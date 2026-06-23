# Health profile and longevity feature

## Product goal

NutriAtlas should start with a simple consumer friendly profile:

- age
- sex
- height
- weight
- activity level
- optional waist circumference
- optional goal

From this, NutriAtlas can calculate basic anthropometric and nutrition planning indicators, then use food intake data to produce an explainable longevity oriented score.

## Important boundary

This feature is not a medical diagnosis and must not claim to determine a true biological age.

The wording must be:

- "estimated vitality age"
- "longevity score"
- "modifiable factors"
- "informational estimate"

Avoid:

- "your real age is"
- "you will live until"
- "you have a disease risk"
- "medical prediction"

## Required inputs

```json
{
  "age_years": 35,
  "sex": "female",
  "height_cm": 168,
  "weight_kg": 62,
  "activity_level": "moderate",
  "waist_cm": null,
  "goal": "maintenance"
}
```

## Initial calculations

### BMI

```txt
BMI = weight_kg / (height_m * height_m)
```

### Basal metabolic rate

Use Mifflin St Jeor as a consumer friendly default:

```txt
female: BMR = 10 * weight_kg + 6.25 * height_cm - 5 * age_years - 161
male:   BMR = 10 * weight_kg + 6.25 * height_cm - 5 * age_years + 5
```

### Total daily energy expenditure

```txt
TDEE = BMR * activity_factor
```

Default activity factors:

- sedentary: 1.2
- light: 1.375
- moderate: 1.55
- active: 1.725
- athlete: 1.9

### Nutrition targets

The target hierarchy remains:

1. EU VNR for regulatory default.
2. Profile based ANSES or EFSA references when available.
3. Upper intake limits when available.

## Longevity score

The longevity score should be explainable and factor based.

Initial components:

- BMI zone
- energy balance
- protein adequacy
- fiber adequacy
- fruit and vegetable proxy
- micronutrient coverage
- ultra processed food proxy when available
- sodium or salt moderation
- omega 3 coverage when available
- physical activity level

The score must show the reason for every point gained or lost.

## Estimated vitality age

Estimated vitality age can be derived as a user friendly translation of the score.

Example:

```txt
vitality_age = chronological_age + score_penalty_or_bonus
```

Display wording:

```txt
Your estimated vitality age is 33 to 37 years.
This is an informational estimate based on modifiable lifestyle and nutrition factors, not a medical measurement.
```

## Output example

```json
{
  "profile": {
    "age_years": 35,
    "sex": "female",
    "height_cm": 168,
    "weight_kg": 62
  },
  "anthropometrics": {
    "bmi": 22.0,
    "bmi_category": "normal_range",
    "bmr_kcal": 1329,
    "tdee_kcal": 2060
  },
  "longevity": {
    "score": 82,
    "estimated_vitality_age_range": "33-37",
    "label": "informational_estimate",
    "drivers": [
      "BMI in normal range",
      "fiber target not fully covered",
      "magnesium intake below selected reference"
    ]
  }
}
```

## UX principle

The feature must speak in actions, not fear.

Good:

```txt
Add 30 g almonds or 150 g white beans to improve magnesium coverage.
```

Bad:

```txt
You are deficient in magnesium.
```

## Competitive angle

Most consumer apps focus on calories. NutriAtlas should focus on:

- coverage of essential nutrients;
- food first corrections;
- regulatory transparency;
- explainable longevity score;
- no hidden supplement bias.
