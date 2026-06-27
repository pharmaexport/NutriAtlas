import { FoodDetailClient } from "../../../aliment/[code]/FoodDetailClient";
import { getFoodByCode, type FullNutrient } from "../../../../lib/nutrition-data";

type PageProps = { params: { code: string } };
type Category = "macros" | "glucides" | "lipides" | "mineraux" | "vitamines" | "autres";
type NutrientRow = { key: string; label: string; unit: string; value: number; sourceColumnName?: string | null; category: Category };

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

function categoryFor(nutrient: Pick<FullNutrient, "key" | "label" | "sourceColumnName">): Category {
  const text = normalize(`${nutrient.key} ${nutrient.label} ${nutrient.sourceColumnName || ""}`);
  if (includesAny(text, ["vitamine", "vitamin", "retinol", "carotene", "folate", "thiamine", "riboflavine", "niacine", "cobalamine", "tocopherol", "phylloquinone"])) return "vitamines";
  if (includesAny(text, ["calcium", "fer", "iron", "magnesium", "magnes", "potassium", "sodium", "zinc", "cuivre", "manganese", "selenium", "iode", "phosphore", "chlorure"])) return "mineraux";
  if (includesAny(text, ["lipide", "fat", "acide_gras", "ag_", "sature", "monoinsature", "polyinsature", "cholesterol", "omega", "dha", "epa"])) return "lipides";
  if (includesAny(text, ["glucide", "carb", "sucre", "sugar", "amidon", "glucose", "fructose", "galactose", "lactose", "maltose", "polyol"])) return "glucides";
  if (includesAny(text, ["energie", "energy", "eau", "water", "proteine", "protein", "fibre", "fiber", "alcool", "alcohol", "cendres"])) return "macros";
  return "autres";
}

function labelForSummaryKey(key: string) {
  return key
    .replace(/_(ug|mg|g|kcal|kj)$/u, "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.length <= 2 ? part.toUpperCase() : `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function unitForSummaryKey(key: string) {
  if (key.endsWith("_ug")) return "µg";
  if (key.endsWith("_mg")) return "mg";
  if (key.endsWith("_g")) return "g";
  if (key.endsWith("_kcal")) return "kcal";
  if (key.endsWith("_kj")) return "kJ";
  return "";
}

function rowsFor(food: { nutrients: Record<string, number>; fullNutrients?: FullNutrient[] }) {
  const rows: NutrientRow[] = food.fullNutrients?.length
    ? food.fullNutrients.map((nutrient) => ({
        key: nutrient.key,
        label: nutrient.label,
        unit: nutrient.unit,
        value: nutrient.value,
        sourceColumnName: nutrient.sourceColumnName || null,
        category: categoryFor(nutrient)
      }))
    : Object.entries(food.nutrients || {}).map(([key, value]) => {
        const row = { key, label: labelForSummaryKey(key), unit: unitForSummaryKey(key), value, sourceColumnName: null };
        return { ...row, category: categoryFor(row) };
      });

  return rows.sort((a, b) => a.category.localeCompare(b.category, "fr") || a.label.localeCompare(b.label, "fr"));
}

function detailRowsFor(food: { nutrients: Record<string, number>; fullNutrients?: FullNutrient[] }) {
  return rowsFor(food).map((row) => ({
    key: row.key,
    label: row.label,
    unit: row.unit,
    per100g: row.value
  }));
}

export default function Ciqual2FoodPage({ params }: PageProps) {
  const food = getFoodByCode(params.code);

  if (!food) {
    return (
      <main>
        <nav className="nav">
          <a className="brand" href="/">NutriAtlas</a>
          <div className="navLinks">
            <a href="/ciqual">CIQUAL</a>
            <a href="/ciqual2">CIQUAL 2</a>
          </div>
        </nav>
        <section className="foodPage pageSection">
          <p className="eyebrow">CIQUAL 2</p>
          <h1>Aliment indisponible.</h1>
          <p>Retourne à CIQUAL 2 et sélectionne une proposition.</p>
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
          <a href="/ciqual2">CIQUAL 2</a>
          <a href="/cumul">Cumul</a>
          <a href="/profil">Profil</a>
        </div>
      </nav>

      <FoodDetailClient
        food={{ code: food.code, name: food.name, group: `CIQUAL 2 · ${food.group}`, subgroup: food.subgroup || null }}
        portions={[{ label: "100 g", grams: 100, description: "Fiche complète CIQUAL 2 sur base 100 g." }]}
        nutrients={detailRowsFor(food)}
      />
    </main>
  );
}
