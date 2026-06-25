"use client";

import { useEffect, useMemo, useState } from "react";
import {
  coveragePercent,
  defaultProfile,
  formatAmount,
  getReferenceForNutrient,
  loadStoredProfile,
  roleForNutrient,
  summarizeProfile,
  type NutrientReference,
  type NutrientRole,
  type UserProfile
} from "../../../lib/nutrition-profile";

const STORAGE_KEY = "nutriatlas-cumul-v1";

type NutrientItem = {
  key: string;
  label: string;
  unit: string;
  per100g: number;
  target?: number;
  role?: NutrientRole;
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
  }>;
  createdAt: string;
};

type ComputedRow = NutrientItem & {
  value: number;
  percent: number | null;
  reference: NutrientReference | null;
  role: NutrientRole;
};

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function valueForPortion(per100g: number, grams: number) {
  return round((per100g * grams) / 100);
}

function scoreFromRows(rows: ComputedRow[]) {
  const useful = rows.filter((row) => typeof row.percent === "number" && !isEnergyKcal(row.key));
  if (useful.length === 0) return 70;

  const score = useful.reduce((sum, row) => {
    const percent = row.percent || 0;
    if (row.role === "limit") {
      if (percent <= 80) return sum + 18;
      if (percent <= 100) return sum + 8;
      return sum - Math.min(42, percent - 100);
    }
    return sum + Math.min(32, percent / 3.5);
  }, 62);

  return Math.max(35, Math.min(96, Math.round(score / Math.max(1, useful.length / 4))));
}

function isEnergyKcal(key: string) {
  const normalized = key.toLowerCase();
  return (normalized.includes("energy") || normalized.includes("energie")) && normalized.includes("kcal");
}

function readCumulItems(): CumulItem[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as unknown;
  return Array.isArray(parsed) ? parsed as CumulItem[] : [];
}

function progressTone(role: NutrientRole, percent: number | null) {
  if (percent === null) return "toneUnknown";
  if (role === "limit" && percent > 100) return "toneDanger";
  if (role === "limit" && percent >= 85) return "toneWarning";
  if (role === "positive" && percent >= 100) return "tonePositiveOver";
  if (role === "positive") return "tonePositive";
  return "toneNeutral";
}

function percentLabel(percent: number | null) {
  if (percent === null) return "-";
  return `${percent}%`;
}

function overflowLabel(percent: number | null, role: NutrientRole) {
  if (percent === null || percent <= 100) return null;
  const prefix = role === "limit" ? "dépassement" : "au-dessus";
  return `+${percent - 100}% ${prefix}`;
}

function referenceText(reference: NutrientReference | null) {
  if (!reference) return "Aucun repère personnalisé disponible";
  return `Repère : ${formatAmount(reference.target, reference.unit)} · ${reference.basis} · ${reference.source}`;
}

export function FoodDetailClient({ food, portions, nutrients }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const portion = portions[selectedIndex] || portions[0];

  useEffect(() => {
    setProfile(loadStoredProfile());
  }, []);

  const profileSummary = useMemo(() => summarizeProfile(profile), [profile]);

  const rows = useMemo(() => {
    return nutrients.map((nutrient) => {
      const value = valueForPortion(nutrient.per100g, portion.grams);
      const reference = getReferenceForNutrient(nutrient.key, profile);
      const percent = coveragePercent(value, reference?.target || nutrient.target || null);
      const role = reference?.role || nutrient.role || roleForNutrient(nutrient.key);
      return { ...nutrient, value, percent, reference, role };
    });
  }, [nutrients, portion.grams, profile]);

  const energy = rows.find((row) => isEnergyKcal(row.key));
  const score = scoreFromRows(rows);
  const highlights = rows
    .filter((row) => typeof row.percent === "number" && !isEnergyKcal(row.key))
    .sort((a, b) => {
      const aRisk = a.role === "limit" && (a.percent || 0) > 100 ? 1000 : 0;
      const bRisk = b.role === "limit" && (b.percent || 0) > 100 ? 1000 : 0;
      return (bRisk + (b.percent || 0)) - (aRisk + (a.percent || 0));
    })
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
        target: row.reference?.target || row.target
      })),
      createdAt: new Date().toISOString()
    };

    const existing = readCumulItems();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, item]));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
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

      <div className="portionControlCard">
        <div className="portionControlHeader">
          <label htmlFor="portion-select">Portion</label>
          <a href="/profil">{profileSummary.referenceModeLabel}</a>
        </div>
        <select id="portion-select" value={selectedIndex} onChange={(event) => setSelectedIndex(Number(event.target.value))}>
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
          <small>{typeof energy?.percent === "number" ? `${energy.percent}% du besoin profil` : "CIQUAL"}</small>
        </div>
      </div>

      <div className="actionRow">
        <button className="primaryCta addButton" type="button" onClick={addToCumul}>
          {added ? "Ajouté au cumul" : "Ajouter au cumul"}
        </button>
        <a className="secondaryCta" href="/cumul">Voir le cumul</a>
        <a className="secondaryCta" href="/profil">Modifier le profil</a>
      </div>

      {highlights.length > 0 ? (
        <section className="highlightCard">
          <span>Contributions principales</span>
          <div>
            {highlights.map((item) => (
              <strong className={progressTone(item.role, item.percent)} key={item.key}>{item.label} · {percentLabel(item.percent)}</strong>
            ))}
          </div>
        </section>
      ) : null}

      <section className="nutrientTable nutrientDashboard">
        <div className="tableHeader">
          <span>Valeurs pour la portion</span>
          <span>% des repères profil</span>
        </div>
        {rows.map((nutrient) => {
          const width = Math.min(nutrient.percent || 0, 100);
          const overflowWidth = Math.min(Math.max((nutrient.percent || 0) - 100, 0), 100);
          const overflow = overflowLabel(nutrient.percent, nutrient.role);
          return (
            <div className={`nutrientLine nutrientProgress ${progressTone(nutrient.role, nutrient.percent)}`} key={nutrient.key}>
              <div className="nutrientMain">
                <span>{nutrient.label}</span>
                <strong>{nutrient.value} {nutrient.unit}</strong>
                <small>{referenceText(nutrient.reference)}</small>
                {nutrient.reference?.note ? <small>{nutrient.reference.note}</small> : null}
              </div>
              <div className="progressTrack">
                <i style={{ width: `${width}%` }} />
                {overflowWidth > 0 ? <b style={{ width: `${overflowWidth}%` }} /> : null}
              </div>
              <em>
                {percentLabel(nutrient.percent)}
                {overflow ? <small>{overflow}</small> : null}
              </em>
            </div>
          );
        })}
      </section>

      <a className="secondaryCta" href="/search">Nouvelle recherche</a>
    </section>
  );
}
