#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import re
import unicodedata
import zipfile
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw" / "ciqual"
SOURCE_NAME = "Table Ciqual 2025_FR_2025_11_03 (1).xlsx"
OUTPUT_PATH = ROOT / "data" / "processed" / "search-index.json"
META_OUTPUT_PATH = ROOT / "data" / "processed" / "search-meta.json"

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkgrel": "http://schemas.openxmlformats.org/package/2006/relationships",
}

NUTRIENT_RULES = {
    "energy_kcal": ("energie.*kcal",),
    "protein_g": ("proteines?.*g",),
    "carbs_g": ("glucides?.*g",),
    "fat_g": ("lipides?.*g",),
    "sugars_g": ("sucres?.*g",),
    "fiber_g": ("fibres?.*g",),
    "salt_g": ("sel.*g",),
    "calcium_mg": ("calcium.*mg",),
    "iron_mg": ("\\bfer\\b.*mg",),
    "magnesium_mg": ("magnesium.*mg",),
    "potassium_mg": ("potassium.*mg",),
    "sodium_mg": ("sodium.*mg",),
    "vitamin_c_mg": ("vitamine c.*mg",),
    "vitamin_d_ug": ("vitamine d.*(ug|µg)",),
    "folate_ug": ("vitamine b9.*(ug|µg)", "folates?.*(ug|µg)"),
}


def normalize(value: Any) -> str:
    text = str(value or "").strip().lower().replace("œ", "oe").replace("æ", "ae").replace("µ", "u")
    text = "".join(ch for ch in unicodedata.normalize("NFD", text) if unicodedata.category(ch) != "Mn")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9%/°.,() -]+", " ", text)).strip()


def search_normalize(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", " ", normalize(value))).strip()


def find_source_file() -> Path:
    exact = RAW_DIR / SOURCE_NAME
    if exact.exists():
        return exact
    candidates = sorted(RAW_DIR.glob("*Ciqual*2025*.xlsx")) + sorted(RAW_DIR.glob("*CIQUAL*2025*.xlsx"))
    if candidates:
        return candidates[0]
    raise FileNotFoundError(f"CIQUAL source table not found in {RAW_DIR}")


def xml_text(element: ET.Element | None) -> str:
    if element is None:
        return ""
    return "".join(node.text or "" for node in element.iter() if node.tag.endswith("}t"))


def load_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return [xml_text(item) for item in root.findall("main:si", NS)]


def first_sheet_path(archive: zipfile.ZipFile) -> str:
    try:
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        rel_targets = {rel.attrib.get("Id"): rel.attrib.get("Target", "") for rel in rels.findall("pkgrel:Relationship", NS)}
        sheet = workbook.find("main:sheets/main:sheet", NS)
        rel_id = sheet.attrib.get(f"{{{NS['rel']}}}id") if sheet is not None else None
        target = rel_targets.get(rel_id, "worksheets/sheet1.xml")
        return target.lstrip("/") if target.startswith("/") else f"xl/{target}"
    except KeyError:
        return "xl/worksheets/sheet1.xml"


def column_index(cell_ref: str) -> int:
    letters = re.sub(r"[^A-Z]", "", cell_ref.upper())
    index = 0
    for letter in letters:
        index = index * 26 + ord(letter) - ord("A") + 1
    return max(index - 1, 0)


def cell_value(cell: ET.Element, shared_strings: list[str]) -> Any:
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        return xml_text(cell.find("main:is", NS))
    value = cell.find("main:v", NS)
    if value is None or value.text is None:
        return ""
    raw = value.text
    if cell_type == "s":
        try:
            return shared_strings[int(raw)]
        except (ValueError, IndexError):
            return ""
    return raw


def sheet_rows(source: Path) -> list[list[Any]]:
    with zipfile.ZipFile(source) as archive:
        shared_strings = load_shared_strings(archive)
        sheet = ET.fromstring(archive.read(first_sheet_path(archive)))
    rows = []
    for row in sheet.findall(".//main:row", NS):
        values = []
        for cell in row.findall("main:c", NS):
            index = column_index(cell.attrib.get("r", "A1"))
            while len(values) <= index:
                values.append("")
            values[index] = cell_value(cell, shared_strings)
        if any(str(value).strip() for value in values):
            rows.append(values)
    return rows


def find_header_index(rows: list[list[Any]]) -> int:
    for index, row in enumerate(rows[:80]):
        joined = " ".join(normalize(value) for value in row)
        if "alim_code" in joined and "alim_nom_fr" in joined:
            return index
        if "code" in joined and "aliment" in joined and "energie" in joined:
            return index
    raise ValueError("Unable to locate CIQUAL header row")


def find_column(headers: list[str], *patterns: str) -> int | None:
    for pattern in patterns:
        regex = re.compile(pattern)
        for index, header in enumerate(headers):
            if regex.search(header):
                return index
    return None


def parse_number(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return round(float(value), 3) if math.isfinite(float(value)) else None
    text = str(value).strip().replace("\u00a0", " ").replace(",", ".")
    if not text or text in {"-", "—", "nd"}:
        return None
    if "trace" in text.lower():
        return 0.0
    match = re.search(r"-?\d+(?:\.\d+)?", text)
    return round(float(match.group(0)), 3) if match else None


def get_value(row: list[Any], column: int | None) -> str:
    return str(row[column] or "").strip() if column is not None and column < len(row) else ""


def aliases_for(name: str, group: str, subgroup: str) -> list[str]:
    head = re.split(r"[,;(]", name, maxsplit=1)[0].strip()
    normalized_head = search_normalize(head)
    aliases = {normalized_head, search_normalize(name), search_normalize(group), search_normalize(subgroup)}
    words = normalized_head.split()
    if words:
        aliases.add(words[0])
        if not words[0].endswith("s"):
            aliases.add(f"{words[0]}s")
    if normalized_head and not normalized_head.endswith("s"):
        aliases.add(f"{normalized_head}s")
    return sorted(alias for alias in aliases if len(alias) >= 3)


def build_index(rows: list[list[Any]]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    header_index = find_header_index(rows)
    headers_raw = [str(value or "").strip() for value in rows[header_index]]
    headers = [normalize(value) for value in headers_raw]
    code_col = find_column(headers, r"^alim_code$", r"code.*aliment", r"^code$")
    name_col = find_column(headers, r"^alim_nom_fr$", r"nom.*fr", r"nom.*aliment")
    sci_col = find_column(headers, r"^alim_nom_sci$", r"scientifique")
    group_col = find_column(headers, r"^alim_grp_nom_fr$", r"groupe.*aliment")
    subgroup_col = find_column(headers, r"^alim_ssgrp_nom_fr$", r"sous.*groupe")
    subsubgroup_col = find_column(headers, r"^alim_ssssgrp_nom_fr$", r"sous.*sous.*groupe")
    nutrient_cols = {key: find_column(headers, *rules) for key, rules in NUTRIENT_RULES.items()}
    nutrient_cols = {key: col for key, col in nutrient_cols.items() if col is not None}
    if code_col is None or name_col is None:
        raise ValueError("CIQUAL code/name columns not found")
    foods = []
    seen_codes = set()
    for row in rows[header_index + 1:]:
        code = get_value(row, code_col)
        name = get_value(row, name_col)
        if not code or not name or code in seen_codes:
            continue
        group = get_value(row, group_col)
        subgroup = get_value(row, subgroup_col)
        nutrients = {}
        for key, column in nutrient_cols.items():
            value = parse_number(row[column] if column < len(row) else None)
            if value is not None:
                nutrients[key] = value
        foods.append({
            "code": str(code),
            "name": name,
            "scientificName": get_value(row, sci_col) or None,
            "group": group or "Groupe non renseigné",
            "subgroup": subgroup or None,
            "subsubgroup": get_value(row, subsubgroup_col) or None,
            "aliases": aliases_for(name, group, subgroup),
            "nutrients": nutrients,
        })
        seen_codes.add(code)
    meta = {
        "dataset": "CIQUAL",
        "publisher": "ANSES",
        "version": "2025",
        "sourceFile": f"data/raw/ciqual/{SOURCE_NAME}",
        "foodCount": len(foods),
        "headerRow": header_index + 1,
        "columns": len(headers_raw),
        "matchedNutrients": sorted(nutrient_cols),
        "unmatchedNutrients": sorted(set(NUTRIENT_RULES) - set(nutrient_cols)),
    }
    return foods, meta


def main() -> None:
    source = find_source_file()
    rows = sheet_rows(source)
    foods, meta = build_index(rows)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(foods, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    META_OUTPUT_PATH.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {OUTPUT_PATH.relative_to(ROOT)} from {source.relative_to(ROOT)} with {len(foods)} foods")


if __name__ == "__main__":
    main()
