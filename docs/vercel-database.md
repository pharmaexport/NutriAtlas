# Vercel database connection

NutriAtlas uses PostgreSQL for CIQUAL data.

## Environment variable

Set one of the following variables in Vercel:

```txt
POSTGRES_URL=...
```

or:

```txt
DATABASE_URL=...
```

## API routes

After CIQUAL is imported, the site exposes:

```txt
/api/search?q=banane
/api/foods/{ciqual_code}
```

## Expected flow

1. Create a PostgreSQL database.
2. Run SQL schemas.
3. Import the CIQUAL XLSX file.
4. Add the database URL to Vercel.
5. Redeploy.
6. Test `/api/search?q=banane`.

## Important

The CIQUAL XLSX file is not deployed to Vercel and not committed to GitHub.
Only the imported database is queried by the website.
