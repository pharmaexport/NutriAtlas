import ciqualIndex from "../.generated/ciqual-search-index.json";

export type NutrientKey = string;

export type FullNutrient = {
  id?: number;
  key: string;
  label: string;
  unit: string;
  value: number;
  sourceColumnName?: string | null;
};

export type Food = {
  code: string;
  name: string;
  scientificName?: string | null;
  group: string;
  subgroup?: string | null;
  subsubgroup?: string | null;
  aliases?: string[];
  nutrients: Record<string, number>;
  fullNutrients?: FullNutrient[];
};

type CiqualIndex = {
  meta: {
    dataset: string;
    publisher: string;
    version: string;
    foodCount: number;
    nutrientCount?: number;
    summaryNutrientCount?: number;
    generatedFrom: string;
  };
  foods: Food[];
};

const index = ciqualIndex as CiqualIndex;

export const ciqualMeta = index.meta;
export const foods = index.foods;
export const nutrientLabels: Record<string, { label: string; unit: string }> = {};
export const referenceTargets: Record<string, number> = {};

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
    .map((word) => word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word)
    .join(" ");
}

function searchableText(food: Food) {
  return normalizeText([food.name, food.group, food.subgroup || "", food.subsubgroup || "", ...(food.aliases || [])].join(" "));
}

function wordStartsWith(text: string, query: string) {
  return text.split(" ").some((word) => word.startsWith(query));
}

export function searchFoods(query: string, limit = 20) {
  const q = normalizeText(query);
  const singularQ = simplifyPlural(q);
  if (!q) return [];

  return foods
    .map((food) => {
      const name = normalizeText(food.name);
      const aliases = (food.aliases || []).map(normalizeText);
      const aliasText = aliases.join(" ");
      const haystack = searchableText(food);
      let score = 100;

      if (name === q || aliases.includes(q)) score = 0;
      else if (name === singularQ || aliases.includes(singularQ)) score = 1;
      else if (name.startsWith(q) || aliases.some((alias) => alias.startsWith(q))) score = 2;
      else if (name.startsWith(singularQ) || aliases.some((alias) => alias.startsWith(singularQ))) score = 3;
      else if (wordStartsWith(name, q) || wordStartsWith(aliasText, q)) score = 4;
      else if (wordStartsWith(name, singularQ) || wordStartsWith(aliasText, singularQ)) score = 5;
      else if (name.includes(q) || aliases.some((alias) => alias.includes(q))) score = 6;
      else if (name.includes(singularQ) || aliases.some((alias) => alias.includes(singularQ))) score = 7;
      else if (q.length >= 4 && haystack.includes(q)) score = 30;
      else if (singularQ.length >= 4 && haystack.includes(singularQ)) score = 31;

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
