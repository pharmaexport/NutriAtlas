"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteNav } from "../components/SiteNav";
import { defaultProfile, loadStoredProfile, summarizeProfile, type UserProfile } from "../../lib/nutrition-profile";
import { calculateLongevityAge, defaultLongevityQuestionnaire, loadLongevityQuestionnaire, type LongevityQuestionnaire } from "../../lib/longevity";

type LongevityGainEstimate = {
  medianMonths: number | null;
  lowMonths?: number;
  highMonths?: number;
  confidence: "forte" | "modérée" | "faible" | "émergente";
  note: string;
  impactLabel?: string;
};

type Recommendation = {
  title: string;
  why: string;
  action: string;
  source: string;
  nutrients: string[];
  actives: string[];
  mechanisms: string[];
  proof: "fort" | "modéré" | "émergent" | "pilotage";
  gain: LongevityGainEstimate;
  priorityScore: number;
  detail: string;
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
    note: "Estimation populationnelle si l’habitude est maintenue dans la durée."
  };
}

function integratedImpact(label: string, reason: string, confidence: LongevityGainEstimate["confidence"] = "modérée"): LongevityGainEstimate {
  return {
    medianMonths: null,
    confidence,
    impactLabel: label,
    note: reason
  };
}

function gainLabel(gain: LongevityGainEstimate) {
  if (gain.medianMonths === null) return gain.impactLabel || "Impact intégré au score global";
  if (gain.lowMonths !== undefined && gain.highMonths !== undefined && gain.lowMonths !== gain.highMonths) {
    return `Gain estimé : +${gain.lowMonths} à +${gain.highMonths} mois en bonne santé`;
  }
  return `Gain estimé : +${gain.medianMonths} mois en bonne santé`;
}

function proofLabel(proof: Recommendation["proof"]) {
  if (proof === "fort") return "Preuve forte";
  if (proof === "modéré") return "Preuve modérée";
  if (proof === "émergent") return "Preuve émergente";
  return "Repère de pilotage";
}

function motivationFactor(q: LongevityQuestionnaire, preferred: Recommendation["title"]) {
  const motivation = q.motivationLevel ?? 6;
  const base = motivation >= 8 ? 1.2 : motivation >= 5 ? 1 : 0.75;
  if (q.preferredAction === "any") return base;
  if (q.preferredAction === "nutrition" && ["Fruits & légumes", "Légumineuses", "Réserves nutritionnelles", "Oméga-3", "Noix & graines"].includes(preferred)) return base * 1.15;
  if (q.preferredAction === "movement" && ["Socle cardio", "Renforcement", "Moins assis", "Mobilité"].includes(preferred)) return base * 1.15;
  if (q.preferredAction === "sleep" && preferred === "Sommeil") return base * 1.15;
  if (q.preferredAction === "stress" && preferred === "Stress / fatigue") return base * 1.15;
  if (q.preferredAction === "supplements" && ["Magnésium", "Vitamine D", "Créatine"].includes(preferred)) return base * 1.15;
  return base;
}

function buildRecommendations(profile: UserProfile, q: LongevityQuestionnaire) {
  const summary = summarizeProfile(profile);
  const equivalent = activityEquivalent(q);
  const recommendations: Recommendation[] = [];

  function pushReco(reco: Omit<Recommendation, "priorityScore">, gap: number, impact: number) {
    recommendations.push({
      ...reco,
      priorityScore: Math.round(gap * impact * motivationFactor(q, reco.title) * 100)
    });
  }

  if (equivalent < 150) {
    pushReco({
      title: "Socle cardio",
      why: "Ton volume d’activité semble inférieur au repère protecteur de base.",
      action: "Vise progressivement 150 minutes modérées par semaine, en commençant par 10 minutes de marche après un repas.",
      source: "OMS / NHS",
      nutrients: ["potassium", "magnésium", "glucides de qualité"],
      actives: ["polyphénols alimentaires"],
      mechanisms: ["santé cardio-métabolique", "glycémie", "inflammation"],
      proof: "fort",
      gain: computableGain(6, 15, 30, "modérée"),
      detail: "Le cardio reste un socle : il soutient la capacité respiratoire, la tension, la glycémie et la santé vasculaire. Les minutes intenses comptent double dans ce suivi."
    }, 150 - equivalent, 1.2);
  } else {
    pushReco({
      title: "Cardio OK",
      why: `Tu déclares environ ${equivalent} minutes équivalentes modérées par semaine.`,
      action: "Conserve la régularité et ajoute surtout des pauses actives si tu restes longtemps assis.",
      source: "OMS / NHS",
      nutrients: ["potassium", "magnésium"],
      actives: ["polyphénols alimentaires"],
      mechanisms: ["régularité", "santé vasculaire"],
      proof: "modéré",
      gain: computableGain(1, 4, 8, "faible"),
      detail: "Le levier principal n’est plus d’ajouter beaucoup de cardio, mais de préserver la régularité et de réduire les longues périodes immobiles."
    }, 20, 0.35);
  }

  if ((q.strengthSessions || 0) < 2) {
    pushReco({
      title: "Renforcement",
      why: "Ton profil indique moins de 2 séances de renforcement par semaine.",
      action: "Ajoute 2 séances courtes : jambes, dos, poussée, tirage et gainage.",
      source: "ANSES / NHS",
      nutrients: ["protéines", "leucine", "vitamine D", "magnésium"],
      actives: ["créatine monohydrate"],
      mechanisms: ["masse musculaire", "métabolisme", "autonomie", "ATP musculaire"],
      proof: "fort",
      gain: computableGain(6, 12, 20, "modérée"),
      detail: "La recommandation active prioritaire est l’exercice. La créatine peut être pertinente chez certains profils, surtout si elle accompagne un vrai travail musculaire."
    }, 2 - (q.strengthSessions || 0), 1.3);
  }

  if ((q.sittingHours || 0) > 8) {
    pushReco({
      title: "Moins assis",
      why: "Le temps assis déclaré dépasse le seuil de vigilance.",
      action: "Ajoute 2 à 5 minutes de marche ou mobilité toutes les 60 à 90 minutes.",
      source: "ANSES / OMS",
      nutrients: ["magnésium", "potassium"],
      actives: [],
      mechanisms: ["glycémie", "circulation", "métabolisme"],
      proof: "modéré",
      gain: computableGain(4, 10, 18, "modérée"),
      detail: "La sédentarité doit être considérée comme un levier distinct du sport : on peut faire du sport et rester trop longtemps assis."
    }, (q.sittingHours || 0) - 8, 1.1);
  }

  if ((q.fruitVegServingsPerDay || 0) < 5) {
    pushReco({
      title: "Fruits & légumes",
      why: "Ton apport végétal semble inférieur au repère protecteur.",
      action: "Ajoute 1 portion de légumes par jour cette semaine, puis progresse vers 5 portions.",
      source: "OMS / PNNS",
      nutrients: ["vitamine C", "folates", "potassium", "fibres", "magnésium"],
      actives: ["polyphénols", "caroténoïdes", "flavonoïdes"],
      mechanisms: ["inflammation", "stress oxydatif", "microbiote", "santé vasculaire"],
      proof: "fort",
      gain: computableGain(6, 14, 28, "modérée"),
      detail: "Le bénéfice longévité ne vient pas d’une vitamine isolée, mais du profil végétal complet : fibres, micronutriments, diversité et composés bioactifs."
    }, 5 - (q.fruitVegServingsPerDay || 0), 1.25);
  }

  if ((q.legumesPerWeek || 0) < 3) {
    pushReco({
      title: "Légumineuses",
      why: "Les légumineuses sont un levier nutritionnel simple et encore sous-utilisé.",
      action: "Ajoute lentilles, pois chiches, haricots ou pois cassés 2 à 3 fois par semaine.",
      source: "OMS / PNNS",
      nutrients: ["fibres", "protéines végétales", "magnésium", "folates", "potassium"],
      actives: ["prébiotiques"],
      mechanisms: ["microbiote", "glycémie", "satiété", "cardio-métabolique"],
      proof: "fort",
      gain: computableGain(3, 6, 12, "faible"),
      detail: "C’est l’un des ponts les plus cohérents entre qualité alimentaire, fibres, protéines végétales et santé métabolique."
    }, 3 - (q.legumesPerWeek || 0), 1.05);
  }

  if ((q.nutsSeedsPerWeek || 0) < 5) {
    pushReco({
      title: "Noix & graines",
      why: "Ton profil peut gagner en bons lipides, magnésium et densité nutritionnelle.",
      action: "Ajoute une petite poignée de noix, amandes ou graines 4 à 5 jours par semaine.",
      source: "PNNS / études longévité",
      nutrients: ["magnésium", "vitamine E", "fibres", "acides gras insaturés"],
      actives: ["polyphénols"],
      mechanisms: ["inflammation", "cardio-métabolique", "satiété"],
      proof: "modéré",
      gain: computableGain(2, 6, 14, "faible"),
      detail: "Les noix et graines sont surtout utiles comme remplacement d’en-cas pauvres en nutriments."
    }, 5 - (q.nutsSeedsPerWeek || 0), 0.85);
  }

  if ((q.fattyFishPerWeek || 0) < 2) {
    pushReco({
      title: "Oméga-3",
      why: "Le profil oméga-3 semble perfectible.",
      action: "Vise 1 à 2 portions de poisson gras par semaine, ou une alternative algale si besoin.",
      source: "ANSES / EFSA",
      nutrients: ["EPA", "DHA", "vitamine D", "iode"],
      actives: ["oméga-3 EPA/DHA"],
      mechanisms: ["inflammation", "cerveau", "membranes cellulaires", "cœur"],
      proof: "modéré",
      gain: integratedImpact("Impact intégré cardio/cerveau", "L’effet isolé en mois n’est pas assez robuste pour être affiché seul."),
      detail: "Les oméga-3 sont intégrés au score fonctionnel plutôt qu’affichés comme mois isolés."
    }, 2 - (q.fattyFishPerWeek || 0), 0.8);
  }

  if (q.ultraProcessed === "frequent" || q.ultraProcessed === "daily") {
    pushReco({
      title: "Ultra-transformés",
      why: "Les prises ultra-transformées fréquentes dégradent la qualité des sources nutritionnelles.",
      action: "Remplace une prise par jour par fruit + oléagineux, yaourt nature, œufs, légumineuses ou légumes.",
      source: "OMS",
      nutrients: ["fibres", "potassium", "protéines", "micronutriments"],
      actives: [],
      mechanisms: ["densité nutritionnelle", "satiété", "glycémie", "inflammation"],
      proof: "modéré",
      gain: computableGain(4, 9, 18, "faible"),
      detail: "L’objectif n’est pas la perfection : un remplacement régulier peut déjà améliorer les réserves nutritionnelles."
    }, q.ultraProcessed === "daily" ? 3 : 2, 1.1);
  }

  if ((q.stressLevel || 0) >= 7 || (q.fatigueLevel || 0) >= 7) {
    pushReco({
      title: "Stress / fatigue",
      why: "Ton stress ou ta fatigue est élevé, ce qui peut bloquer l’adhérence aux autres recos.",
      action: "Choisis une micro-action : 5 minutes de respiration, marche calme ou routine coucher.",
      source: "Profil NutriAtlas",
      nutrients: ["magnésium", "vitamines B", "oméga-3"],
      actives: ["magnésium selon apport", "polyphénols alimentaires"],
      mechanisms: ["cortisol", "récupération", "comportements alimentaires", "sommeil"],
      proof: "pilotage",
      gain: integratedImpact("Impact fonctionnel prioritaire", "Très pertinent pour l’adhérence, mais non isolable en mois."),
      detail: "Cette carte sert à éviter les plans irréalistes : on traite d’abord le frein principal si la fatigue ou le stress empêchent d’agir."
    }, Math.max(q.stressLevel || 0, q.fatigueLevel || 0), 0.9);
  }

  if ((q.mobilitySessions || 0) < 2) {
    pushReco({
      title: "Mobilité",
      why: "La mobilité complète le cardio et le renforcement.",
      action: "Ajoute 2 moments de mobilité, équilibre ou assouplissement par semaine.",
      source: "ANSES",
      nutrients: ["protéines", "magnésium"],
      actives: [],
      mechanisms: ["amplitude", "équilibre", "autonomie"],
      proof: "pilotage",
      gain: integratedImpact("Impact fonctionnel : mobilité & autonomie", "Effet longévité direct difficile à isoler."),
      detail: "À afficher comme défi optionnel, pas comme promesse de mois : yoga, pilates, étirements actifs ou équilibre sur un pied."
    }, 2 - (q.mobilitySessions || 0), 0.55);
  }

  recommendations.push({
    title: "Réserves nutritionnelles",
    why: "Tes repères personnalisés permettent d’identifier les manques prioritaires.",
    action: "Surveille protéines, fibres, sodium, potassium, magnésium, calcium, vitamine D et oméga-3.",
    source: "ANSES / Profil NutriAtlas",
    nutrients: ["protéines", "fibres", "sodium", "potassium", "magnésium", "calcium"],
    actives: ["vitamine D", "oméga-3", "créatine selon profil"],
    mechanisms: ["réserves muscle", "énergie", "os", "immunité", "cardio-métabolique"],
    proof: "pilotage",
    gain: integratedImpact("Impact intégré au score global", "Repères de pilotage nutritionnel, non chiffrables isolément."),
    priorityScore: 30,
    detail: `Ton profil calcule environ ${summary.calories} kcal/j et des repères personnalisés qui alimentent le Top 3 et le Top 10.`
  });

  return recommendations.sort((a, b) => b.priorityScore - a.priorityScore);
}

function RecoCard({ item, rank }: { item: Recommendation; rank: number }) {
  return (
    <article className="recoCard">
      <div className="recoHeader">
        <span>#{rank} {item.title}</span>
        <strong className="recommendationSource">{item.source}</strong>
      </div>
      <small className="gainPill">{gainLabel(item.gain)}</small>
      <p>{item.why}</p>
      <p><strong>Action semaine :</strong> {item.action}</p>
      <div className="chipRow">
        {item.nutrients.slice(0, 5).map((nutrient) => <span key={nutrient}>{nutrient}</span>)}
      </div>
      <details className="recoDetails">
        <summary>+ Détail scientifique</summary>
        <p><strong>Nutriments clés :</strong> {item.nutrients.length ? item.nutrients.join(", ") : "à personnaliser"}.</p>
        <p><strong>Actifs possibles :</strong> {item.actives.length ? item.actives.join(", ") : "aucun actif spécifique prioritaire"}.</p>
        <p><strong>Mécanismes :</strong> {item.mechanisms.join(", ")}.</p>
        <p><strong>Niveau :</strong> {proofLabel(item.proof)} · {item.gain.note}</p>
        <p>{item.detail}</p>
      </details>
    </article>
  );
}

export default function RecoPage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [questionnaire, setQuestionnaire] = useState<LongevityQuestionnaire>(defaultLongevityQuestionnaire);

  useEffect(() => {
    setProfile(loadStoredProfile());
    setQuestionnaire(loadLongevityQuestionnaire());
  }, []);

  const recommendations = useMemo(() => buildRecommendations(profile, questionnaire), [profile, questionnaire]);
  const topThree = recommendations.slice(0, 3);
  const longevity = useMemo(() => calculateLongevityAge(profile, questionnaire), [profile, questionnaire]);

  return (
    <main>
      <SiteNav section="reco" showSubTabs />

      <section className="profileHero pageSection recoHero" id="priorites">
        <div className="profileIntro">
          <p className="eyebrow">Mes priorités</p>
          <h1>Top recos longévité</h1>
          <p>
            Priorités concrètes issues du profil, du questionnaire global, des repères nutritionnels et des sources ANSES, OMS, PNNS, EFSA et NHS.
          </p>
          <div className="ctaRow">
            <a className="primaryCta" href="/longevite">Remplir le bilan</a>
            <a className="secondaryCta" href="/profil">Modifier le profil</a>
          </div>
        </div>

        <aside className="profilePanel">
          <p className="eyebrow">Synthèse</p>
          <div className="metricGrid">
            <div><span>Âge bio</span><strong className="metricAge">{longevity.biologicalAgeLabel}</strong><small>estimation</small></div>
            <div><span>Mois en bonne santé</span><strong className="metricText">{longevity.healthyLifeGainLabel}</strong><small>potentiel améliorable</small></div>
            <div><span>Score</span><strong>{longevity.score}</strong><small>indice / 100</small></div>
            <div><span>Activité</span><strong>{activityEquivalent(questionnaire)}</strong><small>min équiv. / semaine</small></div>
          </div>
        </aside>
      </section>

      <section className="pageSection profileFormPreview" id="gains">
        <div className="referencePreview">
          <p className="eyebrow">Priorités semaine</p>
          <h2>Ton Top 3</h2>
          <div className="referenceList">
            {topThree.map((item, index) => <RecoCard item={item} rank={index + 1} key={item.title} />)}
          </div>
        </div>

        <div className="referencePreview">
          <p className="eyebrow">Top 10 complet</p>
          <h2>Toutes les priorités utiles</h2>
          <div className="referenceList">
            {recommendations.slice(0, 10).map((item, index) => <RecoCard item={item} rank={index + 1} key={item.title} />)}
          </div>
          <div className="sourceNote">
            <strong>Lecture des gains</strong>
            <p><small>Les gains affichés sont des ordres de grandeur populationnels. Ils ne constituent pas une promesse individuelle et ne s’additionnent pas toujours directement.</small></p>
            <p><small>Quand un levier n’est pas chiffrable isolément, il est affiché comme impact fonctionnel ou intégré au score global.</small></p>
          </div>
        </div>
      </section>
    </main>
  );
}
