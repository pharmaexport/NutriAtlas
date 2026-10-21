# Nutrition card visual refresh

Linked issue: #17

## Intent

Move the recommendation card from a mostly clinical reading experience to a more desirable **fresh market / nutrition coach** experience.

The card must still feel serious, traceable and institution-backed, but the first impression should be more appetising, more human and more actionable.

## Target user expectation

A consumer should understand in less than 3 seconds:

1. **Where am I versus the benchmark?**
2. **Why does it matter for me?**
3. **What should I do this week?**
4. **Can I trust the recommendation?**

## Current perceived hierarchy

1. Action week
2. Add 1 portion
3. Personal diagnosis
4. Estimated health gain
5. OMS / PNNS source
6. Micronutrient chips

This puts the instruction before the motivation.

## Target hierarchy

1. **Personal verdict**
   - `Tu es en dessous du repère protecteur de 5 portions/jour.`
2. **Motivation / benefit**
   - `Gain estimé : +6 à +28 mois en bonne santé.`
3. **Concrete weekly action**
   - `Cette semaine : ajoute 1 portion de légumes par jour.`
4. **Portion help**
   - `1 portion = une soupe, une assiette de légumes ou une poignée de crudités.`
5. **Trust marker**
   - `Repère OMS / PNNS`
6. **Nutrients**
   - vitamin C, folates, potassium, fibres, magnesium.

## Creative direction

### Fresh market

Use warm vegetable-inspired colour accents, organic shapes, leaves and bowl imagery. The goal is appetite appeal, not decoration for decoration's sake.

### Food editorial

The card should feel closer to a premium nutrition magazine than a medical alert. Visual examples of portions reduce cognitive friction.

### Health confidence

Institutional references stay visible, but as a trust badge rather than cold administrative text.

## Quantitative / qualitative target scoring

| Criterion | Current estimate | Target | Main lever |
|---|---:|---:|---|
| Clarity | 7/10 | 8.5/10 | More direct verdict |
| Visual desirability | 5/10 | 8/10 | Food illustration and warmer palette |
| Health credibility | 8/10 | 8.5/10 | Source badge closer to benchmark |
| Motivation to act | 6/10 | 8/10 | Benefit block made more prominent |
| Fast comprehension | 6/10 | 8.5/10 | Fewer competing text levels |
| Premium feeling | 7/10 | 8/10 | Softer layout and editorial treatment |

## Typography recommendation

Limit to three visible sizes:

- **L / verdict**: 22-26 px, 800 weight.
- **M / benefit and action**: 16-18 px, 700-800 weight.
- **S / proof and nutrient chips**: 12-14 px, 600-700 weight.

Avoid making every block bold. Bold should be reserved for the verdict, the gain and the weekly action.

## Colour tokens

```css
--nutri-cream: #F7F1E6;
--nutri-paper: #FFFDF6;
--nutri-green-900: #1F3F2A;
--nutri-green-700: #2F5B3A;
--nutri-green-200: #E6F3D8;
--nutri-carrot: #F26B45;
--nutri-lemon: #F2B84B;
--nutri-basil: #7FBF4D;
--nutri-shadow: rgba(31, 63, 42, 0.16);
```

## Files added

- `public/assets/illustrations/nutrition/portion-bowl.svg`
- `public/assets/illustrations/nutrition/fresh-market-pattern.svg`
- `public/assets/illustrations/nutrition/trust-badge.svg`
- `src/styles/nutrition-recommendation-card.css`
- `docs/design/nutrition-card-demo.html`

## Integration recommendation

Use SVG assets as standard images from `/assets/illustrations/nutrition/...` if served from the public directory.

For React / Next / Vite frontends, the CSS can be imported once in the app shell or near the card component:

```ts
import './styles/nutrition-recommendation-card.css';
```

The card should remain data-driven. Text, gain, source and nutrients should come from the recommendation object, not from hard-coded strings.

## Acceptance criteria

The refreshed card is successful if a user can immediately identify:

1. the personal gap;
2. the estimated health gain;
3. the concrete action for this week;
4. the institutional benchmark behind the recommendation.
