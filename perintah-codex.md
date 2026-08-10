Kamu adalah software engineer yang akan membangun aplikasi web bernama "CivilEstimator" — alat bantu kontraktor untuk membuat RAB/BoQ (Rencana Anggaran Biaya) dari gambar denah bangunan, dengan basis perhitungan gaya AHSP (Analisa Harga Satuan Pekerjaan).

Ada dua file referensi yang gue lampirkan:
1. `civilestimator-brief.md` — spec lengkap: alur pengguna, data model, aturan bisnis, catatan arsitektur AI
2. `rab-calculator.jsx` — prototype React yang sudah berfungsi (logika kalkulasi volume, breakdown AHSP, UI komponen). Pakai ini sebagai referensi logika, JANGAN dipakai mentah-mentah karena di situ browser manggil 9Router langsung (buat testing cepat) — di produksi ini WAJIB dipindah ke backend (baca poin PENTING di brief).

Baca `civilestimator-brief.md` dulu sampai selesai sebelum mulai coding.

Kerjakan dengan urutan ini:

**Tahap 1 — Setup project**
- Scaffold project: frontend React + Vite, backend Node.js/Express (atau Fastify) terpisah
- Setup koneksi ke database PostgreSQL SumoPod (kredensial ada di brief bagian "Database" — host, port, database name, username sudah tersedia; password minta ke user, simpan di `.env`, JANGAN commit ke git). Test koneksi pakai `pg` dengan `ssl: true` dulu sebelum lanjut, managed Postgres biasanya wajib SSL.
- Jalankan migration SQL sesuai skema di brief (projects, drawings, ai_suggestions, work_item_library, work_item_components, boq_lines, additional_categories)
- Setup folder upload gambar di VPS (disk lokal) + endpoint backend buat serve file itu
- Seed `work_item_library` + `work_item_components` dari array `WORK_ITEMS` di `rab-calculator.jsx`

**Tahap 2 — Backend AI (WAJIB baca bagian "PENTING" di brief — backend manggil 9Router, bukan browser langsung)**
- Buat endpoint backend `POST /api/analyze-drawings`: terima 2 gambar (existing + rencana), backend yang panggil endpoint 9Router (LiteLLM-compatible, format OpenAI Chat Completions) pakai kombinasi H9Master, balikin JSON saran pekerjaan (uraian, kategori, catatan, panjang/lebar/tinggi nullable) ke frontend
- Buat endpoint backend `POST /api/read-drawing-dims`: terima 1 gambar + label kategori, backend panggil 9Router dengan cara yang sama, balikin JSON dimensi (panjang/lebar/tinggi nullable) + catatan
- Karena backend dan 9Router ada di VPS yang sama, panggilan ini internal/server-to-server — tidak kena masalah mixed-content/CORS yang muncul kalau frontend manggil langsung
- Auth/key 9Router (kalau perlu) disimpan sebagai secret di `.env` backend, tidak pernah ke client
- Cek dulu model apa dalam chain H9Master yang support vision — kalau default chain-nya text-only, tentuin model vision-capable khusus buat dua endpoint ini

**Tahap 3 — Frontend: alur 3 langkah**
Implementasikan persis alur di brief bagian "Alur Pengguna":
- Langkah 1: upload existing + rencana → panggil endpoint analyze-drawings → tampilkan saran → user konfirmasi satu-satu sebelum masuk RAB
- Langkah 2: kategori pekerjaan tambahan yang dinamis (CRUD penuh: tambah/edit nama/hapus), toggle ada/tidak, upload gambar, tombol baca ukuran → endpoint read-drawing-dims
- Langkah 3: tabel RAB dengan input dimensi, breakdown komponen (koefisien × harga, editable), rekap per kategori, grand total, export PDF

**Tahap 4 — Persistensi**
- Semua project, gambar (tersimpan di disk VPS via endpoint upload backend), saran AI, dan baris RAB tersimpan di PostgreSQL SumoPod per project_id, bisa dibuka lagi nanti (bukan cuma in-memory kayak prototype)

**Tahap 5 — Review**
- Setelah selesai tiap tahap, tunjukkan hasilnya dan tunggu konfirmasi sebelum lanjut ke tahap berikutnya

Kalau ada bagian di brief atau prototype yang ambigu/kurang jelas buat diimplementasikan, tanya dulu sebelum asumsi sendiri.