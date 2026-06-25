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

type SearchStatus = "idle" | "loading" | "ready" | "error";

async function fetchSearchResults(q: string): Promise<SearchResult[]> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);

  if (!response.ok) {
    throw new Error(`Search failed with status ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload.results) ? payload.results : [];
}

export function AutocompleteSearchClient() {
  const [query, setQuery] = useState("banane");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");
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
      try {
        const nextSuggestions = await fetchSearchResults(q);
        if (!cancelled) setSuggestions(nextSuggestions.slice(0, 6));
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  async function runSearch(nextQuery = query) {
    const q = nextQuery.trim();
    if (!q) {
      setMessage("Saisis au moins deux lettres pour lancer une recherche.");
      return;
    }

    setStatus("loading");
    setMessage("");
    setResults([]);

    try {
      const nextResults = await fetchSearchResults(q);

      setStatus("ready");
      setResults(nextResults);
      setSuggestions([]);

      if (nextResults.length === 0) {
        setMessage("Aucun aliment trouvé. Essaie banane, amande, saumon, lentille, brocoli, gâteau ou pain.");
      }
    } catch {
      setStatus("error");
      setMessage("Recherche indisponible pour le moment. Vérifie le déploiement ou réessaie plus tard.");
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
          <span aria-hidden="true">🔎</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Recherche aliment"
            placeholder="Ex. banane, œuf, lentille..."
            autoComplete="off"
          />
          <button disabled={status === "loading"}>
            {status === "loading" ? "Recherche..." : "Rechercher"}
          </button>
        </form>

        {canSuggest && suggestions.length > 0 ? (
          <div className="suggestionList" role="listbox" aria-label="Suggestions alimentaires">
            {suggestions.map((food) => (
              <button key={food.source_food_code} type="button" onClick={() => chooseSuggestion(food)}>
                <strong>{food.name}</strong>
                <span>{food.food_group_name_fr || "CIQUAL"}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {message ? <div className={status === "error" ? "stateBox errorState" : "stateBox"}>{message}</div> : null}

      <div className="resultList">
        {results.map((food) => (
          <a className="resultCard" key={food.source_food_code} href={`/aliment/${food.source_food_code}`}>
            <div>
              <strong>{food.name}</strong>
              <span>{food.food_group_name_fr || "Groupe non renseigné"}</span>
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
