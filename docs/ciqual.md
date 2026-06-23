# CIQUAL Integration

## Role in NutriAtlas

CIQUAL is the master nutrition dataset for NutriAtlas.

It is used as the primary source for food composition data in France.

## Official publisher

ANSES - Agence nationale de securite sanitaire de l'alimentation, de l'environnement et du travail.

## Official URLs

- https://www.anses.fr/fr/content/la-table-de-composition-nutritionnelle-du-ciqual
- https://ciqual.anses.fr/

## Data policy

NutriAtlas must keep the following metadata for every imported value:

- source name
- publisher
- source URL
- dataset version
- import date
- food code
- nutrient name
- nutrient unit

## Import directory

Raw files must be stored under:

```txt
data/raw/ciqual/
```

Processed files must be stored under:

```txt
data/processed/
```

## Current integration status

- Source identified
- Metadata file created
- Raw data directory prepared
- Importer not implemented yet
