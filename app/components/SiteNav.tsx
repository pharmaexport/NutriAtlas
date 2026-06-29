"use client";

type SectionKey = "home" | "profil" | "base" | "cumul" | "longevite" | "reco";

type SiteNavProps = {
  section?: SectionKey;
  showSubTabs?: boolean;
};

const primaryNav = [
  { href: "/", label: "Accueil", section: "home" },
  { href: "/profil", label: "Profil", section: "profil" },
  { href: "/base", label: "Base", section: "base" },
  { href: "/cumul", label: "Cumul", section: "cumul" },
  { href: "/longevite", label: "Longévité", section: "longevite" },
  { href: "/reco", label: "Reco", section: "reco" }
] as const;

const subTabs: Record<SectionKey, Array<{ href: string; label: string }>> = {
  home: [
    { href: "#synthese", label: "Synthèse" },
    { href: "#acces", label: "Accès" }
  ],
  profil: [
    { href: "#donnees", label: "Données" },
    { href: "#reperes", label: "Repères" }
  ],
  base: [
    { href: "#recherche", label: "Recherche" },
    { href: "#fiche", label: "Fiche" }
  ],
  cumul: [
    { href: "#journal", label: "Journal" },
    { href: "#totaux", label: "Totaux" }
  ],
  longevite: [
    { href: "#test", label: "Test" },
    { href: "#resultats", label: "Résultats" }
  ],
  reco: [
    { href: "#priorites", label: "Priorités" },
    { href: "#gains", label: "Gains" }
  ]
};

export function SiteNav({ section = "home", showSubTabs = false }: SiteNavProps) {
  return (
    <>
      <nav className="nav siteNav" aria-label="Navigation principale">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          {primaryNav.map((item) => (
            <a href={item.href} key={item.href} aria-current={item.section === section ? "page" : undefined}>
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {showSubTabs ? (
        <div className="pageSection subTabs" aria-label="Sous-navigation">
          {subTabs[section].map((item) => (
            <a href={item.href} key={item.href}>{item.label}</a>
          ))}
        </div>
      ) : null}
    </>
  );
}
