import { coverage, getFoodByCode, nutrientLabels, portionValue, referenceTargets, type NutrientKey } from "../../../lib/nutrition-data";

type PageProps = {
  params: {
    code: string;
  };
};

const priorityNutrients: NutrientKey[] = [
  "energy_kcal",
  "protein_g",
  "carbs_g",
  "fat_g",
  "sugars_g",
  "fiber_g",
  "magnesium_mg",
  "potassium_mg",
  "calcium_mg",
  "iron_mg",
  "vitamin_c_mg",
  "vitamin_d_ug"
];

const portionByGroup: Record<string, { grams: number; label: string }> = {
  fruits: { grams: 150, label: "1 fruit moyen" },
  "produits sucres": { grams: 80, label: "1 part" },
  cereales: { grams: 60, label: "1 portion" },
  legumes: { grams: 150, label: "1 portion" },
  legumineuses: { grams: 150, label: "1 portion" },
  poissons: { grams: 120, label: "1 filet" },
  viandes: { grams: 120, label: "1 portion" },
  oeufs: { grams: 60, label: "1 unite" },
  "produits laitiers": { grams: 125, label: "1 pot" }
};

function normalizeGroup(group: string) {
  return group.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function defaultPortion(group: string) {
  const normalized = normalizeGroup(group);
  return portionByGroup[normalized] || { grams: 100, label: "100 g" };
}

export default function FoodPage({ params }: PageProps) {
  const food = getFoodByCode(params.code);

  if (!food) {
    return (
      <main>
        <nav className="nav">
          <a className="brand" href="/">NutriAtlas</a>
          <div className="navLinks"><a href="/search">Recherche</a></div>
        </nav>
        <section className="foodPage pageSection">
          <p className="eyebrow">Aliment</p>
          <h1>Aliment indisponible.</h1>
          <p>Retourne a la recherche et selectionne une proposition.</p>
        </section>
      </main>
    );
  }

  const portion = defaultPortion(food.group);
  const energy = portionValue(food.nutrients.energy_kcal, portion.grams);

  const nutrients = priorityNutrients
    .map((key) => {
      const value = portionValue(food.nutrients[key], portion.grams);
      const label = nutrientLabels[key];
      const dailyCoverage = key === "energy_kcal" ? coverage(value, 2000) : coverage(value, referenceTargets[key]);
      return { key, value, label, dailyCoverage };
    })
    .filter((item) => item.value !== null);

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/search">Recherche</a>
          <a href="/profil">Profil</a>
        </div>
      </nav>

      <section className="foodPage pageSection">
        <div className="foodHeroCard">
          <p className="eyebrow">Aliment {food.code}</p>
          <h1>{food.name}</h1>
          <p>{food.group}{food.subgroup ? ` - ${food.subgroup}` : ""}</p>
          <div className="portionSummary">
            <div>
              <span>Portion estimee</span>
              <strong>{portion.grams} g</strong>
              <small>{portion.label}</small>
            </div>
            <div>
              <span>Energie portion</span>
              <strong>{energy ?? "-"} kcal</strong>
              <small>Repere journalier : 2000 kcal</small>
            </div>
          </div>
          <a className="secondaryCta" href="/search">Nouvelle recherche</a>
        </div>

        <section className="nutrientTable">
          <div className="tableHeader">
            <span>Valeurs pour la portion</span>
            <span>% repere journalier</span>
          </div>
          {nutrients.map((nutrient) => (
            <div className="nutrientLine" key={nutrient.key}>
              <span>{nutrient.label.label}</span>
              <strong>{nutrient.value} {nutrient.label.unit}</strong>
              <em>{nutrient.dailyCoverage !== null ? `${nutrient.dailyCoverage}%` : "-"}</em>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}
