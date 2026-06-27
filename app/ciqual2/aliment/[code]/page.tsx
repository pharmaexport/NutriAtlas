import { getFoodByCode, type FullNutrient } from "../../../../lib/nutrition-data";

type PageProps = { params: { code: string } };
type Category = "macros" | "glucides" | "lipides" | "mineraux" | "vitamines" | "autres";
type NutrientRow = { key: string; label: string; unit: string; value: number; sourceColumnName?: string | null; category: Category };

const categoryLabels: Record<Category, string> = {
  macros: "Macros et énergie",
  glucides: "Glucides",
  lipides: "Lipides",
  mineraux: "Minéraux",
  vitamines: "Vitamines",
  autres: "Autres constituants"
};

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

function formatValue(value: number) {
  return Math.round(value * 1000) / 1000;
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

  const rows = rowsFor(food);
  const grouped = rows.reduce<Record<Category, NutrientRow[]>>((acc, row) => {
    acc[row.category].push(row);
    return acc;
  }, { macros: [], glucides: [], lipides: [], mineraux: [], vitamines: [], autres: [] });

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

      <section className="foodPage pageSection">
        <div className="foodHeroCard foodHeroPremium">
          <div className="foodTitleBlock">
            <p className="eyebrow">CIQUAL 2 · aliment {food.code}</p>
            <h1>{food.name}</h1>
            <p>{food.group}{food.subgroup ? ` – ${food.subgroup}` : ""}</p>
          </div>
        </div>

        <div className="portionSummary">
          <div><span>Base</span><strong>100 g</strong><small>référence CIQUAL</small></div>
          <div><span>Données disponibles</span><strong>{rows.length}</strong><small>constituants exportés</small></div>
        </div>

        <div className="actionRow">
          <a className="secondaryCta" href="/ciqual2">Nouvelle recherche CIQUAL 2</a>
          <a className="secondaryCta" href={`/aliment/${food.code}`}>Fiche CIQUAL classique</a>
        </div>

        {Object.entries(grouped).map(([category, items]) => items.length > 0 ? (
          <section className="nutrientTable nutrientDashboard" key={category}>
            <div className="tableHeader">
              <span>{categoryLabels[category as Category]}</span>
              <span>{items.length} constituants</span>
            </div>
            {items.map((nutrient) => (
              <div className="nutrientLine nutrientProgress toneUnknown" key={`${nutrient.key}-${nutrient.sourceColumnName || ""}`}>
                <div className="nutrientMain">
                  <span>{nutrient.label}</span>
                  {nutrient.sourceColumnName ? <small>CIQUAL : {nutrient.sourceColumnName}</small> : null}
                </div>
                <strong>{formatValue(nutrient.value)} {nutrient.unit}</strong>
              </div>
            ))}
          </section>
        ) : null)}
      </section>
    </main>
  );
}
