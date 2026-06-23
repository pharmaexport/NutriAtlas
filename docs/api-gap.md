# Nutrition Gap API

## Endpoint

```http
POST /api/v1/gap
```

## Purpose

Calculate the nutritional coverage and remaining gaps from selected food portions.

## Reference selection

NutriAtlas applies this hierarchy:

1. EU VNR or EU reference intake as default regulatory baseline.
2. Official profile based reference if the profile is valid and data is available.
3. Official upper intake limit if supplied.

## Request example

```json
{
  "profile": {
    "age_years": 35,
    "sex": "female",
    "pregnancy": false,
    "lactation": false,
    "country": "FR",
    "reference_mode": "regulatory_first_then_profile"
  },
  "foods": [
    { "source_food_code": "13000", "portion_g": 150 }
  ],
  "nutrients": ["magnesium", "iron", "vitamin_d"]
}
```

## Response example

```json
{
  "results": [
    {
      "nutrient_id": "magnesium",
      "unit": "milligram",
      "intake": 240,
      "target": 375,
      "gap": 135,
      "coverage_percent": 64,
      "reference_system": "EU_VNR_1169_2011",
      "profile_adjusted": false,
      "warnings": ["Informational calculation only. Not medical advice."]
    }
  ]
}
```

## Compliance rule

The API must not return medical diagnosis or supplement prescription wording.

Allowed wording:

```txt
Remaining theoretical gap: 135 mg.
```

Forbidden wording:

```txt
You need to take this supplement.
```
