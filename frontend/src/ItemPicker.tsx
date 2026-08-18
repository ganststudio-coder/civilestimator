import type { WorkItem } from './types';

interface ItemPickerProps {
  library: WorkItem[];
  onPick: (workItemId: string) => void;
  onClose: () => void;
  defaultCategory?: string | null;
}

export default function ItemPicker({ library, onPick, onClose, defaultCategory }: ItemPickerProps) {
  const categories = [...new Set(library.map((w) => w.kategori))];
  const ordered = defaultCategory
    ? [defaultCategory, ...categories.filter((c) => c !== defaultCategory)]
    : categories;

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 20,
        marginTop: '8px',
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        width: '320px',
        maxHeight: '320px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px',
          borderBottom: '1px solid #eee',
          position: 'sticky',
          top: 0,
          background: '#fff',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
          Pilih Jenis Pekerjaan
        </span>
        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
          ✕
        </button>
      </div>
      {ordered.map((cat) => (
        <div key={cat}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#c1440e', padding: '8px 12px 2px' }}>
            {cat}
          </div>
          {library
            .filter((w) => w.kategori === cat)
            .map((w) => (
              <button
                key={w.id}
                onClick={() => onPick(w.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 12px',
                  fontSize: '14px',
                  border: 'none',
                  borderBottom: '1px solid #f3f3f3',
                  background: 'none',
                  cursor: 'pointer',
                }}
              >
                {w.nama}
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}
