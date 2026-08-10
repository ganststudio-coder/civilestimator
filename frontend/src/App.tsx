import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000';

export default function App() {
  const [existingImg, setExistingImg] = useState<string | null>(null);
  const [planImg, setPlanImg] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const handleAction = (suggestion: any, action: 'add' | 'skip') => {
    console.log(`${action}ed:`, suggestion);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
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
        images: [existingImg, planImg]
      });
      console.log(res.data);
      // In a real app, parse the AI response here
      setSuggestions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>CivilEstimator - Langkah 1</h1>
      <div style={{ display: 'flex', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Gambar Denah Existing (kondisi saat ini)</label>
          <input type="file" onChange={(e) => handleUpload(e, setExistingImg)} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Gambar Denah Rencana (kondisi yang diinginkan)</label>
          <input type="file" onChange={(e) => handleUpload(e, setPlanImg)} />
        </div>
      </div>
      <button onClick={analyze} disabled={analyzing || !existingImg || !planImg}>
        {analyzing ? 'Menganalisa...' : 'Analisa Perbandingan'}
      </button>
      <div style={{ marginTop: '20px' }}>
        {suggestions.map((s, i) => (
          <div key={i} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '8px' }}>
            <strong>{s.kategori}</strong>
            <p>{s.uraian}</p>
            <p style={{ fontSize: '0.9em', color: '#666' }}>{s.catatan}</p>
            <p style={{ fontSize: '0.9em' }}>
              {[s.panjang && `P: ${s.panjang}m`, s.lebar && `L: ${s.lebar}m`, s.tinggi && `T: ${s.tinggi}m`]
                .filter(Boolean)
                .join(', ')}
            </p>
            <button onClick={() => handleAction(s, 'add')}>Tambahkan</button>
            <button onClick={() => handleAction(s, 'skip')}>Skip</button>
          </div>
        ))}
      </div>
    </div>
  );
}
