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
} from "../../lib/nutrition-profile";

const STORAGE_KEY = "nutriatlas-cumul-v1";

type CumulNutrient = {
  key: string;
  label: string;
  unit: string;
  value: number;
  target?: number;
};

type CumulItem = {
  id: string;
  foodCode: string;
  foodName: string;
  portionLabel: string;
  grams: number;
  nutrients: CumulNutrient[];
  createdAt: string;
};

type CumulRow = CumulNutrient & {
  reference: NutrientReference | null;
  percent: number | null;
  role: NutrientRole;
};

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function isEnergyKcal(key: string) {
  const normalized = key.toLowerCase();
  return (normalized.includes("energy") || normalized.includes("energie")) && normalized.includes("kcal");
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
  return percent === null ? "-" : `${percent}%`;
}

function overflowLabel(percent: number | null, role: NutrientRole) {
  if (percent === null || percent <= 100) return null;
  return role === "limit" ? `+${percent - 100}% dépassement` : `+${percent - 100}% au-dessus`;
}

function referenceText(reference: NutrientReference | null) {
  if (!reference) return "Aucun repère personnalisé disponible";
  return `Repère : ${formatAmount(reference.target, reference.unit)} · ${reference.basis} · ${reference.source}`;
}

export function CumulClient() {
  const [items, setItems] = useState<CumulItem[]>([]);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
    setProfile(loadStoredProfile());
  }, []);

  function save(next: CumulItem[]) {
    setItems(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const totals = useMemo(() => {
    const map = new Map<string, CumulNutrient>();
    for (const item of items) {
      for (const nutrient of item.nutrients) {
        const current = map.get(nutrient.key);
        if (current) {
          current.value = round(current.value + nutrient.value);
        } else {
          map.set(nutrient.key, { ...nutrient });
        }
      }
    }
    return Array.from(map.values());
  }, [items]);

  const rows = useMemo<CumulRow[]>(() => {
    return totals.map((nutrient) => {
      const reference = getReferenceForNutrient(nutrient.key, profile);
      const percent = coveragePercent(nutrient.value, reference?.target || nutrient.target || null);
      const role = reference?.role || roleForNutrient(nutrient.key);
      return { ...nutrient, reference, percent, role };
    });
  }, [totals, profile]);

  const energy = rows.find((item) => isEnergyKcal(item.key));
  const profileSummary = useMemo(() => summarizeProfile(profile), [profile]);

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/profil">Profil</a>
          <a href="/search">Recherche</a>
          <a href="/cumul">Cumul</a>
        </div>
      </nav>

      <section className="cumulPage pageSection">
        <div className="foodHeroCard foodHeroPremium">
          <div>
            <p className="eyebrow">Cumul journalier</p>
            <h1>Point nutrition de la journée.</h1>
            <p>Ajoute des aliments depuis leur fiche pour suivre calories, fibres, vitamines et minéraux avec les repères du profil.</p>
            <a className="referencePill" href="/profil">Référentiel : {profileSummary.referenceModeLabel}</a>
          </div>
          <div className="scoreCard">
            <span>Calories</span>
            <strong>{energy ? energy.value : 0}</strong>
            <small>{typeof energy?.percent === "number" ? `${energy.percent}% du besoin` : "kcal"}</small>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="stateBox">Aucun aliment dans le cumul. Lance une recherche et appuie sur Ajouter au cumul.</div>
        ) : (
          <>
            <section className="nutrientTable nutrientDashboard">
              <div className="tableHeader">
                <span>Total journalier</span>
                <span>% objectif profil</span>
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

            <section className="cumulItems">
              <div className="tableHeader">
                <span>Aliments ajoutés</span>
                <button onClick={() => save([])}>Vider</button>
              </div>
              {items.map((item) => (
                <article className="cumulItem" key={item.id}>
                  <div>
                    <strong>{item.foodName}</strong>
                    <span>{item.portionLabel} · {item.grams} g</span>
                  </div>
                  <button onClick={() => save(items.filter((candidate) => candidate.id !== item.id))}>Retirer</button>
                </article>
              ))}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
