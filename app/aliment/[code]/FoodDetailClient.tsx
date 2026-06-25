"use client";

import { useMemo, useState } from "react";

const STORAGE_KEY = "nutriatlas-cumul-v1";

type NutrientRole = "positive" | "limit" | "neutral";

type NutrientItem = {
  key: string;
  label: string;
  unit: string;
  per100g: number;
  target?: number;
  role: NutrientRole;
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

type CumulItem = {
  id: string;
  foodCode: string;
  foodName: string;
  portionLabel: string;
  grams: number;
  nutrients: Array<{
    key: string;
    label: string;
    unit: string;
    value: number;
    target?: number;
    role: NutrientRole;
  }>;
  createdAt: string;
};

type NutrientRow = NutrientItem & {
  value: number;
  percent: number | null;
};

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function valueForPortion(per100g: number, grams: number) {
  return round((per100g * grams) / 100);
}

function coverage(value: number, target?: number) {
  if (!target) return null;
  return Math.max(0, Math.round((value / target) * 100));
}

function scoreFromRows(rows: NutrientRow[]) {
  const positiveCoverage = rows
    .filter((row) => row.role === "positive" && typeof row.percent === "number")
    .map((row) => Math.min(row.percent || 0, 35));

  const limitPenalty = rows
    .filter((row) => row.role === "limit" && typeof row.percent === "number")
    .reduce((sum, row) => sum + Math.max(0, (row.percent || 0) - 12) * 0.65, 0);

  const energy = rows.find((row) => row.key === "energy_kcal");
  const energyPenalty = energy?.percent && energy.percent > 35 ? (energy.percent - 35) * 0.45 : 0;
  const positiveBoost = average(positiveCoverage) * 0.45;

  return clamp(Math.round(67 + positiveBoost - limitPenalty - energyPenalty), 25, 95);
}

function readCumulItems(): CumulItem[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

export function FoodDetailClient({ food, portions, nutrients }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [addError, setAddError] = useState(false);
  const portion = portions[selectedIndex] || portions[0];

  const rows = useMemo(() => {
    return nutrients.map((nutrient) => {
      const value = valueForPortion(nutrient.per100g, portion.grams);
      const percent = coverage(value, nutrient.target);
      return { ...nutrient, value, percent };
    });
  }, [nutrients, portion.grams]);

  const energy = rows.find((row) => row.key === "energy_kcal");
  const score = scoreFromRows(rows);
  const highlights = rows
    .filter((row) => row.role === "positive" && typeof row.percent === "number")
    .sort((a, b) => (b.percent || 0) - (a.percent || 0))
    .slice(0, 3);

  const watchouts = rows
    .filter((row) => row.role === "limit" && typeof row.percent === "number" && (row.percent || 0) >= 10)
    .sort((a, b) => (b.percent || 0) - (a.percent || 0))
    .slice(0, 3);

  function addToCumul() {
    const item: CumulItem = {
      id: `${food.code}-${Date.now()}`,
      foodCode: food.code,
      foodName: food.name,
      portionLabel: portion.label,
      grams: portion.grams,
      nutrients: rows.map((row) => ({
        key: row.key,
        label: row.label,
        unit: row.unit,
        value: row.value,
        target: row.target,
        role: row.role
      })),
      createdAt: new Date().toISOString()
    };

    try {
      const existing = readCumulItems();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, item]));
      setAdded(true);
      setAddError(false);
      window.setTimeout(() => setAdded(false), 2200);
    } catch {
      setAdded(false);
      setAddError(true);
    }
  }

  return (
    <section className="foodPage pageSection">
      <div className="foodHeroCard foodHeroPremium">
        <div className="foodTitleBlock">
          <p className="eyebrow">Aliment {food.code}</p>
          <h1>{food.name}</h1>
          <p>{food.group}{food.subgroup ? ` – ${food.subgroup}` : ""}</p>
        </div>

        <div className="scoreCard">
          <span>Score indicatif</span>
          <strong>{score}</strong>
          <small>/100</small>
        </div>
      </div>

      <div className="stateBox">
        Score expérimental : il distingue maintenant les apports utiles des nutriments à limiter. Il ne remplace pas un avis médical.
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
              {option.label} – {option.grams} g
            </option>
          ))}
        </select>
        <p>{portion.description}</p>
      </div>

      <div className="portionSummary">
        <div>
          <span>Portion sélectionnée</span>
          <strong>{portion.grams} g</strong>
          <small>{portion.label}</small>
        </div>
        <div>
          <span>Énergie portion</span>
          <strong>{energy ? `${energy.value} kcal` : "-"}</strong>
          <small>{typeof energy?.percent === "number" ? `${energy.percent}% du repère 2000 kcal` : "Repère journalier"}</small>
        </div>
      </div>

      <div className="actionRow">
        <button className="primaryCta addButton" type="button" onClick={addToCumul}>
          {added ? "Ajouté au cumul" : "Ajouter au cumul"}
        </button>
        <a className="secondaryCta" href="/cumul">Voir le cumul</a>
      </div>

      {addError ? <div className="stateBox errorState">Impossible d’enregistrer le cumul localement sur ce navigateur.</div> : null}

      {highlights.length > 0 ? (
        <section className="highlightCard">
          <span>Contributions utiles</span>
          <div>
            {highlights.map((item) => (
              <strong key={item.key}>{item.label} · {item.percent}%</strong>
            ))}
          </div>
        </section>
      ) : null}

      {watchouts.length > 0 ? (
        <section className="highlightCard">
          <span>Points à surveiller</span>
          <div>
            {watchouts.map((item) => (
              <strong key={item.key}>{item.label} · {item.percent}%</strong>
            ))}
          </div>
        </section>
      ) : null}

      <section className="nutrientTable nutrientDashboard">
        <div className="tableHeader">
          <span>Valeurs pour la portion</span>
          <span>% des repères journaliers</span>
        </div>
        {rows.map((nutrient) => {
          const width = Math.min(nutrient.percent || 0, 100);
          const roleLabel =
            nutrient.role === "positive" ? "Apport utile" : nutrient.role === "limit" ? "À limiter" : "Repère";
          return (
            <div className="nutrientLine nutrientProgress" key={nutrient.key}>
              <div>
                <span>{nutrient.label}</span>
                <strong>{nutrient.value} {nutrient.unit}</strong>
              </div>
              <div className="progressTrack" aria-label={`${nutrient.percent || 0}% — ${roleLabel}`}>
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
