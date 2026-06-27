import { Ciqual2SearchClient } from "./Ciqual2SearchClient";

export default function Ciqual2Page() {
  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/profil">Profil</a>
          <a href="/ciqual">CIQUAL</a>
          <a href="/ciqual2">CIQUAL 2</a>
          <a href="/cumul">Cumul</a>
        </div>
      </nav>
      <Ciqual2SearchClient />
    </main>
  );
}
