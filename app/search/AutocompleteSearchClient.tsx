"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const CUMUL_STORAGE_KEY = "nutriatlas-cumul-v1";

const portionOptions = [
  { label: "50 g", grams: 50 },
  { label: "100 g", grams: 100 },
  { label: "150 g", grams: 150 },
  { label: "200 g", grams: 200 },
  { label: "250 g", grams: 250 }
];

type SearchResult = {
  source_food_code: string;
  name: string;
  scientific_name?: string | null;
  food_group_name_fr?: string | null;
  food_subgroup_name_fr?: string | null;
  dataset_version?: string | null;
  nutrients?: Record<string, number>;
};

type CumulItem = {
  id: string;
  foodCode: string;
  foodName: string;
  portionLabel: string;
  grams: number;
  nutrients: Array<{ key: string; label: string; unit: string; value: number }>;
  createdAt: string;
};

function unitFor(key: string) {
  if (key.endsWith("_ug")) return "µg";
  if (key.endsWith("_mg")) return "mg";
  if (key.endsWith("_g")) return "g";
  if (key.endsWith("_kcal")) return "kcal";
  if (key.endsWith("_kj")) return "kJ";
  return "";
}

function labelFor(key: string) {
  return key
    .replace(/_(ug|mg|g|kcal|kj)$/u, "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.length <= 2 ? part.toUpperCase() : `${part[0].toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function nutrientValues(food: SearchResult, grams: number) {
  return Object.entries(food.nutrients || {})
    .filter(([, value]) => typeof value === "number")
    .map(([key, per100g]) => ({
      key,
      label: labelFor(key),
      unit: unitFor(key),
      value: round((per100g * grams) / 100)
    }));
}

function readCumulItems(): CumulItem[] {
  const raw = window.localStorage.getItem(CUMUL_STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as unknown;
  return Array.isArray(parsed) ? parsed as CumulItem[] : [];
}

export function AutocompleteSearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [selectedFood, setSelectedFood] = useState<SearchResult | null>(null);
  const [selectedPortion, setSelectedPortion] = useState(100);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [added, setAdded] = useState(false);

  const canSuggest = useMemo(() => query.trim().length >= 2, [query]);
  const selectedPortionLabel = useMemo(() => portionOptions.find((option) => option.grams === selectedPortion)?.label || `${selectedPortion} g`, [selectedPortion]);

  useEffect(() => {
    let cancelled = false;
    const q = query.trim();

    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!response.ok) return;
      const payload = await response.json();
      if (!cancelled && q === query.trim()) setSuggestions((payload.results || []).slice(0, 8));
    }, 160);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  async function runSearch(nextQuery = query) {
    const q = nextQuery.trim();
    if (!q) return;

    setStatus("loading");
    setMessage("");
    setResults([]);
    setSelectedFood(null);

    const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const payload = await response.json();

    if (!response.ok) {
      setStatus("error");
      setMessage("Recherche indisponible pour le moment.");
      return;
    }

    const nextResults = payload.results || [];
    setStatus("ready");
    setResults(nextResults);
    setSuggestions([]);

    if (nextResults.length === 0) {
      setMessage("Aucun aliment trouvé. Essaie pomme, amande, saumon, lentille, brocoli, gâteau ou pain.");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch();
  }

  function chooseFood(food: SearchResult) {
    setQuery(food.name);
    setSelectedFood(food);
    setResults([]);
    setSuggestions([]);
    setMessage("");
    setAdded(false);
  }

  function addSelectedToCumul() {
    if (!selectedFood) return;
    const item: CumulItem = {
      id: `${selectedFood.source_food_code}-${Date.now()}`,
      foodCode: selectedFood.source_food_code,
      foodName: selectedFood.name,
      portionLabel: selectedPortionLabel,
      grams: selectedPortion,
      nutrients: nutrientValues(selectedFood, selectedPortion),
      createdAt: new Date().toISOString()
    };

    const existing = readCumulItems();
    window.localStorage.setItem(CUMUL_STORAGE_KEY, JSON.stringify([...existing, item]));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  return (
    <section className="searchPage pageSection">
      <div className="searchIntro">
        <p className="eyebrow">Recherche CIQUAL</p>
        <h1>Rechercher un aliment.</h1>
        <p>
          Tape quelques lettres, choisis une proposition, puis sélectionne directement la portion avant d’ouvrir la fiche ou d’ajouter au cumul.
        </p>
      </div>

      <div className="autocompleteShell">
        <form className="searchBox searchBoxLarge" onSubmit={onSubmit}>
          <span>🔎</span>
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setSelectedFood(null); }}
            aria-label="Recherche aliment"
            placeholder="Ex. pomme, saumon, lentille..."
            autoComplete="off"
          />
          <button disabled={status === "loading"}>{status === "loading" ? "Recherche..." : "Rechercher"}</button>
        </form>

        {canSuggest && suggestions.length > 0 ? (
          <div className="suggestionList" role="listbox">
            {suggestions.map((food) => (
              <button key={food.source_food_code} type="button" onClick={() => chooseFood(food)}>
                <strong>{food.name}</strong>
                <span>{food.food_group_name_fr || "CIQUAL"}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {selectedFood ? (
        <section className="searchSelection">
          <div>
            <span>Aliment sélectionné</span>
            <strong>{selectedFood.name}</strong>
            <small>{selectedFood.food_group_name_fr || "CIQUAL"}</small>
          </div>
          <label>
            <span>Portion</span>
            <select value={selectedPortion} onChange={(event) => setSelectedPortion(Number(event.currentTarget.value))}>
              {portionOptions.map((option) => <option value={option.grams} key={option.grams}>{option.label}</option>)}
            </select>
          </label>
          <div className="searchSelectionActions">
            <button className="primaryCta" type="button" onClick={addSelectedToCumul}>{added ? "Ajouté" : "Ajouter au cumul"}</button>
            <a className="secondaryCta" href={`/aliment/${selectedFood.source_food_code}`}>Ouvrir la fiche</a>
          </div>
        </section>
      ) : null}

      {message ? <div className="stateBox">{message}</div> : null}

      <div className="resultList">
        {results.map((food) => (
          <button className="resultCard resultButton" key={food.source_food_code} type="button" onClick={() => chooseFood(food)}>
            <div>
              <strong>{food.name}</strong>
              <span>{food.food_group_name_fr || "Groupe non renseigné"}</span>
            </div>
            <div className="resultAction">
              <code>{food.source_food_code}</code>
              <span>Choisir</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
