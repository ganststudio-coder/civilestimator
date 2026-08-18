import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import axios from 'axios';
import AdditionalCategories from './AdditionalCategories';
import BoqTable from './BoqTable';
import ItemPicker from './ItemPicker';
import type { BoqLine, RowDims, WorkItem } from './types';
import { computeVolume, unitHargaSatuan } from './rab';
import './styles.css';

const API_BASE = 'http://localhost:3000';

type SuggestedDims = { p?: number | null; l?: number | null; t?: number | null; qty?: number | null };

const fromApi = (l: any): BoqLine => ({
  id: l.id,
  workItemId: l.work_item_id,
  label: l.label,
  dims: {
    p: l.dimensi_json?.p != null ? String(l.dimensi_json.p) : '',
    l: l.dimensi_json?.l != null ? String(l.dimensi_json.l) : '',
    t: l.dimensi_json?.t != null ? String(l.dimensi_json.t) : '',
    qty: l.dimensi_json?.qty != null ? String(l.dimensi_json.qty) : '1',
  },
  overridesHarga: l.overrides_harga_json || {},
  overridesKoef: l.overrides_koef_json || {},
  open: true,
});

const emptyDims = (type: WorkItem | undefined, suggested: SuggestedDims | null | undefined): RowDims => ({
  p: suggested?.p != null ? String(suggested.p) : '',
  l: suggested?.l != null ? String(suggested.l) : '',
  t: suggested?.t != null ? String(suggested.t) : '',
  qty: type?.satuan === 'unit' ? String(suggested?.qty ?? 1) : '1',
});

export default function App() {
  const [existingImg, setExistingImg] = useState<string | null>(null);
  const [planImg, setPlanImg] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [pickerForSuggestion, setPickerForSuggestion] = useState<string | null>(null);

  const [library, setLibrary] = useState<WorkItem[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [rows, setRows] = useState<BoqLine[]>([]);

  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    (async () => {
      try {
        const libRes = await axios.get(`${API_BASE}/api/work-items`);
        setLibrary(libRes.data);

        const projRes = await axios.get(`${API_BASE}/api/projects`);
        let pid = projRes.data[0]?.id;
        if (!pid) {
          const created = await axios.post(`${API_BASE}/api/projects`, { nama: 'Proyek Baru' });
          pid = created.data.id;
        }
        setProjectId(pid);

        const boqRes = await axios.get(`${API_BASE}/api/boq-lines`, { params: { project_id: pid } });
        setRows(boqRes.data.map(fromApi));
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const persistRow = (row: BoqLine) => {
    const type = library.find((w) => w.id === row.workItemId);
    const volume = computeVolume(type, row.dims);
    const hargaSatuan = unitHargaSatuan(type, row.overridesHarga, row.overridesKoef);
    axios
      .put(`${API_BASE}/api/boq-lines/${row.id}`, {
        work_item_id: row.workItemId,
        label: row.label,
        dimensi_json: row.dims,
        overrides_harga_json: row.overridesHarga,
        overrides_koef_json: row.overridesKoef,
        volume,
        harga_satuan: hargaSatuan,
        jumlah: volume * hargaSatuan,
      })
      .catch((err) => console.error(err));
  };

  const schedulePersist = (row: BoqLine) => {
    clearTimeout(timersRef.current[row.id]);
    timersRef.current[row.id] = setTimeout(() => persistRow(row), 400);
  };

  const addRow = async (workItemId: string, label: string | null, suggestedDims: SuggestedDims | null) => {
    if (!projectId) return;
    const type = library.find((w) => w.id === workItemId);
    const dims = emptyDims(type, suggestedDims);
    const volume = computeVolume(type, dims);
    const hargaSatuan = unitHargaSatuan(type, {}, {});
    try {
      const res = await axios.post(`${API_BASE}/api/boq-lines`, {
        project_id: projectId,
        work_item_id: workItemId,
        label: label || type?.nama || '',
        dimensi_json: dims,
        overrides_harga_json: {},
        overrides_koef_json: {},
        volume,
        harga_satuan: hargaSatuan,
        jumlah: volume * hargaSatuan,
      });
      setRows((r) => [...r, fromApi(res.data)]);
    } catch (err) {
      console.error(err);
    }
  };

  const updateDim = (id: string, key: string, val: string) => {
    const next = rows.map((r) => (r.id === id ? { ...r, dims: { ...r.dims, [key]: val } } : r));
    setRows(next);
    schedulePersist(next.find((r) => r.id === id)!);
  };

  const updateOverrideHarga = (id: string, compName: string, val: string) => {
    const next = rows.map((r) =>
      r.id === id ? { ...r, overridesHarga: { ...r.overridesHarga, [compName]: val } } : r,
    );
    setRows(next);
    schedulePersist(next.find((r) => r.id === id)!);
  };

  const updateOverrideKoef = (id: string, compName: string, val: string) => {
    const next = rows.map((r) =>
      r.id === id ? { ...r, overridesKoef: { ...r.overridesKoef, [compName]: val } } : r,
    );
    setRows(next);
    schedulePersist(next.find((r) => r.id === id)!);
  };

  const removeRow = (id: string) => {
    axios.delete(`${API_BASE}/api/boq-lines/${id}`).catch((err) => console.error(err));
    clearTimeout(timersRef.current[id]);
    setRows((r) => r.filter((row) => row.id !== id));
  };

  const toggleOpen = (id: string) => {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, open: !row.open } : row)));
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setter(base64);
    }
  };

  const analyze = async () => {
    if (!existingImg || !planImg) return;
    setAnalyzing(true);
    try {
      const res = await axios.post(`${API_BASE}/api/analyze-drawings`, {
        images: [existingImg, planImg],
      });
      setSuggestions(
        (Array.isArray(res.data) ? res.data : []).map((s: any, i: number) => ({
          id: `${Date.now()}-${i}`,
          dismissed: false,
          ...s,
        })),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const dismissSuggestion = (id: string) =>
    setSuggestions((arr) => arr.map((x) => (x.id === id ? { ...x, dismissed: true } : x)));

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-brand">
            <div className="app-brand-icon">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1z" />
                <path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
                <path d="M4 15v-3a6 6 0 0 1 6-6" />
                <path d="M14 6a6 6 0 0 1 6 6v3" />
              </svg>
            </div>
            <div>
              <p className="app-eyebrow">Analisa Gambar → RAB</p>
              <h1 className="app-title">CivilEstimator</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="step">
          <h2 className="step-title">Fase 1: Denah Existing vs Rencana</h2>
          <div className="upload-row">
            <div className="upload-field">
              <label className="upload-label">Gambar Denah Existing (kondisi saat ini)</label>
              <input className="file-input" type="file" onChange={(e) => handleUpload(e, setExistingImg)} />
            </div>
            <div className="upload-field">
              <label className="upload-label">Gambar Denah Rencana (kondisi yang diinginkan)</label>
              <input className="file-input" type="file" onChange={(e) => handleUpload(e, setPlanImg)} />
            </div>
          </div>
          <button className="btn btn-primary no-print" onClick={analyze} disabled={analyzing || !existingImg || !planImg}>
            {analyzing ? 'Menganalisa...' : 'Analisa Perbandingan'}
          </button>

          <div className="suggestion-list">
            {suggestions
              .filter((s) => !s.dismissed)
              .map((s) => (
                <div key={s.id} className="suggestion">
                  <div className="suggestion-body">
                    <span className="suggestion-cat">{s.kategori}</span>
                    <p className="suggestion-text">{s.uraian}</p>
                    <p className="suggestion-note">{s.catatan}</p>
                    <p className="suggestion-dims">
                      {[s.panjang && `P: ${s.panjang}m`, s.lebar && `L: ${s.lebar}m`, s.tinggi && `T: ${s.tinggi}m`]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                  <div className="suggestion-actions">
                    <div className="picker-anchor">
                      <button className="btn btn-primary btn-sm" onClick={() => setPickerForSuggestion(pickerForSuggestion === s.id ? null : s.id)}>
                        Tambahkan
                      </button>
                      {pickerForSuggestion === s.id && (
                        <ItemPicker
                          library={library}
                          defaultCategory={s.kategori}
                          onClose={() => setPickerForSuggestion(null)}
                          onPick={(wid) => {
                            addRow(wid, s.uraian, { p: s.panjang, l: s.lebar, t: s.tinggi });
                            setPickerForSuggestion(null);
                            dismissSuggestion(s.id);
                          }}
                        />
                      )}
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => dismissSuggestion(s.id)}>
                      Skip
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>

        <AdditionalCategories
          library={library}
          onAddRow={(workItemId, label, dims) => addRow(workItemId, label, dims)}
        />

        <BoqTable
          library={library}
          rows={rows}
          onAddRow={(wid) => addRow(wid, null, null)}
          onUpdateDim={updateDim}
          onUpdateOverrideHarga={updateOverrideHarga}
          onUpdateOverrideKoef={updateOverrideKoef}
          onRemoveRow={removeRow}
          onToggleOpen={toggleOpen}
        />

        <footer className="app-footer">© 2026 Ganst-Zakia</footer>
      </main>
    </div>
  );
}
