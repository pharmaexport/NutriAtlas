import { NextResponse } from "next/server";
import { searchFoods } from "../../../lib/nutrition-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    if (q.length > 80) {
      return NextResponse.json(
        { query: q, count: 0, source: "github-local-ciqual-preview", results: [], error: "query_too_long" },
        { status: 400 }
      );
    }

    const matches = q ? searchFoods(q) : [];

    return NextResponse.json({
      query: q,
      count: matches.length,
      source: "github-local-ciqual-preview",
      results: matches.map((food) => ({
        source_food_code: food.code,
        name: food.name,
        scientific_name: food.scientificName || null,
        food_group_name_fr: food.group,
        food_subgroup_name_fr: food.subgroup || null,
        dataset_version: "CIQUAL preview",
        nutrients: food.nutrients
      }))
    });
  } catch (error) {
    console.error("Search API failed", error);
    return NextResponse.json(
      { query: "", count: 0, source: "github-local-ciqual-preview", results: [], error: "search_unavailable" },
      { status: 500 }
    );
  }
}
