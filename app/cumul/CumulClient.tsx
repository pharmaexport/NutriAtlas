"use client";

import { useEffect, useMemo, useState } from "react";

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

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function percent(value: number, target?: number) {
  if (!target) return null;
  return Math.max(0, Math.round((value / target) * 100));
}

export function CumulClient() {
  const [items, setItems] = useState<CumulItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
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

  const energy = totals.find((item) => item.key === "energy_kcal");

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/search">Recherche</a>
          <a href="/cumul">Cumul</a>
        </div>
      </nav>

      <section className="cumulPage pageSection">
        <div className="foodHeroCard foodHeroPremium">
          <div>
            <p className="eyebrow">Cumul journalier</p>
            <h1>Point nutrition de la journee.</h1>
            <p>Ajoute des aliments depuis leur fiche pour suivre calories, fibres, vitamines et mineraux.</p>
          </div>
          <div className="scoreCard">
            <span>Calories</span>
            <strong>{energy ? energy.value : 0}</strong>
            <small>kcal</small>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="stateBox">Aucun aliment dans le cumul. Lance une recherche et appuie sur Ajouter au cumul.</div>
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
                <span>Aliments ajoutes</span>
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
