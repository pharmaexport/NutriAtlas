import { NextResponse } from "next/server";
import { searchFoods } from "../../../lib/nutrition-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length > 120) {
    return NextResponse.json({ error: "Requête de recherche trop longue" }, { status: 400 });
  }
  const matches = q ? searchFoods(q, 20) : [];

  return NextResponse.json({
    query: q,
    count: matches.length,
    source: "ciqual-generated-index",
    results: matches.map((food) => ({
      source_food_code: food.code,
      name: food.name,
      scientific_name: food.scientificName || null,
      food_group_name_fr: food.group,
      food_subgroup_name_fr: food.subgroup || null,
      dataset_version: "CIQUAL 2025",
      nutrients: food.nutrients
    }))
  });
}
