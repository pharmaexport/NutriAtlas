"use client";

import { usePathname } from "next/navigation";

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

function sectionFromPath(pathname: string): SectionKey {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/profil")) return "profil";
  if (pathname.startsWith("/base") || pathname.startsWith("/ciqual") || pathname.startsWith("/search")) return "base";
  if (pathname.startsWith("/cumul")) return "cumul";
  if (pathname.startsWith("/longevite")) return "longevite";
  if (pathname.startsWith("/reco")) return "reco";
  return "home";
}

export function SiteNav({ section, showSubTabs = true }: SiteNavProps) {
  const pathname = usePathname();
  const activeSection = section || sectionFromPath(pathname || "/");

  return (
    <>
      <nav className="nav siteNav" aria-label="Navigation principale">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          {primaryNav.map((item) => (
            <a href={item.href} key={item.href} aria-current={item.section === activeSection ? "page" : undefined}>
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {showSubTabs ? (
        <div className="pageSection subTabs" aria-label="Sous-navigation">
          {subTabs[activeSection].map((item) => (
            <a href={item.href} key={item.href}>{item.label}</a>
          ))}
        </div>
      ) : null}
    </>
  );
}
