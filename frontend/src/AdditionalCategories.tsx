import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000';

interface Category {
  id: string;
  nama: string;
  ada_pekerjaan: boolean;
  image_path: string | null;
  dims: { panjang: number | null; lebar: number | null; tinggi: number | null };
}

export default function AdditionalCategories() {
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', nama: 'Atap', ada_pekerjaan: false, image_path: null, dims: { panjang: null, lebar: null, tinggi: null } },
    { id: '2', nama: 'Pagar', ada_pekerjaan: false, image_path: null, dims: { panjang: null, lebar: null, tinggi: null } },
    { id: '3', nama: 'Tembok Pembatas', ada_pekerjaan: false, image_path: null, dims: { panjang: null, lebar: null, tinggi: null } },
  ]);

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addCategory = () => {
    setCategories([...categories, { id: Date.now().toString(), nama: 'Kategori Baru', ada_pekerjaan: false, image_path: null, dims: { panjang: null, lebar: null, tinggi: null } }]);
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
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
    <div style={{ marginTop: '40px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
      <h2>Langkah 2: Kategori Pekerjaan Tambahan</h2>
      {categories.map(c => (
        <div key={c.id} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
          <input value={c.nama} onChange={(e) => updateCategory(c.id, { nama: e.target.value })} />
          <input type="checkbox" checked={c.ada_pekerjaan} onChange={(e) => updateCategory(c.id, { ada_pekerjaan: e.target.checked })} /> Ada pekerjaan
          <button onClick={() => deleteCategory(c.id)}>Hapus</button>
          {c.ada_pekerjaan && (
            <div style={{ marginTop: '5px' }}>
               <input type="file" onChange={async (e) => {
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
               }} />
               <button 
                 disabled={!c.image_path} 
                 onClick={() => readDims(c.id, c.image_path!)}
               >
                 Baca ukuran dari gambar
               </button>
               <p>P: {c.dims.panjang}, L: {c.dims.lebar}, T: {c.dims.tinggi}</p>
            </div>
          )}
        </div>
      ))}
      <button onClick={addCategory}>+ Tambah Kategori</button>
    </div>
  );
}
