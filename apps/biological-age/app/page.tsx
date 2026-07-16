"use client";

import { useEffect, useMemo, useState } from "react";
import {
  calculateBiologicalAge,
  defaultProfile,
  defaultQuestionnaire,
  normalizeProfile,
  normalizeQuestionnaire,
  type ChangeStatus,
  type ComponentKey,
  type EnergyStability,
  type FactorKey,
  type Frequency,
  type InjuryStatus,
  type Profile,
  type Questionnaire,
  type SleepQuality,
  type SocialPractice,
  type SportType,
  type TobaccoStatus
} from "@/lib/biological-age";
import { languageOptions, translate, type Language } from "@/lib/i18n";

const STORAGE_KEY = "biological-age-assessment-v1";
const LANGUAGE_KEY = "biological-age-language-v1";

type Option = { value: string; key: string };

const sportOptions: Option[] = [
  { value: "none", key: "sportNone" },
  { value: "walking", key: "sportWalking" },
  { value: "running", key: "sportRunning" },
  { value: "cycling", key: "sportCycling" },
  { value: "swimming", key: "sportSwimming" },
  { value: "racket", key: "sportRacket" },
  { value: "team", key: "sportTeam" },
  { value: "strength", key: "sportStrength" },
  { value: "fitness", key: "sportFitness" },
  { value: "yoga", key: "sportYoga" },
  { value: "other", key: "sportOther" }
];

const socialOptions: Option[] = [
  { value: "solo", key: "socialSolo" },
  { value: "pair", key: "socialPair" },
  { value: "group", key: "socialGroup" },
  { value: "club", key: "socialClub" }
];

const injuryOptions: Option[] = [
  { value: "none", key: "injuryNone" },
  { value: "light", key: "injuryLight" },
  { value: "frequent", key: "injuryFrequent" },
  { value: "limited", key: "injuryLimited" }
];

const sleepOptions: Option[] = [
  { value: "good", key: "sleepGood" },
  { value: "average", key: "sleepAverage" },
  { value: "poor", key: "sleepPoor" }
];

const tobaccoOptions: Option[] = [
  { value: "never", key: "tobaccoNever" },
  { value: "former", key: "tobaccoFormer" },
  { value: "nicotine", key: "tobaccoNicotine" },
  { value: "current", key: "tobaccoCurrent" }
];

const frequencyOptions: Option[] = [
  { value: "rare", key: "frequencyRare" },
  { value: "some", key: "frequencySome" },
  { value: "frequent", key: "frequencyFrequent" },
  { value: "daily", key: "frequencyDaily" }
];

const energyOptions: Option[] = [
  { value: "stable", key: "energyStable" },
  { value: "variable", key: "energyVariable" },
  { value: "crash", key: "energyCrash" },
  { value: "unknown", key: "energyUnknown" }
];

const changeOptions: Option[] = [
  { value: "none", key: "changeNone" },
  { value: "slight", key: "changeSlight" },
  { value: "clear", key: "changeClear" },
  { value: "unknown", key: "changeUnknown" }
];

const componentTranslation: Record<ComponentKey, string> = {
  nutrition: "componentNutrition",
  activity: "componentActivity",
  sedentary: "componentSedentary",
  sleep: "componentSleep",
  stressRecovery: "componentStressRecovery",
  tobacco: "componentTobacco",
  alcohol: "componentAlcohol",
  morphology: "componentMorphology",
  vitals: "componentVitals"
};

const factorTranslation: Record<FactorKey, string> = {
  regularActivity: "factorRegularActivity",
  protectiveNutrition: "factorProtectiveNutrition",
  lowTobaccoExposure: "factorLowTobaccoExposure",
  highSedentaryTime: "factorHighSedentaryTime",
  tobaccoOrNicotine: "factorTobaccoOrNicotine",
  poorSleep: "factorPoorSleep",
  frequentUltraProcessed: "factorFrequentUltraProcessed",
  highAlcohol: "factorHighAlcohol",
  highFatigue: "factorHighFatigue",
  intenseStress: "factorIntenseStress",
  appetiteOrWeightChange: "factorAppetiteOrWeightChange"
};

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const number = Number(value.replace(",", "."));
  return Number.isFinite(number) ? number : null;
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  decimal = false
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  suffix?: string;
  decimal?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="inputWithSuffix">
        <input
          inputMode={decimal ? "decimal" : "numeric"}
          type="text"
          value={value ?? ""}
          onChange={(event) => onChange(parseNumber(event.currentTarget.value))}
        />
        {suffix ? <small>{suffix}</small> : null}
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  language,
  onChange
}: {
  label: string;
  value: string;
  options: Option[];
  language: Language;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.currentTarget.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {translate(language, option.key)}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function HomePage() {
  const [language, setLanguage] = useState<Language>("fr");
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [questionnaire, setQuestionnaire] = useState<Questionnaire>(defaultQuestionnaire);
  const [saved, setSaved] = useState(false);

  const t = (key: string) => translate(language, key);

  useEffect(() => {
    try {
      const storedLanguage = window.localStorage.getItem(LANGUAGE_KEY);
      if (storedLanguage === "fr" || storedLanguage === "en") setLanguage(storedLanguage);
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { profile?: Partial<Profile>; questionnaire?: Partial<Questionnaire> };
        setProfile(normalizeProfile(parsed.profile));
        setQuestionnaire(normalizeQuestionnaire(parsed.questionnaire));
      }
    } catch {
      setProfile(defaultProfile);
      setQuestionnaire(defaultQuestionnaire);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  const result = useMemo(() => calculateBiologicalAge(profile, questionnaire), [profile, questionnaire]);

  function updateProfile<K extends keyof Profile>(field: K, value: Profile[K]) {
    setSaved(false);
    setProfile((current) => normalizeProfile({ ...current, [field]: value }));
  }

  function updateQuestionnaire<K extends keyof Questionnaire>(field: K, value: Questionnaire[K]) {
    setSaved(false);
    setQuestionnaire((current) => normalizeQuestionnaire({ ...current, [field]: value }));
  }

  function saveAssessment() {
    const normalizedProfile = normalizeProfile(profile);
    const normalizedQuestionnaire = normalizeQuestionnaire(questionnaire);
    setProfile(normalizedProfile);
    setQuestionnaire(normalizedQuestionnaire);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ profile: normalizedProfile, questionnaire: normalizedQuestionnaire }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  function resetAssessment() {
    setProfile(defaultProfile);
    setQuestionnaire(defaultQuestionnaire);
    setSaved(false);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  function formatAge(years: number, months: number) {
    return `${years} ${t("years")}, ${months} ${t("months")}`;
  }

  function formatDelta(months: number) {
    if (months === 0) return t("sameAge");
    const absolute = Math.abs(months);
    const years = Math.floor(absolute / 12);
    const remainingMonths = absolute % 12;
    const parts = [years ? `${years} ${t("years")}` : "", remainingMonths ? `${remainingMonths} ${t("months")}` : ""].filter(Boolean);
    return `${parts.join(" ")} ${months < 0 ? t("younger") : t("older")}`;
  }

  const confidenceLabel = t(`confidence${result.confidence[0].toUpperCase()}${result.confidence.slice(1)}`);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top">{t("appName")}</a>
        <label className="languagePicker">
          <span>{t("language")}</span>
          <select value={language} onChange={(event) => setLanguage(event.currentTarget.value as Language)}>
            {languageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h1>{t("heroTitle")}</h1>
          <p className="heroText">{t("heroText")}</p>
          <div className="actions">
            <button className="primary" type="button" onClick={saveAssessment}>{saved ? t("saved") : t("save")}</button>
            <button className="secondary" type="button" onClick={resetAssessment}>{t("reset")}</button>
          </div>
        </div>

        <aside className="resultCard" aria-live="polite">
          <p className="eyebrow">{t("result")}</p>
          <div className="biologicalAge">
            <span>{t("biologicalAge")}</span>
            <strong>{formatAge(result.biologicalAgeYears, result.biologicalAgeMonths)}</strong>
          </div>
          <div className="metricGrid">
            <article><span>{t("chronologicalAge")}</span><strong>{result.chronologicalAge} {t("years")}</strong></article>
            <article><span>{t("difference")}</span><strong>{formatDelta(result.deltaMonths)}</strong></article>
            <article><span>{t("score")}</span><strong>{result.score} / 100</strong></article>
            <article><span>{t("confidence")}</span><strong>{confidenceLabel}</strong></article>
          </div>
        </aside>
      </section>

      <section className="assessmentLayout">
        <form className="assessmentForm" onSubmit={(event) => { event.preventDefault(); saveAssessment(); }}>
          <fieldset>
            <legend>{t("profileTitle")}</legend>
            <p>{t("profileText")}</p>
            <div className="formGrid">
              <NumberField label={t("age")} value={profile.age} onChange={(value) => updateProfile("age", value ?? profile.age)} suffix={t("years")} />
              <NumberField label={t("height")} value={profile.heightCm} onChange={(value) => updateProfile("heightCm", value ?? profile.heightCm)} suffix="cm" />
              <NumberField label={t("weight")} value={profile.weightKg} onChange={(value) => updateProfile("weightKg", value ?? profile.weightKg)} suffix="kg" decimal />
              <NumberField label={t("waist")} value={profile.waistCm} onChange={(value) => updateProfile("waistCm", value)} suffix={`cm · ${t("optional")}`} decimal />
            </div>
          </fieldset>

          <fieldset>
            <legend>{t("movementTitle")}</legend>
            <div className="formGrid">
              <SelectField label={t("sportType")} value={questionnaire.sportType} options={sportOptions} language={language} onChange={(value) => updateQuestionnaire("sportType", value as SportType)} />
              <NumberField label={t("moderateMinutes")} value={questionnaire.moderateMinutes} onChange={(value) => updateQuestionnaire("moderateMinutes", value)} />
              <NumberField label={t("vigorousMinutes")} value={questionnaire.vigorousMinutes} onChange={(value) => updateQuestionnaire("vigorousMinutes", value)} />
              <NumberField label={t("strengthSessions")} value={questionnaire.strengthSessions} onChange={(value) => updateQuestionnaire("strengthSessions", value)} />
              <NumberField label={t("mobilitySessions")} value={questionnaire.mobilitySessions} onChange={(value) => updateQuestionnaire("mobilitySessions", value)} />
              <NumberField label={t("sittingHours")} value={questionnaire.sittingHours} onChange={(value) => updateQuestionnaire("sittingHours", value)} decimal />
              <NumberField label={t("sportYears")} value={questionnaire.sportYears} onChange={(value) => updateQuestionnaire("sportYears", value)} />
              <SelectField label={t("socialPractice")} value={questionnaire.socialPractice} options={socialOptions} language={language} onChange={(value) => updateQuestionnaire("socialPractice", value as SocialPractice)} />
              <SelectField label={t("injuries")} value={questionnaire.injuries} options={injuryOptions} language={language} onChange={(value) => updateQuestionnaire("injuries", value as InjuryStatus)} />
            </div>
          </fieldset>

          <fieldset>
            <legend>{t("recoveryTitle")}</legend>
            <div className="formGrid">
              <NumberField label={t("sleepHours")} value={questionnaire.sleepHours} onChange={(value) => updateQuestionnaire("sleepHours", value)} decimal />
              <SelectField label={t("sleepQuality")} value={questionnaire.sleepQuality} options={sleepOptions} language={language} onChange={(value) => updateQuestionnaire("sleepQuality", value as SleepQuality)} />
              <NumberField label={t("stressLevel")} value={questionnaire.stressLevel} onChange={(value) => updateQuestionnaire("stressLevel", value)} />
              <NumberField label={t("fatigueLevel")} value={questionnaire.fatigueLevel} onChange={(value) => updateQuestionnaire("fatigueLevel", value)} />
              <SelectField label={t("energyStability")} value={questionnaire.energyStability} options={energyOptions} language={language} onChange={(value) => updateQuestionnaire("energyStability", value as EnergyStability)} />
              <SelectField label={t("emotionalEating")} value={questionnaire.emotionalEating} options={frequencyOptions} language={language} onChange={(value) => updateQuestionnaire("emotionalEating", value as Frequency)} />
            </div>
          </fieldset>

          <fieldset>
            <legend>{t("nutritionTitle")}</legend>
            <div className="formGrid">
              <NumberField label={t("fruitVegServingsPerDay")} value={questionnaire.fruitVegServingsPerDay} onChange={(value) => updateQuestionnaire("fruitVegServingsPerDay", value)} decimal />
              <NumberField label={t("legumesPerWeek")} value={questionnaire.legumesPerWeek} onChange={(value) => updateQuestionnaire("legumesPerWeek", value)} />
              <SelectField label={t("wholeGrains")} value={questionnaire.wholeGrains} options={frequencyOptions} language={language} onChange={(value) => updateQuestionnaire("wholeGrains", value as Frequency)} />
              <SelectField label={t("ultraProcessed")} value={questionnaire.ultraProcessed} options={frequencyOptions} language={language} onChange={(value) => updateQuestionnaire("ultraProcessed", value as Frequency)} />
              <NumberField label={t("sugaryDrinksPerWeek")} value={questionnaire.sugaryDrinksPerWeek} onChange={(value) => updateQuestionnaire("sugaryDrinksPerWeek", value)} />
              <SelectField label={t("proteinAtMeals")} value={questionnaire.proteinAtMeals} options={frequencyOptions} language={language} onChange={(value) => updateQuestionnaire("proteinAtMeals", value as Frequency)} />
              <NumberField label={t("nutsSeedsPerWeek")} value={questionnaire.nutsSeedsPerWeek} onChange={(value) => updateQuestionnaire("nutsSeedsPerWeek", value)} />
              <NumberField label={t("fattyFishPerWeek")} value={questionnaire.fattyFishPerWeek} onChange={(value) => updateQuestionnaire("fattyFishPerWeek", value)} />
              <NumberField label={t("processedMeatPerWeek")} value={questionnaire.processedMeatPerWeek} onChange={(value) => updateQuestionnaire("processedMeatPerWeek", value)} />
              <SelectField label={t("appetiteChange")} value={questionnaire.appetiteChange} options={changeOptions} language={language} onChange={(value) => updateQuestionnaire("appetiteChange", value as ChangeStatus)} />
              <SelectField label={t("unintentionalWeightLoss")} value={questionnaire.unintentionalWeightLoss} options={changeOptions} language={language} onChange={(value) => updateQuestionnaire("unintentionalWeightLoss", value as ChangeStatus)} />
            </div>
          </fieldset>

          <fieldset>
            <legend>{t("habitsTitle")}</legend>
            <div className="formGrid">
              <SelectField label={t("tobacco")} value={questionnaire.tobacco} options={tobaccoOptions} language={language} onChange={(value) => updateQuestionnaire("tobacco", value as TobaccoStatus)} />
              <NumberField label={t("alcoholDrinksPerWeek")} value={questionnaire.alcoholDrinksPerWeek} onChange={(value) => updateQuestionnaire("alcoholDrinksPerWeek", value)} />
            </div>
          </fieldset>

          <fieldset>
            <legend>{t("vitalsTitle")}</legend>
            <div className="formGrid">
              <NumberField label={t("systolic")} value={questionnaire.systolic} onChange={(value) => updateQuestionnaire("systolic", value)} suffix="mmHg" />
              <NumberField label={t("diastolic")} value={questionnaire.diastolic} onChange={(value) => updateQuestionnaire("diastolic", value)} suffix="mmHg" />
              <NumberField label={t("restingHeartRate")} value={questionnaire.restingHeartRate} onChange={(value) => updateQuestionnaire("restingHeartRate", value)} suffix="bpm" />
            </div>
          </fieldset>

          <button className="primary submitButton" type="submit">{saved ? t("saved") : t("save")}</button>
        </form>

        <aside className="detailsColumn">
          <section className="detailCard stickyCard">
            <p className="eyebrow">{t("breakdownTitle")}</p>
            <div className="scoreList">
              {result.components.map((component) => {
                const percentage = Math.round((component.score / component.max) * 100);
                return (
                  <article key={component.key}>
                    <div><span>{t(componentTranslation[component.key])}</span><strong>{component.score} / {component.max}</strong></div>
                    <progress value={percentage} max="100" aria-label={`${t(componentTranslation[component.key])}: ${percentage}%`} />
                  </article>
                );
              })}
            </div>
          </section>

          <section className="detailCard">
            <h2>{t("favorableTitle")}</h2>
            <ul>{result.favorable.length ? result.favorable.map((factor) => <li key={factor}>{t(factorTranslation[factor])}</li>) : <li>{t("noneReported")}</li>}</ul>
          </section>

          <section className="detailCard warningCard">
            <h2>{t("watchTitle")}</h2>
            <ul>{result.unfavorable.length ? result.unfavorable.map((factor) => <li key={factor}>{t(factorTranslation[factor])}</li>) : <li>{t("noneReported")}</li>}</ul>
          </section>

          <section className="detailCard methodCard">
            <h2>{t("methodTitle")}</h2>
            <p>{t("methodText")}</p>
          </section>
        </aside>
      </section>
    </main>
  );
}
