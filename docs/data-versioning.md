# Data versioning strategy

NutriAtlas does not store full CIQUAL datasets in Git.

The repository stores:

- source metadata
- schemas
- import scripts
- documentation

Raw and processed datasets are stored outside Git, under local or remote storage.

## Local storage convention

```txt
storage/
└── ciqual/
    └── <version>/
        ├── ciqual_source_file
        └── manifest.json
```

## Version manifest

Each import creates a manifest containing:

- dataset name
- publisher
- version
- source URL
- retrieval date
- SHA-256 checksum
- raw file path

## Why this matters

This makes it possible to:

- keep Git lightweight
- avoid committing large or licensed files
- compare CIQUAL versions over time
- display precise citations in the product
- reproduce imports
