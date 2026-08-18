import type { WorkItem } from './types';
import './styles.css';

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
    <div className="picker">
      <div className="picker-header">
        <span className="picker-title">Pilih Jenis Pekerjaan</span>
        <button className="picker-close" onClick={onClose}>✕</button>
      </div>
      {ordered.map((cat) => (
        <div key={cat}>
          <div className="picker-cat">{cat}</div>
          {library
            .filter((w) => w.kategori === cat)
            .map((w) => (
              <button key={w.id} className="picker-item" onClick={() => onPick(w.id)}>
                {w.nama}
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}
