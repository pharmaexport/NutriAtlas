import searchIndex from "../data/processed/search-index.json";

export type NutrientKey =
  | "energy_kcal"
  | "protein_g"
  | "carbs_g"
  | "fat_g"
  | "sugars_g"
  | "fiber_g"
  | "salt_g"
  | "calcium_mg"
  | "iron_mg"
  | "magnesium_mg"
  | "potassium_mg"
  | "sodium_mg"
  | "vitamin_c_mg"
  | "vitamin_d_ug"
  | "folate_ug";

export type NutrientRole = "positive" | "limit" | "neutral";

export type Food = {
  code: string;
  name: string;
  scientificName?: string | null;
  group: string;
  subgroup?: string | null;
  subsubgroup?: string | null;
  aliases?: string[];
  nutrients: Partial<Record<NutrientKey, number>>;
};

export const foods = searchIndex as Food[];

export const nutrientLabels: Record<NutrientKey, { label: string; unit: string }> = {
  energy_kcal: { label: "Énergie", unit: "kcal" },
  protein_g: { label: "Protéines", unit: "g" },
  carbs_g: { label: "Glucides", unit: "g" },
  fat_g: { label: "Lipides", unit: "g" },
  sugars_g: { label: "Sucres", unit: "g" },
  fiber_g: { label: "Fibres", unit: "g" },
  salt_g: { label: "Sel", unit: "g" },
  calcium_mg: { label: "Calcium", unit: "mg" },
  iron_mg: { label: "Fer", unit: "mg" },
  magnesium_mg: { label: "Magnésium", unit: "mg" },
  potassium_mg: { label: "Potassium", unit: "mg" },
  sodium_mg: { label: "Sodium", unit: "mg" },
  vitamin_c_mg: { label: "Vitamine C", unit: "mg" },
  vitamin_d_ug: { label: "Vitamine D", unit: "µg" },
  folate_ug: { label: "Vitamine B9", unit: "µg" }
};

export const nutrientRoles: Record<NutrientKey, NutrientRole> = {
  energy_kcal: "neutral",
  protein_g: "positive",
  carbs_g: "neutral",
  fat_g: "neutral",
  sugars_g: "limit",
  fiber_g: "positive",
  salt_g: "limit",
  calcium_mg: "positive",
  iron_mg: "positive",
  magnesium_mg: "positive",
  potassium_mg: "positive",
  sodium_mg: "limit",
  vitamin_c_mg: "positive",
  vitamin_d_ug: "positive",
  folate_ug: "positive"
};

export const referenceTargets: Partial<Record<NutrientKey, number>> = {
  energy_kcal: 2000,
  protein_g: 50,
  carbs_g: 260,
  fat_g: 70,
  sugars_g: 90,
  fiber_g: 30,
  salt_g: 6,
  calcium_mg: 800,
  iron_mg: 14,
  magnesium_mg: 375,
  potassium_mg: 2000,
  sodium_mg: 2400,
  vitamin_c_mg: 80,
  vitamin_d_ug: 5,
  folate_ug: 200
};

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function simplifyPlural(value: string) {
  return value
    .split(" ")
    .map((word) => {
      if (word.length > 4 && word.endsWith("aux")) return `${word.slice(0, -3)}al`;
      if (word.length > 3 && word.endsWith("s")) return word.slice(0, -1);
      return word;
    })
    .join(" ");
}

function searchableText(food: Food) {
  return normalizeText([
    food.name,
    food.group,
    food.subgroup || "",
    food.subsubgroup || "",
    ...(food.aliases || [])
  ].join(" "));
}

export function searchFoods(query: string, limit = 20) {
  const q = normalizeText(query);
  const singularQ = simplifyPlural(q);
  if (!q) return [];

  return foods
    .map((food) => {
      const name = normalizeText(food.name);
      const aliases = (food.aliases || []).map(normalizeText);
      const haystack = searchableText(food);
      let score = 100;

      if (name === q || aliases.includes(q)) score = 0;
      else if (name === singularQ || aliases.includes(singularQ)) score = 1;
      else if (name.startsWith(q) || aliases.some((alias) => alias.startsWith(q))) score = 2;
      else if (name.startsWith(singularQ) || aliases.some((alias) => alias.startsWith(singularQ))) score = 3;
      else if (haystack.includes(q)) score = 4;
      else if (haystack.includes(singularQ)) score = 5;

      return { food, score };
    })
    .filter((entry) => entry.score < 100)
    .sort((a, b) => a.score - b.score || a.food.name.localeCompare(b.food.name, "fr"))
    .slice(0, limit)
    .map((entry) => entry.food);
}

export function getFoodByCode(code: string) {
  return foods.find((food) => food.code === code);
}

export function portionValue(valuePer100g: number | undefined, grams: number) {
  if (typeof valuePer100g !== "number") return null;
  return Math.round((valuePer100g * grams) / 100 * 10) / 10;
}

export function coverage(value: number | null, target?: number) {
  if (value === null || !target) return null;
  return Math.max(0, Math.round((value / target) * 100));
}
