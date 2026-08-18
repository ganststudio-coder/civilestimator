import type { WorkItem, RowDims } from './types';

export const DIM_LABEL: Record<string, string> = {
  p: 'Panjang (m)',
  l: 'Lebar (m)',
  t: 'Tinggi (m)',
};

export const rupiah = (n: number) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');

export function computeVolume(type: WorkItem | undefined, dims: RowDims): number {
  if (!type) return 0;
  if (type.satuan === 'unit') return Number(dims.qty) || 0;
  if (type.dims.length === 1) return Number(dims[type.dims[0]]) || 0;
  if (type.dims.length === 2)
    return (Number(dims[type.dims[0]]) || 0) * (Number(dims[type.dims[1]]) || 0);
  if (type.dims.length === 3)
    return (
      (Number(dims[type.dims[0]]) || 0) *
      (Number(dims[type.dims[1]]) || 0) *
      (Number(dims[type.dims[2]]) || 0)
    );
  return 0;
}

export function unitHargaSatuan(
  type: WorkItem | undefined,
  overridesHarga: Record<string, string>,
  overridesKoef: Record<string, string>,
): number {
  if (!type) return 0;
  return type.components.reduce((sum, c) => {
    const koef =
      overridesKoef[c.name] == null || overridesKoef[c.name] === ''
        ? c.koef
        : Number(overridesKoef[c.name]);
    const harga =
      overridesHarga[c.name] == null || overridesHarga[c.name] === ''
        ? c.harga
        : Number(overridesHarga[c.name]);
    return sum + koef * harga;
  }, 0);
}
