import { getPublicUrl } from './utils';

/**
 * ULTRA-PRECISION MACHINE PHOTO RESOLVER
 * Resolves photos strictly by specific machine name/model criteria.
 * Bulletproof against duplicate IDs, legacy localStorage, or shared brand names like PIPROD.
 */
export function getMachinePhoto(m: any): string | null {
  if (!m) return null;

  const id = (m.id || '').toLowerCase();
  const ref = (m.reference || '').toLowerCase();
  const name = (m.name || m.designation || '').toLowerCase();
  const modele = (m.modele || '').toLowerCase();

  // 1. PCB CNC Technodrill 3 -> Red Technodrill 3 photo (fl-cnc-010.jpg)
  if (name.includes('technodrill') || modele.includes('technodrill') || name.includes('pcb cnc') || id === 'fl-cnc-010') {
    return getPublicUrl('/images/machines/fl-cnc-010.jpg');
  }

  // 2. Fraiseuse CNC TPROD 6060 -> TPROD 6060 CNC photo (fl-cnc-009.jpg)
  if (name.includes('6060') || name.includes('tprod 6060') || (name.includes('tprod') && name.includes('cnc')) || id === 'fl-cnc-009') {
    return getPublicUrl('/images/machines/fl-cnc-009.jpg');
  }

  // 3. Imprimante 3D Raise3D E2CF -> Raise3D E2CF photo (fl-imp-068.jpg)
  if (name.includes('raise3d') || name.includes('e2cf') || modele.includes('e2cf')) {
    return getPublicUrl('/images/machines/fl-imp-068.jpg');
  }

  // 4. Imprimante 3D industrielle FDM/FFF (enceinte fermée) -> Industrial 3D Printer photo (fl-imp-069.jpg)
  if (name.includes('industrielle') || name.includes('enceinte fermée') || name.includes('enceinte fermee') || id === 'fl-imp-069' || ref === 'fl-069') {
    return getPublicUrl('/images/machines/fl-imp-069.jpg');
  }

  // 5. Imprimante 3D Résine SLA (Formlabs Form 3) -> Formlabs Form 3 photo (fl-imp-006.jpg)
  if (name.includes('formlabs') || name.includes('form 3') || name.includes('résine') || name.includes('resine') || name.includes('sla')) {
    return getPublicUrl('/images/machines/fl-imp-006.jpg');
  }

  // 6. Découpeuse Laser CO2 (Trotec / PIPROD) -> Laser CO2 photo (fl-las-007.jpg)
  if ((name.includes('laser') && name.includes('co2')) || name.includes('trotec') || name.includes('piprod') || id === 'fl-las-007' || ref === 'fl-007') {
    return getPublicUrl('/images/machines/fl-las-007.jpg');
  }

  return null;
}

/**
 * Centralized validator for machine photos.
 * Ensures a machine has a non-null, non-empty, non-placeholder valid photo.
 */
export function hasValidMachinePhoto(m: any): boolean {
  if (!m) return false;

  const photo = getMachinePhoto(m);
  if (!photo || typeof photo !== 'string') return false;

  const trimmed = photo.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return false;

  const lower = trimmed.toLowerCase();
  if (
    lower.includes('placeholder') ||
    lower.includes('default') ||
    lower.includes('dummy') ||
    lower.includes('no-image') ||
    lower.includes('fictive') ||
    lower.includes('none')
  ) {
    return false;
  }

  return true;
}

export function getMachinePhotoCandidates(m: any): string[] {
  const photo = getMachinePhoto(m);
  return photo && hasValidMachinePhoto(m) ? [photo] : [];
}
