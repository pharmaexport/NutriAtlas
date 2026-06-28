"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultProfile, loadStoredProfile, summarizeProfile, type UserProfile } from "../../lib/nutrition-profile";
import { calculateLongevityAge, defaultLongevityQuestionnaire, loadLongevityQuestionnaire, type LongevityQuestionnaire } from "../../lib/longevity";

type LongevityGainEstimate = {
  medianMonths: number | null;
  lowMonths?: number;
  highMonths?: number;
  confidence: "forte" | "modérée" | "faible";
  note: string;
};

type Recommendation = {
  title: string;
  body: string;
  source: string;
  gain: LongevityGainEstimate;
};

function activityEquivalent(q: LongevityQuestionnaire) {
  return (q.moderateMinutes || 0) + (q.vigorousMinutes || 0) * 2;
}

function computableGain(lowMonths: number, medianMonths: number, highMonths: number, confidence: LongevityGainEstimate["confidence"]): LongevityGainEstimate {
  return {
    lowMonths,
    medianMonths,
    highMonths,
    confidence,
    note: "Estimation statistique si l’habitude est maintenue dans la durée."
  };
}

function nonComputableGain(reason: string): LongevityGainEstimate {
  return {
    medianMonths: null,
    confidence: "faible",
    note: reason
  };
}

function gainLabel(gain: LongevityGainEstimate) {
  if (gain.medianMonths === null) return "Gain longévité non chiffrable";
  if (gain.lowMonths !== undefined && gain.highMonths !== undefined && gain.lowMonths !== gain.highMonths) {
    return `Gain longévité estimé : +${gain.lowMonths} à +${gain.highMonths} mois`;
  }
  return `Gain longévité estimé : +${gain.medianMonths} mois`;
}

function buildRecommendations(profile: UserProfile, q: LongevityQuestionnaire) {
  const summary = summarizeProfile(profile);
  const equivalent = activityEquivalent(q);
  const recommendations: Recommendation[] = [];

  if (equivalent < 150) {
    recommendations.push({
      title: "Bouger plus chaque semaine",
      body: "Monte progressivement à 150 min d’activité modérée par semaine, ou 75 min intenses. Ici, 1 min intense = 2 min modérées.",
      source: "OMS / NHS",
      gain: computableGain(6, 15, 30, "modérée")
    });
  } else {
    recommendations.push({
      title: "Cardio validé",
      body: `Tu déclares environ ${equivalent} min équivalentes par semaine. Priorité : garder le rythme et bouger pendant les longues phases assises.`,
      source: "OMS / NHS",
      gain: computableGain(1, 4, 8, "faible")
    });
  }

  if ((q.strengthSessions || 0) < 2) {
    recommendations.push({
      title: "Renforcer 2 fois/semaine",
      body: "Prévois 2 séances par semaine : jambes, dos, poussée, tirage et gainage. Objectif : préserver muscle, métabolisme et autonomie.",
      source: "ANSES / NHS",
      gain: computableGain(6, 12, 20, "modérée")
    });
  }

  if ((q.mobilitySessions || 0) < 2) {
    recommendations.push({
      title: "Garder de la mobilité",
      body: "Ajoute 2 à 3 séances courtes : mobilité, équilibre, yoga, pilates ou étirements actifs.",
      source: "ANSES",
      gain: nonComputableGain("Impact fonctionnel probable ; effet longévité direct difficile à isoler.")
    });
  }

  if ((q.sittingHours || 0) > 8) {
    recommendations.push({
      title: "Couper les longues périodes assises",
      body: "Au-delà de 8 h assis/jour, fais 2 à 5 min de marche ou mobilité toutes les 60 à 90 min.",
      source: "ANSES / OMS",
      gain: computableGain(4, 10, 18, "modérée")
    });
  }

  if ((q.fruitVegServingsPerDay || 0) < 5) {
    recommendations.push({
      title: "Viser 5 portions végétales",
      body: "Monte vers 5 portions par jour : légumes, fruits entiers, légumineuses et aliments peu transformés.",
      source: "OMS",
      gain: computableGain(6, 14, 28, "modérée")
    });
  }

  if ((q.legumesPerWeek || 0) < 3) {
    recommendations.push({
      title: "Ajouter des légumineuses",
      body: "Ajoute lentilles, pois chiches, haricots ou pois cassés 2 à 3 fois/semaine pour les fibres, protéines végétales et la satiété.",
      source: "OMS / PNNS",
      gain: computableGain(3, 6, 12, "faible")
    });
  }

  if (q.ultraProcessed === "frequent" || q.ultraProcessed === "daily") {
    recommendations.push({
      title: "Réduire les ultra-transformés",
      body: "Remplace une prise par jour par une option simple : fruit + oléagineux, yaourt nature, œufs, poisson, céréales complètes ou légumes.",
      source: "OMS",
      gain: computableGain(4, 9, 18, "faible")
    });
  }

  recommendations.push({
    title: "Suivre tes repères clés",
    body: `Ton profil estime ${summary.calories} kcal/j et fixe tes repères prioritaires : protéines, fibres, sucres, sodium, potassium et magnésium.`,
    source: "ANSES / profil NutriAtlas",
    gain: nonComputableGain("Repère de pilotage nutritionnel ; gain isolé non robuste.")
  });

  return recommendations.sort((a, b) => (b.gain.medianMonths ?? -1) - (a.gain.medianMonths ?? -1));
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
          <a href="/reco">Conseils</a>
          <a href="/longevite">Longévité</a>
          <a href="/search">Recherche</a>
          <a href="/cumul">Cumul</a>
        </div>
      </nav>

      <section className="profileHero pageSection">
        <div className="profileIntro">
          <p className="eyebrow">Conseils profil</p>
          <h1>Priorités nutrition et longévité.</h1>
          <p>
            Profil, questionnaire et repères nutritionnels réunis en actions claires, classées par impact et sourcées ANSES, OMS et NHS.
          </p>
          <div className="ctaRow">
            <a className="primaryCta" href="/longevite">Compléter longévité</a>
            <a className="secondaryCta" href="/profil">Ajuster le profil</a>
          </div>
        </div>

        <aside className="profilePanel">
          <p className="eyebrow">Synthèse</p>
          <div className="metricGrid">
            <div><span>Âge bio estimé</span><strong className="metricAge">{longevity.biologicalAgeLabel}</strong><small>estimation statistique</small></div>
            <div><span>Score longévité</span><strong>{longevity.score}</strong><small>indice global / 100</small></div>
            <div><span>Activité</span><strong>{activityEquivalent(questionnaire)}</strong><small>min équiv. / semaine</small></div>
          </div>
        </aside>
      </section>

      <section className="pageSection profileFormPreview">
        <div className="referencePreview">
          <p className="eyebrow">Actions prioritaires</p>
          <h2>Ce qui compte maintenant.</h2>
          <div className="referenceList">
            {recommendations.map((item) => (
              <article key={item.title}>
                <span>{item.title}</span>
                <strong className="recommendationSource">{item.source}</strong>
                <small className="gainPill">{gainLabel(item.gain)}</small>
                <small>{item.body}</small>
              </article>
            ))}
          </div>
          <div className="sourceNote">
            <strong>Bases officielles</strong>
            <p><small>ANSES : cardio, renforcement, mobilité et sédentarité. OMS : activité physique, alimentation saine, sucres, sel et graisses. NHS : repères pratiques pour bouger plus et rester moins assis.</small></p>
            <p><small>Les gains affichés sont des ordres de grandeur populationnels. Ils ne constituent pas une promesse individuelle et ne s’additionnent pas toujours directement.</small></p>
          </div>
        </div>
      </section>
    </main>
  );
}
