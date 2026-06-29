"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultProfile, loadStoredProfile, type UserProfile } from "../../lib/nutrition-profile";
import {
  calculateLongevityAge,
  changeStatusOptions,
  defaultLongevityQuestionnaire,
  energyStabilityOptions,
  frequencyOptions,
  injuryOptions,
  loadLongevityQuestionnaire,
  normalizeLongevityQuestionnaire,
  preferredActionOptions,
  saveLongevityQuestionnaire,
  sleepQualityOptions,
  socialPracticeOptions,
  sportTypeOptions,
  tobaccoOptions,
  type LongevityQuestionnaire
} from "../../lib/longevity";

type NumericField =
  | "moderateMinutes"
  | "vigorousMinutes"
  | "strengthSessions"
  | "mobilitySessions"
  | "sittingHours"
  | "sportYears"
  | "sleepHours"
  | "stressLevel"
  | "fatigueLevel"
  | "motivationLevel"
  | "availableMinutes"
  | "alcoholDrinksPerWeek"
  | "fruitVegServingsPerDay"
  | "legumesPerWeek"
  | "sugaryDrinksPerWeek"
  | "nutsSeedsPerWeek"
  | "fattyFishPerWeek"
  | "processedMeatPerWeek"
  | "systolic"
  | "diastolic"
  | "restingHeartRate";

type NumericDrafts = Record<NumericField, string>;

const numericFields: NumericField[] = [
  "moderateMinutes",
  "vigorousMinutes",
  "strengthSessions",
  "mobilitySessions",
  "sittingHours",
  "sportYears",
  "sleepHours",
  "stressLevel",
  "fatigueLevel",
  "motivationLevel",
  "availableMinutes",
  "alcoholDrinksPerWeek",
  "fruitVegServingsPerDay",
  "legumesPerWeek",
  "sugaryDrinksPerWeek",
  "nutsSeedsPerWeek",
  "fattyFishPerWeek",
  "processedMeatPerWeek",
  "systolic",
  "diastolic",
  "restingHeartRate"
];

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const numeric = Number(value.replace(",", "."));
  return Number.isFinite(numeric) ? numeric : null;
}

function stringFromNumber(value: number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function draftsFromQuestionnaire(questionnaire: LongevityQuestionnaire): NumericDrafts {
  return {
    moderateMinutes: stringFromNumber(questionnaire.moderateMinutes),
    vigorousMinutes: stringFromNumber(questionnaire.vigorousMinutes),
    strengthSessions: stringFromNumber(questionnaire.strengthSessions),
    mobilitySessions: stringFromNumber(questionnaire.mobilitySessions),
    sittingHours: stringFromNumber(questionnaire.sittingHours),
    sportYears: stringFromNumber(questionnaire.sportYears),
    sleepHours: stringFromNumber(questionnaire.sleepHours),
    stressLevel: stringFromNumber(questionnaire.stressLevel),
    fatigueLevel: stringFromNumber(questionnaire.fatigueLevel),
    motivationLevel: stringFromNumber(questionnaire.motivationLevel),
    availableMinutes: stringFromNumber(questionnaire.availableMinutes),
    alcoholDrinksPerWeek: stringFromNumber(questionnaire.alcoholDrinksPerWeek),
    fruitVegServingsPerDay: stringFromNumber(questionnaire.fruitVegServingsPerDay),
    legumesPerWeek: stringFromNumber(questionnaire.legumesPerWeek),
    sugaryDrinksPerWeek: stringFromNumber(questionnaire.sugaryDrinksPerWeek),
    nutsSeedsPerWeek: stringFromNumber(questionnaire.nutsSeedsPerWeek),
    fattyFishPerWeek: stringFromNumber(questionnaire.fattyFishPerWeek),
    processedMeatPerWeek: stringFromNumber(questionnaire.processedMeatPerWeek),
    systolic: stringFromNumber(questionnaire.systolic),
    diastolic: stringFromNumber(questionnaire.diastolic),
    restingHeartRate: stringFromNumber(questionnaire.restingHeartRate)
  };
}

function questionnaireFromDrafts(questionnaire: LongevityQuestionnaire, drafts: NumericDrafts) {
  return normalizeLongevityQuestionnaire({
    ...questionnaire,
    ...numericFields.reduce((partial, field) => {
      return { ...partial, [field]: parseOptionalNumber(drafts[field]) };
    }, {} as Partial<LongevityQuestionnaire>)
  });
}

function sourceText() {
  return "Sources institutionnelles : ANSES pour activité physique, renforcement, assouplissement et sédentarité ; OMS pour activité physique, alimentation saine, sel, sucres et graisses ; NHS pour les repères pratiques 150 min modérées / 75 min intenses et renforcement au moins 2 jours par semaine.";
}

function NumericInput({
  label,
  field,
  value,
  onChange,
  small,
  decimal = false
}: {
  label: string;
  field: NumericField;
  value: string;
  onChange: (field: NumericField, value: string) => void;
  small?: string;
  decimal?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        inputMode={decimal ? "decimal" : "numeric"}
        type="text"
        value={value}
        onChange={(event) => onChange(field, event.currentTarget.value)}
      />
      {small ? <small>{small}</small> : null}
    </label>
  );
}

export default function LongevityPage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [questionnaire, setQuestionnaire] = useState<LongevityQuestionnaire>(defaultLongevityQuestionnaire);
  const [numberDrafts, setNumberDrafts] = useState<NumericDrafts>(draftsFromQuestionnaire(defaultLongevityQuestionnaire));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedQuestionnaire = loadLongevityQuestionnaire();
    setProfile(loadStoredProfile());
    setQuestionnaire(storedQuestionnaire);
    setNumberDrafts(draftsFromQuestionnaire(storedQuestionnaire));
  }, []);

  const effectiveQuestionnaire = useMemo(() => questionnaireFromDrafts(questionnaire, numberDrafts), [questionnaire, numberDrafts]);
  const result = useMemo(() => calculateLongevityAge(profile, effectiveQuestionnaire), [profile, effectiveQuestionnaire]);
  const deltaLabel = result.deltaYears > 0 ? `+${result.deltaYears} ans` : `${result.deltaYears} ans`;

  function updateNumberDraft(field: NumericField, value: string) {
    setSaved(false);
    setNumberDrafts((current) => ({ ...current, [field]: value }));
  }

  function updateField<K extends keyof LongevityQuestionnaire>(field: K, value: LongevityQuestionnaire[K]) {
    setSaved(false);
    setQuestionnaire((current) => normalizeLongevityQuestionnaire({ ...current, [field]: value }));
  }

  function saveQuestionnaire() {
    const normalized = questionnaireFromDrafts(questionnaire, numberDrafts);
    saveLongevityQuestionnaire(normalized);
    setQuestionnaire(normalized);
    setNumberDrafts(draftsFromQuestionnaire(normalized));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  }

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/profil">Profil</a>
          <a href="/reco">Mes priorités</a>
          <a href="/longevite">Longévité</a>
          <a href="/search">Recherche</a>
          <a href="/cumul">Cumul</a>
        </div>
      </nav>

      <section className="profileHero pageSection">
        <div className="profileIntro">
          <p className="eyebrow">Longévité</p>
          <h1>Bilan global pour estimer ton âge biologique.</h1>
          <p>
            Le calcul combine âge chronologique, morphologie, nutrition, nutriments clés, activité, sédentarité, sommeil, stress, fatigue, tabac, alcool et mesures santé optionnelles.
          </p>
          <div className="ctaRow">
            <button className="primaryCta" type="button" onClick={saveQuestionnaire}>{saved ? "Questionnaire enregistré" : "Enregistrer"}</button>
            <a className="secondaryCta" href="/reco">Voir mes priorités</a>
          </div>
        </div>

        <aside className="profilePanel">
          <p className="eyebrow">Conclusion questionnaire</p>
          <div className="metricGrid">
            <div><span>Âge biologique estimé</span><strong>{result.biologicalAgeLabel}</strong><small>questionnaire global</small></div>
            <div><span>Âge chronologique</span><strong>{result.chronologicalAge}</strong><small>ans</small></div>
            <div><span>Écart estimé</span><strong>{deltaLabel}</strong><small>vs âge chronologique</small></div>
            <div><span>Mois en bonne santé</span><strong className="metricText">{result.healthyLifeGainLabel}</strong><small>potentiel améliorable</small></div>
          </div>
        </aside>
      </section>

      <section className="pageSection profileFormPreview">
        <form className="profileEditor" onSubmit={(event) => { event.preventDefault(); saveQuestionnaire(); }}>
          <div>
            <p className="eyebrow">Questionnaire global</p>
            <h2>Tous les leviers modifiables.</h2>
            <p>Les champs vides utilisent une valeur neutre. Sur mobile, les valeurs sont validées à l’enregistrement pour éviter le blocage par les minimums et maximums.</p>
          </div>

          <div className="formGrid">
            <label className="field"><span>Sport principal</span><select value={questionnaire.sportType} onChange={(event) => updateField("sportType", event.currentTarget.value as LongevityQuestionnaire["sportType"])}>{sportTypeOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <NumericInput label="Minutes modérées / semaine" field="moderateMinutes" value={numberDrafts.moderateMinutes} onChange={updateNumberDraft} small="marche rapide, vélo doux, danse" />
            <NumericInput label="Minutes intenses / semaine" field="vigorousMinutes" value={numberDrafts.vigorousMinutes} onChange={updateNumberDraft} small="course, natation rapide, sport collectif" />
            <NumericInput label="Renforcement / semaine" field="strengthSessions" value={numberDrafts.strengthSessions} onChange={updateNumberDraft} small="séances musculaires" />
            <NumericInput label="Mobilité / semaine" field="mobilitySessions" value={numberDrafts.mobilitySessions} onChange={updateNumberDraft} small="yoga, étirements, équilibre" />
            <NumericInput label="Heures assis / jour" field="sittingHours" value={numberDrafts.sittingHours} onChange={updateNumberDraft} decimal />
            <NumericInput label="Ancienneté de pratique" field="sportYears" value={numberDrafts.sportYears} onChange={updateNumberDraft} small="années régulières" />
            <label className="field"><span>Pratique sociale</span><select value={questionnaire.socialPractice} onChange={(event) => updateField("socialPractice", event.currentTarget.value as LongevityQuestionnaire["socialPractice"])}>{socialPracticeOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label className="field"><span>Blessures</span><select value={questionnaire.injuries} onChange={(event) => updateField("injuries", event.currentTarget.value as LongevityQuestionnaire["injuries"])}>{injuryOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
          </div>

          <div>
            <p className="eyebrow">Récupération</p>
            <h2>Sommeil, stress, fatigue.</h2>
          </div>

          <div className="formGrid">
            <NumericInput label="Sommeil" field="sleepHours" value={numberDrafts.sleepHours} onChange={updateNumberDraft} small="heures / nuit" decimal />
            <label className="field"><span>Qualité sommeil</span><select value={questionnaire.sleepQuality} onChange={(event) => updateField("sleepQuality", event.currentTarget.value as LongevityQuestionnaire["sleepQuality"])}>{sleepQualityOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <NumericInput label="Stress perçu" field="stressLevel" value={numberDrafts.stressLevel} onChange={updateNumberDraft} small="0 à 10" />
            <NumericInput label="Fatigue inhabituelle" field="fatigueLevel" value={numberDrafts.fatigueLevel} onChange={updateNumberDraft} small="0 à 10" />
            <label className="field"><span>Énergie journée</span><select value={questionnaire.energyStability} onChange={(event) => updateField("energyStability", event.currentTarget.value as LongevityQuestionnaire["energyStability"])}>{energyStabilityOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label className="field"><span>Envies liées au stress</span><select value={questionnaire.emotionalEating} onChange={(event) => updateField("emotionalEating", event.currentTarget.value as LongevityQuestionnaire["emotionalEating"])}>{frequencyOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
          </div>

          <div>
            <p className="eyebrow">Nutrition longévité</p>
            <h2>Aliments, nutriments et signaux faibles.</h2>
          </div>

          <div className="formGrid">
            <NumericInput label="Fruits / légumes" field="fruitVegServingsPerDay" value={numberDrafts.fruitVegServingsPerDay} onChange={updateNumberDraft} small="portions / jour" decimal />
            <NumericInput label="Légumineuses" field="legumesPerWeek" value={numberDrafts.legumesPerWeek} onChange={updateNumberDraft} small="fois / semaine" />
            <label className="field"><span>Céréales complètes</span><select value={questionnaire.wholeGrains} onChange={(event) => updateField("wholeGrains", event.currentTarget.value as LongevityQuestionnaire["wholeGrains"])}>{frequencyOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label className="field"><span>Protéines aux repas</span><select value={questionnaire.proteinAtMeals} onChange={(event) => updateField("proteinAtMeals", event.currentTarget.value as LongevityQuestionnaire["proteinAtMeals"])}>{frequencyOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <NumericInput label="Noix / graines" field="nutsSeedsPerWeek" value={numberDrafts.nutsSeedsPerWeek} onChange={updateNumberDraft} small="fois / semaine" />
            <NumericInput label="Poisson gras" field="fattyFishPerWeek" value={numberDrafts.fattyFishPerWeek} onChange={updateNumberDraft} small="fois / semaine" />
            <label className="field"><span>Ultra-transformés</span><select value={questionnaire.ultraProcessed} onChange={(event) => updateField("ultraProcessed", event.currentTarget.value as LongevityQuestionnaire["ultraProcessed"])}>{frequencyOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <NumericInput label="Boissons sucrées" field="sugaryDrinksPerWeek" value={numberDrafts.sugaryDrinksPerWeek} onChange={updateNumberDraft} small="verres / semaine" />
            <NumericInput label="Viandes transformées" field="processedMeatPerWeek" value={numberDrafts.processedMeatPerWeek} onChange={updateNumberDraft} small="charcuterie, bacon, nuggets / semaine" />
            <label className="field"><span>Appétit diminué</span><select value={questionnaire.appetiteChange} onChange={(event) => updateField("appetiteChange", event.currentTarget.value as LongevityQuestionnaire["appetiteChange"])}>{changeStatusOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label className="field"><span>Perte de poids non voulue</span><select value={questionnaire.unintentionalWeightLoss} onChange={(event) => updateField("unintentionalWeightLoss", event.currentTarget.value as LongevityQuestionnaire["unintentionalWeightLoss"])}>{changeStatusOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
          </div>

          <div>
            <p className="eyebrow">Habitudes et motivation</p>
            <h2>Ce que tu peux réellement faire.</h2>
          </div>

          <div className="formGrid">
            <NumericInput label="Motivation cette semaine" field="motivationLevel" value={numberDrafts.motivationLevel} onChange={updateNumberDraft} small="0 à 10" />
            <NumericInput label="Temps disponible" field="availableMinutes" value={numberDrafts.availableMinutes} onChange={updateNumberDraft} small="minutes par jour" />
            <label className="field"><span>Action préférée</span><select value={questionnaire.preferredAction} onChange={(event) => updateField("preferredAction", event.currentTarget.value as LongevityQuestionnaire["preferredAction"])}>{preferredActionOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label className="field"><span>Tabac / nicotine</span><select value={questionnaire.tobacco} onChange={(event) => updateField("tobacco", event.currentTarget.value as LongevityQuestionnaire["tobacco"])}>{tobaccoOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <NumericInput label="Alcool" field="alcoholDrinksPerWeek" value={numberDrafts.alcoholDrinksPerWeek} onChange={updateNumberDraft} small="verres / semaine" />
          </div>

          <div>
            <p className="eyebrow">Mesures optionnelles</p>
            <h2>Tension et fréquence cardiaque.</h2>
          </div>

          <div className="formGrid">
            <NumericInput label="Tension systolique" field="systolic" value={numberDrafts.systolic} onChange={updateNumberDraft} small="optionnel" />
            <NumericInput label="Tension diastolique" field="diastolic" value={numberDrafts.diastolic} onChange={updateNumberDraft} small="optionnel" />
            <NumericInput label="Fréquence repos" field="restingHeartRate" value={numberDrafts.restingHeartRate} onChange={updateNumberDraft} small="bpm, optionnel" />
          </div>

          <button className="primaryCta" type="submit">{saved ? "Questionnaire enregistré" : "Sauvegarder et recalculer"}</button>
        </form>

        <div className="referencePreview">
          <p className="eyebrow">Résultat détaillé</p>
          <h2>Âge biologique estimé : {result.biologicalAgeLabel}</h2>
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
              Méthode : questionnaire + profil morphologique + activité physique + sommeil + stress/fatigue + habitudes générales + apports nutritionnels déclarés dans NutriAtlas. Cette estimation n’est pas un diagnostic médical ; elle donne une approximation comportementale de votre profil de longévité.
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
