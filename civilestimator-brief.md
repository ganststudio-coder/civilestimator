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