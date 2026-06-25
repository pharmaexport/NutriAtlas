# Base de référence NutriAtlas

`search-index.json.gz.b64` est la base de référence compressée.

Le fichier est un JSON compressé en gzip puis encodé en base64 pour rester versionnable dans GitHub sans dépendre d'un stockage binaire externe.

Pour régénérer l'index applicatif :

```bash
npm run data:decompress
```

Sortie générée :

```text
data/processed/search-index.json
```

La base actuelle est une prévisualisation. Elle doit être remplacée par l'export institutionnel complet avant une mise en avant publique.
