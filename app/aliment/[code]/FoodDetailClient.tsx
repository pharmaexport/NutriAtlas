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

type NutrientItem = {
  key: string;
  label: string;
  unit: string;
  per100g: number;
  target?: number;
  role?: NutrientRole;
  sourceColumnName?: string | null;
};
type PortionOption = { label: string; grams: number; description: string; };
type Props = {
  food: { code: string; name: string; group: string; subgroup?: string | null; };
  portions: PortionOption[];
  nutrients: NutrientItem[];
};
type CumulItem = {
  id: string;
  foodCode: string;
  foodName: string;
  portionLabel: string;
  grams: number;
  nutrients: Array<{ key: string; label: string; unit: string; value: number; target?: number; }>;
  createdAt: string;
};
type DisplayRow = NutrientItem & {
  value: number;
  percent: number | null;
  reference: NutrientReference | null;
  role: NutrientRole;
};

function round(value: number) { return Math.round(value * 10) / 10; }
function valueForPortion(per100g: number, grams: number) { return round((per100g * grams) / 100); }
function amountLabel(value: number, unit: string) { return `${value} ${unit}`.trim(); }
function percentLabel(percent: number | null) { return percent === null ? "-" : `${percent}%`; }
function percentOnlyLabel(percent: number | null) { return percent === null ? "" : `${percent}%`; }
function referenceText(reference: NutrientReference | null) { if (!reference) return "Aucun repère disponible"; return `Repère : ${formatAmount(reference.target, reference.unit)}`; }

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isEnergyKcal(row: Pick<DisplayRow, "key" | "label" | "unit">) {
  const text = normalizeText(`${row.key} ${row.label}`);
  return row.unit.toLowerCase() === "kcal" && (text.includes("energie") || text.includes("energy"));
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

function overflowLabel(percent: number | null, role: NutrientRole) {
  if (percent === null || percent <= 100) return null;
  const prefix = role === "limit" ? "dépassement" : "au-dessus";
  return `+${percent - 100}% ${prefix}`;
}

function DailyRecapTable({ rows }: { rows: DisplayRow[] }) {
  return (
    <section
      className="dailyRecapTable"
      style={{
        margin: "18px 0 22px",
        border: "1px solid rgba(16, 35, 27, 0.12)",
        borderRadius: "28px",
        background: "rgba(255, 255, 255, 0.72)",
        boxShadow: "0 18px 54px rgba(16, 35, 27, 0.06)",
        overflow: "hidden"
      }}
    >
      <div style={{ padding: "18px 18px 10px" }}>
        <span style={{ display: "block", color: "#5d6b62", fontSize: "0.78rem", fontWeight: 950, letterSpacing: "0.08em", textTransform: "uppercase" }}>CIQUAL complet</span>
        <strong style={{ display: "block", marginTop: "4px", color: "#10231b", fontSize: "1.15rem" }}>Valeurs réelles et % cible jour</strong>
        <small style={{ display: "block", marginTop: "6px", color: "#6a766f", fontWeight: 800 }}>Toutes les valeurs CIQUAL disponibles pour la portion, avec % seulement quand un repère existe.</small>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: "430px", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ color: "#5d6b62", fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <th style={{ padding: "12px 18px", textAlign: "left" }}>Nutriment</th>
              <th style={{ padding: "12px 14px", textAlign: "right" }}>Valeur réelle</th>
              <th style={{ padding: "12px 18px 12px 14px", textAlign: "right" }}>% cible jour</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((nutrient) => {
              const exceeded = (nutrient.percent || 0) > 100;
              return (
                <tr key={`recap-${nutrient.key}-${nutrient.label}`} style={{ borderTop: "1px solid rgba(16, 35, 27, 0.08)" }}>
                  <td style={{ padding: "12px 18px", color: "#10231b", fontWeight: 900 }}>{nutrient.label}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", color: "#10231b", fontWeight: 950 }}>{amountLabel(nutrient.value, nutrient.unit)}</td>
                  <td style={{ padding: "12px 18px 12px 14px", textAlign: "right" }}>
                    {nutrient.percent !== null ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "0.35rem 0.6rem",
                          borderRadius: "999px",
                          background: exceeded ? "#fff2d6" : "#eef5e8",
                          border: exceeded ? "1px solid #d18b52" : "1px solid rgba(16, 35, 27, 0.08)",
                          color: exceeded ? "#5a3300" : "#24552f",
                          fontWeight: 950,
                          whiteSpace: "nowrap"
                        }}
                      >
                        {percentOnlyLabel(nutrient.percent)}
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SourceNotes({ rows }: { rows: DisplayRow[] }) {
  const references = Array.from(new Set(rows
    .map((row) => row.reference ? `${row.reference.source} — ${row.reference.basis}` : null)
    .filter(Boolean) as string[]));

  return (
    <section style={{ margin: "22px 0 6px", color: "#6a766f", fontSize: "0.72rem", lineHeight: 1.45, fontWeight: 700 }}>
      <strong style={{ display: "block", color: "#4d5c54", fontSize: "0.78rem", marginBottom: "0.35rem" }}>Sources et calculs</strong>
      <p style={{ margin: 0 }}>Valeurs nutritionnelles : CIQUAL / ANSES, exprimées pour la portion sélectionnée. {rows.length} constituants disponibles sur cette fiche.</p>
      {references.length > 0 ? (
        <p style={{ margin: "0.25rem 0 0" }}>Repères : {references.slice(0, 6).join(" ; ")}{references.length > 6 ? " ; …" : ""}.</p>
      ) : null}
    </section>
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

  const energy = rows.find(isEnergyKcal);
  const highlights = rows
    .filter((row) => typeof row.percent === "number" && !isEnergyKcal(row))
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

      <div
        className="portionEnergySummary"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          padding: "1.35rem 1.45rem",
          borderRadius: "28px",
          border: "1px solid rgba(16, 35, 27, 0.10)",
          background: "rgba(255,255,255,0.72)",
          boxShadow: "0 18px 54px rgba(16, 35, 27, 0.06)",
          marginBottom: "18px"
        }}
      >
        <div>
          <span style={{ display: "block", color: "#66746c", fontWeight: 950 }}>Portion sélectionnée</span>
          <strong style={{ display: "block", fontSize: "2.15rem", lineHeight: 1.05, color: "#10231b", marginTop: "0.35rem" }}>{portion.grams} g</strong>
          <small style={{ display: "block", marginTop: "0.45rem", color: "#6d7871", fontWeight: 850 }}>{portion.label}</small>
        </div>
        <div>
          <span style={{ display: "block", color: "#66746c", fontWeight: 950 }}>Énergie portion</span>
          <strong style={{ display: "block", fontSize: "2.15rem", lineHeight: 1.05, color: "#10231b", marginTop: "0.35rem" }}>{energy ? `${energy.value} kcal` : "-"}</strong>
          <small style={{ display: "block", marginTop: "0.45rem", color: "#6d7871", fontWeight: 850 }}>{typeof energy?.percent === "number" ? `${energy.percent}% du besoin profil` : "CIQUAL"}</small>
        </div>
      </div>

      <DailyRecapTable rows={rows} />

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
        <div className="tableHeader"><span>Données CIQUAL complètes</span><span>% repère profil</span></div>
        {rows.map((nutrient) => {
          const overflow = overflowLabel(nutrient.percent, nutrient.role);
          return (
            <div className={`nutrientLine nutrientProgress ${progressTone(nutrient.role, nutrient.percent)}`} key={`${nutrient.key}-${nutrient.label}`}>
              <div className="nutrientMain">
                <span>{nutrient.label}</span>
                <strong>{amountLabel(nutrient.value, nutrient.unit)}</strong>
                <small>{referenceText(nutrient.reference)}</small>
                {nutrient.sourceColumnName ? <small>CIQUAL : {nutrient.sourceColumnName}</small> : null}
                {nutrient.reference?.note ? <small>{nutrient.reference.note}</small> : null}
              </div>
              <em>{percentLabel(nutrient.percent)}{overflow ? <small>{overflow}</small> : null}</em>
            </div>
          );
        })}
      </section>

      <SourceNotes rows={rows} />
      <a className="secondaryCta" href="/search">Nouvelle recherche</a>
    </section>
  );
}
