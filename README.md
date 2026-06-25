# NutriAtlas

Moteur de recherche nutritionnel basé sur des données traçables.

## État actuel

Le projet est une application Next.js qui couvre déjà :

- recherche alimentaire avec suggestions ;
- fiches aliment par portion ;
- cumul journalier local ;
- profil nutritionnel initial ;
- base de référence compressée puis décompressée en index applicatif.

## Données

La base utilisée par l'application est générée depuis une source compressée :

- source compressée : `data/reference/search-index.json.gz.b64`
- sortie décompressée : `data/processed/search-index.json`
- script : `scripts/decompress-reference-base.mjs`

Commandes :

```bash
npm run data:decompress
npm run build
```

`npm run build` lance automatiquement la décompression avant `next build`.

## Sources prévues

- CIQUAL
- ANSES

La base actuelle reste une prévisualisation locale. Elle doit être remplacée par l'import institutionnel complet avant toute promesse publique de couverture exhaustive.

## Principes

- Sources officielles uniquement
- Citations systématiques
- Versionnage des données
- Transparence méthodologique
- Score nutritionnel explicatif, non médical

## Points de vigilance production

Si le domaine public retourne une erreur 502, vérifier en priorité :

1. le dernier déploiement Vercel ou serveur ;
2. les logs de build ;
3. le rattachement du domaine ;
4. les variables d'environnement ;
5. la commande de build et la version Node.

## Roadmap

- Import CIQUAL complet
- API nutrition complète
- Moteur de recherche enrichi
- Comparateur d'aliments
- Documentation scientifique
- Persistance optionnelle du profil
