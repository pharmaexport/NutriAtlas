"use client";

import { useMemo, useState } from "react";

type NutrientItem = {
  key: string;
  label: string;
  unit: string;
  per100g: number;
  target?: number;
};

type PortionOption = {
  label: string;
  grams: number;
  description: string;
};

type Props = {
  food: {
    code: string;
    name: string;
    group: string;
    subgroup?: string | null;
  };
  portions: PortionOption[];
  nutrients: NutrientItem[];
};

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function valueForPortion(per100g: number, grams: number) {
  return round((per100g * grams) / 100);
}

function coverage(value: number, target?: number) {
  if (!target) return null;
  return Math.max(0, Math.round((value / target) * 100));
}

function scoreFromNutrients(nutrients: NutrientItem[], grams: number) {
  const useful = nutrients
    .map((nutrient) => coverage(valueForPortion(nutrient.per100g, grams), nutrient.target))
    .filter((value): value is number => typeof value === "number");

  if (useful.length === 0) return 70;
  const positive = useful.reduce((sum, value) => sum + Math.min(value, 35), 0) / useful.length;
  return Math.max(35, Math.min(96, Math.round(62 + positive)));
}

export function FoodDetailClient({ food, portions, nutrients }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const portion = portions[selectedIndex] || portions[0];

  const rows = useMemo(() => {
    return nutrients.map((nutrient) => {
      const value = valueForPortion(nutrient.per100g, portion.grams);
      const percent = coverage(value, nutrient.target);
      return { ...nutrient, value, percent };
    });
  }, [nutrients, portion.grams]);

  const energy = rows.find((row) => row.key === "energy_kcal");
  const score = scoreFromNutrients(nutrients, portion.grams);
  const highlights = rows
    .filter((row) => typeof row.percent === "number" && row.key !== "energy_kcal")
    .sort((a, b) => (b.percent || 0) - (a.percent || 0))
    .slice(0, 3);

  return (
    <section className="foodPage pageSection">
      <div className="foodHeroCard foodHeroPremium">
        <div className="foodTitleBlock">
          <p className="eyebrow">Aliment {food.code}</p>
          <h1>{food.name}</h1>
          <p>{food.group}{food.subgroup ? ` - ${food.subgroup}` : ""}</p>
        </div>

        <div className="scoreCard">
          <span>Score NutriAtlas</span>
          <strong>{score}</strong>
          <small>/100</small>
        </div>
      </div>

      <div className="portionControlCard">
        <label htmlFor="portion-select">Portion</label>
        <select
          id="portion-select"
          value={selectedIndex}
          onChange={(event) => setSelectedIndex(Number(event.target.value))}
        >
          {portions.map((option, index) => (
            <option value={index} key={`${option.label}-${option.grams}`}>
              {option.label} - {option.grams} g
            </option>
          ))}
        </select>
        <p>{portion.description}</p>
      </div>

      <div className="portionSummary">
        <div>
          <span>Portion selectionnee</span>
          <strong>{portion.grams} g</strong>
          <small>{portion.label}</small>
        </div>
        <div>
          <span>Energie portion</span>
          <strong>{energy ? `${energy.value} kcal` : "-"}</strong>
          <small>{energy?.percent !== null ? `${energy?.percent}% du repere 2000 kcal` : "Repere journalier"}</small>
        </div>
      </div>

      {highlights.length > 0 ? (
        <section className="highlightCard">
          <span>Contributions principales</span>
          <div>
            {highlights.map((item) => (
              <strong key={item.key}>{item.label} · {item.percent}%</strong>
            ))}
          </div>
        </section>
      ) : null}

      <section className="nutrientTable nutrientDashboard">
        <div className="tableHeader">
          <span>Valeurs pour la portion</span>
          <span>% des reperes journaliers</span>
        </div>
        {rows.map((nutrient) => {
          const width = Math.min(nutrient.percent || 0, 100);
          return (
            <div className="nutrientLine nutrientProgress" key={nutrient.key}>
              <div>
                <span>{nutrient.label}</span>
                <strong>{nutrient.value} {nutrient.unit}</strong>
              </div>
              <div className="progressTrack" aria-label={`${nutrient.percent || 0}%`}>
                <i style={{ width: `${width}%` }} />
              </div>
              <em>{nutrient.percent !== null ? `${nutrient.percent}%` : "-"}</em>
            </div>
          );
        })}
      </section>

      <a className="secondaryCta" href="/search">Nouvelle recherche</a>
    </section>
  );
}
