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

NUTRIENT_MAP = {
    "energy_kcal": [
        "Energie, Règlement UE N° 1169 2011 (kcal 100 g)",
        "Energie, N x facteur Jones, avec fibres (kcal 100 g)",
    ],
    "protein_g": [
        "Protéines, N x facteur de Jones (g 100 g)",
        "Protéines, N x 6.25 (g 100 g)",
    ],
    "carbs_g": ["Glucides (g 100 g)"],
    "fat_g": ["Lipides (g 100 g)"],
    "sugars_g": ["Sucres (g 100 g)"],
    "fiber_g": ["Fibres alimentaires (g 100 g)"],
    "salt_g": ["Sel chlorure de sodium (g 100 g)"],
    "calcium_mg": ["Calcium (mg 100 g)"],
    "iron_mg": ["Fer (mg 100 g)"],
    "magnesium_mg": ["Magnésium (mg 100 g)"],
    "potassium_mg": ["Potassium (mg 100 g)"],
    "sodium_mg": ["Sodium (mg 100 g)"],
    "vitamin_c_mg": ["Vitamine C (mg 100 g)"],
    "vitamin_d_ug": ["Vitamine D (µg 100 g)"],
    "folate_ug": ["Vitamine B9 ou Folates totaux (µg 100 g)", "Folates intrinsèques (µg 100 g)"],
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
    }
    for source, target in replacements.items():
        value = value.replace(source, target)
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", " ", value)).strip()


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


def build_index() -> dict[str, Any]:
    ensure_sqlite()
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row

    nutrient_ids: dict[str, int] = {}
    for key, source_names in NUTRIENT_MAP.items():
        placeholders = ",".join("?" for _ in source_names)
        row = conn.execute(
            f"SELECT id FROM nutrients WHERE source_column_name IN ({placeholders}) ORDER BY id LIMIT 1",
            source_names,
        ).fetchone()
        if row:
            nutrient_ids[key] = int(row["id"])

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
        for key, nutrient_id in nutrient_ids.items():
            row = conn.execute(
                "SELECT value FROM food_nutrients WHERE food_id = ? AND nutrient_id = ? LIMIT 1",
                (food["id"], nutrient_id),
            ).fetchone()
            if row and row["value"] is not None:
                nutrients[key] = round(float(row["value"]), 3)

        foods.append(
            {
                "code": str(food["source_food_code"]),
                "name": food["name"],
                "scientificName": food["scientific_name"],
                "group": food["food_group_name_fr"],
                "subgroup": food["food_subgroup_name_fr"],
                "subsubgroup": food["food_subsubgroup_name_fr"],
                "aliases": simple_aliases(food["name"]),
                "nutrients": nutrients,
            }
        )

    return {
        "meta": {
            "dataset": "CIQUAL",
            "publisher": "ANSES",
            "version": "2025",
            "foodCount": len(foods),
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
