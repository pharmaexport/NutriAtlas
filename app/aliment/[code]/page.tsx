import { getFoodByCode, nutrientLabels, type NutrientKey } from "../../../lib/nutrition-data";

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

  const nutrients = priorityNutrients
    .map((key) => ({ key, value: food.nutrients[key], label: nutrientLabels[key] }))
    .filter((item) => typeof item.value === "number");

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
          <a className="secondaryCta" href="/search">Nouvelle recherche</a>
        </div>

        <section className="nutrientTable">
          {nutrients.map((nutrient) => (
            <div className="nutrientLine" key={nutrient.key}>
              <span>{nutrient.label.label}</span>
              <strong>{nutrient.value} {nutrient.label.unit}</strong>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}
