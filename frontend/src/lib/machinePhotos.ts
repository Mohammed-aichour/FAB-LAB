import { getPublicUrl } from './utils';

/**
 * STRICT MACHINE PHOTO RESOLVER
 * Maps each of the 5 FabLab machines directly to its authentic photo from `image machine`.
 */
export function getMachinePhoto(m: any): string | null {
  if (!m) return null;

  const id = (m.id || '').toLowerCase();

  // 1. Fraiseuse CNC PIPROD TPROD 6060 -> WhatsApp Image 2026-09-17 at 10.09.49 PM.jpeg
  if (id === 'fl-cnc-009') {
    return getPublicUrl('/images/machines/fl-cnc-009.jpg');
  }

  // 2. Machine PCB CNC Technodrill 3 -> WhatsApp Image 2026-09-17 at 10.10.14 PM.jpeg
  if (id === 'fl-cnc-010') {
    return getPublicUrl('/images/machines/fl-cnc-010.jpg');
  }

  // 3. Découpeuse Laser CO2 PIPROD / Trotec -> WhatsApp Image 2026-09-17 at 10.10.25 PM.jpeg
  if (id === 'fl-las-007') {
    return getPublicUrl('/images/machines/fl-las-007.jpg');
  }

  // 4. Imprimante 3D Raise3D E2CF -> WhatsApp Image 2026-09-17 at 10.10.58 PM.jpeg
  if (id === 'fl-imp-068') {
    return getPublicUrl('/images/machines/fl-imp-068.jpg');
  }

  // 5. Imprimante 3D Résine SLA Formlabs Form 3 -> WhatsApp Image 2026-09-17 at 10.12.05 PM.jpeg
  if (id === 'fl-imp-006') {
    return getPublicUrl('/images/machines/fl-imp-006.jpg');
  }

  return null;
}

export function getMachinePhotoCandidates(m: any): string[] {
  const photo = getMachinePhoto(m);
  return photo ? [photo] : [];
}
