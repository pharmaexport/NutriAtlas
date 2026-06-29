"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type SearchResult = {
  source_food_code: string;
  name: string;
  food_group_name_fr?: string | null;
  food_subgroup_name_fr?: string | null;
};

const portionOptions = [50, 100, 150, 200, 250, 300];

function portionHref(foodCode: string, grams: number) {
  return `/base/aliment/${foodCode}?portion=${grams}`;
}

export function Ciqual2SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [selectedPortions, setSelectedPortions] = useState<Record<string, number>>({});
  const canSuggest = useMemo(() => query.trim().length >= 2, [query]);

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
      setMessage("Aucun aliment trouvé. Essaie pomme, figue, saumon, lentille ou pain.");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch();
  }

  function chooseFood(food: SearchResult) {
    setQuery(food.name);
    setResults([]);
    setSuggestions([]);
    setMessage("");
    window.location.href = portionHref(food.source_food_code, 100);
  }

  return (
    <section className="searchPage pageSection" id="recherche">
      <div className="searchIntro">
        <p className="eyebrow">Base</p>
        <h1>Recherche aliment.</h1>
        <p>
          Recherche dans la base CIQUAL/ANSES, ouvre une fiche complète et ajoute l’aliment au cumul journalier.
        </p>
      </div>

      <div className="autocompleteShell">
        <form className="searchBox searchBoxLarge" onSubmit={onSubmit}>
          <span>🔎</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Recherche aliment"
            placeholder="Ex. figue, pizza, pomme..."
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

      {message ? <div className="stateBox">{message}</div> : null}

      <div className="resultList" id="fiche">
        {results.map((food) => {
          const grams = selectedPortions[food.source_food_code] || 100;
          return (
            <article className="resultCard" key={food.source_food_code}>
              <div>
                <strong>{food.name}</strong>
                <span>{food.food_group_name_fr || "Groupe non renseigné"}</span>
              </div>
              <div className="resultAction" style={{ gap: "0.65rem" }}>
                <code>{food.source_food_code}</code>
                <label style={{ display: "grid", gap: "0.25rem", color: "#4c5d53", fontWeight: 900 }}>
                  <small style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Portion</small>
                  <select
                    aria-label={`Portion pour ${food.name}`}
                    value={grams}
                    onChange={(event) => setSelectedPortions((current) => ({ ...current, [food.source_food_code]: Number(event.target.value) }))}
                    style={{
                      border: "1px solid rgba(16, 35, 27, 0.14)",
                      borderRadius: "999px",
                      padding: "0.55rem 0.75rem",
                      background: "#eef5e8",
                      color: "#10231b",
                      fontWeight: 950,
                      minWidth: "112px"
                    }}
                  >
                    {portionOptions.map((option) => <option value={option} key={option}>{option} g</option>)}
                  </select>
                </label>
                <a className="primaryCta" href={portionHref(food.source_food_code, grams)} style={{ padding: "0.8rem 1rem", minWidth: "0" }}>
                  Fiche complète
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
