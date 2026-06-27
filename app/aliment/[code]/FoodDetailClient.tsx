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
type RankingGrade = "A" | "B" | "C" | "D" | "E";
type RankingEstimate = { grade: RankingGrade; confidence: "moyenne" | "faible" };
type SnapshotTone = "good" | "watch" | "neutral";
type SnapshotItem = { label: string; value: string; tone: SnapshotTone };

const ENERGY_THRESHOLDS_KJ = [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350];
const SATURATED_FAT_THRESHOLDS_G = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SUGARS_THRESHOLDS_G = [3.4, 6.8, 10, 14, 17, 20, 24, 27, 31, 34, 37, 41, 44, 48, 51];
const SALT_THRESHOLDS_G = [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.8, 4];
const FIBER_THRESHOLDS_G = [3, 4.1, 5.2, 6.3, 7.4];
const PROTEIN_THRESHOLDS_G = [2.4, 4.8, 7.2, 9.6, 12, 14, 17];

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

function thresholdCount(value: number, thresholds: readonly number[]) {
  return thresholds.reduce((sum, threshold) => sum + (value > threshold ? 1 : 0), 0);
}

function gradeFromTotal(total: number): RankingGrade {
  if (total <= 0) return "A";
  if (total <= 2) return "B";
  if (total <= 10) return "C";
  if (total <= 18) return "D";
  return "E";
}

function findRow(rows: DisplayRow[], keys: string[], labelPatterns: string[] = []) {
  const normalizedPatterns = labelPatterns.map(normalizeText);
  return rows.find((item) => {
    const label = normalizeText(`${item.key} ${item.label} ${item.sourceColumnName || ""}`);
    return keys.includes(item.key) || normalizedPatterns.some((pattern) => label.includes(pattern));
  }) || null;
}

function rowValue(rows: DisplayRow[], keys: string[], labelPatterns: string[] = []) {
  const row = findRow(rows, keys, labelPatterns);
  return typeof row?.per100g === "number" ? row.per100g : null;
}

function hasFruitVegetableLegumeSignal(food: Props["food"]) {
  const text = normalizeText(`${food.name} ${food.group} ${food.subgroup || ""}`);
  return text.includes("fruit") || text.includes("legume") || text.includes("legumineuse") || text.includes("lentille") || text.includes("pois chiche") || text.includes("haricot") || text.includes("feve");
}

function computeRanking(rows: DisplayRow[], food: Props["food"]): RankingEstimate | null {
  const fruitVegetableLegume = hasFruitVegetableLegumeSignal(food);
  const protein = rowValue(rows, ["protein_g"], ["proteines"]);
  const carbs = rowValue(rows, ["carbs_g"], ["glucides"]);
  const fat = rowValue(rows, ["fat_g"], ["lipides"]);
  const computedEnergyKcal = protein !== null && carbs !== null && fat !== null ? protein * 4 + carbs * 4 + fat * 9 : null;
  const energyKcal = rowValue(rows, ["energy_kcal"]) ?? computedEnergyKcal;
  const energyKj = rowValue(rows, ["energy_kj"]) ?? (energyKcal !== null ? energyKcal * 4.184 : null);
  const saturatedFat = rowValue(rows, ["saturated_fat_g"], ["acides gras satures", "ag satures", "saturated fat"]);
  const sugars = rowValue(rows, ["sugars_g"], ["sucres"]);
  const sodiumMg = rowValue(rows, ["sodium_mg"], ["sodium"]);
  const salt = rowValue(rows, ["salt_g"], ["sel chlorure de sodium"]) ?? (sodiumMg !== null ? (sodiumMg * 2.5) / 1000 : null);

  if (energyKj === null || saturatedFat === null || sugars === null || salt === null) {
    return fruitVegetableLegume ? { grade: "A", confidence: "faible" } : null;
  }

  const unfavorable =
    thresholdCount(energyKj, ENERGY_THRESHOLDS_KJ) +
    thresholdCount(saturatedFat, SATURATED_FAT_THRESHOLDS_G) +
    thresholdCount(sugars, SUGARS_THRESHOLDS_G) +
    thresholdCount(salt, SALT_THRESHOLDS_G);

  const fiber = rowValue(rows, ["fiber_g"], ["fibres alimentaires"]) ?? 0;
  const safeProtein = protein ?? 0;
  const favorable = unfavorable < 11
    ? 5 + thresholdCount(fiber, FIBER_THRESHOLDS_G) + thresholdCount(safeProtein, PROTEIN_THRESHOLDS_G)
    : 5 + thresholdCount(fiber, FIBER_THRESHOLDS_G);

  return {
    grade: gradeFromTotal(unfavorable - favorable),
    confidence: fruitVegetableLegume ? "moyenne" : "faible"
  };
}

function rankingGradient(grade: RankingGrade | "unknown") {
  if (grade === "A" || grade === "B") return "linear-gradient(135deg, #1f7a39, #7fb449)";
  if (grade === "C") return "linear-gradient(135deg, #e1b928, #f2d767)";
  if (grade === "D") return "linear-gradient(135deg, #d98024, #f0b15a)";
  if (grade === "E") return "linear-gradient(135deg, #b8322d, #e0594d)";
  return "linear-gradient(135deg, #7a867e, #aeb7af)";
}

function RankingBadge({ ranking }: { ranking: RankingEstimate | null }) {
  const grade = ranking?.grade || "unknown";
  return (
    <aside
      aria-label={ranking ? `Indice nutritionnel ${ranking.grade}, confiance ${ranking.confidence}` : "Indice nutritionnel indisponible"}
      style={{
        position: "absolute",
        top: "22px",
        right: "22px",
        zIndex: 2,
        display: "grid",
        placeItems: "center",
        width: "138px",
        minHeight: "132px",
        padding: "13px 12px 12px",
        borderRadius: "30px",
        border: "1px solid rgba(16, 35, 27, 0.12)",
        background: "rgba(255,255,255,0.92)",
        color: "#10231b",
        textAlign: "center",
        boxShadow: "0 20px 52px rgba(16, 35, 27, 0.12)"
      }}
    >
      <span style={{ color: "#526158", fontSize: "0.72rem", fontWeight: 950, letterSpacing: "0.08em", textTransform: "uppercase" }}>Indice</span>
      <strong
        style={{
          display: "grid",
          placeItems: "center",
          width: "78px",
          height: "78px",
          margin: "7px 0 0",
          borderRadius: "26px",
          background: rankingGradient(grade),
          color: grade === "C" ? "#352d00" : "#ffffff",
          fontSize: "3.25rem",
          lineHeight: 1,
          fontWeight: 1000,
          letterSpacing: "-0.08em",
          boxShadow: "inset 0 -12px 24px rgba(0,0,0,0.12)"
        }}
      >
        {ranking?.grade || "–"}
      </strong>
    </aside>
  );
}

function snapshotStyle(tone: SnapshotTone) {
  const isWatch = tone === "watch";
  const isGood = tone === "good";
  return {
    padding: "0.85rem 0.95rem",
    borderRadius: "22px",
    background: isWatch ? "#fff2d6" : isGood ? "#eef5e8" : "rgba(255,255,255,0.74)",
    border: isWatch ? "1px solid #d18b52" : "1px solid rgba(16, 35, 27, 0.08)",
    color: isWatch ? "#5a3300" : isGood ? "#24552f" : "#33443b",
    fontWeight: 950
  };
}

function buildSnapshot(rows: DisplayRow[], food: Props["food"], energy: DisplayRow | undefined): SnapshotItem[] {
  const items: SnapshotItem[] = [];
  const isFruitVeg = hasFruitVegetableLegumeSignal(food);
  const fiber = findRow(rows, ["fiber_g"], ["fibres alimentaires"]);
  const sugars = findRow(rows, ["sugars_g"], ["sucres"]);
  const salt = findRow(rows, ["salt_g"], ["sel chlorure de sodium"]);
  const sodium = findRow(rows, ["sodium_mg"], ["sodium"]);
  const potassium = findRow(rows, ["potassium_mg"], ["potassium"]);

  if (energy) {
    const tone: SnapshotTone = energy.value > 400 ? "watch" : energy.value <= 150 ? "good" : "neutral";
    items.push({ label: energy.value <= 150 ? "Léger" : "Énergie", value: `${energy.value} kcal`, tone });
  }

  if (fiber && fiber.value >= 3) {
    items.push({ label: "Fibres +", value: `${fiber.value} g${fiber.percent !== null ? ` · ${fiber.percent}% jour` : ""}`, tone: "good" });
  }

  if (sugars && sugars.value >= 10) {
    items.push({ label: isFruitVeg ? "Sucres naturels" : "Sucres à surveiller", value: `${sugars.value} g${sugars.percent !== null ? ` · ${sugars.percent}% jour` : ""}`, tone: isFruitVeg ? "neutral" : "watch" });
  }

  if (salt && salt.value <= 0.3) {
    items.push({ label: "Très peu salé", value: `${salt.value} g sel`, tone: "good" });
  } else if (sodium && sodium.value <= 120) {
    items.push({ label: "Très peu salé", value: `${sodium.value} mg sodium`, tone: "good" });
  } else if (salt && salt.value > 1.5) {
    items.push({ label: "Sel élevé", value: `${salt.value} g sel`, tone: "watch" });
  }

  if (potassium && potassium.percent !== null && potassium.percent >= 5) {
    items.push({ label: "Potassium", value: `${potassium.value} mg · ${potassium.percent}% jour`, tone: "good" });
  }

  return items.slice(0, 4);
}

function ConsumerSnapshot({ items, isFruitVeg }: { items: SnapshotItem[]; isFruitVeg: boolean }) {
  if (items.length === 0) return null;

  return (
    <section
      className="highlightCard"
      style={{
        margin: "0 0 18px",
        background: "rgba(255,255,255,0.82)"
      }}
    >
      <span>À retenir</span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.7rem" }}>
        {items.map((item) => (
          <strong style={snapshotStyle(item.tone)} key={`${item.label}-${item.value}`}>
            <small style={{ display: "block", opacity: 0.78, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>{item.label}</small>
            {item.value}
          </strong>
        ))}
      </div>
      {isFruitVeg ? <p style={{ margin: "0.75rem 0 0", color: "#5b695f", fontWeight: 850 }}>Bon candidat collation ou dessert ; à équilibrer sur la journée avec protéines, bonnes graisses et autres végétaux.</p> : null}
    </section>
  );
}

function highlightPillStyle(item: DisplayRow) {
  const exceeded = (item.percent || 0) > 100;
  const isLimit = item.role === "limit";
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.55rem 0.8rem",
    borderRadius: "999px",
    background: exceeded && isLimit ? "#fff2d6" : "#eef5e8",
    border: exceeded && isLimit ? "1px solid #d18b52" : "1px solid rgba(16, 35, 27, 0.08)",
    color: exceeded && isLimit ? "#5a3300" : "#24552f",
    fontWeight: 950,
    whiteSpace: "nowrap" as const
  };
}

function HighlightCard({ highlights }: { highlights: DisplayRow[] }) {
  if (highlights.length === 0) return null;

  return (
    <section className="highlightCard" style={{ margin: "0 0 18px" }}>
      <span>Apports notables</span>
      <div>{highlights.map((item) => <strong style={highlightPillStyle(item)} key={`${item.key}-${item.label}`}>{item.label} · {percentLabel(item.percent)}</strong>)}</div>
    </section>
  );
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
  const ranking = useMemo(() => computeRanking(rows, food), [rows, food]);
  const snapshot = useMemo(() => buildSnapshot(rows, food, energy), [rows, food, energy]);
  const isFruitVeg = hasFruitVegetableLegumeSignal(food);
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
      <div className="foodHeroCard foodHeroPremium" style={{ paddingRight: "188px" }}>
        <div className="foodTitleBlock">
          <p className="eyebrow">Aliment {food.code}</p>
          <h1>{food.name}</h1>
          <p>{food.group}{food.subgroup ? ` – ${food.subgroup}` : ""}</p>
        </div>
        <RankingBadge ranking={ranking} />
      </div>

      <ConsumerSnapshot items={snapshot} isFruitVeg={isFruitVeg} />
      <HighlightCard highlights={highlights} />

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
