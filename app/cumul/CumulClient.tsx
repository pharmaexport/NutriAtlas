"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "nutriatlas-cumul-v1";

type NutrientRole = "positive" | "limit" | "neutral";

type CumulNutrient = {
  key: string;
  label: string;
  unit: string;
  value: number;
  target?: number;
  role?: NutrientRole;
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

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function percent(value: number, target?: number) {
  if (!target) return null;
  return Math.max(0, Math.round((value / target) * 100));
}

function localDayKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function isToday(item: CumulItem) {
  return localDayKey(item.createdAt) === localDayKey(new Date());
}

function safeParseItems(raw: string | null): CumulItem[] {
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

export function CumulClient() {
  const [items, setItems] = useState<CumulItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setItems(safeParseItems(raw));
    } catch {
      setItems([]);
    }
  }, []);

  function save(next: CumulItem[]) {
    setItems(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  const todayItems = useMemo(() => items.filter(isToday), [items]);
  const olderItemsCount = items.length - todayItems.length;

  const totals = useMemo(() => {
    const map = new Map<string, CumulNutrient>();
    for (const item of todayItems) {
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
  }, [todayItems]);

  const energy = totals.find((item) => item.key === "energy_kcal");

  function removeItem(id: string) {
    save(items.filter((candidate) => candidate.id !== id));
  }

  function clearToday() {
    save(items.filter((item) => !isToday(item)));
  }

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/search">Recherche</a>
          <a href="/cumul">Cumul</a>
          <a href="/profil">Profil</a>
        </div>
      </nav>

      <section className="cumulPage pageSection">
        <div className="foodHeroCard foodHeroPremium">
          <div>
            <p className="eyebrow">Cumul journalier</p>
            <h1>Point nutrition de la journée.</h1>
            <p>Ajoute des aliments depuis leur fiche pour suivre calories, fibres, vitamines et minéraux.</p>
          </div>
          <div className="scoreCard">
            <span>Calories du jour</span>
            <strong>{energy ? energy.value : 0}</strong>
            <small>kcal</small>
          </div>
        </div>

        {olderItemsCount > 0 ? (
          <div className="stateBox">
            {olderItemsCount} aliment{olderItemsCount > 1 ? "s" : ""} d’un jour précédent sont conservés localement mais exclus du cumul du jour.
          </div>
        ) : null}

        {todayItems.length === 0 ? (
          <div className="stateBox">Aucun aliment dans le cumul du jour. Lance une recherche et appuie sur Ajouter au cumul.</div>
        ) : (
          <>
            <section className="nutrientTable nutrientDashboard">
              <div className="tableHeader">
                <span>Total journalier</span>
                <span>% objectif</span>
              </div>
              {totals.map((nutrient) => {
                const reached = percent(nutrient.value, nutrient.target);
                const width = Math.min(reached || 0, 100);
                return (
                  <div className="nutrientLine nutrientProgress" key={nutrient.key}>
                    <div>
                      <span>{nutrient.label}</span>
                      <strong>{nutrient.value} {nutrient.unit}</strong>
                    </div>
                    <div className="progressTrack">
                      <i style={{ width: `${width}%` }} />
                    </div>
                    <em>{reached !== null ? `${reached}%` : "-"}</em>
                  </div>
                );
              })}
            </section>

            <section className="cumulItems">
              <div className="tableHeader">
                <span>Aliments ajoutés aujourd’hui</span>
                <button onClick={clearToday}>Vider le jour</button>
              </div>
              {todayItems.map((item) => (
                <article className="cumulItem" key={item.id}>
                  <div>
                    <strong>{item.foodName}</strong>
                    <span>{item.portionLabel} · {item.grams} g</span>
                  </div>
                  <button onClick={() => removeItem(item.id)}>Retirer</button>
                </article>
              ))}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
