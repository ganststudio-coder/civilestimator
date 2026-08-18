import { useState } from 'react';
import axios from 'axios';
import type { WorkItem } from './types';
import ItemPicker from './ItemPicker';
import './styles.css';

const API_BASE = 'http://localhost:3000';

interface Category {
  id: string;
  nama: string;
  ada_pekerjaan: boolean;
  image_path: string | null;
  dims: { panjang: number | null; lebar: number | null; tinggi: number | null };
}

interface AdditionalCategoriesProps {
  library: WorkItem[];
  onAddRow: (
    workItemId: string,
    label: string | null,
    dims: { p?: number | null; l?: number | null; t?: number | null } | null,
  ) => void;
}

export default function AdditionalCategories({ library, onAddRow }: AdditionalCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', nama: 'Atap', ada_pekerjaan: false, image_path: null, dims: { panjang: null, lebar: null, tinggi: null } },
    { id: '2', nama: 'Pagar', ada_pekerjaan: false, image_path: null, dims: { panjang: null, lebar: null, tinggi: null } },
    { id: '3', nama: 'Tembok Pembatas', ada_pekerjaan: false, image_path: null, dims: { panjang: null, lebar: null, tinggi: null } },
  ]);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(categories.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const addCategory = () => {
    setCategories([
      ...categories,
      { id: Date.now().toString(), nama: 'Kategori Baru', ada_pekerjaan: false, image_path: null, dims: { panjang: null, lebar: null, tinggi: null } },
    ]);
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
  };

  const readDims = async (id: string, image_path: string) => {
    try {
      const res = await axios.post(`${API_BASE}/api/read-drawing-dims`, { image_path });
      updateCategory(id, { dims: res.data });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className="step">
      <h2 className="step-title">Fase 2: Kategori Pekerjaan Tambahan</h2>
      {categories.map((c) => (
        <div key={c.id} className="cat-card">
          <div className="cat-header">
            <input className="cat-name" value={c.nama} onChange={(e) => updateCategory(c.id, { nama: e.target.value })} />
            <label className="cat-check">
              <input type="checkbox" checked={c.ada_pekerjaan} onChange={(e) => updateCategory(c.id, { ada_pekerjaan: e.target.checked })} /> Ada pekerjaan
            </label>
            <button className="btn btn-ghost btn-sm" onClick={() => deleteCategory(c.id)}>Hapus</button>
          </div>
          {c.ada_pekerjaan && (
            <div className="cat-body">
              <input
                className="file-input"
                type="file"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append('drawing', file);
                    try {
                      const res = await axios.post(`${API_BASE}/api/upload`, formData);
                      updateCategory(c.id, { image_path: res.data.filePath });
                    } catch (err) {
                      console.error('Upload failed', err);
                    }
                  }
                }}
              />
              <button className="btn btn-primary btn-sm" disabled={!c.image_path} onClick={() => readDims(c.id, c.image_path!)}>
                Baca ukuran dari gambar
              </button>
              <p className="cat-dims">P: {c.dims.panjang}, L: {c.dims.lebar}, T: {c.dims.tinggi}</p>

              <div className="picker-anchor">
                <button className="btn btn-accent btn-sm" onClick={() => setPickerFor(pickerFor === c.id ? null : c.id)}>
                  + Tambah pekerjaan {c.nama.toLowerCase()}
                </button>
                {pickerFor === c.id && (
                  <ItemPicker
                    library={library}
                    defaultCategory={c.nama}
                    onClose={() => setPickerFor(null)}
                    onPick={(wid) => {
                      onAddRow(wid, null, { p: c.dims.panjang, l: c.dims.lebar, t: c.dims.tinggi });
                      setPickerFor(null);
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      <button className="btn btn-ghost" onClick={addCategory}>+ Tambah Kategori</button>
    </section>
  );
}
