from packages.nutrition_gap.nutrition_gap import (
    FoodPortion,
    NutrientAmount,
    ReferenceValue,
    SupplementOption,
    UpperLimit,
    calculate_gap,
)


def test_calculates_gap_from_food_portion():
    foods = [
        FoodPortion(
            source_food_code="example",
            portion_g=200,
            nutrients_per_100g=[NutrientAmount("magnesium", 50, "milligram")],
        )
    ]
    refs = [ReferenceValue("magnesium", 375, "milligram", "EU_VNR_1169_2011")]

    result = calculate_gap(
        nutrient_id="magnesium",
        foods=foods,
        regulatory_references=refs,
    )

    assert result.intake == 100
    assert result.target == 375
    assert result.gap == 275
    assert result.profile_adjusted is False


def test_profile_reference_overrides_regulatory_reference():
    foods = []
    regulatory = [ReferenceValue("magnesium", 375, "milligram", "EU_VNR_1169_2011")]
    profile = [ReferenceValue("magnesium", 300, "milligram", "ANSES_PROFILE", "adult_female", True)]

    result = calculate_gap(
        nutrient_id="magnesium",
        foods=foods,
        regulatory_references=regulatory,
        profile_references=profile,
    )

    assert result.target == 300
    assert result.reference_system == "ANSES_PROFILE"
    assert result.profile_adjusted is True


def test_calculates_theoretical_supplement_equivalent():
    refs = [ReferenceValue("magnesium", 375, "milligram", "EU_VNR_1169_2011")]
    supplement = SupplementOption(
        name="Example magnesium",
        nutrients_per_serving=[NutrientAmount("magnesium", 150, "milligram")],
    )

    result = calculate_gap(
        nutrient_id="magnesium",
        foods=[],
        regulatory_references=refs,
        supplement=supplement,
    )

    assert result.supplement_equivalent is not None
    assert result.supplement_equivalent.servings_needed == 2.5


def test_checks_upper_limit():
    refs = [ReferenceValue("magnesium", 375, "milligram", "EU_VNR_1169_2011")]
    upper_limits = [UpperLimit("magnesium", 300, "milligram", "EFSA_UL", "adult")]
    supplement = SupplementOption(
        name="Example magnesium",
        nutrients_per_serving=[NutrientAmount("magnesium", 375, "milligram")],
    )

    result = calculate_gap(
        nutrient_id="magnesium",
        foods=[],
        regulatory_references=refs,
        upper_limits=upper_limits,
        supplement=supplement,
    )

    assert result.exceeds_upper_limit is True
