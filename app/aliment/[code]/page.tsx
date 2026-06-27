import { FoodDetailClient } from "./FoodDetailClient";
import { getFoodByCode, type Food, type FullNutrient } from "../../../lib/nutrition-data";

type PageProps = { params: { code: string } };
type NutrientRole = "positive" | "limit" | "neutral";

type NutrientRow = {
  key: string;
  label: string;
  unit: string;
  per100g: number;
  role: NutrientRole;
  sourceColumnName?: string | null;
};

const SUMMARY_LABELS: Record<string, string> = {
  energy_kcal: "Énergie",
  energy_kj: "Énergie",
  protein_g: "Protéines",
  carbs_g: "Glucides",
  fat_g: "Lipides",
  saturated_fat_g: "Acides gras saturés",
  sugars_g: "Sucres",
  fiber_g: "Fibres alimentaires",
  salt_g: "Sel",
  sodium_mg: "Sodium",
  potassium_mg: "Potassium",
  calcium_mg: "Calcium",
  iron_mg: "Fer",
  magnesium_mg: "Magnésium",
  zinc_mg: "Zinc",
  selenium_ug: "Sélénium",
  iodine_ug: "Iode",
  vitamin_c_mg: "Vitamine C",
  vitamin_d_ug: "Vitamine D",
  folate_ug: "Vitamine B9 / folates",
  vitamin_b12_ug: "Vitamine B12",
  vitamin_b6_mg: "Vitamine B6",
  vitamin_e_mg: "Vitamine E",
  vitamin_a_ug: "Vitamine A",
  cholesterol_mg: "Cholestérol"
};

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

function unitFor(key: string) {
  if (key.endsWith("_ug")) return "µg";
  if (key.endsWith("_mg")) return "mg";
  if (key.endsWith("_g")) return "g";
  if (key.endsWith("_kcal")) return "kcal";
  if (key.endsWith("_kj")) return "kJ";
  return "";
}

function cleanLabel(value: string) {
  return value
    .replace(/\s*\((?:kcal|kJ|µg|ug|mg|g)?\s*\/?\s*100\s*g\)\s*$/iu, "")
    .replace(/\s*\((?:kcal|kJ|µg|ug|mg|g)?\s*100\s*g\)\s*$/iu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function labelFor(key: string, fallback?: string | null) {
  if (SUMMARY_LABELS[key]) return SUMMARY_LABELS[key];
  if (fallback) return cleanLabel(fallback);

  const clean = key.replace(/_(ug|mg|g|kcal|kj)$/u, "");
  return clean
    .split("_")
    .filter(Boolean)
    .map((part) => {
      if (part === "vitamin") return "Vitamine";
      if (part.length <= 2) return part.toUpperCase();
      return `${part[0].toUpperCase()}${part.slice(1)}`;
    })
    .join(" ");
}

function canonicalKey(nutrient: FullNutrient) {
  const text = normalizeText([nutrient.key, nutrient.label, nutrient.sourceColumnName || ""].join(" "));
  const unit = nutrient.unit.toLowerCase();

  if (unit === "kcal" && (text.includes("energie") || text.includes("energy"))) return "energy_kcal";
  if (unit === "kj" && (text.includes("energie") || text.includes("energy"))) return "energy_kj";
  if (unit === "g" && text.includes("proteine")) return "protein_g";
  if (unit === "g" && text.includes("glucide")) return "carbs_g";
  if (unit === "g" && text.includes("lipide")) return "fat_g";
  if (unit === "g" && text.includes("sature") && !text.includes("mono") && !text.includes("poly") && !text.includes("trans")) return "saturated_fat_g";
  if (unit === "g" && text.includes("sucre")) return "sugars_g";
  if (unit === "g" && text.includes("fibre")) return "fiber_g";
  if (unit === "g" && text.includes("sel")) return "salt_g";
  if (unit === "mg" && text.includes("sodium")) return "sodium_mg";
  if (unit === "mg" && text.includes("potassium")) return "potassium_mg";
  if (unit === "mg" && text.includes("calcium")) return "calcium_mg";
  if (unit === "mg" && text.includes("magnesium")) return "magnesium_mg";
  if (unit === "mg" && text.includes("fer")) return "iron_mg";
  if (unit === "mg" && text.includes("zinc")) return "zinc_mg";
  if (unit === "µg" && text.includes("selenium")) return "selenium_ug";
  if (unit === "µg" && text.includes("iode")) return "iodine_ug";
  if (unit === "mg" && text.includes("vitamine c")) return "vitamin_c_mg";
  if (unit === "µg" && text.includes("vitamine d")) return "vitamin_d_ug";
  if (unit === "µg" && (text.includes("vitamine b9") || text.includes("folate"))) return "folate_ug";
  if (unit === "µg" && text.includes("vitamine b12")) return "vitamin_b12_ug";
  if (unit === "mg" && text.includes("vitamine b6")) return "vitamin_b6_mg";
  if (unit === "mg" && text.includes("vitamine e")) return "vitamin_e_mg";
  if (unit === "µg" && (text.includes("vitamine a") || text.includes("retinol"))) return "vitamin_a_ug";
  if (unit === "mg" && text.includes("cholesterol")) return "cholesterol_mg";

  return nutrient.key;
}

function roleFor(key: string, label = ""): NutrientRole {
  const text = normalizeText(`${key} ${label}`);
  if (
    text.includes("sucre") ||
    text.includes("sugar") ||
    text.includes("salt") ||
    text.includes("sel") ||
    text.includes("sodium") ||
    text.includes("sature") ||
    text.includes("trans") ||
    text.includes("cholesterol")
  ) return "limit";

  if (
    text.includes("vitamin") ||
    text.includes("vitamine") ||
    text.includes("calcium") ||
    text.includes("iron") ||
    text.includes("fer") ||
    text.includes("magnesium") ||
    text.includes("potassium") ||
    text.includes("selenium") ||
    text.includes("zinc") ||
    text.includes("iode") ||
    text.includes("fiber") ||
    text.includes("fibre") ||
    text.includes("protein") ||
    text.includes("proteine") ||
    text.includes("omega") ||
    text.includes("epa") ||
    text.includes("dha")
  ) return "positive";

  return "neutral";
}

function sortScore(item: Pick<NutrientRow, "key" | "label" | "unit">) {
  const text = normalizeText(`${item.key} ${item.label}`);
  if (item.key === "energy_kcal") return 0;
  if (item.key === "energy_kj") return 1;
  if (text.includes("proteine") || text.includes("protein") || text.includes("glucide") || text.includes("carb") || text.includes("lipide") || text.includes("fat") || text.includes("sucre") || text.includes("sugar") || text.includes("fibre") || text.includes("fiber") || text.includes("sel") || text.includes("salt")) return 10;
  if (text.includes("omega") || text.includes("epa") || text.includes("dha") || text.includes("linole") || text.includes("oleique") || text.includes("sature")) return 20;
  if (text.includes("calcium") || text.includes("fer") || text.includes("iron") || text.includes("magnesium") || text.includes("potassium") || text.includes("sodium") || text.includes("zinc") || text.includes("selenium") || text.includes("iode")) return 30;
  if (text.includes("vitamin") || text.includes("vitamine") || text.includes("retinol") || text.includes("carotene") || text.includes("folate")) return 40;
  return 50;
}

function fullNutrientsFor(food: Food): NutrientRow[] {
  const rows = new Map<string, NutrientRow>();

  for (const nutrient of food.fullNutrients || []) {
    if (typeof nutrient.value !== "number") continue;
    const key = canonicalKey(nutrient);
    const unit = nutrient.unit || unitFor(key);
    const label = labelFor(key, nutrient.label || nutrient.sourceColumnName);
    const mapKey = `${key}__${label}__${unit}`;

    if (!rows.has(mapKey)) {
      rows.set(mapKey, {
        key,
        label,
        unit,
        per100g: nutrient.value,
        role: roleFor(key, label),
        sourceColumnName: nutrient.sourceColumnName || null
      });
    }
  }

  for (const [key, value] of Object.entries(food.nutrients || {})) {
    if (typeof value !== "number") continue;
    const unit = unitFor(key);
    const label = labelFor(key);
    const mapKey = `${key}__${label}__${unit}`;

    if (!rows.has(mapKey)) {
      rows.set(mapKey, {
        key,
        label,
        unit,
        per100g: value,
        role: roleFor(key, label),
        sourceColumnName: null
      });
    }
  }

  return Array.from(rows.values())
    .sort((a, b) => sortScore(a) - sortScore(b) || a.label.localeCompare(b.label, "fr") || a.key.localeCompare(b.key, "fr"));
}

export default function FoodPage({ params }: PageProps) {
  const food = getFoodByCode(params.code);

  if (!food) {
    return (
      <main>
        <nav className="nav">
          <a className="brand" href="/">NutriAtlas</a>
          <div className="navLinks">
            <a href="/ciqual">CIQUAL</a>
            <a href="/cumul">Cumul</a>
          </div>
        </nav>
        <section className="foodPage pageSection">
          <p className="eyebrow">Aliment</p>
          <h1>Aliment indisponible.</h1>
          <p>Retourne à CIQUAL et sélectionne une proposition.</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/ciqual">CIQUAL</a>
          <a href="/cumul">Cumul</a>
          <a href="/profil">Profil</a>
        </div>
      </nav>

      <FoodDetailClient
        food={{ code: food.code, name: food.name, group: food.group, subgroup: food.subgroup || null }}
        portions={[{ label: "100 g", grams: 100, description: "Référence nutritionnelle standard CIQUAL." }]}
        nutrients={fullNutrientsFor(food)}
      />
    </main>
  );
}
