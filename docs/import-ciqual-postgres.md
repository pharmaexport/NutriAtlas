# Import CIQUAL into PostgreSQL

NutriAtlas must not store the official CIQUAL XLSX workbook in Git.

The workbook is stored locally or in private object storage, then imported into PostgreSQL.

## Recommended hosting

- Vercel for the Next.js website.
- Neon PostgreSQL for the database.

## Steps

1. Create a PostgreSQL database.
2. Add the connection string as `DATABASE_URL`.
3. Run the schema.

```bash
psql "$DATABASE_URL" -f schemas/nutriatlas.sql
psql "$DATABASE_URL" -f schemas/reference-values.sql
```

4. Install Python dependencies.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

5. Place the official CIQUAL XLSX outside Git.

```txt
storage/ciqual/2025/Table Ciqual 2025_FR_2025_11_03.xlsx
```

6. Import CIQUAL.

```bash
python scripts/import_ciqual_to_postgres.py \
  "storage/ciqual/2025/Table Ciqual 2025_FR_2025_11_03.xlsx" \
  --version 2025
```

## What is imported

The importer stores:

- dataset version;
- SHA-256 checksum;
- source worksheet;
- full raw CIQUAL row as JSONB;
- normalized foods;
- normalized nutrients;
- per-food nutrient values;
- import log.

## No data loss rule

Every source row is preserved in `raw_food_rows.raw_row_json`.

Normalized tables are derived from the raw row and can be rebuilt.
