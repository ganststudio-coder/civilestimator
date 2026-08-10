CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tipe TEXT CHECK (tipe IN ('existing','rencana','tambahan')),
  kategori_label TEXT,
  image_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  uraian TEXT NOT NULL,
  kategori TEXT,
  catatan TEXT,
  panjang NUMERIC,
  lebar NUMERIC,
  tinggi NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','ditambahkan','skip')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE work_item_library (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  satuan TEXT NOT NULL,
  dims_config JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE work_item_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_item_id TEXT REFERENCES work_item_library(id) ON DELETE CASCADE,
  nama_komponen TEXT NOT NULL,
  satuan TEXT NOT NULL,
  koefisien NUMERIC NOT NULL,
  harga_default NUMERIC NOT NULL
);

CREATE TABLE boq_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  work_item_id TEXT REFERENCES work_item_library(id),
  label TEXT,
  dimensi_json JSONB,
  overrides_harga_json JSONB DEFAULT '{}',
  volume NUMERIC,
  harga_satuan NUMERIC,
  jumlah NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE additional_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  image_path TEXT,
  ada_pekerjaan BOOLEAN,
  dims_json JSONB
);
