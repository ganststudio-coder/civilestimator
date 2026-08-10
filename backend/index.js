require('dotenv').config({ path: '/home/ubuntu/civilestimator/backend/.env' });
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Placeholder for 9Router API base URL
const NINEROUTER_URL = process.env.NINEROUTER_URL || 'http://127.0.0.1:20128'; // Sesuaikan port

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

