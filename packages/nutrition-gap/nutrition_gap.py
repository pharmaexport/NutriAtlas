"""
NutriAtlas Nutrition Gap Engine.

Pure calculation module. It does not fetch commercial products and does not
make medical recommendations.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Iterable, Optional


@dataclass(frozen=True)
class NutrientAmount:
    nutrient_id: str
    amount: float
    unit: str


@dataclass(frozen=True)
class FoodPortion:
    source_food_code: str
    portion_g: float
    nutrients_per_100g: list[NutrientAmount]


@dataclass(frozen=True)
class ReferenceValue:
    nutrient_id: str
    amount: float
    unit: str
    reference_system: str
    population_group: str = "adult_default"
    is_profile_based: bool = False


@dataclass(frozen=True)
class UpperLimit:
    nutrient_id: str
    amount: float
    unit: str
    reference_system: str
    population_group: str


@dataclass(frozen=True)
class SupplementOption:
    name: str
    nutrients_per_serving: list[NutrientAmount]


@dataclass(frozen=True)
class SupplementEquivalent:
    supplement_name: str
    servings_needed: float
    label: str = "theoretical"


@dataclass(frozen=True)
class GapResult:
    nutrient_id: str
    unit: str
    intake: float
    target: float
    gap: float
    coverage_percent: float
    reference_system: str
    population_group: str
    profile_adjusted: bool
    upper_limit: Optional[float]
    exceeds_upper_limit: Optional[bool]
    supplement_equivalent: Optional[SupplementEquivalent]
    warnings: list[str]


def _assert_same_unit(a: str, b: str, nutrient_id: str) -> None:
    if a != b:
        raise ValueError(f"Unit mismatch for {nutrient_id}: {a} != {b}")


def calculate_food_intake(
    foods: Iterable[FoodPortion],
    nutrient_id: str,
    unit: str,
) -> float:
    total = 0.0
    for food in foods:
        if food.portion_g < 0:
            raise ValueError("portion_g must be positive")
        for nutrient in food.nutrients_per_100g:
            if nutrient.nutrient_id == nutrient_id:
                _assert_same_unit(nutrient.unit, unit, nutrient_id)
                total += nutrient.amount * food.portion_g / 100.0
    return total


def choose_reference(
    nutrient_id: str,
    regulatory_references: Iterable[ReferenceValue],
    profile_references: Iterable[ReferenceValue] | None = None,
) -> ReferenceValue:
    if profile_references:
        for ref in profile_references:
            if ref.nutrient_id == nutrient_id:
                return ref
    for ref in regulatory_references:
        if ref.nutrient_id == nutrient_id:
            return ref
    raise KeyError(f"No reference value found for {nutrient_id}")


def find_upper_limit(
    nutrient_id: str,
    unit: str,
    upper_limits: Iterable[UpperLimit] | None,
) -> Optional[UpperLimit]:
    if not upper_limits:
        return None
    for limit in upper_limits:
        if limit.nutrient_id == nutrient_id:
            _assert_same_unit(limit.unit, unit, nutrient_id)
            return limit
    return None


def calculate_supplement_equivalent(
    gap: float,
    nutrient_id: str,
    unit: str,
    supplement: SupplementOption | None,
) -> Optional[SupplementEquivalent]:
    if gap <= 0 or supplement is None:
        return None
    for nutrient in supplement.nutrients_per_serving:
        if nutrient.nutrient_id == nutrient_id:
            _assert_same_unit(nutrient.unit, unit, nutrient_id)
            if nutrient.amount <= 0:
                return None
            return SupplementEquivalent(
                supplement_name=supplement.name,
                servings_needed=gap / nutrient.amount,
            )
    return None


def calculate_gap(
    *,
    nutrient_id: str,
    foods: Iterable[FoodPortion],
    regulatory_references: Iterable[ReferenceValue],
    profile_references: Iterable[ReferenceValue] | None = None,
    upper_limits: Iterable[UpperLimit] | None = None,
    supplement: SupplementOption | None = None,
) -> GapResult:
    reference = choose_reference(nutrient_id, regulatory_references, profile_references)
    intake = calculate_food_intake(foods, nutrient_id, reference.unit)
    gap = max(reference.amount - intake, 0.0)
    coverage_percent = 0.0 if reference.amount == 0 else intake / reference.amount * 100.0

    upper_limit = find_upper_limit(nutrient_id, reference.unit, upper_limits)
    supplement_equivalent = calculate_supplement_equivalent(
        gap,
        nutrient_id,
        reference.unit,
        supplement,
    )

    total_with_supplement = intake
    if supplement_equivalent and supplement:
        for nutrient in supplement.nutrients_per_serving:
            if nutrient.nutrient_id == nutrient_id:
                total_with_supplement += nutrient.amount * supplement_equivalent.servings_needed

    exceeds_upper_limit = None
    warnings = [
        "Informational calculation only. Not medical advice.",
        "Supplement equivalent is theoretical and based on label data when provided.",
    ]

    if upper_limit:
        exceeds_upper_limit = total_with_supplement > upper_limit.amount
        if exceeds_upper_limit:
            warnings.append("Total intake may exceed the official upper intake limit.")
    else:
        warnings.append("No official upper intake limit supplied for this nutrient.")

    return GapResult(
        nutrient_id=nutrient_id,
        unit=reference.unit,
        intake=round(intake, 4),
        target=reference.amount,
        gap=round(gap, 4),
        coverage_percent=round(coverage_percent, 2),
        reference_system=reference.reference_system,
        population_group=reference.population_group,
        profile_adjusted=reference.is_profile_based,
        upper_limit=upper_limit.amount if upper_limit else None,
        exceeds_upper_limit=exceeds_upper_limit,
        supplement_equivalent=supplement_equivalent,
        warnings=warnings,
    )


def to_dict(result: GapResult) -> dict:
    return asdict(result)
