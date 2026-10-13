/** Menu GF yang DIHAPUS dari clone (keputusan user — tidak berguna untuk versi web). */
export const REMOVED_MENU_IDS = new Set<number>([
  24489, // Create Indexes
  24490, // Repair Databases
  24491, // Check Databases
  24492, // Hapus Cache Laporan
  24493, // Hapus File Sementara
  24495, // Hapus Seluruh Data
  24497, // Backup or Restore Data
  24500, // Add New Background
  24501, // Show Next Background
  24502, // Delete Current Background
  24504, // Export Data
  24505, // Import Data
  24529, // POS Export Data
  24530, // POS Import Data
]);

export function isRemoved(id?: number | null): boolean {
  return id != null && REMOVED_MENU_IDS.has(id);
}
