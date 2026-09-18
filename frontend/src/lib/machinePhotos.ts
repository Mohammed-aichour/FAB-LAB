import { getPublicUrl } from './utils';

/**
 * STRICT & ROBUST MACHINE PHOTO RESOLVER
 * Maps each of the 5 FabLab machines directly to its authentic photo from `image machine`.
 * Matches by Machine ID, Reference, Code EQ, or Name/Designation keywords to guarantee 100% correct photo rendering.
 */
export function getMachinePhoto(m: any): string | null {
  if (!m) return null;

  const id = (m.id || '').toLowerCase();
  const ref = (m.reference || '').toLowerCase();
  const name = (m.name || m.designation || '').toLowerCase();
  const marque = (m.marque || '').toLowerCase();
  const modele = (m.modele || '').toLowerCase();

  // 1. Fraiseuse CNC PIPROD TPROD 6060 -> fl-cnc-009.jpg
  if (id === 'fl-cnc-009' || ref === 'fl-009' || name.includes('tprod') || name.includes('6060')) {
    return getPublicUrl('/images/machines/fl-cnc-009.jpg');
  }

  // 2. Machine PCB CNC (Technodrill 3) -> fl-cnc-010.jpg
  if (id === 'fl-cnc-010' || ref === 'fl-010' || name.includes('technodrill') || name.includes('pcb cnc') || modele.includes('technodrill')) {
    return getPublicUrl('/images/machines/fl-cnc-010.jpg');
  }

  // 3. Découpeuse Laser CO2 (Trotec / PIPROD) -> fl-las-007.jpg
  if (id === 'fl-las-007' || ref === 'fl-007' || (name.includes('laser') && name.includes('co2')) || name.includes('piprod') || marque.includes('trotec') || name.includes('trotec')) {
    return getPublicUrl('/images/machines/fl-las-007.jpg');
  }

  // 4. Imprimante 3D Raise3D E2CF -> fl-imp-068.jpg
  if (id === 'fl-imp-068' || ref === 'fl-068' || name.includes('raise3d') || name.includes('e2cf') || modele.includes('e2cf')) {
    return getPublicUrl('/images/machines/fl-imp-068.jpg');
  }

  // 5. Imprimante 3D Résine SLA (Formlabs Form 3) -> fl-imp-006.jpg
  if (id === 'fl-imp-006' || ref === 'fl-006' || name.includes('formlabs') || name.includes('form 3') || name.includes('résine') || name.includes('resine') || name.includes('sla')) {
    return getPublicUrl('/images/machines/fl-imp-006.jpg');
  }

  return null;
}

export function getMachinePhotoCandidates(m: any): string[] {
  const photo = getMachinePhoto(m);
  return photo ? [photo] : [];
}
