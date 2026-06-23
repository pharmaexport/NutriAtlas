import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "../../../../lib/db";

export const dynamic = "force-dynamic";

type Params = {
  params: {
    code: string;
  };
};

export async function GET(_request: Request, { params }: Params) {
  const code = params.code;

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { source_food_code: code, status: "database_not_configured" },
      { status: 503 }
    );
  }

  const foodResult = await db.query(
    `
      SELECT
        f.id,
        f.source_food_code,
        f.name,
        f.scientific_name,
        f.food_group_name_fr,
        f.food_subgroup_name_fr,
        f.food_subsubgroup_name_fr,
        dv.version AS dataset_version,
        dv.source_url,
        dv.checksum_sha256
      FROM foods f
      JOIN dataset_versions dv ON dv.id = f.dataset_version_id
      WHERE f.source_food_code = $1
      ORDER BY dv.created_at DESC
      LIMIT 1
    `,
    [code]
  );

  if (foodResult.rowCount === 0) {
    return NextResponse.json({ source_food_code: code, status: "not_found" }, { status: 404 });
  }

  const food = foodResult.rows[0];
  const nutrientsResult = await db.query(
    `
      SELECT
        n.name,
        n.unit,
        n.infoods_tag,
        fn.value,
        fn.original_value,
        fn.source_column_name
      FROM food_nutrients fn
      JOIN nutrients n ON n.id = fn.nutrient_id
      WHERE fn.food_id = $1
      ORDER BY n.name ASC
    `,
    [food.id]
  );

  return NextResponse.json({
    food,
    nutrients: nutrientsResult.rows
  });
}
