"use client";

import { FormEvent, useState } from "react";

type SearchResult = {
  source_food_code: string;
  name: string;
  scientific_name?: string | null;
  food_group_name_fr?: string | null;
  dataset_version?: string | null;
};

export function SearchClient() {
  const [query, setQuery] = useState("banane");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<string>("idle");
  const [message, setMessage] = useState<string>("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (!q) return;

    setStatus("loading");
    setMessage("");
    setResults([]);

    const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const payload = await response.json();

    if (!response.ok) {
      setStatus("error");
      setMessage(
        payload.status === "database_not_configured"
          ? "La base PostgreSQL n’est pas encore connectée à Vercel."
          : "Recherche indisponible pour le moment."
      );
      return;
    }

    setStatus("ready");
    setResults(payload.results || []);
    if ((payload.results || []).length === 0) {
      setMessage("Aucun aliment trouvé pour cette recherche.");
    }
  }

  return (
    <section className="searchPage pageSection">
      <div className="searchIntro">
        <p className="eyebrow">Recherche CIQUAL</p>
        <h1>Rechercher un aliment.</h1>
        <p>
          Cette page est branchée sur l’API NutriAtlas. Les résultats deviendront réels dès que CIQUAL 2025 sera importé dans PostgreSQL.
        </p>
      </div>

      <form className="searchBox searchBoxLarge" onSubmit={onSubmit}>
        <span>🔎</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Recherche aliment" />
        <button disabled={status === "loading"}>{status === "loading" ? "Recherche..." : "Rechercher"}</button>
      </form>

      {message ? <div className="stateBox">{message}</div> : null}

      <div className="resultList">
        {results.map((food) => (
          <a className="resultCard" key={food.source_food_code} href={`/aliment/${food.source_food_code}`}>
            <div>
              <strong>{food.name}</strong>
              <span>{food.food_group_name_fr || "Groupe non renseigné"}</span>
            </div>
            <code>{food.source_food_code}</code>
          </a>
        ))}
      </div>
    </section>
  );
}
