#!/usr/bin/env python3
"""
CIQUAL import scaffold for NutriAtlas.

This script is intentionally conservative:
- it does not commit raw data into Git;
- it stores downloaded/source files in local storage;
- it creates a dataset version manifest with a SHA-256 checksum;
- it prepares a reproducible import boundary for future database loading.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import urlretrieve

DEFAULT_SOURCE_PAGE = "https://www.anses.fr/fr/content/la-table-de-composition-nutritionnelle-du-ciqual"
DEFAULT_STORAGE_DIR = Path("storage/ciqual")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def write_manifest(
    *,
    dataset: str,
    publisher: str,
    version: str,
    source_url: str,
    raw_file: Path,
    output_dir: Path,
) -> Path:
    manifest = {
        "dataset": dataset,
        "publisher": publisher,
        "version": version,
        "source_url": source_url,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "checksum_sha256": sha256_file(raw_file),
        "raw_file_path": str(raw_file),
        "notes": "Raw CIQUAL file stored outside Git repository.",
    }

    manifest_path = output_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    return manifest_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare a versioned CIQUAL import.")
    parser.add_argument("--version", required=True, help="CIQUAL version label, for example 2025.")
    parser.add_argument("--source-url", default=DEFAULT_SOURCE_PAGE, help="Official source URL or direct file URL.")
    parser.add_argument("--file", help="Local raw file path already downloaded from ANSES/CIQUAL.")
    parser.add_argument("--download", action="store_true", help="Download --source-url into local storage.")
    parser.add_argument("--storage-dir", default=str(DEFAULT_STORAGE_DIR), help="Local storage directory outside Git tracking.")
    args = parser.parse_args()

    output_dir = Path(args.storage_dir) / args.version
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.file:
        raw_file = Path(args.file)
        if not raw_file.exists():
            raise FileNotFoundError(f"Raw file not found: {raw_file}")
    elif args.download:
        raw_file = output_dir / "ciqual_source_file"
        urlretrieve(args.source_url, raw_file)
    else:
        raise ValueError("Provide either --file PATH or --download.")

    manifest_path = write_manifest(
        dataset="CIQUAL",
        publisher="ANSES",
        version=args.version,
        source_url=args.source_url,
        raw_file=raw_file,
        output_dir=output_dir,
    )

    print(f"Manifest written: {manifest_path}")


if __name__ == "__main__":
    main()
