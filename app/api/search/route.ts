import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    return NextResponse.json({ query: q, results: [] });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        query: q,
        results: [],
        status: "database_not_configured"
      },
      { status: 503 }
    );
  }

  const result = await db.query(
    `
      SELECT
        f.source_food_code,
        f.name,
        f.scientific_name,
        f.food_group_name_fr,
        dv.version AS dataset_version
      FROM foods f
      JOIN dataset_versions dv ON dv.id = f.dataset_version_id
      WHERE f.name ILIKE $1
      ORDER BY
        CASE WHEN f.name ILIKE $2 THEN 0 ELSE 1 END,
        f.name ASC
      LIMIT 20
    `,
    [`%${q}%`, `${q}%`]
  );

  return NextResponse.json({
    query: q,
    count: result.rowCount,
    results: result.rows
  });
}
