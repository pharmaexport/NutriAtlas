# Biological Age — standalone longevity assessment

Application Next.js autonome extraite du module Longévité de NutriAtlas.

## Périmètre

- bilan comportemental centré sur l’estimation de l’âge biologique ;
- profil minimal : âge, taille, poids et tour de taille optionnel ;
- activité, sédentarité, sommeil, stress, nutrition, tabac, alcool et constantes optionnelles ;
- résultat instantané, score par composante et facteurs favorables / à surveiller ;
- français et anglais, avec langue mémorisée localement ;
- aucune dépendance aux données CIQUAL, à la recherche NutriAtlas ou aux recommandations profil.

## Démarrage

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`.

## Déploiement séparé

Le dossier peut être déplacé tel quel dans un nouveau dépôt et déployé indépendamment sur Vercel ou une plateforme compatible Next.js.

## Avertissement

Le résultat est une estimation éducative fondée sur un questionnaire de mode de vie. Il ne constitue ni un diagnostic, ni une mesure biologique validée cliniquement.
