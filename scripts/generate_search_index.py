#!/usr/bin/env python3
"""Generate the NutriAtlas search index from the packaged CIQUAL SQLite archive."""

from __future__ import annotations

import json
import re
import shutil
import sqlite3
import zipfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
ZIP_PATH = ROOT / "data" / "processed" / "nutriatlas_ciqual_2025_sqlite.zip"
GENERATED_DIR = ROOT / ".generated"
SQLITE_PATH = GENERATED_DIR / "nutriatlas_ciqual_2025.sqlite"
OUTPUT_PATH = GENERATED_DIR / "ciqual-search-index.json"

# Résumé stable utilisé par la recherche CIQUAL historique et le cumul.
# CIQUAL 2 utilise en plus `fullNutrients`, exporté sans réduire la fiche.
NUTRIENT_MAP = {
    "energy_kcal": [
        "Energie, Règlement UE N° 1169 2011 (kcal 100 g)",
        "Energie, Règlement UE N° 1169/2011 (kcal/100 g)",
        "Energie, N x facteur Jones, avec fibres (kcal 100 g)",
        "Energie, N x facteur Jones, avec fibres (kcal/100 g)",
    ],
    "protein_g": [
        "Protéines, N x facteur de Jones (g 100 g)",
        "Protéines, N x facteur de Jones (g/100 g)",
        "Protéines, N x 6.25 (g 100 g)",
        "Protéines, N x 6.25 (g/100 g)",
    ],
    "carbs_g": ["Glucides (g 100 g)", "Glucides (g/100 g)"],
    "fat_g": ["Lipides (g 100 g)", "Lipides (g/100 g)"],
    "sugars_g": ["Sucres (g 100 g)", "Sucres (g/100 g)"],
    "fiber_g": ["Fibres alimentaires (g 100 g)", "Fibres alimentaires (g/100 g)"],
    "salt_g": ["Sel chlorure de sodium (g 100 g)", "Sel chlorure de sodium (g/100 g)"],
    "calcium_mg": ["Calcium (mg 100 g)", "Calcium (mg/100 g)"],
    "iron_mg": ["Fer (mg 100 g)", "Fer (mg/100 g)"],
    "magnesium_mg": ["Magnésium (mg 100 g)", "Magnésium (mg/100 g)"],
    "potassium_mg": ["Potassium (mg 100 g)", "Potassium (mg/100 g)"],
    "sodium_mg": ["Sodium (mg 100 g)", "Sodium (mg/100 g)"],
    "vitamin_c_mg": ["Vitamine C (mg 100 g)", "Vitamine C (mg/100 g)"],
    "vitamin_d_ug": ["Vitamine D (µg 100 g)", "Vitamine D (µg/100 g)", "Vitamine D (ug/100 g)"],
    "folate_ug": [
        "Vitamine B9 ou Folates totaux (µg 100 g)",
        "Vitamine B9 ou Folates totaux (µg/100 g)",
        "Folates intrinsèques (µg 100 g)",
        "Folates intrinsèques (µg/100 g)",
    ],
}


def normalize(value: str) -> str:
    value = value.lower()
    replacements = {
        "à": "a", "â": "a", "ä": "a",
        "ç": "c",
        "é": "e", "è": "e", "ê": "e", "ë": "e",
        "î": "i", "ï": "i",
        "ô": "o", "ö": "o",
        "ù": "u", "û": "u", "ü": "u",
        "œ": "oe",
        "µ": "u", "μ": "u",
    }
    for source, target in replacements.items():
        value = value.replace(source, target)
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", " ", value)).strip()


def slugify(value: str) -> str:
    return normalize(value).replace(" ", "_")


def simple_aliases(name: str) -> list[str]:
    head = re.split(r"[,;(]", name, maxsplit=1)[0].strip()
    normalized = normalize(head)
    aliases = {normalized}
    if normalized and not normalized.endswith("s"):
        aliases.add(f"{normalized}s")
    words = normalized.split()
    if words:
        aliases.add(words[0])
        if not words[0].endswith("s"):
            aliases.add(f"{words[0]}s")
    return sorted(alias for alias in aliases if len(alias) >= 3)


def ensure_sqlite() -> None:
    GENERATED_DIR.mkdir(exist_ok=True)
    if SQLITE_PATH.exists() and SQLITE_PATH.stat().st_size > 0:
        return
    if not ZIP_PATH.exists():
        raise FileNotFoundError(f"Missing archive: {ZIP_PATH}")
    with zipfile.ZipFile(ZIP_PATH) as archive:
        sqlite_members = [member for member in archive.namelist() if member.endswith(".sqlite")]
        if not sqlite_members:
            raise FileNotFoundError("No .sqlite file found in CIQUAL archive")
        with archive.open(sqlite_members[0]) as source, SQLITE_PATH.open("wb") as target:
            shutil.copyfileobj(source, target)


def row_value(row: sqlite3.Row | None, *names: str) -> Any:
    if row is None:
        return None
    keys = set(row.keys())
    for name in names:
        if name in keys and row[name] not in (None, ""):
            return row[name]
    return None


def label_from_source_column(source_column_name: str) -> str:
    label = source_column_name.strip()
    chunks = re.findall(r"\(([^()]*)\)", label)
    if chunks:
        last = chunks[-1].lower().replace("μ", "µ")
        if "100" in last and "g" in last:
            label = re.sub(r"\s*\([^()]*\)\s*$", "", label)
    return re.sub(r"\s+", " ", label).strip()


def unit_from_source_column(source_column_name: str) -> str:
    chunks = re.findall(r"\(([^()]*)\)", source_column_name)
    for chunk in reversed(chunks):
        normalized = chunk.lower().replace("μ", "µ").replace("/", " ")
        if "kcal" in normalized:
            return "kcal"
        if "kj" in normalized:
            return "kJ"
        if "µg" in normalized or "ug" in normalized:
            return "µg"
        if re.search(r"\bmg\b", normalized):
            return "mg"
        if re.search(r"\bg\b", normalized):
            return "g"
    return ""


def nutrient_source_column(nutrient: sqlite3.Row | None) -> str:
    return str(row_value(nutrient, "source_column_name", "sourceColumnName", "name", "label") or "")


def nutrient_label(nutrient: sqlite3.Row | None) -> str:
    source_column_name = nutrient_source_column(nutrient)
    label = row_value(nutrient, "label_fr", "name_fr", "nutrient_name_fr", "constituent_name_fr", "label", "name")
    if label:
        return str(label)
    return label_from_source_column(source_column_name) if source_column_name else "Constituant CIQUAL"


def full_nutrient_key(nutrient_id: int, nutrient: sqlite3.Row | None, summary_key: str | None = None) -> str:
    if summary_key:
        return summary_key
    source_column_name = nutrient_source_column(nutrient)
    label = nutrient_label(nutrient)
    source = slugify(source_column_name or label)
    return f"ciqual_{nutrient_id}_{source or 'constituant'}"


def rounded(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return round(float(value), 3)
    except (TypeError, ValueError):
        return None


def find_nutrient_id(all_nutrients: dict[int, sqlite3.Row], source_names: list[str]) -> int | None:
    wanted = {normalize(name) for name in source_names}
    for nutrient_id, nutrient in all_nutrients.items():
        if normalize(nutrient_source_column(nutrient)) in wanted:
            return nutrient_id
    return None


def build_index() -> dict[str, Any]:
    ensure_sqlite()
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row

    all_nutrients = {int(row["id"]): row for row in conn.execute("SELECT * FROM nutrients ORDER BY id ASC")}

    nutrient_ids: dict[str, int] = {}
    for key, source_names in NUTRIENT_MAP.items():
        nutrient_id = find_nutrient_id(all_nutrients, source_names)
        if nutrient_id:
            nutrient_ids[key] = nutrient_id

    missing_summary_keys = sorted(set(NUTRIENT_MAP) - set(nutrient_ids))
    if missing_summary_keys:
        print(f"Warning: missing summary nutrients: {', '.join(missing_summary_keys)}")

    summary_key_by_nutrient_id = {nutrient_id: key for key, nutrient_id in nutrient_ids.items()}

    foods: list[dict[str, Any]] = []
    for food in conn.execute(
        """
        SELECT id, source_food_code, name, scientific_name,
               food_group_name_fr, food_subgroup_name_fr, food_subsubgroup_name_fr
        FROM foods
        ORDER BY name ASC
        """
    ):
        nutrients: dict[str, float] = {}
        full_nutrients: list[dict[str, Any]] = []

        for food_nutrient in conn.execute(
            """
            SELECT nutrient_id, value
            FROM food_nutrients
            WHERE food_id = ? AND value IS NOT NULL
            ORDER BY nutrient_id ASC
            """,
            (food["id"],),
        ):
            nutrient_id = int(food_nutrient["nutrient_id"])
            value = rounded(food_nutrient["value"])
            if value is None:
                continue

            nutrient = all_nutrients.get(nutrient_id)
            summary_key = summary_key_by_nutrient_id.get(nutrient_id)
            source_column_name = nutrient_source_column(nutrient)
            label = nutrient_label(nutrient)
            unit = unit_from_source_column(source_column_name)

            if summary_key:
                nutrients[summary_key] = value

            full_nutrients.append({
                "id": nutrient_id,
                "key": full_nutrient_key(nutrient_id, nutrient, summary_key),
                "label": label,
                "unit": unit,
                "value": value,
                "sourceColumnName": source_column_name or None,
            })

        foods.append({
            "code": str(food["source_food_code"]),
            "name": food["name"],
            "scientificName": food["scientific_name"],
            "group": food["food_group_name_fr"],
            "subgroup": food["food_subgroup_name_fr"],
            "subsubgroup": food["food_subsubgroup_name_fr"],
            "aliases": simple_aliases(food["name"]),
            "nutrients": nutrients,
            "fullNutrients": full_nutrients,
        })

    return {
        "meta": {
            "dataset": "CIQUAL",
            "publisher": "ANSES",
            "version": "2025",
            "foodCount": len(foods),
            "nutrientCount": len(all_nutrients),
            "summaryNutrientCount": len(nutrient_ids),
            "generatedFrom": "data/processed/nutriatlas_ciqual_2025_sqlite.zip",
        },
        "foods": foods,
    }


def main() -> None:
    data = build_index()
    OUTPUT_PATH.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Generated {OUTPUT_PATH} with {data['meta']['foodCount']} foods")


if __name__ == "__main__":
    main()
