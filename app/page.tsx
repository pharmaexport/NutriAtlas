import { SiteNav } from "./components/SiteNav";

export default function HomePage() {
  return (
    <main>
      <SiteNav section="home" />
      <section className="hero pageSection" id="synthese">
        <div className="heroCopy">
          <p className="eyebrow">Synthèse</p>
          <h1>NutriAtlas</h1>
          <div className="ctaRow" id="acces">
            <a className="primaryCta" href="/base">Base aliments</a>
            <a className="secondaryCta" href="/longevite">Diagnostic longévité</a>
            <a className="secondaryCta" href="/reco">Reco âge bio</a>
          </div>
        </div>
      </section>
    </main>
  );
}
