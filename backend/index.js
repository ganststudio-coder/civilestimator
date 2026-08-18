require('dotenv').config({ path: '/home/ubuntu/civilestimator/backend/.env' });
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const pool = require('./db');

const app = express();
const NINEROUTER_URL = process.env.NINEROUTER_URL;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });
app.use('/uploads', express.static(uploadDir));

// ---------------------------------------------------------------------------
// Work item library (untuk ItemPicker + hitung breakdown di frontend)
// ---------------------------------------------------------------------------
app.get('/api/work-items', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT w.id, w.nama, w.kategori, w.satuan, w.dims_config AS dims,
        COALESCE(
          json_agg(
            json_build_object(
              'name', c.nama_komponen,
              'satuan', c.satuan,
              'koef', c.koefisien::float,
              'harga', c.harga_default::float
            )
            ORDER BY c.id
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) AS components
      FROM work_item_library w
      LEFT JOIN work_item_components c ON c.work_item_id = w.id
      GROUP BY w.id
      ORDER BY w.kategori, w.nama
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
app.get('/api/projects', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { nama } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO projects (nama) VALUES ($1) RETURNING *',
      [nama || 'Proyek Baru']
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// BoQ lines (RAB)
// ---------------------------------------------------------------------------
app.get('/api/boq-lines', async (req, res) => {
  try {
    const { project_id } = req.query;
    const { rows } = await pool.query(
      'SELECT * FROM boq_lines WHERE project_id = $1 ORDER BY created_at, id',
      [project_id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/boq-lines', async (req, res) => {
  try {
    const {
      project_id, work_item_id, label,
      dimensi_json, overrides_harga_json, overrides_koef_json,
      volume, harga_satuan, jumlah,
    } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO boq_lines
        (project_id, work_item_id, label, dimensi_json, overrides_harga_json, overrides_koef_json, volume, harga_satuan, jumlah)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        project_id, work_item_id, label,
        JSON.stringify(dimensi_json || {}),
        JSON.stringify(overrides_harga_json || {}),
        JSON.stringify(overrides_koef_json || {}),
        volume, harga_satuan, jumlah,
      ]
    );
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/boq-lines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      work_item_id, label,
      dimensi_json, overrides_harga_json, overrides_koef_json,
      volume, harga_satuan, jumlah,
    } = req.body;
    const { rows } = await pool.query(
      `UPDATE boq_lines SET
        work_item_id = $2, label = $3,
        dimensi_json = $4, overrides_harga_json = $5, overrides_koef_json = $6,
        volume = $7, harga_satuan = $8, jumlah = $9
       WHERE id = $1
       RETURNING *`,
      [
        id, work_item_id, label,
        JSON.stringify(dimensi_json || {}),
        JSON.stringify(overrides_harga_json || {}),
        JSON.stringify(overrides_koef_json || {}),
        volume, harga_satuan, jumlah,
      ]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/boq-lines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM boq_lines WHERE id = $1', [id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Additional categories (placeholder — client-side dulu)
// ---------------------------------------------------------------------------
app.get('/api/additional_categories', async (req, res) => {
  res.json([]);
});

app.post('/api/additional_categories', async (req, res) => {
  const { project_id, nama, image_path, ada_pekerjaan, dims_json } = req.body;
  res.json({ id: 'mock-id', project_id, nama, image_path, ada_pekerjaan, dims_json });
});

app.put('/api/additional_categories/:id', async (req, res) => {
  const { id } = req.params;
  const { nama, image_path, ada_pekerjaan, dims_json } = req.body;
  res.json({ id, nama, image_path, ada_pekerjaan, dims_json });
});

// ---------------------------------------------------------------------------
// AI: baca dimensi dari gambar kerja
// ---------------------------------------------------------------------------
app.post('/api/read-drawing-dims', async (req, res) => {
  try {
    const { image_path } = req.body;

    const fullPath = path.join(__dirname, image_path);
    const imageBase64 = fs.readFileSync(fullPath, { encoding: 'base64' });
    const mimeType = 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${imageBase64}`;

    const response = await axios.post(`${NINEROUTER_URL}/v1/chat/completions`, {
      model: 'H9Master',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analisa gambar ini. HANYA kembalikan JSON. Format: {"panjang": number | null, "lebar": number | null, "tinggi": number | null, "catatan": string}. Jika tidak ada info dimensi, isi nilai number dengan null dan catatan dengan pesan tidak ditemukan.' },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    let rawContent = response.data.choices[0].message.content;
    rawContent = rawContent.replace(/```json\n?/, '').replace(/```/, '');

    let jsonResult;
    try {
      jsonResult = JSON.parse(rawContent);
    } catch (e) {
      jsonResult = { panjang: null, lebar: null, tinggi: null, catatan: 'Tidak bisa membaca ukuran dari gambar ini' };
    }

    res.json(jsonResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// AI: analisa perbandingan denah existing vs rencana
// ---------------------------------------------------------------------------
app.post('/api/analyze-drawings', async (req, res) => {
  try {
    const { images } = req.body;
    const response = await axios.post(`${NINEROUTER_URL}/v1/chat/completions`, {
      model: 'H9Master',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Kamu adalah API yang HANYA mengembalikan JSON, tidak pernah teks penjelasan apapun. Jangan gunakan markdown, jangan gunakan code fence, jangan beri pembuka atau penutup kalimat. Output kamu HARUS langsung dimulai dengan karakter [ dan diakhiri dengan karakter ]. Format setiap item: {"uraian": "nama pekerjaan singkat", "kategori": "...", "catatan": "...", "panjang": angka atau null, "lebar": angka atau null, "tinggi": angka atau null}. Analisa yang diminta: bandingkan denah existing dan rencana, identifikasi pekerjaan konstruksi (bongkar/pasang/ubah) yang diperlukan. Maksimal 10 item.' },
            ...images.map((img) => ({ type: 'image_url', image_url: { url: img } })),
          ],
        },
      ],
    });

    let rawContent = response.data.choices[0].message.content;
    rawContent = rawContent.replace(/```json\n?/, '').replace(/```/, '');
    const jsonResult = JSON.parse(rawContent);

    res.json(jsonResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload', upload.single('drawing'), (req, res) => {
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

app.listen(3000, () => console.log('Backend running on port 3000'));
