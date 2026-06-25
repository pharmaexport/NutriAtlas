import { notFound } from "next/navigation";
import {
  getFoodByCode,
  nutrientLabels,
  nutrientRoles,
  referenceTargets,
  type NutrientKey
} from "../../../lib/nutrition-data";
import { FoodDetailClient } from "./FoodDetailClient";

type PageProps = {
  params: {
    code: string;
  };
};

const nutrientOrder: NutrientKey[] = [
  "energy_kcal",
  "protein_g",
  "carbs_g",
  "fat_g",
  "sugars_g",
  "fiber_g",
  "salt_g",
  "magnesium_mg",
  "potassium_mg",
  "calcium_mg",
  "iron_mg",
  "vitamin_c_mg",
  "vitamin_d_ug",
  "folate_ug",
  "sodium_mg"
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/œ/g, "oe")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function portionOptions(food: { name: string; group: string; subgroup?: string | null }) {
  const name = normalize(food.name);
  const group = normalize(food.group);
  const options = [
    { label: "100 g", grams: 100, description: "Référence nutritionnelle standard." }
  ];

  if (name.includes("banane")) {
    options.unshift(
      { label: "1 petite banane", grams: 100, description: "Portion pratique pour une petite banane sans peau." },
      { label: "1 banane moyenne", grams: 150, description: "Portion estimée pour une banane moyenne." },
      { label: "1 grande banane", grams: 180, description: "Portion estimée pour une grande banane." }
    );
  } else if (name.includes("pomme") || group.includes("fruits")) {
    options.unshift(
      { label: "1 petit fruit", grams: 100, description: "Portion pratique pour un petit fruit." },
      { label: "1 fruit moyen", grams: 150, description: "Portion estimée pour un fruit moyen." },
      { label: "1 grand fruit", grams: 200, description: "Portion estimée pour un grand fruit." }
    );
  } else if (name.includes("oeuf") || group.includes("oeufs")) {
    options.unshift(
      { label: "1 œuf", grams: 60, description: "Portion estimée pour une unité." },
      { label: "2 œufs", grams: 120, description: "Portion estimée pour deux unités." }
    );
  } else if (group.includes("produits laitiers")) {
    options.unshift(
      { label: "1 pot", grams: 125, description: "Portion courante pour un pot individuel." },
      { label: "1 bol", grams: 250, description: "Portion plus importante de type bol." }
    );
  } else if (group.includes("produits sucres") || name.includes("gateau") || name.includes("biscuit")) {
    options.unshift(
      { label: "1 petite portion", grams: 40, description: "Petite portion de dessert ou biscuit." },
      { label: "1 part", grams: 80, description: "Portion estimée pour une part." },
      { label: "1 grosse part", grams: 120, description: "Portion estimée pour une part plus généreuse." }
    );
  } else if (group.includes("poissons") || group.includes("viandes")) {
    options.unshift(
      { label: "1 portion", grams: 120, description: "Portion courante pour un plat principal." },
      { label: "Grande portion", grams: 180, description: "Portion plus généreuse pour un repas." }
    );
  } else if (group.includes("legumineuses") || group.includes("legumes")) {
    options.unshift(
      { label: "1 portion", grams: 150, description: "Portion courante pour un accompagnement." },
      { label: "1 bol", grams: 250, description: "Portion plus importante de type bol." }
    );
  } else if (group.includes("cereales") || name.includes("pain")) {
    options.unshift(
      { label: "1 petite portion", grams: 30, description: "Petite portion ou tranche fine." },
      { label: "1 portion", grams: 60, description: "Portion courante." },
      { label: "Grande portion", grams: 100, description: "Portion plus importante." }
    );
  }

  return options;
}

export default function FoodPage({ params }: PageProps) {
  const food = getFoodByCode(params.code);

  if (!food) {
    notFound();
  }

  const nutrients = nutrientOrder
    .filter((key) => typeof food.nutrients[key] === "number")
    .map((key) => ({
      key,
      label: nutrientLabels[key].label,
      unit: nutrientLabels[key].unit,
      per100g: food.nutrients[key] as number,
      target: referenceTargets[key],
      role: nutrientRoles[key]
    }));

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/search">Recherche</a>
          <a href="/cumul">Cumul</a>
          <a href="/profil">Profil</a>
          <a href="/#sources">Sources</a>
        </div>
      </nav>

      <FoodDetailClient
        food={{
          code: food.code,
          name: food.name,
          group: food.group,
          subgroup: food.subgroup || null
        }}
        portions={portionOptions(food)}
        nutrients={nutrients}
      />
    </main>
  );
}
