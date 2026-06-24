import { NextResponse } from "next/server";
import { getFoodByCode, nutrientLabels, type NutrientKey } from "../../../../lib/nutrition-data";

export const dynamic = "force-dynamic";

type Params = {
  params: {
    code: string;
  };
};

export async function GET(_request: Request, { params }: Params) {
  const food = getFoodByCode(params.code);

  if (!food) {
    return NextResponse.json(
      {
        source_food_code: params.code,
        status: "not_found"
      },
      { status: 404 }
    );
  }

  const nutrients = Object.entries(food.nutrients).map(([key, value]) => {
    const nutrientKey = key as NutrientKey;
    const label = nutrientLabels[nutrientKey];
    return {
      source_column_name: key,
      name: label?.label || key,
      unit: label?.unit || "",
      value,
      original_value: value
    };
  });

  return NextResponse.json({
    food: {
      source_food_code: food.code,
      name: food.name,
      scientific_name: food.scientificName || null,
      food_group_name_fr: food.group,
      food_subgroup_name_fr: food.subgroup || null,
      food_subsubgroup_name_fr: food.subsubgroup || null
    },
    nutrients
  });
}
