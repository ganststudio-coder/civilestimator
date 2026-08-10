# Brief: Bangun Aplikasi "CivilEstimator" (RAB/BoQ dari Gambar Denah)

## Konteks
Aplikasi buat kontraktor/estimator bangunan di Indonesia untuk menghasilkan RAB (Rencana Anggaran Biaya) / BoQ (Bill of Quantity) berdasarkan gambar denah, dengan basis perhitungan gaya AHSP (Analisa Harga Satuan Pekerjaan). Sudah ada prototype fungsional dalam bentuk single-file React artifact (`rab-calculator.jsx`, terlampir/dilampirkan terpisah) — gunakan itu sebagai referensi logika dan komponen, lalu bangun ulang sebagai aplikasi produksi dengan arsitektur di bawah.

## Alur Pengguna (User Flow) — WAJIB dipertahankan

**Langkah 1 — Denah Existing vs Rencana**
- User upload dua gambar: "Gambar Denah Existing" (kondisi saat ini) dan "Gambar Denah Rencana" (kondisi yang diinginkan).
- Tombol "Analisa Perbandingan dengan AI" mengirim kedua gambar ke backend, yang meneruskannya ke 9Router/H9Master (vision) untuk dibandingkan.
- AI mengembalikan daftar saran pekerjaan (JSON): `uraian`, `kategori`, `catatan`, dan opsional `panjang`/`lebar`/`tinggi` (dalam meter) **jika ada angka dimensi yang jelas tertulis di gambar** — kalau tidak jelas, field tersebut `null`, AI tidak boleh menebak/mengarang angka.
- User me-review tiap saran satu-satu: klik "Tambahkan" (lalu pilih jenis pekerjaan yang sesuai dari library) atau "Skip" kalau saran tidak relevan. Ini konfirmasi manual — AI tidak pernah auto-menambahkan ke RAB.

**Langkah 2 — Gambar Kerja Tambahan**
- Daftar kategori pekerjaan tambahan yang **sepenuhnya bisa diedit** oleh user: nama kategori bisa diubah/dihapus, dan bisa nambah kategori baru bebas (default awal: Atap, Pagar, Tembok Pembatas — tapi ini cuma starting point, bukan daftar tetap).
- Tiap kategori: toggle "Ada / Tidak ada pekerjaan ini", upload gambar kerja (opsional), tombol "Baca ukuran dari gambar" (kirim gambar itu ke backend, yang meneruskannya ke 9Router/H9Master, minta baca angka dimensi yang tertulis di gambar tersebut), lalu tombol "Tambah pekerjaan" (pilih dari library, dimensi otomatis terisi dari hasil baca AI kalau ada, tapi tetap editable).

**Langkah 3 — Daftar Pekerjaan (RAB/BoQ)**
- Semua pekerjaan yang sudah dikonfirmasi dari langkah 1 & 2 (atau ditambah manual) muncul sebagai baris.
- Tiap baris: input dimensi (panjang/lebar/tinggi atau qty tergantung satuan), breakdown komponen bahan+upah (koefisien × harga satuan, keduanya editable per baris tanpa mengubah default di library), subtotal otomatis.
- Rekap total per kategori + grand total di bagian bawah.
- Tombol export/print ke PDF.

## Database — SumoPod PostgreSQL (bukan Supabase)
Database sudah tersedia, managed PostgreSQL dari SumoPod. Kredensial (simpan sebagai environment variable / secret, JANGAN pernah hardcode atau commit ke git):
```
DB_HOST=pgsql-dbas-jkt1-003.sumobase.my.id
DB_PORT=6432
DB_NAME=db320bd3cdbd4b7483
DB_USER=uQSQEaQPyAMEADE74.jkt1_003
DB_PASSWORD=<minta ke user, isi manual di .env, jangan commit>
DB_SSL=true   # managed Postgres biasanya wajib SSL, cek dulu pas testing koneksi
```
Karena ini Postgres murni (bukan Supabase), tidak ada auto-generated REST API, Storage, atau Auth bawaan. Semua itu perlu dibangun manual:
- **Koneksi DB**: pakai `pg` (node-postgres) atau ORM seperti Prisma/Drizzle dari backend
- **Storage gambar**: simpan file gambar (existing/rencana/tambahan) di disk VPS yang sama tempat backend jalan (folder terpisah, misal `/var/www/rab-kilat/uploads/`), backend serve lewat static route atau endpoint download. (Alternatif: kalau nanti butuh scale/backup lebih baik, bisa pindah ke S3-compatible object storage — tapi untuk versi awal, disk VPS cukup.)
- **Auth**: kalau app ini dipakai sendiri/tim kecil, boleh mulai tanpa auth kompleks (misal cukup 1 admin login sederhana), bisa ditingkatkan belakangan.

### Skema tabel (jalankan sebagai migration SQL)
```sql
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
```
Seed `work_item_library` + `work_item_components` dari array `WORK_ITEMS` di `rab-calculator.jsx`.

## ⚠️ PENTING — AI Provider: pakai 9Router / H9Master, dipanggil dari backend (bukan dari browser)
Backend Node/Express (di VPS yang sama dengan 9Router) yang manggil 9Router, BUKAN frontend/browser yang manggil langsung. Ini penting karena:
- Kalau browser (frontend) yang manggil langsung ke 9Router, kena masalah mixed-content (frontend biasanya HTTPS, 9Router VPS masih HTTP) dan CORS — ini yang bikin prototype artifact gagal connect sebelumnya.
- Kalau backend yang manggil (server-to-server, bahkan bisa lewat `localhost` kalau satu VPS), masalah itu otomatis hilang — aturan mixed-content/CORS cuma berlaku untuk request dari browser.

Jadi alurnya: Frontend (browser) → HTTPS → Backend sendiri (endpoint `/api/analyze-drawings`, `/api/read-drawing-dims`) → Backend manggil 9Router internal → balikin hasil JSON ke frontend.

Detail teknis:
- Karena LiteLLM-compatible, format request ke 9Router ngikut OpenAI Chat Completions API (`/v1/chat/completions`): payload gambar pakai `content: [{type: "image_url", image_url: {url: "data:image/...;base64,..."}}, {type: "text", text: "..."}]`
- Model: `H9Master` (combo chain H9Free → H9Router)
- **Perlu dicek dulu**: pastikan model yang dipilih H9Master dalam chain-nya benar-benar support vision/multimodal. Kalau default chain-nya text-only, tentuin model vision-capable khusus buat dua endpoint ini
- JSON output tetap: uraian/kategori/catatan/panjang/lebar/tinggi untuk saran pekerjaan; panjang/lebar/tinggi/catatan untuk baca dimensi
- Kredensial 9Router (kalau butuh auth) disimpan sebagai secret/env var di backend, tidak pernah ke frontend

Frontend sendiri, kalau nanti butuh HTTPS untuk diakses dari luar (bukan cuma localhost), butuh setup HTTPS di VPS (Nginx + Certbot, atau Cloudflare Tunnel untuk testing cepat) — tapi ini terpisah dari masalah 9Router, karena sekarang 9Router sudah "disembunyikan" di belakang backend.

## Tech Stack (ikutin pola project lain yang sudah jalan)
- Frontend: React + Vite
- Backend: Node.js/Express (atau Fastify) custom, dihosting di VPS SumoPod yang sama dengan 9Router — koneksi ke database via `pg`/Prisma, endpoint upload gambar (simpan ke disk VPS), endpoint proxy ke 9Router untuk analisa AI
- Database: PostgreSQL SumoPod (lihat bagian "Database" di atas untuk kredensial & skema)
- Storage gambar: disk VPS, folder terpisah, diserve backend
- Deploy: frontend ke Vercel (opsional) atau ikut disajikan dari backend yang sama; backend + DB + AI semua di VPS SumoPod
- AI: 9Router / H9Master (LiteLLM-compatible proxy, sudah jalan di VPS yang sama) — karena backend dan 9Router sama-sama di VPS, panggilan ini internal (server-to-server), jadi TIDAK kena masalah mixed-content/CORS yang muncul kalau dipanggil langsung dari browser

## Aturan Bisnis Penting
1. AI **tidak pernah** jadi sumber akhir untuk volume/dimensi — semua angka yang disarankan AI tetap harus bisa diedit user sebelum dihitung ke RAB.
2. Koefisien & harga di `work_item_library` itu **contoh ilustrasi**, bukan AHSP resmi — sediakan UI untuk user import/edit koefisien sesuai referensi SNI/Permen PUPR atau data lapangan sendiri.
3. Kategori pekerjaan tambahan (langkah 2) harus dinamis sepenuhnya — jangan hardcode daftar tetap di kode, simpan sebagai data per-project yang bisa CRUD.
4. Satu project bisa punya banyak drawing (existing, rencana, dan tambahan per kategori), semua tersimpan di disk VPS terhubung ke project_id lewat tabel drawings.

## Referensi Kode
Lampirkan/rujuk file prototype `rab-calculator.jsx` sebagai referensi struktur komponen (ItemPicker, ImageDrop, computeVolume, unitHargaSatuan) dan daftar `WORK_ITEMS` sebagai starting seed data untuk `work_item_library`.
