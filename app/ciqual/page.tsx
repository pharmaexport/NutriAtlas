import { AutocompleteSearchClient } from "../search/AutocompleteSearchClient";

export default function CiqualPage() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/profil">Profil</a>
          <a href="/reco">Reco profil</a>
          <a href="/longevite">Longévité</a>
          <a href="/ciqual">CIQUAL</a>
          <a href="/cumul">Cumul</a>
        </div>
      </nav>
      <AutocompleteSearchClient />
    </main>
  );
}
