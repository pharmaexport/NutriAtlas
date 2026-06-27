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

type NutrientItem = { key: string; label: string; unit: string; per100g: number; target?: number; role?: NutrientRole; };
type PortionOption = { label: string; grams: number; description: string; };
type Props = { food: { code: string; name: string; group: string; subgroup?: string | null; }; portions: PortionOption[]; nutrients: NutrientItem[]; };
type CumulItem = { id: string; foodCode: string; foodName: string; portionLabel: string; grams: number; nutrients: Array<{ key: string; label: string; unit: string; value: number; target?: number; }>; createdAt: string; };
type DisplayRow = NutrientItem & { value: number; percent: number | null; reference: NutrientReference | null; role: NutrientRole; };

function round(value: number) { return Math.round(value * 10) / 10; }
function valueForPortion(per100g: number, grams: number) { return round((per100g * grams) / 100); }
function isEnergyKcal(key: string) { const normalized = key.toLowerCase(); return (normalized.includes("energy") || normalized.includes("energie")) && normalized.includes("kcal"); }
function amountLabel(value: number, unit: string) { return `${value} ${unit}`.trim(); }

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

function ProgressVisual({ nutrient }: { nutrient: DisplayRow }) {
  const percent = nutrient.percent;
  const clampedPercent = Math.min(percent || 0, 100);
  const overflowPercent = Math.max((percent || 0) - 100, 0);
  const safeCursorPercent = percent === null ? 0 : Math.max(6, Math.min(clampedPercent, 94));
  const targetShiftPx = overflowPercent > 0 ? Math.min(72, Math.max(18, overflowPercent * 0.9)) : 0;
  const targetLabel = nutrient.reference ? formatAmount(nutrient.reference.target, nutrient.reference.unit) : null;
  const currentLabel = amountLabel(nutrient.value, nutrient.unit);

  return (
    <div className="progressVisual" style={{ position: "relative", paddingTop: "2.65rem", marginTop: "1rem" }}>
      <div className="progressScale" style={{ position: "absolute", inset: "0 0 auto 0", height: "2.25rem", pointerEvents: "none" }} aria-hidden="true">
        <span
          className="currentValuePill"
          style={{
            position: "absolute",
            left: `${safeCursorPercent}%`,
            top: 0,
            transform: "translateX(-50%)",
            padding: "0.28rem 0.58rem",
            borderRadius: "999px",
            background: "rgba(238, 245, 232, 0.98)",
            border: "1px solid rgba(16, 35, 27, 0.09)",
            color: "#10231b",
            fontWeight: 950,
            fontSize: "0.82rem",
            whiteSpace: "nowrap"
          }}
        >
          {currentLabel}
        </span>
        {targetLabel ? (
          <span
            className="targetValuePill"
            style={{
              position: "absolute",
              right: `${targetShiftPx}px`,
              top: 0,
              textAlign: "right",
              color: "#31493d",
              fontWeight: 950,
              whiteSpace: "nowrap"
            }}
          >
            <strong style={{ display: "block", fontSize: "0.86rem", lineHeight: 1 }}>{targetLabel}</strong>
            <small style={{ display: "block", marginTop: "0.15rem", fontSize: "0.66rem", lineHeight: 1, opacity: 0.75 }}>100 %</small>
          </span>
        ) : null}
      </div>
      <div className="progressTrack" style={{ position: "relative", height: "14px", borderRadius: "999px", background: "rgba(237, 244, 232, 0.95)", border: "1px solid rgba(16, 35, 27, 0.08)", overflow: "hidden" }}>
        <i style={{ position: "absolute", inset: "0 auto 0 0", width: `${clampedPercent}%`, borderRadius: "999px", background: "linear-gradient(90deg, #2e7d3f, #86b65d)" }} />
        {overflowPercent > 0 ? <b style={{ position: "absolute", inset: "0 0 0 auto", width: `${Math.min(overflowPercent, 100)}%`, borderRadius: "999px", background: "linear-gradient(90deg, #b7c96a, #d18b52)" }} /> : null}
      </div>
    </div>
  );
}

export function FoodDetailClient({ food, portions, nutrients }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
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
    const role = reference?.role || nutrient.role || roleForNutrient(nutrient.key);
    return { ...nutrient, value, percent, reference, role };
  }), [nutrients, portion.grams, profile, customEnergyKcal]);

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

      <section className="nutrientTable nutrientDashboard">
        <div className="tableHeader"><span>Valeurs pour la portion</span><span>% des repères profil</span></div>
        {rows.map((nutrient) => {
          const overflow = overflowLabel(nutrient.percent, nutrient.role);
          return (
            <div className={`nutrientLine nutrientProgress ${progressTone(nutrient.role, nutrient.percent)}`} key={nutrient.key}>
              <div className="nutrientMain">
                <span>{nutrient.label}</span>
                <strong>{amountLabel(nutrient.value, nutrient.unit)}</strong>
                <small>{referenceText(nutrient.reference)}</small>
                {nutrient.reference?.note ? <small>{nutrient.reference.note}</small> : null}
              </div>
              <ProgressVisual nutrient={nutrient} />
              <em>{percentLabel(nutrient.percent)}{overflow ? <small>{overflow}</small> : null}</em>
            </div>
          );
        })}
      </section>

      <a className="secondaryCta" href="/search">Nouvelle recherche</a>
    </section>
  );
}
