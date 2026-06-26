"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultProfile, loadStoredProfile, type UserProfile } from "../../lib/nutrition-profile";
import {
  calculateLongevityAge,
  defaultLongevityQuestionnaire,
  frequencyOptions,
  injuryOptions,
  loadLongevityQuestionnaire,
  normalizeLongevityQuestionnaire,
  saveLongevityQuestionnaire,
  sleepQualityOptions,
  socialPracticeOptions,
  sportTypeOptions,
  tobaccoOptions,
  type LongevityQuestionnaire
} from "../../lib/longevity";

type NumericField = "moderateMinutes" | "vigorousMinutes" | "strengthSessions" | "mobilitySessions" | "sittingHours" | "sportYears" | "sleepHours" | "stressLevel" | "alcoholDrinksPerWeek" | "fruitVegServingsPerDay" | "legumesPerWeek" | "sugaryDrinksPerWeek" | "systolic" | "diastolic" | "restingHeartRate";

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function sourceText() {
  return "Sources institutionnelles : ANSES pour activité physique, renforcement, assouplissement et sédentarité ; OMS pour activité physique, alimentation saine, sel, sucres et graisses ; NHS pour les repères pratiques 150 min modérées / 75 min intenses et renforcement au moins 2 jours par semaine.";
}

export default function LongevityPage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [questionnaire, setQuestionnaire] = useState<LongevityQuestionnaire>(defaultLongevityQuestionnaire);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(loadStoredProfile());
    setQuestionnaire(loadLongevityQuestionnaire());
  }, []);

  const result = useMemo(() => calculateLongevityAge(profile, questionnaire), [profile, questionnaire]);
  const deltaLabel = result.deltaYears > 0 ? `+${result.deltaYears} ans` : `${result.deltaYears} ans`;

  function updateNumber(field: NumericField, value: string) {
    setSaved(false);
    setQuestionnaire((current) => ({ ...current, [field]: parseOptionalNumber(value) }));
  }

  function updateField<K extends keyof LongevityQuestionnaire>(field: K, value: LongevityQuestionnaire[K]) {
    setSaved(false);
    setQuestionnaire((current) => normalizeLongevityQuestionnaire({ ...current, [field]: value }));
  }

  function saveQuestionnaire() {
    const normalized = normalizeLongevityQuestionnaire(questionnaire);
    saveLongevityQuestionnaire(normalized);
    setQuestionnaire(normalized);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  }

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
          <p className="eyebrow">Longévité</p>
          <h1>Questionnaire simple pour estimer l’âge biologique.</h1>
          <p>
            Le calcul combine âge chronologique, profil morphologique, activité, sédentarité, sommeil, tabac, alcool, habitudes alimentaires et mesures santé optionnelles.
          </p>
          <div className="ctaRow">
            <button className="primaryCta" type="button" onClick={saveQuestionnaire}>{saved ? "Questionnaire enregistré" : "Enregistrer"}</button>
            <a className="secondaryCta" href="/reco">Voir mes recos</a>
          </div>
        </div>

        <aside className="profilePanel">
          <p className="eyebrow">Conclusion questionnaire</p>
          <div className="metricGrid">
            <div><span>Âge biologique estimé</span><strong>{result.biologicalAge}</strong><small>ans</small></div>
            <div><span>Âge chronologique</span><strong>{result.chronologicalAge}</strong><small>ans</small></div>
            <div><span>Écart estimé</span><strong>{deltaLabel}</strong><small>vs âge chronologique</small></div>
            <div><span>Confiance</span><strong className="metricText">{result.confidence}</strong><small>questionnaire non médical</small></div>
          </div>
        </aside>
      </section>

      <section className="pageSection profileFormPreview">
        <form className="profileEditor" onSubmit={(event) => { event.preventDefault(); saveQuestionnaire(); }}>
          <div>
            <p className="eyebrow">Questionnaire</p>
            <h2>Activité, sommeil et habitudes.</h2>
            <p>Les champs vides utilisent une valeur neutre. Plus le questionnaire est complet, plus la confiance affichée augmente.</p>
          </div>

          <div className="formGrid">
            <label className="field"><span>Sport principal</span><select value={questionnaire.sportType} onChange={(event) => updateField("sportType", event.currentTarget.value as LongevityQuestionnaire["sportType"])}>{sportTypeOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label className="field"><span>Minutes modérées / semaine</span><input type="number" min="0" max="2000" value={questionnaire.moderateMinutes ?? ""} onChange={(event) => updateNumber("moderateMinutes", event.currentTarget.value)} /><small>marche rapide, vélo doux, danse</small></label>
            <label className="field"><span>Minutes intenses / semaine</span><input type="number" min="0" max="1200" value={questionnaire.vigorousMinutes ?? ""} onChange={(event) => updateNumber("vigorousMinutes", event.currentTarget.value)} /><small>course, natation rapide, sport collectif</small></label>
            <label className="field"><span>Renforcement / semaine</span><input type="number" min="0" max="14" value={questionnaire.strengthSessions ?? ""} onChange={(event) => updateNumber("strengthSessions", event.currentTarget.value)} /><small>séances musculaires</small></label>
            <label className="field"><span>Mobilité / semaine</span><input type="number" min="0" max="14" value={questionnaire.mobilitySessions ?? ""} onChange={(event) => updateNumber("mobilitySessions", event.currentTarget.value)} /><small>yoga, étirements, équilibre</small></label>
            <label className="field"><span>Heures assis / jour</span><input type="number" min="0" max="18" step="0.5" value={questionnaire.sittingHours ?? ""} onChange={(event) => updateNumber("sittingHours", event.currentTarget.value)} /></label>
            <label className="field"><span>Ancienneté de pratique</span><input type="number" min="0" max="80" value={questionnaire.sportYears ?? ""} onChange={(event) => updateNumber("sportYears", event.currentTarget.value)} /><small>années régulières</small></label>
            <label className="field"><span>Pratique sociale</span><select value={questionnaire.socialPractice} onChange={(event) => updateField("socialPractice", event.currentTarget.value as LongevityQuestionnaire["socialPractice"])}>{socialPracticeOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label className="field"><span>Blessures</span><select value={questionnaire.injuries} onChange={(event) => updateField("injuries", event.currentTarget.value as LongevityQuestionnaire["injuries"])}>{injuryOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
          </div>

          <div className="formGrid">
            <label className="field"><span>Sommeil</span><input type="number" min="3" max="12" step="0.5" value={questionnaire.sleepHours ?? ""} onChange={(event) => updateNumber("sleepHours", event.currentTarget.value)} /><small>heures / nuit</small></label>
            <label className="field"><span>Qualité sommeil</span><select value={questionnaire.sleepQuality} onChange={(event) => updateField("sleepQuality", event.currentTarget.value as LongevityQuestionnaire["sleepQuality"])}>{sleepQualityOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label className="field"><span>Stress perçu</span><input type="number" min="0" max="10" value={questionnaire.stressLevel ?? ""} onChange={(event) => updateNumber("stressLevel", event.currentTarget.value)} /><small>0 à 10</small></label>
            <label className="field"><span>Tabac / nicotine</span><select value={questionnaire.tobacco} onChange={(event) => updateField("tobacco", event.currentTarget.value as LongevityQuestionnaire["tobacco"])}>{tobaccoOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label className="field"><span>Alcool</span><input type="number" min="0" max="80" value={questionnaire.alcoholDrinksPerWeek ?? ""} onChange={(event) => updateNumber("alcoholDrinksPerWeek", event.currentTarget.value)} /><small>verres / semaine</small></label>
          </div>

          <div className="formGrid">
            <label className="field"><span>Fruits / légumes</span><input type="number" min="0" max="12" step="0.5" value={questionnaire.fruitVegServingsPerDay ?? ""} onChange={(event) => updateNumber("fruitVegServingsPerDay", event.currentTarget.value)} /><small>portions / jour</small></label>
            <label className="field"><span>Légumineuses</span><input type="number" min="0" max="21" value={questionnaire.legumesPerWeek ?? ""} onChange={(event) => updateNumber("legumesPerWeek", event.currentTarget.value)} /><small>fois / semaine</small></label>
            <label className="field"><span>Céréales complètes</span><select value={questionnaire.wholeGrains} onChange={(event) => updateField("wholeGrains", event.currentTarget.value as LongevityQuestionnaire["wholeGrains"])}>{frequencyOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label className="field"><span>Ultra-transformés</span><select value={questionnaire.ultraProcessed} onChange={(event) => updateField("ultraProcessed", event.currentTarget.value as LongevityQuestionnaire["ultraProcessed"])}>{frequencyOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label className="field"><span>Boissons sucrées</span><input type="number" min="0" max="50" value={questionnaire.sugaryDrinksPerWeek ?? ""} onChange={(event) => updateNumber("sugaryDrinksPerWeek", event.currentTarget.value)} /><small>verres / semaine</small></label>
          </div>

          <div className="formGrid">
            <label className="field"><span>Tension systolique</span><input type="number" min="70" max="240" value={questionnaire.systolic ?? ""} onChange={(event) => updateNumber("systolic", event.currentTarget.value)} /><small>optionnel</small></label>
            <label className="field"><span>Tension diastolique</span><input type="number" min="40" max="140" value={questionnaire.diastolic ?? ""} onChange={(event) => updateNumber("diastolic", event.currentTarget.value)} /><small>optionnel</small></label>
            <label className="field"><span>Fréquence repos</span><input type="number" min="35" max="130" value={questionnaire.restingHeartRate ?? ""} onChange={(event) => updateNumber("restingHeartRate", event.currentTarget.value)} /><small>bpm, optionnel</small></label>
          </div>

          <button className="primaryCta" type="submit">{saved ? "Questionnaire enregistré" : "Sauvegarder et recalculer"}</button>
        </form>

        <div className="referencePreview">
          <p className="eyebrow">Résultat détaillé</p>
          <h2>Âge biologique estimé : {result.biologicalAge} ans</h2>
          <div className="referenceList">
            {result.components.map((component) => (
              <article key={component.key}>
                <span>{component.label}</span>
                <strong>{component.score} / {component.max}</strong>
                <small>{Math.round((component.score / component.max) * 100)} % du bloc</small>
              </article>
            ))}
          </div>

          <div className="sourceNote">
            <strong>Confiance : {result.confidence}</strong>
            <p>
              Méthode : questionnaire + profil morphologique + activité physique + sommeil + habitudes générales + apports nutritionnels déclarés dans NutriAtlas. Cette estimation n’est pas un diagnostic médical ; elle donne une approximation comportementale de votre profil de longévité.
            </p>
            <p><small>{sourceText()}</small></p>
          </div>

          <div className="sourceNote">
            <strong>Facteurs visibles</strong>
            <p>Favorables : {result.favorable.length ? result.favorable.join(", ") : "à renseigner"}.</p>
            <p>À améliorer : {result.unfavorable.length ? result.unfavorable.join(", ") : "aucun signal défavorable majeur dans ce questionnaire"}.</p>
          </div>
        </div>
      </section>
    </main>
  );
}