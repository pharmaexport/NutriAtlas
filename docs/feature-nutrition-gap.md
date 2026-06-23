# Nutrition Gap Feature

## Purpose

This feature compares a user's selected food portions against reference nutritional targets, then estimates the remaining nutritional gap.

It must answer questions like:

```txt
Given these foods and portions, what nutrients are still missing?
Can food portions cover the gap?
If not, what supplement quantity would theoretically be needed?
```

## Important boundary

NutriAtlas must not diagnose deficiency or prescribe supplements.

The output is a calculation layer, not medical advice.

## Inputs

```json
{
  "profile": {
    "age": 35,
    "sex": "female",
    "pregnancy": false,
    "lactation": false,
    "reference_system": "ANSES_OR_EFSA_TO_DEFINE"
  },
  "foods": [
    {
      "source_food_code": "13000",
      "portion_g": 150
    }
  ],
  "targets": [
    "magnesium",
    "calcium",
    "iron",
    "vitamin_d"
  ],
  "supplements": [
    {
      "name": "Magnesium supplement",
      "nutrients": [
        {
          "nutrient": "magnesium",
          "amount_per_serving": 200,
          "unit": "mg"
        }
      ]
    }
  ]
}
```

## Calculation model

For each nutrient:

```txt
food_intake = sum(ciqual_value_per_100g * portion_g / 100)
gap = reference_target - food_intake
coverage_percent = food_intake / reference_target * 100
```

If `gap <= 0`, no gap is reported.

If `gap > 0`, NutriAtlas may report:

- missing amount;
- percentage covered by the selected foods;
- food-based alternatives;
- optional theoretical supplement equivalent.

## Supplement calculation

```txt
servings_needed = gap / supplement_amount_per_serving
```

The result must be labelled as theoretical.

Example wording:

```txt
Based on the selected foods, the remaining magnesium gap is 120 mg.
This equals 0.6 serving of the selected supplement.
This is not a medical recommendation.
```

## Safety constraints

The feature must check:

- reference target;
- tolerable upper intake level when available;
- total intake from foods plus supplement;
- unit compatibility;
- population profile.

If no safe upper limit is available, NutriAtlas must say so instead of guessing.

## Required data sources

- CIQUAL for food composition.
- ANSES or EFSA for reference intakes.
- EFSA or official national authorities for tolerable upper intake levels.
- Product label data for supplement composition, separated from the scientific layer.

## Output example

```json
{
  "nutrient": "magnesium",
  "unit": "mg",
  "target": 360,
  "food_intake": 240,
  "gap": 120,
  "coverage_percent": 66.7,
  "food_alternatives": [],
  "supplement_equivalent": {
    "servings_needed": 0.6,
    "label": "theoretical"
  },
  "warnings": [
    "This is not medical advice.",
    "Supplement composition comes from product label data, not CIQUAL."
  ]
}
```

## Product rule

The scientific result must be generated before any commercial product display.

Commercial links must never influence:

- gap calculation;
- ranking of foods;
- reference targets;
- safety warnings.
