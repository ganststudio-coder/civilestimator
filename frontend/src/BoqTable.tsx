import { useMemo, useState } from 'react';
import type { BoqLine, WorkItem } from './types';
import { computeVolume, unitHargaSatuan, rupiah, DIM_LABEL } from './rab';
import ItemPicker from './ItemPicker';

interface BoqTableProps {
  library: WorkItem[];
  rows: BoqLine[];
  onAddRow: (workItemId: string) => void;
  onUpdateDim: (id: string, key: string, val: string) => void;
  onUpdateOverrideHarga: (id: string, compName: string, val: string) => void;
  onUpdateOverrideKoef: (id: string, compName: string, val: string) => void;
  onRemoveRow: (id: string) => void;
  onToggleOpen: (id: string) => void;
}

export default function BoqTable({
  library,
  rows,
  onAddRow,
  onUpdateDim,
  onUpdateOverrideHarga,
  onUpdateOverrideKoef,
  onRemoveRow,
  onToggleOpen,
}: BoqTableProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const computed = useMemo(
    () =>
      rows.map((row) => {
        const type = library.find((w) => w.id === row.workItemId);
        const volume = computeVolume(type, row.dims);
        const hargaSatuan = unitHargaSatuan(type, row.overridesHarga, row.overridesKoef);
        return { ...row, type, volume, hargaSatuan, jumlah: volume * hargaSatuan };
      }),
    [rows, library],
  );

  const grandTotal = computed.reduce((s, r) => s + r.jumlah, 0);

  const grouped = useMemo(() => {
    const g: Record<string, number> = {};
    computed.forEach((r) => {
      const cat = r.type?.kategori || 'Lainnya';
      g[cat] = (g[cat] || 0) + r.jumlah;
    });
    return g;
  }, [computed]);

  const display = (override: string | undefined, def: number) =>
    override !== undefined ? override : String(def);

  return (
    <div style={{ marginTop: '40px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
      <h2>Langkah 3: Daftar Pekerjaan (RAB)</h2>
      <p style={{ color: '#666', marginBottom: '12px' }}>
        Isi dimensi tiap pekerjaan. Koefisien &amp; harga satuan bisa diedit langsung (tidak mengubah default di library).
      </p>

      {computed.length === 0 && (
        <div
          style={{
            border: '1px dashed #ccc',
            borderRadius: '8px',
            padding: '24px',
            color: '#666',
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          Belum ada pekerjaan. Tambahkan dari saran AI, kategori tambahan, atau manual di bawah.
        </div>
      )}

      {computed.map((row) => (
        <div
          key={row.id}
          style={{ border: '1px solid #ddd', borderRadius: '8px', marginBottom: '10px', overflow: 'hidden' }}
        >
          <div
            onClick={() => onToggleOpen(row.id)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              cursor: 'pointer',
              background: '#fafafa',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#c1440e', textTransform: 'uppercase' }}>
                {row.type?.kategori || 'Lainnya'}
              </span>
              <span style={{ marginLeft: '8px', fontWeight: 600 }}>{row.label}</span>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#666' }}>
                {row.volume.toLocaleString('id-ID', { maximumFractionDigits: 2 })} {row.type?.satuan}
              </span>
              <span style={{ fontWeight: 700, color: '#c1440e' }}>{rupiah(row.jumlah)}</span>
              <span>{row.open ? '▲' : '▼'}</span>
            </div>
          </div>

          {row.open && row.type && (
            <div style={{ padding: '12px 14px', borderTop: '1px solid #eee' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {row.type.satuan === 'unit' ? (
                  <label style={{ fontSize: '14px' }}>
                    <span style={{ display: 'block', fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                      Jumlah (unit)
                    </span>
                    <input
                      type="number"
                      value={row.dims.qty ?? '1'}
                      onChange={(e) => onUpdateDim(row.id, 'qty', e.target.value)}
                      style={{ width: '110px', padding: '4px 6px' }}
                    />
                  </label>
                ) : (
                  row.type.dims.map((d) => (
                    <label key={d} style={{ fontSize: '14px' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                        {DIM_LABEL[d] || d}
                      </span>
                      <input
                        type="number"
                        value={row.dims[d] ?? ''}
                        onChange={(e) => onUpdateDim(row.id, d, e.target.value)}
                        style={{ width: '110px', padding: '4px 6px' }}
                      />
                    </label>
                  ))
                )}
                <button className="no-print" onClick={() => onRemoveRow(row.id)} style={{ alignSelf: 'flex-end', color: '#c1440e', border: 'none', background: 'none', cursor: 'pointer' }}>
                  hapus item
                </button>
              </div>

              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                    <th style={{ textAlign: 'left', padding: '4px', fontWeight: 600 }}>Bahan / Upah</th>
                    <th style={{ textAlign: 'right', padding: '4px', fontWeight: 600 }}>Koef</th>
                    <th style={{ textAlign: 'right', padding: '4px', fontWeight: 600 }}>Satuan</th>
                    <th style={{ textAlign: 'right', padding: '4px', fontWeight: 600 }}>Harga Satuan</th>
                    <th style={{ textAlign: 'right', padding: '4px', fontWeight: 600 }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {row.type.components.map((c) => {
                    const koef =
                      row.overridesKoef[c.name] == null || row.overridesKoef[c.name] === ''
                        ? c.koef
                        : Number(row.overridesKoef[c.name]);
                    const harga =
                      row.overridesHarga[c.name] == null || row.overridesHarga[c.name] === ''
                        ? c.harga
                        : Number(row.overridesHarga[c.name]);
                    const subtotal = koef * harga * row.volume;
                    return (
                      <tr key={c.name} style={{ borderBottom: '1px solid #f3f3f3' }}>
                        <td style={{ padding: '4px' }}>{c.name}</td>
                        <td style={{ textAlign: 'right', padding: '4px' }}>
                          <input
                            type="number"
                            value={display(row.overridesKoef[c.name], c.koef)}
                            onChange={(e) => onUpdateOverrideKoef(row.id, c.name, e.target.value)}
                            style={{ width: '80px', textAlign: 'right', padding: '2px 4px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', padding: '4px', color: '#666' }}>{c.satuan}</td>
                        <td style={{ textAlign: 'right', padding: '4px' }}>
                          <input
                            type="number"
                            value={display(row.overridesHarga[c.name], c.harga)}
                            onChange={(e) => onUpdateOverrideHarga(row.id, c.name, e.target.value)}
                            style={{ width: '110px', textAlign: 'right', padding: '2px 4px' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', padding: '4px', fontWeight: 500 }}>{rupiah(subtotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <p style={{ textAlign: 'right', fontSize: '12px', color: '#666', marginTop: '8px' }}>
                Harga satuan pekerjaan: <strong>{rupiah(row.hargaSatuan)}</strong> / {row.type.satuan}
              </p>
            </div>
          )}
        </div>
      ))}

      <div className="no-print" style={{ position: 'relative', marginTop: '16px' }}>
        <button onClick={() => setPickerOpen((o) => !o)} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          + Tambah Pekerjaan Manual
        </button>
        {pickerOpen && (
          <ItemPicker
            library={library}
            onClose={() => setPickerOpen(false)}
            onPick={(wid) => {
              onAddRow(wid);
              setPickerOpen(false);
            }}
          />
        )}
      </div>

      <div style={{ marginTop: '24px', border: '1px solid #ddd', borderRadius: '8px', padding: '16px', background: '#fafafa' }}>
        <h3 style={{ margin: '0 0 12px' }}>Rekap RAB</h3>
        {Object.entries(grouped).map(([cat, total]) => (
          <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '2px 0' }}>
            <span>{cat}</span>
            <span>{rupiah(total)}</span>
          </div>
        ))}
        {computed.length === 0 && <p style={{ color: '#999', fontSize: '13px' }}>Belum ada pekerjaan ditambahkan.</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', marginTop: '12px', paddingTop: '12px', fontWeight: 700, fontSize: '18px' }}>
          <span>Total Estimasi</span>
          <span>{rupiah(grandTotal)}</span>
        </div>
      </div>

      <button className="no-print" onClick={() => window.print()} style={{ marginTop: '16px', padding: '8px 16px', cursor: 'pointer' }}>
        Cetak / Simpan sebagai PDF
      </button>
    </div>
  );
}
