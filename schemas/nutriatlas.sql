-- NutriAtlas initial relational schema
-- Goal: preserve source traceability for every displayed nutrition value.
-- Principle: normalized tables are derived views; raw CIQUAL rows remain preserved.

CREATE TABLE dataset_versions (
    id BIGSERIAL PRIMARY KEY,
    dataset TEXT NOT NULL,
    publisher TEXT NOT NULL,
    version TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_worksheet TEXT,
    retrieved_at TIMESTAMPTZ NOT NULL,
    checksum_sha256 TEXT NOT NULL,
    raw_file_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (dataset, version, checksum_sha256)
);

CREATE TABLE raw_food_rows (
    id BIGSERIAL PRIMARY KEY,
    dataset_version_id BIGINT NOT NULL REFERENCES dataset_versions(id),
    source_row_number INTEGER NOT NULL,
    source_food_code TEXT NOT NULL,
    raw_row_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (dataset_version_id, source_row_number),
    UNIQUE (dataset_version_id, source_food_code)
);

CREATE TABLE foods (
    id BIGSERIAL PRIMARY KEY,
    dataset_version_id BIGINT NOT NULL REFERENCES dataset_versions(id),
    raw_food_row_id BIGINT REFERENCES raw_food_rows(id),
    source_food_code TEXT NOT NULL,
    name TEXT NOT NULL,
    scientific_name TEXT,
    food_group_code TEXT,
    food_subgroup_code TEXT,
    food_subsubgroup_code TEXT,
    food_group_name_fr TEXT,
    food_subgroup_name_fr TEXT,
    food_subsubgroup_name_fr TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (dataset_version_id, source_food_code)
);

CREATE TABLE nutrients (
    id BIGSERIAL PRIMARY KEY,
    source_nutrient_code TEXT,
    infoods_tag TEXT,
    origcpcd TEXT,
    name TEXT NOT NULL,
    unit TEXT,
    source_column_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (source_column_name)
);

CREATE TABLE food_nutrients (
    id BIGSERIAL PRIMARY KEY,
    food_id BIGINT NOT NULL REFERENCES foods(id),
    nutrient_id BIGINT NOT NULL REFERENCES nutrients(id),
    value NUMERIC,
    original_value TEXT,
    source TEXT NOT NULL,
    source_url TEXT NOT NULL,
    source_column_name TEXT NOT NULL,
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
