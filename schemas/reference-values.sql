-- NutriAtlas reference values schema
-- Separates regulatory VNR values from profile based nutritional references.

CREATE TABLE reference_systems (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    jurisdiction TEXT,
    legal_basis TEXT,
    source_url TEXT,
    reference_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reference_values (
    id BIGSERIAL PRIMARY KEY,
    reference_system_id BIGINT NOT NULL REFERENCES reference_systems(id),
    nutrient_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    population_group TEXT NOT NULL DEFAULT 'adult_default',
    sex TEXT,
    min_age_years NUMERIC,
    max_age_years NUMERIC,
    pregnancy BOOLEAN,
    lactation BOOLEAN,
    source_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (reference_system_id, nutrient_id, population_group, sex, min_age_years, max_age_years, pregnancy, lactation)
);

CREATE TABLE upper_intake_limits (
    id BIGSERIAL PRIMARY KEY,
    reference_system_id BIGINT NOT NULL REFERENCES reference_systems(id),
    nutrient_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    population_group TEXT NOT NULL DEFAULT 'adult_default',
    sex TEXT,
    min_age_years NUMERIC,
    max_age_years NUMERIC,
    pregnancy BOOLEAN,
    lactation BOOLEAN,
    source_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
