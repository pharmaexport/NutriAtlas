-- NutriAtlas initial relational schema
-- Goal: preserve source traceability for every displayed nutrition value.

CREATE TABLE dataset_versions (
    id BIGSERIAL PRIMARY KEY,
    dataset TEXT NOT NULL,
    publisher TEXT NOT NULL,
    version TEXT NOT NULL,
    source_url TEXT NOT NULL,
    retrieved_at TIMESTAMPTZ NOT NULL,
    checksum_sha256 TEXT NOT NULL,
    raw_file_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (dataset, version, checksum_sha256)
);

CREATE TABLE foods (
    id BIGSERIAL PRIMARY KEY,
    dataset_version_id BIGINT NOT NULL REFERENCES dataset_versions(id),
    source_food_code TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (dataset_version_id, source_food_code)
);

CREATE TABLE nutrients (
    id BIGSERIAL PRIMARY KEY,
    source_nutrient_code TEXT,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (name, unit)
);

CREATE TABLE food_nutrients (
    id BIGSERIAL PRIMARY KEY,
    food_id BIGINT NOT NULL REFERENCES foods(id),
    nutrient_id BIGINT NOT NULL REFERENCES nutrients(id),
    value NUMERIC,
    original_value TEXT,
    source TEXT NOT NULL,
    source_url TEXT NOT NULL,
    dataset_version_id BIGINT NOT NULL REFERENCES dataset_versions(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (food_id, nutrient_id, dataset_version_id)
);

CREATE TABLE import_logs (
    id BIGSERIAL PRIMARY KEY,
    dataset_version_id BIGINT REFERENCES dataset_versions(id),
    status TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
