import { FoodDetailClient } from "./FoodDetailClient";
import { getFoodByCode, type FullNutrient } from "../../../lib/nutrition-data";

type PageProps = { params: { code: string } };
type NutrientRole = "positive" | "limit" | "neutral";
type NutrientRow = { key: string; label: string; unit: string; value: number; sourceColumnName?: string | null; };

function unitFor(key: string) {
  if (key.endsWith("_ug")) return "µg";
  if (key.endsWith("_mg")) return "mg";
  if (key.endsWith("_g")) return "g";
  if (key.endsWith("_kcal")) return "kcal";
  if (key.endsWith("_kj")) return "kJ";
  return "";
}

function labelFor(key: string) {
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

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_");
}

function includesAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

function roleFor(key: string, label: string): NutrientRole {
  const normalized = normalize(`${key} ${label}`);
  if (
    includesAny(normalized, ["sugar", "sucre", "sucres", "salt", "sel", "sodium", "sature", "saturated"]) &&
    !normalized.includes("selenium")
  ) return "limit";
  if (
    includesAny(normalized, [
      "vitamin", "vitamine", "retinol", "carotene", "folate", "calcium", "iron", "fer", "magnesium", "magnes",
      "potassium", "selenium", "zinc", "cuivre", "manganese", "iode", "fiber", "fibre", "fibres", "protein", "proteine", "proteines"
    ])
  ) return "positive";
  return "neutral";
}

function sortScore(key: string, label: string) {
  const normalized = normalize(`${key} ${label}`);
  if (includesAny(normalized, ["energy", "energie"])) return 0;
  if (includesAny(normalized, ["eau", "water", "protein", "proteine", "glucide", "carb", "lipide", "fat", "sucre", "sugar", "fibre", "fiber", "sel", "salt", "alcool"])) return 1;
  if (includesAny(normalized, ["calcium", "fer", "iron", "magnesium", "magnes", "potassium", "sodium", "zinc", "selenium", "cuivre", "manganese", "iode", "phosphore"])) return 2;
  if (includesAny(normalized, ["vitamin", "vitamine", "retinol", "carotene", "folate", "thiamine", "riboflavine", "niacine", "cobalamine"])) return 3;
  return 4;
}

function summaryRows(nutrients: Record<string, number>): NutrientRow[] {
  return Object.entries(nutrients || {}).map(([key, value]) => ({
    key,
    label: labelFor(key),
    unit: unitFor(key),
    value
  }));
}

function fullRows(fullNutrients: FullNutrient[]): NutrientRow[] {
  return fullNutrients.map((nutrient) => ({
    key: nutrient.key,
    label: nutrient.label || labelFor(nutrient.key),
    unit: nutrient.unit || unitFor(nutrient.key),
    value: nutrient.value,
    sourceColumnName: nutrient.sourceColumnName || null
  }));
}

function nutrientsFor(food: { nutrients: Record<string, number>; fullNutrients?: FullNutrient[] }) {
  const sourceRows = food.fullNutrients?.length ? fullRows(food.fullNutrients) : summaryRows(food.nutrients);

  return sourceRows
    .filter((item) => typeof item.value === "number")
    .sort((a, b) => sortScore(a.key, a.label) - sortScore(b.key, b.label) || a.label.localeCompare(b.label, "fr"))
    .map((item) => ({
      key: item.key,
      label: item.label,
      unit: item.unit,
      per100g: item.value,
      sourceColumnName: item.sourceColumnName || null,
      role: roleFor(item.key, item.label)
    }));
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
        nutrients={nutrientsFor(food)}
      />
    </main>
  );
}
