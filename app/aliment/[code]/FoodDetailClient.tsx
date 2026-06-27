"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getReferenceForNutrientWithEnergy,
  loadCustomEnergyTarget
} from "../../../lib/energy-reference";
import {
  coveragePercent,
  defaultProfile,
  formatAmount,
  loadStoredProfile,
  roleForNutrient,
  summarizeProfile,
  type NutrientReference,
  type NutrientRole,
  type UserProfile
} from "../../../lib/nutrition-profile";

const STORAGE_KEY = "nutriatlas-cumul-v1";

type NutrientCategory = "summary" | "macros" | "glucides" | "lipides" | "mineraux" | "vitamines" | "autres" | "all";
type NutrientItem = { key: string; label: string; unit: string; per100g: number; target?: number; role?: NutrientRole; sourceColumnName?: string | null; };
type PortionOption = { label: string; grams: number; description: string; };
type Props = { food: { code: string; name: string; group: string; subgroup?: string | null; }; portions: PortionOption[]; nutrients: NutrientItem[]; };
type CumulItem = { id: string; foodCode: string; foodName: string; portionLabel: string; grams: number; nutrients: Array<{ key: string; label: string; unit: string; value: number; target?: number; }>; createdAt: string; };
type DisplayRow = NutrientItem & { value: number; percent: number | null; reference: NutrientReference | null; role: NutrientRole; };

const filterOptions: Array<{ value: NutrientCategory; label: string }> = [
  { value: "summary", label: "Résumé" },
  { value: "macros", label: "Macros" },
  { value: "glucides", label: "Glucides" },
  { value: "lipides", label: "Lipides" },
  { value: "mineraux", label: "Minéraux" },
  { value: "vitamines", label: "Vitamines" },
  { value: "autres", label: "Autres" },
  { value: "all", label: "Tout CIQUAL" }
];

const summaryKeys = new Set(["energy_kcal", "protein_g", "carbs_g", "fat_g", "sugars_g", "fiber_g", "salt_g", "sodium_mg"]);

function round(value: number) { return Math.round(value * 10) / 10; }
function valueForPortion(per100g: number, grams: number) { return round((per100g * grams) / 100); }
function isEnergyKcal(key: string) { const normalized = key.toLowerCase(); return (normalized.includes("energy") || normalized.includes("energie")) && normalized.includes("kcal"); }
function normalizedText(value: string) { return value.toLowerCase().replace(/œ/g, "oe").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_"); }
function includesAny(value: string, needles: string[]) { return needles.some((needle) => value.includes(needle)); }
function rowText(row: NutrientItem) { return normalizedText(`${row.key} ${row.label} ${row.sourceColumnName || ""}`); }

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

function percentLabel(percent: number | null) { return percent === null ? "-" : `${percent}%`; }
function overflowLabel(percent: number | null, role: NutrientRole) { if (percent === null || percent <= 100) return null; const prefix = role === "limit" ? "dépassement" : "au-dessus"; return `+${percent - 100}% ${prefix}`; }
function referenceText(reference: NutrientReference | null) { if (!reference) return "Aucun repère personnalisé disponible"; return `Repère : ${formatAmount(reference.target, reference.unit)} · ${reference.basis} · ${reference.source}`; }

function isSummaryNutrient(row: NutrientItem) {
  const text = rowText(row);
  return summaryKeys.has(row.key) || includesAny(text, ["energie_reglement", "energie_n_x", "proteines", "glucides", "lipides", "sucres", "fibres_alimentaires", "sel_chlorure", "sodium"]);
}

function categoryForNutrient(row: NutrientItem): Exclude<NutrientCategory, "summary" | "all"> {
  const text = rowText(row);

  if (includesAny(text, ["vitamine", "vitamin", "retinol", "carotene", "folate", "thiamine", "riboflavine", "niacine", "cobalamine", "tocopherol", "phylloquinone"])) return "vitamines";
  if (includesAny(text, ["calcium", "fer", "iron", "magnesium", "magnes", "potassium", "sodium", "zinc", "cuivre", "manganese", "selenium", "iode", "phosphore", "chlorure"])) return "mineraux";
  if (includesAny(text, ["lipide", "fat", "acide_gras", "ag_", "sature", "monoinsature", "polyinsature", "cholesterol", "omega", "dha", "epa"])) return "lipides";
  if (includesAny(text, ["glucide", "carb", "sucre", "sugar", "amidon", "glucose", "fructose", "galactose", "lactose", "maltose", "polyol"])) return "glucides";
  if (includesAny(text, ["energie", "energy", "eau", "water", "proteine", "protein", "fibre", "fiber", "alcool", "alcohol", "cendres"])) return "macros";
  return "autres";
}

function shouldShowForCategory(row: DisplayRow, category: NutrientCategory) {
  if (category === "all") return true;
  if (category === "summary") return isSummaryNutrient(row);
  return categoryForNutrient(row) === category;
}

export function FoodDetailClient({ food, portions, nutrients }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<NutrientCategory>("summary");
  const [added, setAdded] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [customEnergyKcal, setCustomEnergyKcal] = useState<number | null>(null);
  const portion = portions[selectedIndex] || portions[0];

  useEffect(() => {
    setProfile(loadStoredProfile());
    setCustomEnergyKcal(loadCustomEnergyTarget());
  }, []);

  const profileSummary = useMemo(() => summarizeProfile(profile), [profile]);

  const rows = useMemo(() => nutrients.map((nutrient) => {
    const value = valueForPortion(nutrient.per100g, portion.grams);
    const reference = getReferenceForNutrientWithEnergy(nutrient.key, profile, customEnergyKcal);
    const percent = coveragePercent(value, reference?.target || nutrient.target || null);
    const role = reference?.role || nutrient.role || roleForNutrient(`${nutrient.key} ${nutrient.label}`);
    return { ...nutrient, value, percent, reference, role };
  }), [nutrients, portion.grams, profile, customEnergyKcal]);

  const filteredRows = useMemo(() => rows.filter((row) => shouldShowForCategory(row, selectedCategory)), [rows, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<NutrientCategory, number> = { summary: 0, macros: 0, glucides: 0, lipides: 0, mineraux: 0, vitamines: 0, autres: 0, all: rows.length };
    rows.forEach((row) => {
      if (isSummaryNutrient(row)) counts.summary += 1;
      const category = categoryForNutrient(row);
      counts[category] += 1;
    });
    return counts;
  }, [rows]);

  const selectedFilter = filterOptions.find((option) => option.value === selectedCategory) || filterOptions[0];
  const energy = rows.find((row) => isEnergyKcal(row.key));
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
      nutrients: rows.map((row) => ({ key: row.key, label: row.label, unit: row.unit, value: row.value, target: row.reference?.target || row.target })),
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
      </div>

      <div className="portionControlCard">
        <div className="portionControlHeader">
          <label htmlFor="portion-select">Portion</label>
          <a href="/profil">{profileSummary.referenceModeLabel}</a>
        </div>
        <select id="portion-select" value={selectedIndex} onChange={(event) => setSelectedIndex(Number(event.target.value))}>
          {portions.map((option, index) => <option value={index} key={`${option.label}-${option.grams}`}>{option.label} – {option.grams} g</option>)}
        </select>
        <p>{portion.description}</p>
      </div>

      <div className="portionSummary">
        <div><span>Portion sélectionnée</span><strong>{portion.grams} g</strong><small>{portion.label}</small></div>
        <div><span>Énergie portion</span><strong>{energy ? `${energy.value} kcal` : "-"}</strong><small>{typeof energy?.percent === "number" ? `${energy.percent}% du besoin profil` : "CIQUAL"}</small></div>
        <div><span>Données disponibles</span><strong>{rows.length}</strong><small>constituants CIQUAL</small></div>
      </div>

      <div className="actionRow">
        <button className="primaryCta addButton" type="button" onClick={addToCumul}>{added ? "Ajouté au cumul" : "Ajouter au cumul"}</button>
        <a className="secondaryCta" href="/cumul">Voir le cumul</a>
        <a className="secondaryCta" href="/profil">Modifier le profil</a>
      </div>

      {highlights.length > 0 ? (
        <section className="highlightCard">
          <span>Contributions principales</span>
          <div>{highlights.map((item) => <strong className={progressTone(item.role, item.percent)} key={item.key}>{item.label} · {percentLabel(item.percent)}</strong>)}</div>
        </section>
      ) : null}

      <section className="actionRow" aria-label="Filtres des constituants CIQUAL">
        {filterOptions.map((option) => (
          <button
            className={selectedCategory === option.value ? "primaryCta" : "secondaryCta"}
            key={option.value}
            type="button"
            onClick={() => setSelectedCategory(option.value)}
          >
            {option.label} · {categoryCounts[option.value]}
          </button>
        ))}
      </section>

      <section className="nutrientTable nutrientDashboard">
        <div className="tableHeader">
          <span>{selectedFilter.label} · valeurs pour la portion</span>
          <span>{filteredRows.length} / {rows.length} constituants</span>
        </div>
        {filteredRows.map((nutrient) => {
          const width = Math.min(nutrient.percent || 0, 100);
          const overflowWidth = Math.min(Math.max((nutrient.percent || 0) - 100, 0), 100);
          const overflow = overflowLabel(nutrient.percent, nutrient.role);
          return (
            <div className={`nutrientLine nutrientProgress ${progressTone(nutrient.role, nutrient.percent)}`} key={`${nutrient.key}-${nutrient.sourceColumnName || ""}`}>
              <div className="nutrientMain">
                <span>{nutrient.label}</span>
                <strong>{nutrient.value} {nutrient.unit}</strong>
                <small>{referenceText(nutrient.reference)}</small>
                {nutrient.sourceColumnName ? <small>CIQUAL : {nutrient.sourceColumnName}</small> : null}
                {nutrient.reference?.note ? <small>{nutrient.reference.note}</small> : null}
              </div>
              <div className="progressTrack"><i style={{ width: `${width}%` }} />{overflowWidth > 0 ? <b style={{ width: `${overflowWidth}%` }} /> : null}</div>
              <em>{percentLabel(nutrient.percent)}{overflow ? <small>{overflow}</small> : null}</em>
            </div>
          );
        })}
      </section>

      <a className="secondaryCta" href="/search">Nouvelle recherche</a>
    </section>
  );
}
