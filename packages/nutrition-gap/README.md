# Nutrition Gap Engine

Core calculation package for NutriAtlas.

## Responsibility

This package calculates:

- nutrient intake from food portions;
- reference target selection;
- coverage percentage;
- remaining gap;
- theoretical supplement equivalent;
- safety warnings when upper limits are available.

## Reference hierarchy

1. EU VNR or EU reference intake as regulatory default.
2. Profile based reference when official data is available.
3. Upper intake limit when available.

## Non goals

This package must not:

- diagnose deficiency;
- prescribe supplements;
- rank commercial products;
- alter scientific results based on affiliate links.
