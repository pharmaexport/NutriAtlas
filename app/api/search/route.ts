import { NextResponse } from "next/server";
import { searchFoods } from "../../../lib/nutrition-data";

export const dynamic = "force-dynamic";

const DATA_SOURCE = "ciqual-2025-anses";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    if (q.length > 80) {
      return NextResponse.json(
        { query: q, count: 0, source: DATA_SOURCE, results: [], error: "query_too_long" },
        { status: 400 }
      );
    }

    const matches = q ? searchFoods(q) : [];

    return NextResponse.json({
      query: q,
      count: matches.length,
      source: DATA_SOURCE,
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
  } catch (error) {
    console.error("Search API failed", error);
    return NextResponse.json(
      { query: "", count: 0, source: DATA_SOURCE, results: [], error: "search_unavailable" },
      { status: 500 }
    );
  }
}
