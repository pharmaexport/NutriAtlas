import { computeBmi, normalizeProfile, type UserProfile } from "./nutrition-profile";

export const LONGEVITY_STORAGE_KEY = "nutriatlas-longevity-v1";

export type SportType = "none" | "walking" | "running" | "cycling" | "swimming" | "racket" | "team" | "strength" | "fitness" | "yoga" | "other";
export type SocialPractice = "solo" | "pair" | "group" | "club";
export type InjuryStatus = "none" | "light" | "frequent" | "limited";
export type SleepQuality = "good" | "average" | "poor";
export type TobaccoStatus = "never" | "former" | "nicotine" | "current";
export type Frequency = "rare" | "some" | "frequent" | "daily";

export type LongevityQuestionnaire = {
  sportType: SportType;
  moderateMinutes: number | null;
  vigorousMinutes: number | null;
  strengthSessions: number | null;
  mobilitySessions: number | null;
  sittingHours: number | null;
  sportYears: number | null;
  socialPractice: SocialPractice;
  injuries: InjuryStatus;
  sleepHours: number | null;
  sleepQuality: SleepQuality;
  stressLevel: number | null;
  tobacco: TobaccoStatus;
  alcoholDrinksPerWeek: number | null;
  fruitVegServingsPerDay: number | null;
  legumesPerWeek: number | null;
  wholeGrains: Frequency;
  ultraProcessed: Frequency;
  sugaryDrinksPerWeek: number | null;
  systolic: number | null;
  diastolic: number | null;
  restingHeartRate: number | null;
};

export type LongevityComponent = {
  key: string;
  label: string;
  score: number;
  max: number;
};

export type LongevityResult = {
  chronologicalAge: number;
  biologicalAge: number;
  deltaYears: number;
  score: number;
  confidence: "faible" | "moyenne" | "bonne";
  components: LongevityComponent[];
  favorable: string[];
  unfavorable: string[];
};

export const sportTypeOptions: Array<{ value: SportType; label: string }> = [
  { value: "none", label: "Aucun sport structuré" },
  { value: "walking", label: "Marche rapide / randonnée" },
  { value: "running", label: "Course à pied" },
  { value: "cycling", label: "Vélo" },
  { value: "swimming", label: "Natation" },
  { value: "racket", label: "Tennis / padel / badminton / squash" },
  { value: "team", label: "Sport collectif" },
  { value: "strength", label: "Musculation dominante" },
  { value: "fitness", label: "Fitness / danse / aérobic" },
  { value: "yoga", label: "Yoga / pilates / mobilité" },
  { value: "other", label: "Autre" }
];

export const socialPracticeOptions: Array<{ value: SocialPractice; label: string }> = [
  { value: "solo", label: "Plutôt seul" },
  { value: "pair", label: "À deux" },
  { value: "group", label: "En groupe" },
  { value: "club", label: "Club / compétition" }
];

export const injuryOptions: Array<{ value: InjuryStatus; label: string }> = [
  { value: "none", label: "Aucune gêne" },
  { value: "light", label: "Douleurs légères" },
  { value: "frequent", label: "Blessures fréquentes" },
  { value: "limited", label: "Pratique limitée" }
];

export const sleepQualityOptions: Array<{ value: SleepQuality; label: string }> = [
  { value: "good", label: "Bonne" },
  { value: "average", label: "Moyenne" },
  { value: "poor", label: "Mauvaise" }
];

export const tobaccoOptions: Array<{ value: TobaccoStatus; label: string }> = [
  { value: "never", label: "Jamais" },
  { value: "former", label: "Ancien fumeur" },
  { value: "nicotine", label: "Vape / nicotine" },
  { value: "current", label: "Fumeur actuel" }
];

export const frequencyOptions: Array<{ value: Frequency; label: string }> = [
  { value: "rare", label: "Rarement" },
  { value: "some", label: "Parfois" },
  { value: "frequent", label: "Souvent" },
  { value: "daily", label: "Tous les jours" }
];

export const defaultLongevityQuestionnaire: LongevityQuestionnaire = {
  sportType: "walking",
  moderateMinutes: 150,
  vigorousMinutes: 0,
  strengthSessions: 1,
  mobilitySessions: 1,
  sittingHours: 8,
  sportYears: 1,
  socialPractice: "solo",
  injuries: "none",
  sleepHours: 7,
  sleepQuality: "average",
  stressLevel: 5,
  tobacco: "never",
  alcoholDrinksPerWeek: 0,
  fruitVegServingsPerDay: 4,
  legumesPerWeek: 2,
  wholeGrains: "some",
  ultraProcessed: "some",
  sugaryDrinksPerWeek: 0,
  systolic: null,
  diastolic: null,
  restingHeartRate: null
};

const sportValues: readonly SportType[] = ["none", "walking", "running", "cycling", "swimming", "racket", "team", "strength", "fitness", "yoga", "other"];
const socialValues: readonly SocialPractice[] = ["solo", "pair", "group", "club"];
const injuryValues: readonly InjuryStatus[] = ["none", "light", "frequent", "limited"];
const sleepValues: readonly SleepQuality[] = ["good", "average", "poor"];
const tobaccoValues: readonly TobaccoStatus[] = ["never", "former", "nicotine", "current"];
const frequencyValues: readonly Frequency[] = ["rare", "some", "frequent", "daily"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function numberOrNull(value: unknown, min: number, max: number, decimals = 0) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  const factor = Math.pow(10, decimals);
  return Math.round(clamp(numeric, min, max) * factor) / factor;
}

function unrestrictedNumberOrNull(value: unknown, decimals = 0) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  const factor = Math.pow(10, decimals);
  return Math.round(numeric * factor) / factor;
}

function optionValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function normalizeLongevityQuestionnaire(input?: Partial<LongevityQuestionnaire> | null): LongevityQuestionnaire {
  return {
    sportType: optionValue(input?.sportType, sportValues, defaultLongevityQuestionnaire.sportType),
    moderateMinutes: numberOrNull(input?.moderateMinutes, 0, 2000),
    vigorousMinutes: numberOrNull(input?.vigorousMinutes, 0, 1200),
    strengthSessions: numberOrNull(input?.strengthSessions, 0, 14),
    mobilitySessions: numberOrNull(input?.mobilitySessions, 0, 14),
    sittingHours: numberOrNull(input?.sittingHours, 0, 18, 1),
    sportYears: numberOrNull(input?.sportYears, 0, 80),
    socialPractice: optionValue(input?.socialPractice, socialValues, defaultLongevityQuestionnaire.socialPractice),
    injuries: optionValue(input?.injuries, injuryValues, defaultLongevityQuestionnaire.injuries),
    sleepHours: numberOrNull(input?.sleepHours, 3, 12, 1),
    sleepQuality: optionValue(input?.sleepQuality, sleepValues, defaultLongevityQuestionnaire.sleepQuality),
    stressLevel: numberOrNull(input?.stressLevel, 0, 10),
    tobacco: optionValue(input?.tobacco, tobaccoValues, defaultLongevityQuestionnaire.tobacco),
    alcoholDrinksPerWeek: numberOrNull(input?.alcoholDrinksPerWeek, 0, 80),
    fruitVegServingsPerDay: numberOrNull(input?.fruitVegServingsPerDay, 0, 12, 1),
    legumesPerWeek: numberOrNull(input?.legumesPerWeek, 0, 21),
    wholeGrains: optionValue(input?.wholeGrains, frequencyValues, defaultLongevityQuestionnaire.wholeGrains),
    ultraProcessed: optionValue(input?.ultraProcessed, frequencyValues, defaultLongevityQuestionnaire.ultraProcessed),
    sugaryDrinksPerWeek: numberOrNull(input?.sugaryDrinksPerWeek, 0, 50),
    systolic: numberOrNull(input?.systolic, 70, 240),
    diastolic: numberOrNull(input?.diastolic, 40, 140),
    restingHeartRate: unrestrictedNumberOrNull(input?.restingHeartRate)
  };
}

export function loadLongevityQuestionnaire(): LongevityQuestionnaire {
  if (typeof window === "undefined") return defaultLongevityQuestionnaire;
  try {
    const raw = window.localStorage.getItem(LONGEVITY_STORAGE_KEY);
    return raw ? normalizeLongevityQuestionnaire(JSON.parse(raw) as Partial<LongevityQuestionnaire>) : defaultLongevityQuestionnaire;
  } catch {
    return defaultLongevityQuestionnaire;
  }
}

export function saveLongevityQuestionnaire(questionnaire: LongevityQuestionnaire) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LONGEVITY_STORAGE_KEY, JSON.stringify(normalizeLongevityQuestionnaire(questionnaire)));
}

function scoreActivity(q: LongevityQuestionnaire) {
  const equivalent = (q.moderateMinutes || 0) + (q.vigorousMinutes || 0) * 2;
  let score = 0;
  if (equivalent >= 300) score += 9;
  else if (equivalent >= 150) score += 8;
  else if (equivalent >= 75) score += 5;
  else if (equivalent > 0) score += 2;

  score += clamp((q.strengthSessions || 0) * 2, 0, 4);
  score += clamp(q.mobilitySessions || 0, 0, 2);

  const sportBonus: Record<SportType, number> = { none: 0, walking: 1, running: 1.5, cycling: 1.5, swimming: 2, racket: 3, team: 2.5, strength: 1.5, fitness: 2, yoga: 1, other: 1 };
  score += sportBonus[q.sportType];
  if (q.socialPractice === "group" || q.socialPractice === "club") score += 1;
  if ((q.sportYears || 0) >= 5) score += 1;
  if (q.injuries === "frequent") score -= 2;
  if (q.injuries === "limited") score -= 4;

  return clamp(score, 0, 20);
}

function scoreSedentary(q: LongevityQuestionnaire) {
  const hours = q.sittingHours ?? 8;
  if (hours <= 5) return 10;
  if (hours <= 8) return 7;
  if (hours <= 10) return 4;
  return 1;
}

function scoreSleep(q: LongevityQuestionnaire) {
  const hours = q.sleepHours ?? 7;
  let score = hours >= 7 && hours <= 9 ? 7 : hours >= 6 && hours < 10 ? 5 : 2;
  if (q.sleepQuality === "good") score += 3;
  if (q.sleepQuality === "average") score += 1;
  return clamp(score, 0, 10);
}

function scoreTobacco(q: LongevityQuestionnaire) {
  if (q.tobacco === "never") return 12;
  if (q.tobacco === "former") return 9;
  if (q.tobacco === "nicotine") return 5;
  return 0;
}

function scoreAlcohol(q: LongevityQuestionnaire) {
  const drinks = q.alcoholDrinksPerWeek ?? 0;
  if (drinks === 0) return 6;
  if (drinks <= 7) return 5;
  if (drinks <= 14) return 3;
  return 1;
}

function scoreMorphology(profile: UserProfile) {
  const normalized = normalizeProfile(profile);
  const bmi = computeBmi(normalized.weightKg, normalized.heightCm);
  let score = bmi >= 18.5 && bmi < 25 ? 7 : bmi >= 25 && bmi < 30 ? 4 : 2;
  if (normalized.waistCm) {
    const waistToHeight = normalized.waistCm / normalized.heightCm;
    if (waistToHeight < 0.5) score += 3;
    else if (waistToHeight < 0.6) score += 1;
  } else {
    score += 1;
  }
  return clamp(score, 0, 10);
}

function scoreNutrition(q: LongevityQuestionnaire) {
  let score = 0;
  const fruitVeg = q.fruitVegServingsPerDay ?? 0;
  if (fruitVeg >= 5) score += 7;
  else if (fruitVeg >= 3) score += 5;
  else if (fruitVeg >= 1) score += 2;

  if ((q.legumesPerWeek || 0) >= 3) score += 4;
  else if ((q.legumesPerWeek || 0) >= 1) score += 2;

  if (q.wholeGrains === "daily") score += 4;
  else if (q.wholeGrains === "frequent") score += 3;
  else if (q.wholeGrains === "some") score += 1;

  if (q.ultraProcessed === "rare") score += 6;
  else if (q.ultraProcessed === "some") score += 4;
  else if (q.ultraProcessed === "frequent") score += 1;

  if ((q.sugaryDrinksPerWeek || 0) === 0) score += 4;
  else if ((q.sugaryDrinksPerWeek || 0) <= 2) score += 2;

  return clamp(score, 0, 25);
}

function scoreVitals(q: LongevityQuestionnaire) {
  let score = 0;
  if (q.systolic && q.diastolic) {
    if (q.systolic < 120 && q.diastolic < 80) score += 4;
    else if (q.systolic < 130 && q.diastolic < 85) score += 3;
    else if (q.systolic < 140 && q.diastolic < 90) score += 2;
  } else {
    score += 2;
  }

  if (q.restingHeartRate) {
    if (q.restingHeartRate >= 50 && q.restingHeartRate <= 70) score += 3;
    else if (q.restingHeartRate < 85) score += 2;
    else score += 1;
  } else {
    score += 1;
  }
  return clamp(score, 0, 7);
}

function scoreStress(q: LongevityQuestionnaire) {
  const stress = q.stressLevel ?? 5;
  if (stress <= 3) return 6;
  if (stress <= 6) return 4;
  if (stress <= 8) return 2;
  return 0;
}

function deltaFromScore(score: number) {
  if (score >= 90) return -6;
  if (score >= 80) return -4;
  if (score >= 70) return -2;
  if (score >= 60) return 0;
  if (score >= 50) return 2;
  if (score >= 40) return 4;
  return 7;
}

function confidence(q: LongevityQuestionnaire) {
  const optionalFilled = [q.systolic, q.diastolic, q.restingHeartRate].filter(Boolean).length;
  const activityFilled = q.moderateMinutes !== null || q.vigorousMinutes !== null;
  if (optionalFilled >= 3 && activityFilled) return "bonne";
  if (activityFilled) return "moyenne";
  return "faible";
}

export function calculateLongevityAge(profileInput: Partial<UserProfile>, questionnaireInput?: Partial<LongevityQuestionnaire> | null): LongevityResult {
  const profile = normalizeProfile(profileInput);
  const q = normalizeLongevityQuestionnaire(questionnaireInput || defaultLongevityQuestionnaire);
  const components: LongevityComponent[] = [
    { key: "nutrition", label: "Nutrition", score: scoreNutrition(q), max: 25 },
    { key: "activity", label: "Activité physique", score: scoreActivity(q), max: 20 },
    { key: "sedentary", label: "Sédentarité", score: scoreSedentary(q), max: 10 },
    { key: "sleep", label: "Sommeil", score: scoreSleep(q), max: 10 },
    { key: "tobacco", label: "Tabac / nicotine", score: scoreTobacco(q), max: 12 },
    { key: "alcohol", label: "Alcool", score: scoreAlcohol(q), max: 6 },
    { key: "morphology", label: "Morphologie", score: scoreMorphology(profile), max: 10 },
    { key: "vitals", label: "Mesures santé", score: scoreVitals(q), max: 7 }
  ];
  const baseScore = components.reduce((sum, item) => sum + item.score, 0);
  const score = clamp(Math.round(baseScore + scoreStress(q) * 0.6), 0, 100);
  const deltaYears = deltaFromScore(score);

  const favorable: string[] = [];
  const unfavorable: string[] = [];
  if (scoreActivity(q) >= 15) favorable.push("activité physique régulière");
  if (scoreNutrition(q) >= 18) favorable.push("habitudes alimentaires protectrices");
  if (q.tobacco === "never" || q.tobacco === "former") favorable.push("tabac/nicotine peu défavorable");
  if ((q.sittingHours || 0) > 8) unfavorable.push("sédentarité élevée");
  if (q.tobacco === "current" || q.tobacco === "nicotine") unfavorable.push("tabac ou nicotine");
  if ((q.sleepHours || 7) < 6 || q.sleepQuality === "poor") unfavorable.push("sommeil insuffisant ou de mauvaise qualité");
  if (q.ultraProcessed === "daily" || q.ultraProcessed === "frequent") unfavorable.push("aliments ultra-transformés fréquents");
  if ((q.alcoholDrinksPerWeek || 0) > 14) unfavorable.push("alcool élevé");

  return {
    chronologicalAge: profile.age,
    biologicalAge: clamp(profile.age + deltaYears, 18, 100),
    deltaYears,
    score,
    confidence: confidence(q),
    components,
    favorable,
    unfavorable
  };
}
