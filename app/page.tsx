import { SiteNav } from "./components/SiteNav";

export default function HomePage() {
  return (
    <main>
      <SiteNav section="home" showSubTabs />
      <section className="hero pageSection" id="synthese">
        <div className="heroCopy">
          <p className="eyebrow">Synthèse</p>
          <h1>NutriAtlas</h1>
          <div className="ctaRow" id="acces">
            <a className="primaryCta" href="/base">Accès base</a>
            <a className="secondaryCta" href="/longevite">Longévité</a>
            <a className="secondaryCta" href="/reco">Reco</a>
          </div>
        </div>
      </section>
    </main>
  );
}
