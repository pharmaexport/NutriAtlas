"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type SearchResult = {
  source_food_code: string;
  name: string;
  scientific_name?: string | null;
  food_group_name_fr?: string | null;
  food_subgroup_name_fr?: string | null;
  dataset_version?: string | null;
};

export function AutocompleteSearchClient() {
  const [query, setQuery] = useState("banane");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

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
      if (!cancelled) setSuggestions((payload.results || []).slice(0, 6));
    }, 180);

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
      setMessage("Aucun aliment trouve. Essaie banane, amande, saumon, lentille, brocoli, gateau ou pain.");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch();
  }

  function chooseSuggestion(food: SearchResult) {
    setQuery(food.name);
    runSearch(food.name);
  }

  return (
    <section className="searchPage pageSection">
      <div className="searchIntro">
        <p className="eyebrow">Recherche CIQUAL</p>
        <h1>Rechercher un aliment.</h1>
        <p>
          Tape quelques lettres, choisis une proposition, puis ouvre la fiche pour voir les apports nutritionnels.
        </p>
      </div>

      <div className="autocompleteShell">
        <form className="searchBox searchBoxLarge" onSubmit={onSubmit}>
          <span>🔎</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Recherche aliment"
            autoComplete="off"
          />
          <button disabled={status === "loading"}>{status === "loading" ? "Recherche..." : "Rechercher"}</button>
        </form>

        {canSuggest && suggestions.length > 0 ? (
          <div className="suggestionList" role="listbox">
            {suggestions.map((food) => (
              <button key={food.source_food_code} type="button" onClick={() => chooseSuggestion(food)}>
                <strong>{food.name}</strong>
                <span>{food.food_group_name_fr || "CIQUAL"}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {message ? <div className="stateBox">{message}</div> : null}

      <div className="resultList">
        {results.map((food) => (
          <a className="resultCard" key={food.source_food_code} href={`/aliment/${food.source_food_code}`}>
            <div>
              <strong>{food.name}</strong>
              <span>{food.food_group_name_fr || "Groupe non renseigne"}</span>
            </div>
            <div className="resultAction">
              <code>{food.source_food_code}</code>
              <span>Ouvrir</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
