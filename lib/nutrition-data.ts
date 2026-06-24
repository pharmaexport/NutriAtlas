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
  | "vitamin_c_mg"
  | "vitamin_d_ug"
  | "folate_ug";

export type Food = {
  code: string;
  name: string;
  group: string;
  subgroup?: string;
  nutrients: Partial<Record<NutrientKey, number>>;
};

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
  vitamin_c_mg: { label: "Vitamine C", unit: "mg" },
  vitamin_d_ug: { label: "Vitamine D", unit: "µg" },
  folate_ug: { label: "Vitamine B9", unit: "µg" }
};

export const referenceTargets: Partial<Record<NutrientKey, number>> = {
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
  vitamin_c_mg: 80,
  vitamin_d_ug: 5,
  folate_ug: 200
};

export const foods: Food[] = [
  { code: "13012", name: "Banane, pulpe, crue", group: "fruits", subgroup: "fruits tropicaux", nutrients: { energy_kcal: 90, protein_g: 1.06, carbs_g: 19.7, fat_g: 0.25, sugars_g: 15.6, fiber_g: 2.7, magnesium_mg: 28, potassium_mg: 320, vitamin_c_mg: 7.16, folate_ug: 19 } },
  { code: "15004", name: "Amande", group: "fruits à coque et graines", subgroup: "fruits oléagineux", nutrients: { energy_kcal: 634, protein_g: 21.2, carbs_g: 7.85, fat_g: 53.4, sugars_g: 4.35, fiber_g: 12.5, magnesium_mg: 232, potassium_mg: 668, calcium_mg: 248, iron_mg: 3, vitamin_c_mg: 0.5 } },
  { code: "15009", name: "Noix", group: "fruits à coque et graines", subgroup: "fruits oléagineux", nutrients: { energy_kcal: 709, protein_g: 15.7, carbs_g: 6.88, fat_g: 67.3, sugars_g: 3, fiber_g: 6.7, magnesium_mg: 126, potassium_mg: 441, calcium_mg: 67.1, iron_mg: 2.2 } },
  { code: "26047", name: "Saumon, cuit", group: "poissons", subgroup: "poissons gras", nutrients: { energy_kcal: 205, protein_g: 22.8, fat_g: 12.3, magnesium_mg: 29, potassium_mg: 384, sodium_mg: 56, vitamin_d_ug: 8.7 } as Partial<Record<NutrientKey, number>> },
  { code: "4002", name: "Œuf, dur", group: "œufs", subgroup: "œufs cuits", nutrients: { energy_kcal: 134, protein_g: 13.5, carbs_g: 0.52, fat_g: 8.62, magnesium_mg: 12.1, potassium_mg: 126, calcium_mg: 52, iron_mg: 1.9, vitamin_d_ug: 2 } },
  { code: "11109", name: "Yaourt nature", group: "produits laitiers", subgroup: "yaourts", nutrients: { energy_kcal: 57, protein_g: 4, carbs_g: 4.6, fat_g: 2.6, sugars_g: 4.6, calcium_mg: 150, magnesium_mg: 13, potassium_mg: 190 } },
  { code: "20037", name: "Lentille, cuite", group: "légumineuses", subgroup: "légumes secs cuits", nutrients: { energy_kcal: 127, protein_g: 10.1, carbs_g: 16.6, fat_g: 0.58, fiber_g: 8.45, magnesium_mg: 36, potassium_mg: 284, iron_mg: 2.45, folate_ug: 59 } },
  { code: "20040", name: "Pois chiche, cuit", group: "légumineuses", subgroup: "légumes secs cuits", nutrients: { energy_kcal: 147, protein_g: 8.31, carbs_g: 17.7, fat_g: 3, fiber_g: 8.2, magnesium_mg: 44, potassium_mg: 291, iron_mg: 2.86, folate_ug: 84 } },
  { code: "20011", name: "Riz complet, cuit", group: "céréales", subgroup: "riz et assimilés", nutrients: { energy_kcal: 156, protein_g: 3.2, carbs_g: 31.7, fat_g: 1.1, fiber_g: 1.8, magnesium_mg: 43, potassium_mg: 86 } },
  { code: "24218", name: "Pain complet", group: "céréales", subgroup: "pains", nutrients: { energy_kcal: 247, protein_g: 9, carbs_g: 42, fat_g: 4.2, sugars_g: 4.7, fiber_g: 7.3, salt_g: 1.32, magnesium_mg: 82, potassium_mg: 250, iron_mg: 2.2 } },
  { code: "20004", name: "Brocoli, cuit", group: "légumes", subgroup: "légumes cuits", nutrients: { energy_kcal: 35, protein_g: 2.4, carbs_g: 2.2, fat_g: 0.41, fiber_g: 3, magnesium_mg: 16, potassium_mg: 148, calcium_mg: 59, vitamin_c_mg: 37, folate_ug: 108 } },
  { code: "20031", name: "Épinard, cuit", group: "légumes", subgroup: "légumes feuilles", nutrients: { energy_kcal: 28, protein_g: 3.2, carbs_g: 0.5, fat_g: 0.5, fiber_g: 3.1, magnesium_mg: 53, potassium_mg: 390, calcium_mg: 141, iron_mg: 2.14, folate_ug: 125 } },
  { code: "13001", name: "Pomme, crue", group: "fruits", subgroup: "fruits frais", nutrients: { energy_kcal: 53, protein_g: 0.27, carbs_g: 11.6, fat_g: 0.25, sugars_g: 10.4, fiber_g: 1.4, potassium_mg: 120, vitamin_c_mg: 4 } },
  { code: "13006", name: "Orange, crue", group: "fruits", subgroup: "agrumes", nutrients: { energy_kcal: 47, protein_g: 0.75, carbs_g: 8.03, fat_g: 0.3, sugars_g: 8.03, fiber_g: 2.7, potassium_mg: 151, calcium_mg: 40, vitamin_c_mg: 47.5, folate_ug: 30 } },
  { code: "31008", name: "Poulet, blanc, cuit", group: "viandes", subgroup: "volailles", nutrients: { energy_kcal: 157, protein_g: 31.2, fat_g: 3.2, magnesium_mg: 34, potassium_mg: 320, sodium_mg: 74 } as Partial<Record<NutrientKey, number>> },
  { code: "40001", name: "Chocolat noir 70% cacao", group: "produits sucrés", subgroup: "chocolats", nutrients: { energy_kcal: 572, protein_g: 8.7, carbs_g: 33.9, fat_g: 42.3, sugars_g: 29, fiber_g: 11, magnesium_mg: 206, potassium_mg: 715, iron_mg: 11.9 } }
];

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchFoods(query: string, limit = 20) {
  const q = normalizeText(query);
  if (!q) return [];

  return foods
    .map((food) => {
      const haystack = normalizeText(`${food.name} ${food.group} ${food.subgroup || ""}`);
      const starts = normalizeText(food.name).startsWith(q);
      const includes = haystack.includes(q);
      const score = starts ? 0 : includes ? 1 : 10;
      return { food, score };
    })
    .filter((entry) => entry.score < 10)
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
