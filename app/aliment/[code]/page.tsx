import { FoodDetailClient } from "./FoodDetailClient";
import { getFoodByCode } from "../../../lib/nutrition-data";
import { computeNutritionRanking } from "../../../lib/nutrition-ranking";

type PageProps = { params: { code: string } };

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

function roleFor(key: string): "positive" | "limit" | "neutral" {
  if (key.includes("sugar") || key.includes("salt") || key.includes("sodium")) return "limit";
  if (
    key.includes("vitamin") ||
    key.includes("calcium") ||
    key.includes("iron") ||
    key.includes("magnesium") ||
    key.includes("potassium") ||
    key.includes("selenium") ||
    key.includes("zinc") ||
    key.includes("fiber") ||
    key.includes("protein")
  ) return "positive";
  return "neutral";
}

function sortScore(key: string) {
  if (key.includes("energy")) return 0;
  if (key.includes("protein") || key.includes("carb") || key.includes("fat") || key.includes("sugar") || key.includes("fiber") || key.includes("salt")) return 1;
  if (key.includes("calcium") || key.includes("iron") || key.includes("magnesium") || key.includes("potassium") || key.includes("sodium") || key.includes("zinc") || key.includes("selenium")) return 2;
  if (key.includes("vitamin") || key.includes("retinol") || key.includes("carotene") || key.includes("folate")) return 3;
  return 4;
}

function nutrientsFor(food: { nutrients: Record<string, number> }) {
  return Object.entries(food.nutrients || {})
    .filter(([, value]) => typeof value === "number")
    .sort(([a], [b]) => sortScore(a) - sortScore(b) || a.localeCompare(b, "fr"))
    .map(([key, per100g]) => ({
      key,
      label: labelFor(key),
      unit: unitFor(key),
      per100g,
      role: roleFor(key)
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

  const nutritionRanking = computeNutritionRanking(food);

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
        nutritionRanking={nutritionRanking}
      />
    </main>
  );
}
