#!/usr/bin/env python3
"""
Generate NutriAtlas mapping files from the official CIQUAL Excel workbook.

The script reads XLSX internals directly so the mapping is derived from the
source file itself. It preserves every detected column and flags any column
that has no INFOODS correspondence.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}

FOOD_COLUMN_TARGETS = {
    "alim_grp_code": "food_group_code",
    "alim_ssgrp_code": "food_subgroup_code",
    "alim_ssssgrp_code": "food_subsubgroup_code",
    "alim_grp_nom_fr": "food_group_name_fr",
    "alim_ssgrp_nom_fr": "food_subgroup_name_fr",
    "alim_ssssgrp_nom_fr": "food_subsubgroup_name_fr",
    "alim_code": "source_food_code",
    "alim_nom_fr": "food_name_fr",
    "alim_nom_sci": "scientific_name",
}


def clean(value: str | None) -> str:
    if value is None:
        return ""
    return re.sub(r"\s+", " ", value.replace("\n", " ")).strip()


def norm(value: str | None) -> str:
    value = clean(value).lower()
    value = value.replace("/100 g", " 100 g")
    return re.sub(r"\s+", " ", value)


def col_number(ref: str) -> int:
    letters = re.match(r"([A-Z]+)", ref).group(1)
    number = 0
    for char in letters:
        number = number * 26 + (ord(char) - 64)
    return number


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_shared_strings(zfile: ZipFile) -> list[str]:
    root = ET.fromstring(zfile.read("xl/sharedStrings.xml"))
    strings = []
    for item in root.findall("a:si", NS):
        strings.append("".join(t.text or "" for t in item.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")))
    return strings


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str | None:
    value = cell.find("a:v", NS)
    if value is None:
        inline = cell.find("a:is", NS)
        if inline is None:
            return None
        return "".join(t.text or "" for t in inline.iter("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t"))
    if cell.attrib.get("t") == "s":
        return shared_strings[int(value.text)]
    return value.text


def read_rows(zfile: ZipFile, sheet_path: str, shared_strings: list[str]) -> list[list[str | None]]:
    root = ET.fromstring(zfile.read(sheet_path))
    rows = []
    for row in root.find("a:sheetData", NS).findall("a:row", NS):
        values = []
        for cell in row.findall("a:c", NS):
            col = col_number(cell.attrib["r"])
            while len(values) < col - 1:
                values.append(None)
            values.append(cell_value(cell, shared_strings))
        rows.append(values)
    return rows


def build_mapping(xlsx_path: Path) -> dict:
    with ZipFile(xlsx_path) as zfile:
        shared_strings = load_shared_strings(zfile)
        composition = read_rows(zfile, "xl/worksheets/sheet1.xml", shared_strings)
        infoods = read_rows(zfile, "xl/worksheets/sheet2.xml", shared_strings)

    source_columns = [clean(v) for v in composition[0]]
    infoods_rows = infoods[1:]
    infoods_by_name = {norm(row[2]): row for row in infoods_rows if len(row) >= 3}

    columns = []
    for index, source_column in enumerate(source_columns, start=1):
        if index <= 9:
            columns.append({
                "source_index": index,
                "source_column": source_column,
                "kind": "food_metadata",
                "nutriatlas_target": FOOD_COLUMN_TARGETS.get(source_column, source_column),
                "infoods_tag": None,
                "origcpcd": None,
                "unit": None,
                "preserve": True,
            })
            continue

        infoods_row = infoods_by_name.get(norm(source_column))
        unit_match = re.search(r"\(([^()]*)\)\s*$", source_column)
        unit = unit_match.group(1).replace("100 g", "/100 g") if unit_match else None
        columns.append({
            "source_index": index,
            "source_column": source_column,
            "kind": "nutrient_or_constituent",
            "nutriatlas_target": "food_nutrients.value",
            "infoods_tag": infoods_row[0] if infoods_row else None,
            "origcpcd": infoods_row[1] if infoods_row else None,
            "unit": unit,
            "preserve": True,
        })

    return {
        "dataset": "CIQUAL",
        "publisher": "ANSES",
        "version": "2025",
        "source_file": xlsx_path.name,
        "sha256": sha256_file(xlsx_path),
        "composition_rows_including_header": len(composition),
        "food_records": len(composition) - 1,
        "composition_columns": len(source_columns),
        "infoods_rows": len(infoods_rows),
        "columns": columns,
        "unmatched_columns": [c for c in columns if c["kind"] == "nutrient_or_constituent" and c["infoods_tag"] is None],
    }


def write_markdown(mapping: dict, output_path: Path) -> None:
    lines = [
        "# CIQUAL 2025 column mapping\n",
        "This file is generated from the official CIQUAL 2025 Excel workbook.\n",
        "## Source summary\n",
        f"- Dataset: {mapping['dataset']}\n",
        f"- Publisher: {mapping['publisher']}\n",
        f"- Version: {mapping['version']}\n",
        f"- Source file: `{mapping['source_file']}`\n",
        f"- SHA-256: `{mapping['sha256']}`\n",
        f"- Food records: {mapping['food_records']}\n",
        f"- Composition columns: {mapping['composition_columns']}\n",
        f"- INFOODS rows: {mapping['infoods_rows']}\n",
        "\n## No data loss rule\n",
        "Every source column has `preserve = true`. Normalized tables are derived views; the raw row must remain reproducible from the canonical source file and checksum.\n",
        "\n## Columns\n",
        "| # | Source column | Kind | NutriAtlas target | INFOODS | ORIGCPCD | Unit |\n",
        "|---:|---|---|---|---|---|---|\n",
    ]
    for col in mapping["columns"]:
        lines.append(
            f"| {col['source_index']} | `{col['source_column']}` | `{col['kind']}` | `{col['nutriatlas_target']}` | `{col['infoods_tag'] or ''}` | `{col['origcpcd'] or ''}` | `{col['unit'] or ''}` |\n"
        )
    output_path.write_text("".join(lines), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build CIQUAL mapping artifacts.")
    parser.add_argument("xlsx", help="Path to the official CIQUAL 2025 XLSX file")
    parser.add_argument("--json", default="schemas/ciqual-2025.columns.json")
    parser.add_argument("--md", default="docs/ciqual-mapping.md")
    args = parser.parse_args()

    mapping = build_mapping(Path(args.xlsx))
    json_path = Path(args.json)
    md_path = Path(args.md)
    json_path.parent.mkdir(parents=True, exist_ok=True)
    md_path.parent.mkdir(parents=True, exist_ok=True)
    json_path.write_text(json.dumps(mapping, ensure_ascii=False, indent=2), encoding="utf-8")
    write_markdown(mapping, md_path)
    print(f"Mapping JSON written: {json_path}")
    print(f"Mapping Markdown written: {md_path}")


if __name__ == "__main__":
    main()
