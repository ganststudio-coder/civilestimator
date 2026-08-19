import { useMemo, useState } from 'react';
import type { BoqLine, WorkItem } from './types';
import { computeVolume, unitHargaSatuan, rupiah, DIM_LABEL } from './rab';
import ItemPicker from './ItemPicker';
import './styles.css';

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
    <section className="step">
      <h2 className="step-title">Fase 3: Daftar Pekerjaan (RAB)</h2>
      <p className="step-desc">
        Isi dimensi tiap pekerjaan. Koefisien &amp; harga satuan bisa diedit langsung (tidak mengubah default di library).
      </p>

      <div className="info-box">
        <svg
          className="info-box-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <p>
          Analisis Harga Satuan Pekerjaan (AHSP) adalah cara menghitung biaya tenaga kerja, bahan, dan
          alat untuk mendapatkan harga satu jenis pekerjaan konstruksi.
        </p>
      </div>

      {computed.length === 0 && (
        <div className="boq-empty">
          Belum ada pekerjaan. Tambahkan dari saran AI, kategori tambahan, atau manual di bawah.
        </div>
      )}

      <div className="boq">
        {computed.map((row) => (
          <div key={row.id} className="boq-row">
            <div className="boq-row-header" onClick={() => onToggleOpen(row.id)}>
              <div className="boq-row-meta">
                <span className="boq-row-category">{row.type?.kategori || 'Lainnya'}</span>
                <span className="boq-row-label">{row.label}</span>
              </div>
              <div className="boq-row-facts">
                <span className="boq-row-volume">
                  {row.volume.toLocaleString('id-ID', { maximumFractionDigits: 2 })} {row.type?.satuan}
                </span>
                <span className="boq-row-amount">{rupiah(row.jumlah)}</span>
                <span className="boq-row-chevron">{row.open ? '▲' : '▼'}</span>
              </div>
            </div>

            {row.open && row.type && (
              <div className="boq-row-body">
                <div className="boq-dims">
                  {row.type.satuan === 'unit' ? (
                    <label className="dim-field">
                      <span className="dim-label">Jumlah (unit)</span>
                      <input
                        type="number"
                        className="dim-input"
                        value={row.dims.qty ?? '1'}
                        onChange={(e) => onUpdateDim(row.id, 'qty', e.target.value)}
                      />
                    </label>
                  ) : (
                    row.type.dims.map((d) => (
                      <label key={d} className="dim-field">
                        <span className="dim-label">{DIM_LABEL[d] || d}</span>
                        <input
                          type="number"
                          className="dim-input"
                          value={row.dims[d] ?? ''}
                          onChange={(e) => onUpdateDim(row.id, d, e.target.value)}
                        />
                      </label>
                    ))
                  )}
                  <button className="no-print btn btn-danger boq-remove" onClick={() => onRemoveRow(row.id)}>
                    hapus item
                  </button>
                </div>

                <table className="components-table">
                  <thead>
                    <tr>
                      <th>Bahan / Upah</th>
                      <th>Koef</th>
                      <th>Satuan</th>
                      <th>Harga Satuan</th>
                      <th>Subtotal</th>
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
                        <tr key={c.name}>
                          <td>{c.name}</td>
                          <td>
                            <input
                              type="number"
                              className="table-input"
                              value={display(row.overridesKoef[c.name], c.koef)}
                              onChange={(e) => onUpdateOverrideKoef(row.id, c.name, e.target.value)}
                            />
                          </td>
                          <td className="num muted">{c.satuan}</td>
                          <td>
                            <input
                              type="number"
                              className="table-input"
                              value={display(row.overridesHarga[c.name], c.harga)}
                              onChange={(e) => onUpdateOverrideHarga(row.id, c.name, e.target.value)}
                            />
                          </td>
                          <td className="num">{rupiah(subtotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <p className="boq-note">
                  Harga satuan pekerjaan: <strong>{rupiah(row.hargaSatuan)}</strong> / {row.type.satuan}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="no-print picker-anchor">
        <button className="btn btn-primary" onClick={() => setPickerOpen((o) => !o)}>
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

      <div className="rekap">
        <p className="rekap-title">Rekap RAB</p>
        <div className="rekap-list">
          {Object.entries(grouped).map(([cat, total]) => (
            <div key={cat} className="rekap-row">
              <span className="rekap-row-cat">{cat}</span>
              <span className="rekap-row-val">{rupiah(total)}</span>
            </div>
          ))}
        </div>
        {computed.length === 0 && <p className="rekap-empty">Belum ada pekerjaan ditambahkan.</p>}
        <div className="rekap-total">
          <span className="rekap-total-label">Total Estimasi</span>
          <span className="rekap-total-val">{rupiah(grandTotal)}</span>
        </div>
      </div>

      <button className="no-print btn btn-accent" onClick={() => window.print()}>
        Cetak / Simpan sebagai PDF
      </button>
    </section>
  );
}
