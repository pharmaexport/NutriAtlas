"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type SearchResult = {
  source_food_code: string;
  name: string;
  food_group_name_fr?: string | null;
  food_subgroup_name_fr?: string | null;
};

export function Ciqual2SearchClient() {
  const [query, setQuery] = useState("");
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
    window.location.href = `/ciqual2/aliment/${food.source_food_code}`;
  }

  return (
    <section className="searchPage pageSection">
      <div className="searchIntro">
        <p className="eyebrow">CIQUAL 2</p>
        <h1>Fiches complètes.</h1>
        <p>
          Onglet expérimental séparé : la recherche CIQUAL historique reste inchangée, et CIQUAL 2 ouvre la fiche avec tous les constituants disponibles.
        </p>
      </div>

      <div className="autocompleteShell">
        <form className="searchBox searchBoxLarge" onSubmit={onSubmit}>
          <span>🔎</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Recherche aliment CIQUAL 2"
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

      <div className="resultList">
        {results.map((food) => (
          <a className="resultCard" key={food.source_food_code} href={`/ciqual2/aliment/${food.source_food_code}`}>
            <div>
              <strong>{food.name}</strong>
              <span>{food.food_group_name_fr || "Groupe non renseigné"}</span>
            </div>
            <div className="resultAction">
              <code>{food.source_food_code}</code>
              <span>Fiche complète</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
