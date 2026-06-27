import type { Food, FullNutrient } from "./nutrition-data";

export type NutritionRankingGrade = "A" | "B" | "C" | "D" | "E";
export type NutritionRankingColor = "vert" | "jaune" | "orange" | "rouge";
export type NutritionRankingConfidence = "moyenne" | "faible";

export type NutritionRankingEstimate = {
  grade: NutritionRankingGrade;
  color: NutritionRankingColor;
  confidence: NutritionRankingConfidence;
  label: string;
};

const ENERGY_THRESHOLDS_KJ = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350];
const SATURATED_FAT_THRESHOLDS_G = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SUGARS_THRESHOLDS_G = [3.4, 6.8, 10, 14, 17, 20, 24, 27, 31, 34, 37, 41, 44, 48, 51];
const SALT_THRESHOLDS_G = [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.8, 4];
const FIBER_THRESHOLDS_G = [3, 4.1, 5.2, 6.3, 7.4];
const PROTEIN_THRESHOLDS_G = [2.4, 4.8, 7.2, 9.6, 12, 14, 17];

function normalizeText(value: string) {
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

function thresholdCount(value: number, thresholds: readonly number[]) {
  return thresholds.reduce((sum, threshold) => sum + (value > threshold ? 1 : 0), 0);
}

function gradeFromTotal(total: number): NutritionRankingGrade {
  if (total <= 0) return "A";
  if (total <= 2) return "B";
  if (total <= 10) return "C";
  if (total <= 18) return "D";
  return "E";
}

function colorFromGrade(grade: NutritionRankingGrade): NutritionRankingColor {
  if (grade === "A" || grade === "B") return "vert";
  if (grade === "C") return "jaune";
  if (grade === "D") return "orange";
  return "rouge";
}

function findFullNutrient(food: Pick<Food, "fullNutrients">, matcher: (text: string, nutrient: FullNutrient) => boolean) {
  return (food.fullNutrients || []).find((nutrient) => {
    const text = normalizeText([nutrient.key, nutrient.label, nutrient.sourceColumnName || ""].join(" "));
    return matcher(text, nutrient);
  })?.value;
}

function nutrientValue(food: Food, key: string) {
  const value = food.nutrients[key];
  return typeof value === "number" ? value : null;
}

function energyKj(food: Food) {
  const summaryKj = nutrientValue(food, "energy_kj");
  if (summaryKj !== null) return summaryKj;

  const fullKj = findFullNutrient(food, (text, nutrient) => {
    const unit = nutrient.unit.toLowerCase();
    return unit === "kj" && (text.includes("energie") || text.includes("energy"));
  });
  if (typeof fullKj === "number") return fullKj;

  const kcal = nutrientValue(food, "energy_kcal");
  return kcal !== null ? kcal * 4.184 : null;
}

function saturatedFatG(food: Food) {
  const summary = nutrientValue(food, "saturated_fat_g");
  if (summary !== null) return summary;

  const full = findFullNutrient(food, (text, nutrient) => {
    if (nutrient.unit !== "g") return false;
    const saturated = text.includes("acides gras satures") || text.includes("ag satures") || text.includes("saturated fat");
    const unrelated = text.includes("mono") || text.includes("poly") || text.includes("insatures") || text.includes("trans");
    return saturated && !unrelated;
  });

  return typeof full === "number" ? full : null;
}

function saltG(food: Food) {
  const salt = nutrientValue(food, "salt_g");
  if (salt !== null) return salt;

  const sodiumMg = nutrientValue(food, "sodium_mg");
  return sodiumMg !== null ? (sodiumMg * 2.5) / 1000 : null;
}

function fruitVegetableLegumeContribution(food: Food) {
  const text = normalizeText([food.name, food.group, food.subgroup || "", food.subsubgroup || ""].join(" "));
  const isFruitVegOrLegume =
    text.includes("fruit") ||
    text.includes("legume") ||
    text.includes("legumineuse") ||
    text.includes("lentille") ||
    text.includes("pois chiche") ||
    text.includes("haricot") ||
    text.includes("feve");

  return isFruitVegOrLegume ? 5 : 0;
}

export function computeNutritionRanking(food: Food): NutritionRankingEstimate | null {
  const energy = energyKj(food);
  const saturatedFat = saturatedFatG(food);
  const sugars = nutrientValue(food, "sugars_g");
  const salt = saltG(food);
  const fiber = nutrientValue(food, "fiber_g") || 0;
  const protein = nutrientValue(food, "protein_g") || 0;

  if (energy === null || saturatedFat === null || sugars === null || salt === null) return null;

  const unfavorable =
    thresholdCount(energy, ENERGY_THRESHOLDS_KJ) +
    thresholdCount(saturatedFat, SATURATED_FAT_THRESHOLDS_G) +
    thresholdCount(sugars, SUGARS_THRESHOLDS_G) +
    thresholdCount(salt, SALT_THRESHOLDS_G);

  const fruitVegLegume = fruitVegetableLegumeContribution(food);
  const fiberContribution = thresholdCount(fiber, FIBER_THRESHOLDS_G);
  const proteinContribution = thresholdCount(protein, PROTEIN_THRESHOLDS_G);
  const favorable = unfavorable < 11 ? fruitVegLegume + fiberContribution + proteinContribution : fruitVegLegume + fiberContribution;
  const grade = gradeFromTotal(unfavorable - favorable);
  const confidence: NutritionRankingConfidence = fruitVegLegume > 0 ? "moyenne" : "faible";

  return {
    grade,
    color: colorFromGrade(grade),
    confidence,
    label: `Ranking nutritionnel estimé ${grade}`
  };
}
