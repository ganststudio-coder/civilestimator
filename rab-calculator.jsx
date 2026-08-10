import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus, Trash2, FileDown, ChevronDown, ChevronUp, HardHat, Info,
  Upload, Sparkles, ImageOff, X, Loader2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// AHSP-STYLE COEFFICIENT LIBRARY (illustrative defaults — edit to match your
// actual SNI/AHSP reference and local material prices before real use)
// ---------------------------------------------------------------------------
const WORK_ITEMS = [
  { id: 'bongkar-dinding', category: 'Bongkar', name: 'Bongkar Pasangan Dinding Bata', unit: 'm2', dims: ['p', 't'],
    components: [
      { name: 'Pekerja', satuan: 'OH', koef: 0.3, harga: 130000 },
      { name: 'Mandor', satuan: 'OH', koef: 0.03, harga: 180000 },
    ]},
  { id: 'bongkar-keramik', category: 'Bongkar', name: 'Bongkar Keramik Lantai', unit: 'm2', dims: ['p', 'l'],
    components: [
      { name: 'Pekerja', satuan: 'OH', koef: 0.25, harga: 130000 },
      { name: 'Mandor', satuan: 'OH', koef: 0.025, harga: 180000 },
    ]},
  { id: 'bongkar-atap', category: 'Bongkar', name: 'Bongkar Penutup Atap', unit: 'm2', dims: ['p', 'l'],
    components: [
      { name: 'Pekerja', satuan: 'OH', koef: 0.2, harga: 130000 },
      { name: 'Mandor', satuan: 'OH', koef: 0.02, harga: 180000 },
    ]},
  { id: 'dinding-bata', category: 'Dinding', name: 'Pasangan Dinding Bata Merah 1:4', unit: 'm2', dims: ['p', 't'],
    components: [
      { name: 'Bata merah', satuan: 'bh', koef: 70, harga: 900 },
      { name: 'Semen PC', satuan: 'kg', koef: 11.5, harga: 1650 },
      { name: 'Pasir pasang', satuan: 'm3', koef: 0.043, harga: 300000 },
      { name: 'Pekerja', satuan: 'OH', koef: 0.3, harga: 130000 },
      { name: 'Tukang batu', satuan: 'OH', koef: 0.1, harga: 150000 },
      { name: 'Kepala tukang', satuan: 'OH', koef: 0.01, harga: 165000 },
      { name: 'Mandor', satuan: 'OH', koef: 0.015, harga: 180000 },
    ]},
  { id: 'plesteran', category: 'Dinding', name: 'Plesteran 1:4 tebal 15mm', unit: 'm2', dims: ['p', 't'],
    components: [
      { name: 'Semen PC', satuan: 'kg', koef: 6.24, harga: 1650 },
      { name: 'Pasir pasang', satuan: 'm3', koef: 0.024, harga: 300000 },
      { name: 'Pekerja', satuan: 'OH', koef: 0.3, harga: 130000 },
      { name: 'Tukang batu', satuan: 'OH', koef: 0.15, harga: 150000 },
      { name: 'Kepala tukang', satuan: 'OH', koef: 0.015, harga: 165000 },
      { name: 'Mandor', satuan: 'OH', koef: 0.015, harga: 180000 },
    ]},
  { id: 'cat-tembok', category: 'Finishing', name: 'Pengecatan Tembok (plamir + 2 lapis)', unit: 'm2', dims: ['p', 't'],
    components: [
      { name: 'Plamir', satuan: 'kg', koef: 0.1, harga: 12000 },
      { name: 'Cat dasar', satuan: 'ltr', koef: 0.1, harga: 45000 },
      { name: 'Cat penutup', satuan: 'ltr', koef: 0.2, harga: 45000 },
      { name: 'Pekerja', satuan: 'OH', koef: 0.02, harga: 130000 },
      { name: 'Tukang cat', satuan: 'OH', koef: 0.063, harga: 150000 },
      { name: 'Kepala tukang', satuan: 'OH', koef: 0.007, harga: 165000 },
    ]},
  { id: 'keramik-lantai', category: 'Lantai', name: 'Pasang Keramik Lantai 40x40', unit: 'm2', dims: ['p', 'l'],
    components: [
      { name: 'Keramik 40x40', satuan: 'bh', koef: 6.25, harga: 8500 },
      { name: 'Semen PC', satuan: 'kg', koef: 10.4, harga: 1650 },
      { name: 'Pasir pasang', satuan: 'm3', koef: 0.045, harga: 300000 },
      { name: 'Semen nat', satuan: 'kg', koef: 1, harga: 4000 },
      { name: 'Pekerja', satuan: 'OH', koef: 0.7, harga: 130000 },
      { name: 'Tukang batu', satuan: 'OH', koef: 0.35, harga: 150000 },
      { name: 'Kepala tukang', satuan: 'OH', koef: 0.035, harga: 165000 },
    ]},
  { id: 'atap-genteng', category: 'Atap', name: 'Penutup Atap Genteng Beton', unit: 'm2', dims: ['p', 'l'],
    components: [
      { name: 'Genteng beton', satuan: 'bh', koef: 10.5, harga: 6500 },
      { name: 'Paku', satuan: 'kg', koef: 0.02, harga: 22000 },
      { name: 'Pekerja', satuan: 'OH', koef: 0.1, harga: 130000 },
      { name: 'Tukang atap', satuan: 'OH', koef: 0.1, harga: 150000 },
      { name: 'Kepala tukang', satuan: 'OH', koef: 0.01, harga: 165000 },
    ]},
  { id: 'rangka-baja-ringan', category: 'Atap', name: 'Rangka Atap Baja Ringan', unit: 'm2', dims: ['p', 'l'],
    components: [
      { name: 'Kanal C baja ringan', satuan: "m'", koef: 1.35, harga: 32000 },
      { name: 'Reng baja ringan', satuan: "m'", koef: 2.5, harga: 18000 },
      { name: 'Baut self drilling', satuan: 'bh', koef: 12, harga: 400 },
      { name: 'Tukang', satuan: 'OH', koef: 0.15, harga: 150000 },
      { name: 'Pekerja', satuan: 'OH', koef: 0.1, harga: 130000 },
    ]},
  { id: 'pagar-besi', category: 'Pagar', name: 'Pagar Besi Hollow + Tralis', unit: 'm', dims: ['p'],
    components: [
      { name: 'Besi hollow 4x4', satuan: "m'", koef: 3.2, harga: 45000 },
      { name: 'Cat besi', satuan: 'ltr', koef: 0.15, harga: 55000 },
      { name: 'Tukang las', satuan: 'OH', koef: 0.4, harga: 165000 },
      { name: 'Pekerja', satuan: 'OH', koef: 0.2, harga: 130000 },
    ]},
  { id: 'pagar-tembok', category: 'Pagar', name: 'Pagar Tembok Bata + Finishing', unit: 'm2', dims: ['p', 't'],
    components: [
      { name: 'Bata merah', satuan: 'bh', koef: 70, harga: 900 },
      { name: 'Semen PC', satuan: 'kg', koef: 17.7, harga: 1650 },
      { name: 'Pasir', satuan: 'm3', koef: 0.067, harga: 300000 },
      { name: 'Cat dinding', satuan: 'ltr', koef: 0.3, harga: 45000 },
      { name: 'Pekerja', satuan: 'OH', koef: 0.6, harga: 130000 },
      { name: 'Tukang batu', satuan: 'OH', koef: 0.25, harga: 150000 },
      { name: 'Kepala tukang', satuan: 'OH', koef: 0.025, harga: 165000 },
    ]},
  { id: 'kusen-pintu', category: 'Kusen & Pintu', name: 'Kusen + Daun Pintu Panel Kayu (1 set)', unit: 'unit', dims: [],
    components: [
      { name: 'Kusen kayu kamper', satuan: 'set', koef: 1, harga: 850000 },
      { name: 'Daun pintu panel', satuan: 'bh', koef: 1, harga: 950000 },
      { name: 'Engsel', satuan: 'bh', koef: 3, harga: 25000 },
      { name: 'Kunci tanam', satuan: 'bh', koef: 1, harga: 150000 },
      { name: 'Tukang kayu', satuan: 'OH', koef: 1.5, harga: 155000 },
      { name: 'Pekerja', satuan: 'OH', koef: 0.5, harga: 130000 },
    ]},
  { id: 'kusen-jendela', category: 'Kusen & Pintu', name: 'Kusen + Daun Jendela Kaca (1 set)', unit: 'unit', dims: [],
    components: [
      { name: 'Kusen kayu kamper', satuan: 'set', koef: 1, harga: 550000 },
      { name: 'Kaca 5mm', satuan: 'm2', koef: 0.8, harga: 120000 },
      { name: 'Engsel', satuan: 'bh', koef: 2, harga: 20000 },
      { name: 'Grendel', satuan: 'bh', koef: 1, harga: 15000 },
      { name: 'Tukang kayu', satuan: 'OH', koef: 1, harga: 155000 },
      { name: 'Pekerja', satuan: 'OH', koef: 0.3, harga: 130000 },
    ]},
  { id: 'cor-beton', category: 'Struktur', name: 'Cor Beton Bertulang (sloof/kolom/balok)', unit: 'm3', dims: ['p', 'l', 't'],
    components: [
      { name: 'Semen PC', satuan: 'kg', koef: 371, harga: 1650 },
      { name: 'Pasir beton', satuan: 'm3', koef: 0.698, harga: 320000 },
      { name: 'Split/kerikil', satuan: 'm3', koef: 1.047, harga: 350000 },
      { name: 'Besi beton', satuan: 'kg', koef: 150, harga: 15500 },
      { name: 'Kawat bendrat', satuan: 'kg', koef: 2.25, harga: 22000 },
      { name: 'Bekisting', satuan: 'm2', koef: 6.8, harga: 95000 },
      { name: 'Pekerja', satuan: 'OH', koef: 1.65, harga: 130000 },
      { name: 'Tukang batu', satuan: 'OH', koef: 0.275, harga: 150000 },
      { name: 'Tukang besi', satuan: 'OH', koef: 0.4, harga: 150000 },
      { name: 'Tukang kayu', satuan: 'OH', koef: 0.25, harga: 155000 },
      { name: 'Kepala tukang', satuan: 'OH', koef: 0.028, harga: 165000 },
      { name: 'Mandor', satuan: 'OH', koef: 0.083, harga: 180000 },
    ]},
];

const DIM_LABEL = { p: 'Panjang (m)', l: 'Lebar (m)', t: 'Tinggi (m)' };
const rupiah = (n) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
const DEFAULT_ADDITIONAL = ['Atap', 'Pagar', 'Tembok Pembatas'];

function computeVolume(type, dims) {
  if (!type) return 0;
  if (type.unit === 'unit') return Number(dims.qty) || 0;
  if (type.dims.length === 1) return Number(dims[type.dims[0]]) || 0;
  if (type.dims.length === 2) return (Number(dims[type.dims[0]]) || 0) * (Number(dims[type.dims[1]]) || 0);
  if (type.dims.length === 3)
    return (Number(dims[type.dims[0]]) || 0) * (Number(dims[type.dims[1]]) || 0) * (Number(dims[type.dims[2]]) || 0);
  return 0;
}
function unitHargaSatuan(type, overrides) {
  return type.components.reduce((sum, c) => sum + c.koef * (overrides?.[c.name] ?? c.harga), 0);
}
let uid = 1;
const newId = () => uid++;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function ItemPicker({ onPick, onClose, defaultCategory }) {
  const categories = [...new Set(WORK_ITEMS.map((w) => w.category))];
  const ordered = defaultCategory
    ? [defaultCategory, ...categories.filter((c) => c !== defaultCategory)]
    : categories;
  return (
    <div className="absolute z-20 mt-2 bg-white border-2 border-[#1E3350] rounded-sm shadow-lg w-80 max-h-80 overflow-y-auto right-0">
      <div className="flex justify-between items-center px-3 py-2 border-b border-[#1E3350]/10 bg-[#EDE7D6]/60 sticky top-0">
        <span className="mono text-[10px] uppercase tracking-widest font-bold">Pilih Jenis Pekerjaan</span>
        <button onClick={onClose}><X size={14} /></button>
      </div>
      {ordered.map((cat) => (
        <div key={cat}>
          <div className="mono text-[10px] uppercase tracking-widest text-[#C1440E] font-bold px-3 pt-3 pb-1">{cat}</div>
          {WORK_ITEMS.filter((w) => w.category === cat).map((w) => (
            <button key={w.id} onClick={() => onPick(w.id)}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-[#EDE7D6] border-b border-[#1E3350]/5">
              {w.name}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function ImageDrop({ label, image, onChange, small }) {
  const inputRef = useRef(null);
  return (
    <div className="flex-1 min-w-[140px]">
      <span className="block mono text-[10px] uppercase tracking-widest text-[#1E3350]/60 mb-1">{label}</span>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer border-2 border-dashed border-[#1E3350]/30 hover:border-[#C1440E] rounded-sm flex items-center justify-center overflow-hidden bg-white ${small ? 'h-20' : 'h-44'}`}
      >
        {image ? (
          <img src={image} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center text-[#1E3350]/40 gap-1">
            <Upload size={small ? 16 : 22} />
            <span className="text-xs">Upload gambar</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={async (e) => { const f = e.target.files?.[0]; if (f) onChange(await fileToBase64(f)); }} />
      </div>
    </div>
  );
}

export default function RabCalculator() {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Big+Shoulders:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const [projectName, setProjectName] = useState('Proyek Baru');
  const [showSettings, setShowSettings] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('http://43.156.128.239:20128/v1/chat/completions');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('H9Master');

  const [existingImg, setExistingImg] = useState(null);
  const [planImg, setPlanImg] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [pickerForSuggestion, setPickerForSuggestion] = useState(null);

  const [additional, setAdditional] = useState(
    DEFAULT_ADDITIONAL.map((nama) => ({ id: newId(), nama, image: null, ada: null, dims: null, dimsNote: null, reading: false }))
  );
  const [pickerForAdditional, setPickerForAdditional] = useState(null);
  const [newAdditionalName, setNewAdditionalName] = useState('');

  const readDimsFromImage = async (id, image, nama) => {
    updateAdditional(id, { reading: true });
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: `Ini gambar kerja untuk pekerjaan "${nama}". Baca angka dimensi (panjang, lebar, tinggi) yang tertulis di gambar ini, dalam meter (konversi kalau satuannya cm/mm). Kalau ada beberapa segmen/bagian, jumlahkan atau ambil ukuran total yang paling relevan buat volume pekerjaan. Kalau angkanya tidak jelas terbaca, isi null — jangan mengarang. Balas HANYA JSON valid, tanpa markdown: {"panjang": angka_meter_atau_null, "lebar": angka_meter_atau_null, "tinggi": angka_meter_atau_null, "catatan": "ringkasan singkat ukuran yang terbaca"}` },
              { type: 'image_url', image_url: { url: image } },
            ],
          }],
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content ?? '';
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      updateAdditional(id, {
        dims: { p: parsed.panjang, l: parsed.lebar, t: parsed.tinggi },
        dimsNote: parsed.catatan || null,
        reading: false,
      });
    } catch (err) {
      console.error(err);
      updateAdditional(id, {
        reading: false,
        dimsNote: `Gagal konek ke 9Router (${err.message}). Kalau ini mixed-content/CORS error, endpoint http:// gak bisa dipanggil dari halaman https:// — cek console browser buat detailnya. Isi manual dulu aja.`,
      });
    }
  };

  const [rows, setRows] = useState([]);
  const [mainPickerOpen, setMainPickerOpen] = useState(false);

  const analyzeDrawings = async () => {
    if (!existingImg || !planImg) return;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'Gambar pertama adalah denah EXISTING (kondisi saat ini). Gambar kedua adalah denah RENCANA (kondisi yang diinginkan setelah renovasi/pembangunan).' },
              { type: 'image_url', image_url: { url: existingImg } },
              { type: 'image_url', image_url: { url: planImg } },
              { type: 'text', text: 'Bandingkan kedua gambar ini sebagai estimator bangunan. Identifikasi pekerjaan konstruksi yang diperlukan untuk mengubah dari kondisi existing ke rencana (misal: bongkar dinding, pasang dinding baru, ubah tata ruang, ganti lantai, dst). PENTING: gambar teknik biasanya punya angka dimensi tertulis (panjang, lebar, tinggi dalam meter atau cm — kalau cm, konversi ke meter). Kalau ukuran elemen yang kena pekerjaan itu bisa terbaca atau dihitung dari angka dimensi di gambar, sertakan. Kalau tidak ada angka yang jelas, isi null (jangan menebak/mengarang angka). Balas HANYA dengan JSON array valid, tanpa markdown, tanpa teks lain, format: [{"uraian": "nama pekerjaan singkat", "kategori": "salah satu dari: Bongkar, Dinding, Lantai, Atap, Pagar, Kusen & Pintu, Struktur, Finishing, Lainnya", "catatan": "lokasi/keterangan singkat", "panjang": angka_meter_atau_null, "lebar": angka_meter_atau_null, "tinggi": angka_meter_atau_null}]. Maksimal 10 item, urutkan dari yang paling jelas terlihat.' },
            ],
          }],
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content ?? '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setSuggestions(parsed.map((p) => ({ id: newId(), ...p })));
    } catch (err) {
      console.error(err);
      setAnalysisError(`Gagal konek ke 9Router (${err.message}). Kalau ini mixed-content/CORS error (endpoint http:// dipanggil dari halaman https://), coba buka Console browser buat pastiin. Sementara tambahkan pekerjaan manual di bawah.`);
    } finally {
      setAnalyzing(false);
    }
  };

  const addRow = (workItemId, label, suggestedDims) => {
    const type = WORK_ITEMS.find((w) => w.id === workItemId);
    setRows((r) => [...r, {
      id: newId(), workItemId,
      label: label || type.name,
      dims: {
        p: suggestedDims?.p ?? 0,
        l: suggestedDims?.l ?? 0,
        t: suggestedDims?.t ?? 0,
        qty: suggestedDims?.qty ?? 1,
      },
      overrides: {}, open: true,
    }]);
  };
  const removeRow = (id) => setRows((r) => r.filter((row) => row.id !== id));
  const updateDim = (id, key, val) => setRows((r) => r.map((row) => (row.id === id ? { ...row, dims: { ...row.dims, [key]: val } } : row)));
  const updatePrice = (id, compName, val) => setRows((r) => r.map((row) => (row.id === id ? { ...row, overrides: { ...row.overrides, [compName]: Number(val) || 0 } } : row)));
  const toggleOpen = (id) => setRows((r) => r.map((row) => (row.id === id ? { ...row, open: !row.open } : row)));

  const computed = useMemo(() => rows.map((row) => {
    const type = WORK_ITEMS.find((w) => w.id === row.workItemId);
    const volume = computeVolume(type, row.dims);
    const hargaSatuan = unitHargaSatuan(type, row.overrides);
    return { ...row, type, volume, hargaSatuan, jumlah: volume * hargaSatuan };
  }), [rows]);

  const grandTotal = computed.reduce((s, r) => s + r.jumlah, 0);
  const grouped = useMemo(() => {
    const g = {};
    computed.forEach((r) => { (g[r.type.category] ||= []).push(r); });
    return g;
  }, [computed]);

  const updateAdditional = (id, patch) => setAdditional((a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const addAdditionalCategory = () => {
    if (!newAdditionalName.trim()) return;
    setAdditional((a) => [...a, { id: newId(), nama: newAdditionalName.trim(), image: null, ada: null, dims: null, dimsNote: null, reading: false }]);
    setNewAdditionalName('');
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#EDE7D6' }} className="min-h-screen w-full text-[#1E3350]">
      <style>{`
        .bp-grid { background-image: linear-gradient(#1E335014 1px, transparent 1px), linear-gradient(90deg, #1E335014 1px, transparent 1px); background-size: 24px 24px; }
        .display { font-family: 'Big Shoulders', sans-serif; letter-spacing: 0.01em; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        @media print { .no-print { display: none !important; } body { background: white !important; } }
      `}</style>

      <div className="bp-grid border-b-4 border-[#1E3350] px-5 py-6 md:px-10 md:py-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-[#C1440E] p-2 rounded-sm"><HardHat size={22} color="#EDE7D6" /></div>
            <div>
              <p className="mono text-[10px] tracking-[0.25em] uppercase text-[#C1440E] font-bold">Analisa Gambar → RAB</p>
              <h1 className="display text-3xl md:text-4xl font-extrabold uppercase leading-none">RAB Kilat</h1>
            </div>
          </div>
          <button onClick={() => setShowSettings((s) => !s)} className="no-print mono text-[10px] uppercase tracking-widest border border-[#1E3350]/30 rounded-sm px-3 py-1.5 hover:border-[#C1440E]">
            Koneksi AI
          </button>
        </div>

        {showSettings && (
          <div className="no-print mt-4 bg-white border border-[#1E3350]/20 rounded-sm p-4 max-w-xl space-y-3">
            <p className="mono text-[10px] uppercase tracking-widest text-[#1E3350]/50">9Router / H9Master — pengaturan koneksi</p>
            <label className="block text-sm">
              <span className="block text-xs text-[#1E3350]/60 mb-1">Endpoint</span>
              <input value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)}
                className="w-full bg-[#EDE7D6]/40 border border-[#1E3350]/20 rounded-sm px-2 py-1.5 mono text-xs" />
            </label>
            <label className="block text-sm">
              <span className="block text-xs text-[#1E3350]/60 mb-1">Model</span>
              <input value={modelName} onChange={(e) => setModelName(e.target.value)}
                className="w-full bg-[#EDE7D6]/40 border border-[#1E3350]/20 rounded-sm px-2 py-1.5 mono text-xs" />
            </label>
            <label className="block text-sm">
              <span className="block text-xs text-[#1E3350]/60 mb-1">API Key (kalau 9Router lo butuh auth)</span>
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-[#EDE7D6]/40 border border-[#1E3350]/20 rounded-sm px-2 py-1.5 mono text-xs" placeholder="sk-..." />
            </label>
            <p className="text-xs text-[#1E3350]/50">
              Endpoint http:// dari halaman https:// biasanya diblokir browser (mixed content). Kalau gagal, cek Console browser dulu buat lihat error aslinya.
            </p>
          </div>
        )}

        <div className="mt-5">
          <label className="mono text-[10px] uppercase tracking-widest text-[#1E3350]/60">Nama Proyek</label>
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)}
            className="block w-full max-w-md bg-transparent border-b-2 border-[#1E3350]/30 focus:border-[#C1440E] outline-none text-xl font-semibold py-1 mt-1" />
        </div>
      </div>

      <div className="px-5 py-6 md:px-10 md:py-8 max-w-5xl mx-auto space-y-10">

        <section>
          <h2 className="display text-xl font-bold uppercase mb-1">1. Denah Existing vs Rencana</h2>
          <p className="text-sm text-[#1E3350]/60 mb-4">Upload dua gambar ini dulu, sistem bakal bandingin dan nyaranin pekerjaan apa aja yang muncul.</p>
          <div className="flex gap-4">
            <ImageDrop label="Gambar Denah Existing" image={existingImg} onChange={setExistingImg} />
            <ImageDrop label="Gambar Denah Rencana" image={planImg} onChange={setPlanImg} />
          </div>

          <button
            disabled={!existingImg || !planImg || analyzing}
            onClick={analyzeDrawings}
            className="no-print mt-4 flex items-center gap-2 bg-[#1E3350] disabled:bg-[#1E3350]/30 disabled:cursor-not-allowed text-[#EDE7D6] px-4 py-2.5 rounded-sm font-semibold text-sm hover:bg-[#2A4568] transition-colors"
          >
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {analyzing ? 'Menganalisa...' : 'Analisa Perbandingan dengan AI'}
          </button>

          {analysisError && <p className="text-sm text-[#C1440E] mt-2">{analysisError}</p>}

          {suggestions.length > 0 && (
            <div className="mt-5 space-y-2">
              <p className="mono text-[10px] uppercase tracking-widest text-[#1E3350]/50">Saran pekerjaan dari AI — cek dan tambahkan yang relevan</p>
              {suggestions.filter((s) => !s.dismissed).map((s) => (
                <div key={s.id} className="bg-white border border-[#1E3350]/20 rounded-sm px-4 py-3 flex items-start justify-between gap-3 relative">
                  <div className="min-w-0">
                    <span className="mono text-[10px] uppercase tracking-widest text-[#C1440E] font-bold">{s.kategori}</span>
                    <p className="font-medium text-sm">{s.uraian}</p>
                    {s.catatan && <p className="text-xs text-[#1E3350]/50 mt-0.5">{s.catatan}</p>}
                    {(s.panjang || s.lebar || s.tinggi) && (
                      <p className="mono text-xs text-[#1E3350]/60 mt-1">
                        Ukuran terbaca: {[s.panjang && `p${s.panjang}m`, s.lebar && `l${s.lebar}m`, s.tinggi && `t${s.tinggi}m`].filter(Boolean).join(' × ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 no-print relative">
                    <button onClick={() => setPickerForSuggestion(pickerForSuggestion === s.id ? null : s.id)}
                      className="flex items-center gap-1 text-xs font-semibold bg-[#1E3350] text-white px-2.5 py-1.5 rounded-sm hover:bg-[#2A4568]">
                      <Plus size={12} /> Tambahkan
                    </button>
                    <button onClick={() => setSuggestions((arr) => arr.map((x) => (x.id === s.id ? { ...x, dismissed: true } : x)))}
                      className="text-[#1E3350]/40 hover:text-[#C1440E]"><X size={16} /></button>
                    {pickerForSuggestion === s.id && (
                      <ItemPicker
                        defaultCategory={s.kategori}
                        onClose={() => setPickerForSuggestion(null)}
                        onPick={(wid) => { addRow(wid, s.uraian, { p: s.panjang, l: s.lebar, t: s.tinggi }); setPickerForSuggestion(null); setSuggestions((arr) => arr.map((x) => (x.id === s.id ? { ...x, dismissed: true } : x))); }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="display text-xl font-bold uppercase mb-1">2. Gambar Kerja Tambahan</h2>
          <p className="text-sm text-[#1E3350]/60 mb-4">Cek tiap kategori — kalau ada pekerjaannya, upload gambarnya (opsional) lalu tambahkan ke RAB.</p>
          <div className="space-y-2">
            {additional.map((a) => (
              <div key={a.id} className="bg-white border border-[#1E3350]/20 rounded-sm px-4 py-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <input
                    value={a.nama}
                    onChange={(e) => updateAdditional(a.id, { nama: e.target.value })}
                    className="font-semibold bg-transparent border-b border-transparent hover:border-[#1E3350]/20 focus:border-[#C1440E] outline-none min-w-[120px]"
                  />
                  <div className="flex items-center gap-2 no-print">
                    <button onClick={() => updateAdditional(a.id, { ada: true })}
                      className={`px-3 py-1 rounded-sm text-xs font-semibold border ${a.ada === true ? 'bg-[#1E3350] text-white border-[#1E3350]' : 'border-[#1E3350]/30 text-[#1E3350]/60'}`}>
                      Ada
                    </button>
                    <button onClick={() => updateAdditional(a.id, { ada: false })}
                      className={`px-3 py-1 rounded-sm text-xs font-semibold border ${a.ada === false ? 'bg-[#1E3350]/10 text-[#1E3350]/50 border-[#1E3350]/20' : 'border-[#1E3350]/30 text-[#1E3350]/60'}`}>
                      Tidak ada
                    </button>
                    <button onClick={() => setAdditional((arr) => arr.filter((x) => x.id !== a.id))}
                      className="text-[#1E3350]/30 hover:text-[#C1440E]" title="Hapus kategori">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {a.ada === true && (
                  <div className="mt-3">
                    <div className="flex items-end gap-4 flex-wrap">
                      <ImageDrop label={`Gambar ${a.nama}`} image={a.image} onChange={(img) => updateAdditional(a.id, { image: img, dims: null, dimsNote: null })} small />
                      {a.image && (
                        <button
                          disabled={a.reading}
                          onClick={() => readDimsFromImage(a.id, a.image, a.nama)}
                          className="no-print flex items-center gap-1 text-xs font-semibold bg-[#1E3350] disabled:bg-[#1E3350]/30 text-white px-2.5 py-2 rounded-sm hover:bg-[#2A4568]">
                          {a.reading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          {a.reading ? 'Membaca...' : 'Baca ukuran dari gambar'}
                        </button>
                      )}
                      <div className="relative">
                        <button onClick={() => setPickerForAdditional(pickerForAdditional === a.id ? null : a.id)}
                          className="no-print flex items-center gap-1 text-xs font-semibold bg-[#C1440E] text-white px-2.5 py-2 rounded-sm hover:bg-[#A6390B]">
                          <Plus size={12} /> Tambah pekerjaan {a.nama.toLowerCase()}
                        </button>
                        {pickerForAdditional === a.id && (
                          <ItemPicker
                            defaultCategory={a.nama}
                            onClose={() => setPickerForAdditional(null)}
                            onPick={(wid) => { addRow(wid, null, a.dims); setPickerForAdditional(null); }}
                          />
                        )}
                      </div>
                    </div>
                    {a.dimsNote && (
                      <p className="mono text-xs text-[#1E3350]/60 mt-2">
                        {a.dims && (a.dims.p || a.dims.l || a.dims.t) && (
                          <>Ukuran terbaca: {[a.dims.p && `p${a.dims.p}m`, a.dims.l && `l${a.dims.l}m`, a.dims.t && `t${a.dims.t}m`].filter(Boolean).join(' × ')} — </>
                        )}
                        {a.dimsNote}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="no-print flex items-center gap-2 mt-3">
            <input value={newAdditionalName} onChange={(e) => setNewAdditionalName(e.target.value)}
              placeholder="Kategori lain (mis. Plafond, Instalasi Listrik)"
              className="bg-white border border-[#1E3350]/30 rounded-sm px-3 py-1.5 text-sm w-72" />
            <button onClick={addAdditionalCategory} className="text-sm font-semibold text-[#1E3350] hover:underline">+ tambah kategori</button>
          </div>
        </section>

        <section>
          <h2 className="display text-xl font-bold uppercase mb-1">3. Daftar Pekerjaan (RAB)</h2>
          <p className="text-sm text-[#1E3350]/60 mb-4">Isi dimensi tiap pekerjaan, koefisien &amp; harga satuan bisa diedit langsung.</p>

          {computed.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-[#1E3350]/50 bg-white border border-dashed border-[#1E3350]/20 rounded-sm px-4 py-6 justify-center">
              <ImageOff size={16} /> Belum ada pekerjaan. Tambahkan dari saran AI, kategori tambahan, atau manual di bawah.
            </div>
          )}

          <div className="space-y-3">
            {computed.map((row) => (
              <div key={row.id} className="bg-white border-2 border-[#1E3350] rounded-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => toggleOpen(row.id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="mono text-[10px] uppercase tracking-widest text-[#C1440E] font-bold shrink-0">{row.type.category}</span>
                    <span className="font-semibold truncate">{row.label}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="mono text-sm hidden sm:block">{row.volume.toLocaleString('id-ID', { maximumFractionDigits: 2 })} {row.type.unit}</span>
                    <span className="mono font-bold text-[#C1440E]">{rupiah(row.jumlah)}</span>
                    {row.open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {row.open && (
                  <div className="border-t-2 border-[#1E3350]/10 px-4 py-4 bg-[#EDE7D6]/40">
                    <div className="flex flex-wrap gap-4 mb-4">
                      {row.type.unit === 'unit' ? (
                        <label className="text-sm">
                          <span className="block mono text-[10px] uppercase tracking-widest text-[#1E3350]/60 mb-1">Jumlah (unit)</span>
                          <input type="number" value={row.dims.qty ?? 1} onChange={(e) => updateDim(row.id, 'qty', e.target.value)}
                            className="w-28 bg-white border border-[#1E3350]/30 rounded-sm px-2 py-1 mono" />
                        </label>
                      ) : (
                        row.type.dims.map((d) => (
                          <label key={d} className="text-sm">
                            <span className="block mono text-[10px] uppercase tracking-widest text-[#1E3350]/60 mb-1">{DIM_LABEL[d]}</span>
                            <input type="number" value={row.dims[d] ?? 0} onChange={(e) => updateDim(row.id, d, e.target.value)}
                              className="w-28 bg-white border border-[#1E3350]/30 rounded-sm px-2 py-1 mono" />
                          </label>
                        ))
                      )}
                      <div className="flex items-end">
                        <button onClick={() => removeRow(row.id)} className="no-print flex items-center gap-1 text-sm text-[#C1440E] hover:underline mono">
                          <Trash2 size={14} /> hapus item
                        </button>
                      </div>
                    </div>

                    <table className="w-full text-sm">
                      <thead>
                        <tr className="mono text-[10px] uppercase tracking-widest text-[#1E3350]/50 border-b border-[#1E3350]/20">
                          <th className="text-left py-1 font-medium">Bahan / Upah</th>
                          <th className="text-right py-1 font-medium">Koef</th>
                          <th className="text-right py-1 font-medium">Satuan</th>
                          <th className="text-right py-1 font-medium">Harga Satuan</th>
                          <th className="text-right py-1 font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {row.type.components.map((c) => {
                          const price = row.overrides[c.name] ?? c.harga;
                          const subtotal = c.koef * price * row.volume;
                          return (
                            <tr key={c.name} className="border-b border-[#1E3350]/10">
                              <td className="py-1.5">{c.name}</td>
                              <td className="text-right mono py-1.5">{c.koef}</td>
                              <td className="text-right mono py-1.5 text-[#1E3350]/60">{c.satuan}</td>
                              <td className="text-right py-1.5">
                                <input type="number" value={price} onChange={(e) => updatePrice(row.id, c.name, e.target.value)}
                                  className="w-24 text-right bg-white border border-[#1E3350]/20 rounded-sm px-1.5 py-0.5 mono" />
                              </td>
                              <td className="text-right mono py-1.5 font-medium">{rupiah(subtotal)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <p className="text-right mono text-xs mt-2 text-[#1E3350]/60">
                      Harga satuan pekerjaan: <span className="font-bold text-[#1E3350]">{rupiah(row.hargaSatuan)}</span> / {row.type.unit}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="relative mt-4 no-print">
            <button onClick={() => setMainPickerOpen((o) => !o)}
              className="flex items-center gap-2 bg-[#1E3350] text-[#EDE7D6] px-4 py-2.5 rounded-sm font-semibold text-sm hover:bg-[#2A4568] transition-colors">
              <Plus size={16} /> Tambah Pekerjaan Manual
            </button>
            {mainPickerOpen && (
              <ItemPicker onClose={() => setMainPickerOpen(false)} onPick={(wid) => { addRow(wid); setMainPickerOpen(false); }} />
            )}
          </div>
        </section>

        <div className="bg-[#1E3350] text-[#EDE7D6] rounded-sm p-6 relative overflow-hidden">
          <div className="bp-grid absolute inset-0 opacity-10" />
          <div className="relative">
            <p className="mono text-[10px] uppercase tracking-[0.25em] text-[#C1440E] font-bold mb-4">Rekap RAB</p>
            <div className="space-y-1.5 mb-4">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat} className="flex justify-between text-sm">
                  <span className="text-[#EDE7D6]/70">{cat}</span>
                  <span className="mono">{rupiah(items.reduce((s, r) => s + r.jumlah, 0))}</span>
                </div>
              ))}
              {computed.length === 0 && <p className="text-sm text-[#EDE7D6]/40">Belum ada pekerjaan ditambahkan.</p>}
            </div>
            <div className="border-t border-[#EDE7D6]/20 pt-4 flex items-baseline justify-between">
              <span className="display text-lg uppercase font-bold">Total Estimasi</span>
              <span className="display text-3xl md:text-4xl font-extrabold text-[#C1440E]">{rupiah(grandTotal)}</span>
            </div>
          </div>
        </div>

        <button onClick={() => window.print()}
          className="no-print flex items-center gap-2 bg-[#C1440E] text-white px-4 py-2.5 rounded-sm font-semibold text-sm hover:bg-[#A6390B] transition-colors">
          <FileDown size={16} /> Cetak / Simpan sebagai PDF
        </button>

        <div className="no-print flex gap-2 items-start bg-[#1E3350]/5 border border-[#1E3350]/15 rounded-sm px-4 py-3 text-sm">
          <Info size={16} className="mt-0.5 shrink-0 text-[#C1440E]" />
          <p className="text-[#1E3350]/80">
            Koefisien &amp; harga di daftar pekerjaan itu contoh ilustrasi, bukan AHSP resmi — sesuaikan dengan referensi SNI/data lapangan lo. AI cuma bantu nyaranin <em>apa</em> pekerjaannya dari perbandingan gambar; ukuran/volume tetap lo yang input biar akurat.
          </p>
        </div>
      </div>
    </div>
  );
}