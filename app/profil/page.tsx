"use client";

import { useEffect, useMemo, useState } from "react";
import {
  activityLevels,
  defaultProfile,
  formatAmount,
  keyReferenceSummary,
  loadStoredProfile,
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

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(loadStoredProfile());
  }, []);

  const summary = useMemo(() => summarizeProfile(profile), [profile]);
  const referenceSummary = useMemo(() => keyReferenceSummary(profile), [profile]);

  function updateNumber(field: "age" | "heightCm" | "weightKg", value: string) {
    setSaved(false);
    setProfile((current) => normalizeProfile({ ...current, [field]: Number(value) }));
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
    const normalized = normalizeProfile(profile);
    saveStoredProfile(normalized);
    setProfile(normalized);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  }

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="/">NutriAtlas</a>
        <div className="navLinks">
          <a href="/profil">Profil</a>
          <a href="/search">Recherche</a>
          <a href="/cumul">Cumul</a>
          <a href="/#sources">Sources</a>
        </div>
      </nav>

      <section className="profileHero pageSection">
        <div className="profileIntro">
          <p className="eyebrow">Profil nutritionnel</p>
          <h1>Définir les repères avant de lire les pourcentages.</h1>
          <p>
            L’âge, le sexe, la taille, le poids, l’activité et le référentiel choisi pilotent désormais les objectifs affichés dans les fiches aliments et le cumul journalier.
          </p>
          <div className="ctaRow">
            <button className="primaryCta" type="button" onClick={saveProfile}>{saved ? "Profil enregistré" : "Enregistrer le profil"}</button>
            <a className="secondaryCta" href="/search">Rechercher un aliment</a>
          </div>
        </div>

        <aside className="profilePanel">
          <p className="eyebrow">Résumé calculé</p>
          <div className="metricGrid">
            <div><span>IMC</span><strong>{summary.bmi.toFixed(1)}</strong><small>{summary.bmiLabel}</small></div>
            <div><span>Métabolisme</span><strong>{summary.bmr}</strong><small>kcal / jour</small></div>
            <div><span>Besoin estimé</span><strong>{summary.calories}</strong><small>kcal / jour</small></div>
            <div><span>Référentiel</span><strong className="metricText">{summary.referenceModeLabel}</strong><small>appliqué au cumul</small></div>
          </div>
        </aside>
      </section>

      <section className="pageSection profileFormPreview">
        <form className="profileEditor" onSubmit={(event) => { event.preventDefault(); saveProfile(); }}>
          <div>
            <p className="eyebrow">Étape 1</p>
            <h2>Mes données de base.</h2>
            <p>
              Ces données restent locales au navigateur pour cette première version. Elles servent à remplacer les repères génériques par des repères adaptés au profil.
            </p>
          </div>

          <div className="formGrid">
            <label className="field"><span>Âge</span><input type="number" min="4" max="100" value={profile.age} onChange={(event) => updateNumber("age", event.currentTarget.value)} /></label>
            <label className="field"><span>Taille</span><input type="number" min="90" max="230" value={profile.heightCm} onChange={(event) => updateNumber("heightCm", event.currentTarget.value)} /><small>cm</small></label>
            <label className="field"><span>Poids</span><input type="number" min="25" max="250" step="0.1" value={profile.weightKg} onChange={(event) => updateNumber("weightKg", event.currentTarget.value)} /><small>kg</small></label>
            <label className="field"><span>Sexe</span><select value={profile.sex} onChange={(event) => updateSex(event.currentTarget.value as ProfileSex)}><option value="female">Femme</option><option value="male">Homme</option></select></label>
            <label className="field"><span>Activité</span><select value={profile.activityLevel} onChange={(event) => updateActivity(event.currentTarget.value as ActivityLevel)}>{activityLevels.map((level) => <option value={level.value} key={level.value}>{level.label}</option>)}</select></label>
            <label className="field"><span>Objectif</span><select value={profile.objective} onChange={(event) => updateObjective(event.currentTarget.value as Objective)}>{objectiveOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>
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
            <strong>Lecture importante</strong>
            <p>
              Les valeurs ANSES sont utilisées en priorité quand elles existent. Le mode UE reste disponible pour comparer avec les valeurs d’étiquetage, mais il ne remplace pas un référentiel personnalisé.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
