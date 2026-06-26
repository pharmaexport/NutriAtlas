"use client";

import { useEffect, useMemo, useState } from "react";
import {
  activeEnergyTarget,
  getReferenceForNutrientWithEnergy,
  loadCustomEnergyTarget,
  saveCustomEnergyTarget
} from "../../lib/energy-reference";
import {
  activityLevels,
  defaultProfile,
  formatAmount,
  keyReferenceSummary,
  loadStoredProfile,
  macroDistribution,
  normalizeProfile,
  objectiveOptions,
  referenceModes,
  saveStoredProfile,
  summarizeProfile,
  type ActivityLevel,
  type Objective,
  type PhysiologicalStatus,
  type ProfileSex,
  type ReferenceMode,
  type UserProfile
} from "../../lib/nutrition-profile";

const physiologicalOptions: Array<{ value: PhysiologicalStatus; label: string }> = [
  { value: "none", label: "Aucune" },
  { value: "pregnant", label: "Grossesse" },
  { value: "lactating", label: "Allaitement" }
];

type RequiredNumberField = "age" | "heightCm" | "weightKg";
type OptionalNumberField = "targetWeightKg" | "waistCm" | "activityMinutesPerWeek" | "proteinFactor" | "carbPercent" | "fatPercent" | "mealsPerDay";
type RequiredNumberDrafts = Record<RequiredNumberField, string>;

function draftsFromProfile(profile: UserProfile): RequiredNumberDrafts {
  return {
    age: String(profile.age),
    heightCm: String(profile.heightCm),
    weightKg: String(profile.weightKg)
  };
}

function normalizeCustomEnergy(value: string) {
  if (!value.trim()) return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.min(6000, Math.max(900, Math.round(numeric)));
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function draftValue(current: number, draft: string) {
  const numeric = Number(draft);
  return draft.trim() && Number.isFinite(numeric) ? numeric : current;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [numberDrafts, setNumberDrafts] = useState<RequiredNumberDrafts>(draftsFromProfile(defaultProfile));
  const [customEnergyKcal, setCustomEnergyKcal] = useState<number | null>(null);
  const [customEnergyDraft, setCustomEnergyDraft] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedProfile = loadStoredProfile();
    const storedCustomEnergy = loadCustomEnergyTarget();
    setProfile(storedProfile);
    setNumberDrafts(draftsFromProfile(storedProfile));
    setCustomEnergyKcal(storedCustomEnergy);
    setCustomEnergyDraft(storedCustomEnergy ? String(storedCustomEnergy) : "");
  }, []);

  const summary = useMemo(() => summarizeProfile(profile), [profile]);
  const activeCalories = useMemo(() => activeEnergyTarget(profile, customEnergyKcal), [profile, customEnergyKcal]);
  const activeMacro = useMemo(() => macroDistribution(profile, activeCalories), [profile, activeCalories]);
  const referenceSummary = useMemo(() => {
    return keyReferenceSummary(profile).map((item) => ({
      ...item,
      reference: getReferenceForNutrientWithEnergy(item.key, profile, customEnergyKcal)
    }));
  }, [profile, customEnergyKcal]);

  function updateNumber(field: RequiredNumberField, value: string) {
    setSaved(false);
    setNumberDrafts((current) => ({ ...current, [field]: value }));
    if (!value.trim()) return;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return;
    setProfile((current) => normalizeProfile({ ...current, [field]: numeric }));
  }

  function finishNumber(field: RequiredNumberField, value: string) {
    const numeric = Number(value);
    if (!value.trim() || !Number.isFinite(numeric)) {
      setNumberDrafts((current) => ({ ...current, [field]: String(profile[field]) }));
      return;
    }
    const normalized = normalizeProfile({ ...profile, [field]: numeric });
    setProfile(normalized);
    setNumberDrafts((current) => ({ ...current, [field]: String(normalized[field]) }));
  }

  function updateOptionalNumber(field: OptionalNumberField, value: string) {
    setSaved(false);
    setProfile((current) => ({ ...current, [field]: parseOptionalNumber(value) }));
  }

  function updateCustomEnergy(value: string) {
    setSaved(false);
    setCustomEnergyDraft(value);
    if (!value.trim()) {
      setCustomEnergyKcal(null);
      return;
    }
    const next = normalizeCustomEnergy(value);
    if (next !== null) setCustomEnergyKcal(next);
  }

  function finishCustomEnergy(value: string) {
    const next = normalizeCustomEnergy(value);
    setCustomEnergyKcal(next);
    setCustomEnergyDraft(next ? String(next) : "");
  }

  function updateSex(value: ProfileSex) {
    setSaved(false);
    setProfile((current) => normalizeProfile({ ...current, sex: value }));
  }

  function updateActivity(value: ActivityLevel) {
    setSaved(false);
    setProfile((current) => normalizeProfile({ ...current, activityLevel: value }));
  }

  function updateObjective(value: Objective) {
    setSaved(false);
    setProfile((current) => normalizeProfile({ ...current, objective: value }));
  }

  function updatePhysiologicalStatus(value: PhysiologicalStatus) {
    setSaved(false);
    setProfile((current) => normalizeProfile({ ...current, physiologicalStatus: value }));
  }

  function updateReferenceMode(value: ReferenceMode) {
    setSaved(false);
    setProfile((current) => normalizeProfile({ ...current, referenceMode: value }));
  }

  function saveProfile() {
    const normalized = normalizeProfile({
      ...profile,
      age: draftValue(profile.age, numberDrafts.age),
      heightCm: draftValue(profile.heightCm, numberDrafts.heightCm),
      weightKg: draftValue(profile.weightKg, numberDrafts.weightKg)
    });
    const normalizedCustomEnergy = normalizeCustomEnergy(customEnergyDraft);
    saveStoredProfile(normalized);
    saveCustomEnergyTarget(normalizedCustomEnergy);
    setProfile(normalized);
    setNumberDrafts(draftsFromProfile(normalized));
    setCustomEnergyKcal(normalizedCustomEnergy);
    setCustomEnergyDraft(normalizedCustomEnergy ? String(normalizedCustomEnergy) : "");
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
          <p className="eyebrow">Profil nutritionnel</p>
          <h1>Définir les repères avant de lire les pourcentages.</h1>
          <p>
            Les cases remplies pilotent les calories, les protéines, les glucides, les lipides, les sucres, les fibres et les minéraux affichés dans les fiches aliments et le cumul journalier.
          </p>
          <div className="ctaRow">
            <button className="primaryCta" type="button" onClick={saveProfile}>{saved ? "Profil enregistré" : "Enregistrer le profil"}</button>
            <a className="secondaryCta" href="/longevite">Calcul longévité</a>
          </div>
        </div>

        <aside className="profilePanel">
          <p className="eyebrow">Résumé calculé</p>
          <div className="metricGrid">
            <div><span>IMC</span><strong>{summary.bmi.toFixed(1)}</strong><small>{summary.bmiLabel}</small></div>
            <div><span>Métabolisme</span><strong>{summary.bmr}</strong><small>kcal / jour</small></div>
            <div><span>Objectif calories</span><strong>{activeCalories}</strong><small>{customEnergyKcal ? "saisi manuellement" : "estimé depuis le profil"}</small></div>
            <div><span>Macros</span><strong className="metricText">{activeMacro.carbPercent}/{activeMacro.fatPercent}</strong><small>% glucides / lipides</small></div>
          </div>
        </aside>
      </section>

      <section className="pageSection profileFormPreview">
        <form className="profileEditor" onSubmit={(event) => { event.preventDefault(); saveProfile(); }}>
          <div>
            <p className="eyebrow">Étape 1</p>
            <h2>Mes données de base.</h2>
            <p>Âge, sexe, taille, poids et activité servent au métabolisme, à l’IMC, aux calories et aux recommandations par profil.</p>
          </div>

          <div className="formGrid">
            <label className="field"><span>Âge chronologique</span><input inputMode="numeric" type="text" value={numberDrafts.age} onChange={(event) => updateNumber("age", event.currentTarget.value)} onBlur={(event) => finishNumber("age", event.currentTarget.value)} /></label>
            <label className="field"><span>Taille</span><input inputMode="numeric" type="text" value={numberDrafts.heightCm} onChange={(event) => updateNumber("heightCm", event.currentTarget.value)} onBlur={(event) => finishNumber("heightCm", event.currentTarget.value)} /><small>cm</small></label>
            <label className="field"><span>Poids actuel</span><input inputMode="decimal" type="text" value={numberDrafts.weightKg} onChange={(event) => updateNumber("weightKg", event.currentTarget.value)} onBlur={(event) => finishNumber("weightKg", event.currentTarget.value)} /><small>kg</small></label>
            <label className="field"><span>Poids cible</span><input type="number" min="25" max="250" step="0.1" value={profile.targetWeightKg ?? ""} onChange={(event) => updateOptionalNumber("targetWeightKg", event.currentTarget.value)} /><small>vide = poids actuel</small></label>
            <label className="field"><span>Tour de taille</span><input type="number" min="45" max="180" step="0.1" value={profile.waistCm ?? ""} onChange={(event) => updateOptionalNumber("waistCm", event.currentTarget.value)} /><small>cm, utilisé longévité</small></label>
            <label className="field"><span>Sexe</span><select value={profile.sex} onChange={(event) => updateSex(event.currentTarget.value as ProfileSex)}><option value="female">Femme</option><option value="male">Homme</option></select></label>
            <label className="field"><span>Activité générale</span><select value={profile.activityLevel} onChange={(event) => updateActivity(event.currentTarget.value as ActivityLevel)}>{activityLevels.map((level) => <option value={level.value} key={level.value}>{level.label}</option>)}</select></label>
            <label className="field"><span>Minutes activité / semaine</span><input type="number" min="0" max="2000" value={profile.activityMinutesPerWeek ?? ""} onChange={(event) => updateOptionalNumber("activityMinutesPerWeek", event.currentTarget.value)} /><small>sert aux recos</small></label>
          </div>

          <div>
            <p className="eyebrow">Étape 2</p>
            <h2>Objectifs nutritionnels.</h2>
            <p>Les calories peuvent être estimées automatiquement ou fixées manuellement. Les macros personnalisées prennent le dessus sur les valeurs automatiques.</p>
          </div>

          <div className="formGrid">
            <label className="field"><span>Objectif</span><select value={profile.objective} onChange={(event) => updateObjective(event.currentTarget.value as Objective)}>{objectiveOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label className="field"><span>Calories personnalisées</span><input inputMode="numeric" type="text" placeholder={`${summary.calories}`} value={customEnergyDraft} onChange={(event) => updateCustomEnergy(event.currentTarget.value)} onBlur={(event) => finishCustomEnergy(event.currentTarget.value)} /><small>vide = estimation automatique</small></label>
            <label className="field"><span>Protéines</span><input type="number" min="0.6" max="2.5" step="0.05" value={profile.proteinFactor ?? ""} onChange={(event) => updateOptionalNumber("proteinFactor", event.currentTarget.value)} /><small>g/kg poids de référence</small></label>
            <label className="field"><span>Glucides</span><input type="number" min="20" max="70" value={profile.carbPercent ?? ""} onChange={(event) => updateOptionalNumber("carbPercent", event.currentTarget.value)} /><small>% des calories</small></label>
            <label className="field"><span>Lipides</span><input type="number" min="15" max="50" value={profile.fatPercent ?? ""} onChange={(event) => updateOptionalNumber("fatPercent", event.currentTarget.value)} /><small>% des calories</small></label>
            <label className="field"><span>Repas / jour</span><input type="number" min="1" max="8" value={profile.mealsPerDay ?? ""} onChange={(event) => updateOptionalNumber("mealsPerDay", event.currentTarget.value)} /></label>
            <label className="field"><span>Situation</span><select value={profile.physiologicalStatus} disabled={profile.sex !== "female"} onChange={(event) => updatePhysiologicalStatus(event.currentTarget.value as PhysiologicalStatus)}>{physiologicalOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
            <label className="field"><span>Référentiel</span><select value={profile.referenceMode} onChange={(event) => updateReferenceMode(event.currentTarget.value as ReferenceMode)}>{referenceModes.map((mode) => <option value={mode.value} key={mode.value}>{mode.label}</option>)}</select></label>
          </div>

          <button className="primaryCta" type="submit">{saved ? "Profil enregistré" : "Sauvegarder et appliquer"}</button>
        </form>

        <div className="referencePreview">
          <p className="eyebrow">Repères actifs</p>
          <h2>Les VNR changent avec le profil.</h2>
          <div className="referenceList">
            {referenceSummary.map((item) => (
              <article key={item.key}>
                <span>{item.label}</span>
                <strong>{item.reference ? formatAmount(item.reference.target, item.reference.unit) : "-"}</strong>
                <small>{item.reference ? `${item.reference.basis} · ${item.reference.source}` : "Non renseigné"}</small>
              </article>
            ))}
          </div>
          <div className="sourceNote">
            <strong>Calcul actif</strong>
            <p>
              Calories : {activeCalories} kcal/j. Protéines : {formatAmount(activeMacro.proteinG, "g")}. Glucides : {formatAmount(activeMacro.carbG, "g")}. Lipides : {formatAmount(activeMacro.fatG, "g")}. Saturés : {formatAmount(activeMacro.saturatedFatLimitG, "g")} maximum.
            </p>
            <p><small>Le cumul énergétique se compare à l’objectif calories actif. Si 1 800 kcal/j est saisi, 900 kcal consommées représentent 50 % de la journée.</small></p>
          </div>
        </div>
      </section>
    </main>
  );
}