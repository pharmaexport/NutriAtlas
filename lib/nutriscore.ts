import type { Food, FullNutrient } from "./nutrition-data";

export type NutriScoreGrade = "A" | "B" | "C" | "D" | "E";
export type NutriScoreColor = "vert" | "jaune" | "orange" | "rouge";
export type NutriScoreConfidence = "moyenne" | "faible";

export type NutriScoreEstimate = {
  score: number;
  grade: NutriScoreGrade;
  color: NutriScoreColor;
  confidence: NutriScoreConfidence;
  label: string;
  details: string;
};

const ENERGY_POINTS_KJ = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350];
const SATURATED_FAT_POINTS_G = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SUGARS_POINTS_G = [3.4, 6.8, 10, 14, 17, 20, 24, 27, 31, 34, 37, 41, 44, 48, 51];
const SALT_POINTS_G = [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.8, 4];
const FIBER_POINTS_G = [3, 4.1, 5.2, 6.3, 7.4];
const PROTEIN_POINTS_G = [2.4, 4.8, 7.2, 9.6, 12, 14, 17];

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

function points(value: number, thresholds: readonly number[]) {
  return thresholds.reduce((sum, threshold) => sum + (value > threshold ? 1 : 0), 0);
}

function rounded(value: number) {
  return Math.round(value * 10) / 10;
}

function gradeFromScore(score: number): NutriScoreGrade {
  if (score <= 0) return "A";
  if (score <= 2) return "B";
  if (score <= 10) return "C";
  if (score <= 18) return "D";
  return "E";
}

function colorFromGrade(grade: NutriScoreGrade): NutriScoreColor {
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

function fruitVegetableLegumePoints(food: Food) {
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

export function computeNutriScoreEstimate(food: Food): NutriScoreEstimate | null {
  const energy = energyKj(food);
  const saturatedFat = saturatedFatG(food);
  const sugars = nutrientValue(food, "sugars_g");
  const salt = saltG(food);
  const fiber = nutrientValue(food, "fiber_g") || 0;
  const protein = nutrientValue(food, "protein_g") || 0;

  if (energy === null || saturatedFat === null || sugars === null || salt === null) return null;

  const negative =
    points(energy, ENERGY_POINTS_KJ) +
    points(saturatedFat, SATURATED_FAT_POINTS_G) +
    points(sugars, SUGARS_POINTS_G) +
    points(salt, SALT_POINTS_G);

  const fruitVegLegume = fruitVegetableLegumePoints(food);
  const fiberPoints = points(fiber, FIBER_POINTS_G);
  const proteinPoints = points(protein, PROTEIN_POINTS_G);
  const positive = negative < 11 ? fruitVegLegume + fiberPoints + proteinPoints : fruitVegLegume + fiberPoints;
  const score = negative - positive;
  const grade = gradeFromScore(score);
  const confidence: NutriScoreConfidence = fruitVegLegume > 0 ? "moyenne" : "faible";

  return {
    score,
    grade,
    color: colorFromGrade(grade),
    confidence,
    label: `Nutri-Score estimé ${grade}`,
    details: `Score numérique ${rounded(score)} · estimation CIQUAL, cas général`
  };
}
