"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultProfile, loadStoredProfile, summarizeProfile, type UserProfile } from "../../lib/nutrition-profile";
import { calculateLongevityAge, defaultLongevityQuestionnaire, loadLongevityQuestionnaire, type LongevityQuestionnaire } from "../../lib/longevity";

function activityEquivalent(q: LongevityQuestionnaire) {
  return (q.moderateMinutes || 0) + (q.vigorousMinutes || 0) * 2;
}

function buildRecommendations(profile: UserProfile, q: LongevityQuestionnaire) {
  const summary = summarizeProfile(profile);
  const equivalent = activityEquivalent(q);
  const recommendations: Array<{ title: string; body: string; source: string }> = [];

  if (equivalent < 150) {
    recommendations.push({
      title: "Augmenter le socle cardio",
      body: "Vise progressivement 150 minutes d’activité modérée par semaine, ou 75 minutes intenses. Les minutes intenses comptent double dans ce suivi.",
      source: "OMS / NHS"
    });
  } else {
    recommendations.push({
      title: "Cardio : socle atteint",
      body: `Tu déclares environ ${equivalent} minutes équivalentes modérées par semaine. Le prochain levier est la régularité et la réduction du temps assis.`,
      source: "OMS / NHS"
    });
  }

  if ((q.strengthSessions || 0) < 2) {
    recommendations.push({
      title: "Ajouter du renforcement musculaire",
      body: "Ajoute 2 séances de renforcement par semaine : jambes, dos, poussée, tirage et gainage. C’est important pour la masse musculaire, le métabolisme et le vieillissement fonctionnel.",
      source: "ANSES / NHS"
    });
  }

  if ((q.mobilitySessions || 0) < 2) {
    recommendations.push({
      title: "Mobilité et assouplissement",
      body: "Ajoute 2 à 3 moments de mobilité, équilibre ou assouplissement par semaine : yoga, pilates, étirements actifs ou travail d’amplitude.",
      source: "ANSES"
    });
  }

  if ((q.sittingHours || 0) > 8) {
    recommendations.push({
      title: "Réduire la sédentarité",
      body: "Au-dessus de 8 heures assis par jour, ajoute des pauses actives : 2 à 5 minutes de marche ou mobilité toutes les 60 à 90 minutes.",
      source: "ANSES / OMS"
    });
  }

  if ((q.fruitVegServingsPerDay || 0) < 5) {
    recommendations.push({
      title: "Fruits et légumes",
      body: "Augmente progressivement vers 5 portions par jour, en priorité légumes, fruits entiers, légumineuses et aliments peu transformés.",
      source: "OMS"
    });
  }

  if ((q.legumesPerWeek || 0) < 3) {
    recommendations.push({
      title: "Légumineuses",
      body: "Ajoute lentilles, pois chiches, haricots ou pois cassés 2 à 3 fois par semaine pour les fibres, les protéines végétales et la satiété.",
      source: "OMS / PNNS"
    });
  }

  if (q.ultraProcessed === "frequent" || q.ultraProcessed === "daily") {
    recommendations.push({
      title: "Réduire les ultra-transformés",
      body: "Remplace une prise ultra-transformée par jour par une option simple : fruit + oléagineux, yaourt nature, légumineuses, œufs, poisson, céréales complètes ou légumes.",
      source: "OMS"
    });
  }

  recommendations.push({
    title: "Repères nutritionnels actifs",
    body: `Ton profil calcule environ ${summary.calories} kcal/j, avec des repères personnalisés pour protéines, glucides, lipides, sucres, fibres, sodium, potassium et magnésium.`,
    source: "ANSES / profil NutriAtlas"
  });

  return recommendations;
}

export default function RecoPage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [questionnaire, setQuestionnaire] = useState<LongevityQuestionnaire>(defaultLongevityQuestionnaire);

  useEffect(() => {
    setProfile(loadStoredProfile());
    setQuestionnaire(loadLongevityQuestionnaire());
  }, []);

  const recommendations = useMemo(() => buildRecommendations(profile, questionnaire), [profile, questionnaire]);
  const longevity = useMemo(() => calculateLongevityAge(profile, questionnaire), [profile, questionnaire]);

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/profil">Profil</a>
          <a href="/reco">Reco profil</a>
          <a href="/longevite">Longévité</a>
          <a href="/search">Recherche</a>
          <a href="/cumul">Cumul</a>
        </div>
      </nav>

      <section className="profileHero pageSection">
        <div className="profileIntro">
          <p className="eyebrow">Reco profil</p>
          <h1>Recommandations personnalisées, sourcées et actionnables.</h1>
          <p>
            Cette page transforme le profil, le questionnaire longévité et les repères nutritionnels en priorités concrètes inspirées des recommandations ANSES, OMS et NHS.
          </p>
          <div className="ctaRow">
            <a className="primaryCta" href="/longevite">Remplir longévité</a>
            <a className="secondaryCta" href="/profil">Modifier le profil</a>
          </div>
        </div>

        <aside className="profilePanel">
          <p className="eyebrow">Synthèse</p>
          <div className="metricGrid">
            <div><span>Âge bio estimé</span><strong>{longevity.biologicalAge}</strong><small>ans</small></div>
            <div><span>Score longévité</span><strong>{longevity.score}</strong><small>/ 100</small></div>
            <div><span>Confiance</span><strong className="metricText">{longevity.confidence}</strong><small>questionnaire</small></div>
            <div><span>Activité</span><strong>{activityEquivalent(questionnaire)}</strong><small>min équiv. / semaine</small></div>
          </div>
        </aside>
      </section>

      <section className="pageSection profileFormPreview">
        <div className="referencePreview">
          <p className="eyebrow">Priorités</p>
          <h2>À faire selon ton profil.</h2>
          <div className="referenceList">
            {recommendations.map((item) => (
              <article key={item.title}>
                <span>{item.title}</span>
                <strong>{item.source}</strong>
                <small>{item.body}</small>
              </article>
            ))}
          </div>
          <div className="sourceNote">
            <strong>Sources officielles</strong>
            <p><small>ANSES : activité cardiorespiratoire, renforcement musculaire, assouplissement et sédentarité. OMS : activité physique, alimentation saine, sucres, sel et graisses. NHS : repères pratiques d’activité modérée, intense, renforcement et réduction du temps assis.</small></p>
          </div>
        </div>
      </section>
    </main>
  );
}
