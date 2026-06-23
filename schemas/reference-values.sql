-- Reference values schema for NutriAtlas
-- Regulatory VNR values are stored separately from profile based references.

CREATE TABLE reference_systems (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    jurisdiction TEXT,
    legal_basis TEXT,
    source_url TEXT NOT NULL,
    reference_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reference_values (
    id BIGSERIAL PRIMARY KEY,
    reference_system_id BIGINT NOT NULL REFERENCES reference_systems(id),
    nutrient_id TEXT NOT NULL,
    label_fr TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    population_group TEXT NOT NULL DEFAULT 'adult_default',
    age_min_years NUMERIC,
    age_max_years NUMERIC,
    sex TEXT,
    pregnancy BOOLEAN,
    lactation BOOLEAN,
    is_regulatory BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (reference_system_id, nutrient_id, population_group, unit)
);

CREATE TABLE upper_intake_limits (
    id BIGSERIAL PRIMARY KEY,
    reference_system_id BIGINT NOT NULL REFERENCES reference_systems(id),
    nutrient_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    population_group TEXT NOT NULL,
    source_url TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
