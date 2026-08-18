export interface WorkItemComponent {
  name: string;
  satuan: string;
  koef: number;
  harga: number;
}

export interface WorkItem {
  id: string;
  nama: string;
  kategori: string;
  satuan: string;
  dims: string[];
  components: WorkItemComponent[];
}

export interface RowDims {
  p: string;
  l: string;
  t: string;
  qty: string;
  [key: string]: string;
}

export interface BoqLine {
  id: string;
  workItemId: string;
  label: string;
  dims: RowDims;
  overridesHarga: Record<string, string>;
  overridesKoef: Record<string, string>;
  open: boolean;
}

export interface Suggestion {
  uraian: string;
  kategori: string;
  catatan: string;
  panjang: number | null;
  lebar: number | null;
  tinggi: number | null;
  [key: string]: unknown;
}

export interface CategoryDims {
  panjang: number | null;
  lebar: number | null;
  tinggi: number | null;
}
