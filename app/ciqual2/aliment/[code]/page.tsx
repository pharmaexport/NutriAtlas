import { FoodDetailClient } from "../../../aliment/[code]/FoodDetailClient";
import { getFoodByCode, type FullNutrient } from "../../../../lib/nutrition-data";

type PageProps = { params: { code: string }; searchParams?: { portion?: string } };
type Category = "macros" | "glucides" | "lipides" | "mineraux" | "vitamines" | "autres";
type NutrientRow = { key: string; label: string; unit: string; value: number; sourceColumnName?: string | null; category: Category };

const portionValues = [50, 100, 150, 200, 250, 300];
const vitaminOrder = [
  ["vitamin_c", "vitamine_c", "ascorbique"],
  ["vitamin_d", "vitamine_d"],
  ["vitamin_b9", "vitamine_b9", "folate", "folates", "folique"],
  ["vitamin_b12", "vitamine_b12", "cobalamine"],
  ["vitamin_a", "vitamine_a", "retinol", "carotene"],
  ["vitamin_e", "vitamine_e", "tocopherol"],
  ["vitamin_k", "vitamine_k", "phylloquinone"],
  ["vitamin_b1", "vitamine_b1", "thiamine"],
  ["vitamin_b2", "vitamine_b2", "riboflavine"],
  ["vitamin_b3", "vitamine_b3", "niacine", "niacin"],
  ["vitamin_b5", "vitamine_b5", "pantothenique", "pantothenic"],
  ["vitamin_b6", "vitamine_b6", "pyridoxine"],
  ["vitamin_b8", "vitamine_b8", "biotine", "biotin"]
];
const mineralOrder = [
  ["calcium"],
  ["fer", "iron"],
  ["magnesium", "magnes"],
  ["potassium"],
  ["sodium", "sel", "chlorure", "chloride"],
  ["zinc"],
  ["iode", "iodine"],
  ["selenium"],
  ["phosphore", "phosphorus"],
  ["cuivre", "copper"],
  ["manganese"],
  ["fluorure", "fluoride"],
  ["chrome", "chromium"],
  ["molybdene", "molybdenum"]
];

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

function firstMatchingOrder(text: string, groups: string[][]) {
  const index = groups.findIndex((needles) => includesAny(text, needles));
  return index === -1 ? null : index;
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

function nutrientText(row: NutrientRow) {
  return normalize(`${row.key} ${row.label} ${row.sourceColumnName || ""}`);
}

function cleanDisplayLabel(row: NutrientRow) {
  const text = nutrientText(row);

  if (includesAny(text, ["energy", "energie"]) && row.unit === "kcal") return "Énergie";
  if (includesAny(text, ["proteine", "proteines", "protein"])) return "Protéines";
  if (includesAny(text, ["glucide", "glucides", "carbohydrate", "carbs_g"]) && !includesAny(text, ["amidon", "glucose", "fructose", "lactose", "maltose", "galactose", "polyol"])) return "Glucides";
  if (isTotalSugar(text)) return "Sucres";
  if (isMainFat(text)) return "Lipides";
  if (includesAny(text, ["sature", "saturated"]) && includesAny(text, ["gras", "fat", "ag_", "acide_gras"])) return "Acides gras saturés";
  if (includesAny(text, ["monoinsature", "monounsaturated"])) return "Acides gras mono-insaturés";
  if (includesAny(text, ["polyinsature", "polyunsaturated"])) return "Acides gras poly-insaturés";
  if (includesAny(text, ["fiber", "fibre", "fibres"])) return "Fibres";

  return row.label
    .replace(/\s*\((kcal|kj|g|mg|µg|ug)\s*\/?\s*100\s*g\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isTotalSugar(text: string) {
  return includesAny(text, ["sugars_g", "sucres_g", "sucres", "sugar_total", "sugars_total"]) && !includesAny(text, ["glucose", "fructose", "lactose", "maltose", "galactose"]);
}

function isMainFat(text: string) {
  return includesAny(text, ["fat_g", "lipides_g", "lipides"]) && !includesAny(text, ["acide_gras", "ag_", "sature", "monoinsature", "polyinsature", "cholesterol", "omega", "epa", "dha"]);
}

function isSecondaryEnergyKj(row: NutrientRow) {
  const text = nutrientText(row);
  return includesAny(text, ["energie", "energy"]) && (row.unit === "kJ" || includesAny(text, ["_kj", "kj_100_g"]));
}

function canonicalNutrientKey(row: NutrientRow) {
  const text = nutrientText(row);
  if (includesAny(text, ["energy", "energie"]) && row.unit === "kcal") return "energy_kcal";
  if (includesAny(text, ["proteine", "proteines", "protein"])) return "protein";
  if (includesAny(text, ["glucide", "glucides", "carbohydrate", "carbs_g"]) && !includesAny(text, ["amidon", "glucose", "fructose", "lactose", "maltose", "galactose", "polyol"])) return "carbs";
  if (isTotalSugar(text)) return "sugars";
  if (isMainFat(text)) return "fat";
  if (includesAny(text, ["sature", "saturated"]) && includesAny(text, ["gras", "fat", "ag_", "acide_gras"])) return "saturated_fat";
  if (includesAny(text, ["fiber", "fibre", "fibres"])) return "fiber";
  return row.key;
}

function nutrientPriority(row: NutrientRow) {
  const text = nutrientText(row);
  const vitaminRank = firstMatchingOrder(text, vitaminOrder);
  const mineralRank = firstMatchingOrder(text, mineralOrder);

  if (includesAny(text, ["carbs_g", "glucides_g", "glucides", "carbohydrate"]) && !includesAny(text, ["amidon", "glucose", "fructose", "lactose", "maltose", "galactose", "polyol"])) return 10;
  if (isTotalSugar(text)) return 11;
  if (isMainFat(text)) return 20;
  if (includesAny(text, ["sature", "saturated"]) && includesAny(text, ["gras", "fat", "ag_", "acide_gras"])) return 21;
  if (includesAny(text, ["protein", "proteine", "proteines"])) return includesAny(text, ["facteur_de_jones", "jones"]) ? 30 : 31;
  if (includesAny(text, ["fiber", "fibre", "fibres"])) return 40;
  if (includesAny(text, ["energy", "energie"])) return includesAny(text, ["reglement_ue", "1169"]) ? 50 : 51;
  if (vitaminRank !== null) return 100 + vitaminRank;
  if (mineralRank !== null) return 200 + mineralRank;
  if (includesAny(text, ["amidon", "polyol", "glucose", "fructose", "galactose", "lactose", "maltose"])) return 350;
  if (includesAny(text, ["acide_gras", "ag_", "monoinsature", "polyinsature", "omega", "epa", "dha", "cholesterol"])) return 360;
  if (includesAny(text, ["eau", "water", "alcool", "alcohol", "cendres"])) return 700;
  return 900;
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

  return rows.sort((a, b) => nutrientPriority(a) - nutrientPriority(b) || a.label.localeCompare(b.label, "fr"));
}

function detailRowsFor(food: { nutrients: Record<string, number>; fullNutrients?: FullNutrient[] }) {
  const seen = new Set<string>();

  return rowsFor(food)
    .filter((row) => !isSecondaryEnergyKj(row))
    .filter((row) => {
      const canonical = canonicalNutrientKey(row);
      if (seen.has(canonical)) return false;
      seen.add(canonical);
      return true;
    })
    .map((row) => ({
      key: row.key,
      label: cleanDisplayLabel(row),
      unit: row.unit,
      per100g: row.value,
      sourceColumnName: row.sourceColumnName
    }));
}

function selectedPortion(raw?: string) {
  const numeric = Number(raw);
  return portionValues.includes(numeric) ? numeric : 100;
}

function portionOptions(selectedGrams: number) {
  const ordered = [selectedGrams, ...portionValues.filter((grams) => grams !== selectedGrams)];
  return ordered.map((grams) => ({
    label: `${grams} g`,
    grams,
    description: grams === selectedGrams
      ? `Portion sélectionnée depuis la recherche CIQUAL 2 : ${grams} g.`
      : `Portion CIQUAL 2 calculée sur ${grams} g.`
  }));
}

export default function Ciqual2FoodPage({ params, searchParams }: PageProps) {
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

  const grams = selectedPortion(searchParams?.portion);

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
        portions={portionOptions(grams)}
        nutrients={detailRowsFor(food)}
      />
    </main>
  );
}
