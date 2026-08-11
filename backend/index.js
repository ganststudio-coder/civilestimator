require('dotenv').config({ path: '/home/ubuntu/civilestimator/backend/.env' });
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const NINEROUTER_URL = process.env.NINEROUTER_URL;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Tambahkan endpoint untuk additional_categories dan AI dimensi

app.get('/api/additional_categories', async (req, res) => {
  try {
    const { project_id } = req.query;
    // Panggil database (sesuaikan dengan setup DB Anda)
    // const categories = await db.query('SELECT * FROM additional_categories WHERE project_id = $1', [project_id]);
    // res.json(categories.rows);
    res.json([]); // Placeholder
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/additional_categories', async (req, res) => {
  try {
    const { project_id, nama, image_path, ada_pekerjaan, dims_json } = req.body;
    // const newCategory = await db.query('INSERT INTO additional_categories (project_id, nama, image_path, ada_pekerjaan, dims_json) VALUES ($1, $2, $3, $4, $5) RETURNING *', [project_id, nama, image_path, ada_pekerjaan, dims_json]);
    // res.json(newCategory.rows[0]);
    res.json({ id: 'mock-id', project_id, nama, image_path, ada_pekerjaan, dims_json }); // Placeholder
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/additional_categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, image_path, ada_pekerjaan, dims_json } = req.body;
    // const updatedCategory = await db.query('UPDATE additional_categories SET nama = $1, image_path = $2, ada_pekerjaan = $3, dims_json = $4 WHERE id = $5 RETURNING *', [nama, image_path, ada_pekerjaan, dims_json, id]);
    // res.json(updatedCategory.rows[0]);
    res.json({ id, nama, image_path, ada_pekerjaan, dims_json }); // Placeholder
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/read-drawing-dims', async (req, res) => {
  try {
    const { image_path } = req.body;
    
    // Konversi file ke base64
    const fullPath = path.join(__dirname, image_path);
    const imageBase64 = fs.readFileSync(fullPath, { encoding: 'base64' });
    const mimeType = 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${imageBase64}`;

    // Panggil 9Router untuk analisa gambar dan ekstraksi dimensi
    const response = await axios.post(`${NINEROUTER_URL}/v1/chat/completions`, {
      model: 'H9Master',
      response_format: { type: "json_object" },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analisa gambar ini. HANYA kembalikan JSON. Format: {"panjang": number | null, "lebar": number | null, "tinggi": number | null, "catatan": string}. Jika tidak ada info dimensi, isi nilai number dengan null dan catatan dengan pesan tidak ditemukan.' },
            { type: 'image_url', image_url: { url: dataUrl } }
          ]
        }
      ]
    });

    let rawContent = response.data.choices[0].message.content;
    rawContent = rawContent.replace(/```json\n?/, '').replace(/```/, '');
    
    console.log('AI Response:', rawContent);
    
    let jsonResult;
    try {
      jsonResult = JSON.parse(rawContent);
    } catch (e) {
      jsonResult = { panjang: null, lebar: null, tinggi: null, catatan: "Tidak bisa membaca ukuran dari gambar ini" };
    }

    res.json(jsonResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze-drawings', async (req, res) => {
  try {
    const { images } = req.body;
    // Panggil 9Router/H9Master
    const response = await axios.post(`${NINEROUTER_URL}/v1/chat/completions`, {
      model: 'H9Master',
      response_format: { type: "json_object" },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Kamu adalah API yang HANYA mengembalikan JSON, tidak pernah teks penjelasan apapun. Jangan gunakan markdown, jangan gunakan code fence, jangan beri pembuka atau penutup kalimat. Output kamu HARUS langsung dimulai dengan karakter [ dan diakhiri dengan karakter ]. Format setiap item: {"uraian": "nama pekerjaan singkat", "kategori": "...", "catatan": "...", "panjang": angka atau null, "lebar": angka atau null, "tinggi": angka atau null}. Analisa yang diminta: bandingkan denah existing dan rencana, identifikasi pekerjaan konstruksi (bongkar/pasang/ubah) yang diperlukan. Maksimal 10 item.' },
            ...images.map(img => ({ type: 'image_url', image_url: { url: img } }))
          ]
        }
      ]
    });

    let rawContent = response.data.choices[0].message.content;
    rawContent = rawContent.replace(/```json\n?/, '').replace(/```/, '');
    const jsonResult = JSON.parse(rawContent);

    res.json(jsonResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const multer = require('multer');
const path = require('path');

const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });
app.use('/uploads', express.static(uploadDir));

app.post('/api/upload', upload.single('drawing'), (req, res) => {
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

app.listen(3000, () => console.log('Backend running on port 3000'));

