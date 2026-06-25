# NutriAtlas

Moteur de recherche nutritionnel basé sur la table CIQUAL officielle.

## État actuel

Le projet est une application Next.js qui couvre déjà :

- recherche alimentaire avec suggestions ;
- fiches aliment par portion ;
- cumul journalier local ;
- profil nutritionnel initial ;
- génération de l'index applicatif depuis la table CIQUAL brute.

## Données

La seule source de référence alimentaire doit être le fichier CIQUAL brut placé ici :

```text
data/raw/ciqual/Table Ciqual 2025_FR_2025_11_03 (1).xlsx
```

Le générateur lit cette table XLSX et produit :

```text
data/processed/search-index.json
data/processed/search-meta.json
```

Script principal :

```bash
python3 scripts/generate-ciqual-index.py
```

La commande existante `npm run data:decompress` reste temporairement conservée pour ne pas casser le build, mais elle délègue désormais vers le générateur CIQUAL brut. Elle ne lit plus l'ancienne base compressée.

Commandes usuelles :

```bash
npm run data:decompress
npm run build
```

`npm run build` régénère l'index CIQUAL avant `next build`.

## Source officielle

- CIQUAL 2025
- ANSES
- Fichier source local : `data/raw/ciqual/Table Ciqual 2025_FR_2025_11_03 (1).xlsx`

## Principes

- Source officielle uniquement
- Versionnage des données source
- Génération reproductible
- Transparence méthodologique
- Score nutritionnel explicatif, non médical

## Points de vigilance production

Si le domaine public retourne une erreur 502, vérifier en priorité :

1. le dernier déploiement Vercel ou serveur ;
2. les logs de build ;
3. le rattachement du domaine ;
4. les variables d'environnement ;
5. la disponibilité de Python 3 pendant le build.

## Roadmap

- Étendre l'affichage à davantage de nutriments CIQUAL
- API nutrition complète
- Moteur de recherche enrichi
- Comparateur d'aliments
- Documentation scientifique
- Persistance optionnelle du profil
