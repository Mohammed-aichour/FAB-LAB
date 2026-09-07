import crypto from 'crypto';
import { z } from 'zod';
import { readEntity } from './json-store';

type Row = Record<string, any>;
const normalize = (v: unknown) => String(v ?? '').trim().toLocaleLowerCase('fr');
export function unique(records: Row[], query: string, fields: string[], label: string): Row {
  if (!query.trim()) throw new Error(`${label} : référence requise.`);
  const exact = records.filter(r => fields.some(f => normalize(r[f]) === normalize(query)));
  const found = exact.length ? exact : records.filter(r => fields.some(f => normalize(r[f]).includes(normalize(query))));
  if (found.length !== 1) throw new Error(found.length ? `${label} ambigu : précisez un identifiant exact.` : `${label} introuvable dans les données actuelles.`);
  return found[0];
}
export function suppliers(): Row[] {
  return readEntity<Row[]>('suppliers').filter(s => s.code !== 'Code').map(s => ({
    ...s, domain: s.domain ?? s.domaine ?? '', email: s.email || (z.email().safeParse(s.telEmail).success ? s.telEmail : ''),
    phone: s.phone || (s.telEmail && !String(s.telEmail).includes('@') ? s.telEmail : ''),
    delaiJours: s.delaiJours ?? s.delaiMoyenJours ?? null,
    evaluation: s.evaluation ?? '', francoMAD: s.francoMAD ?? '', paymentTerms: s.paymentTerms ?? '',
  }));
}
export function componentSupplier(query: string) {
  const component = unique(readEntity<Row[]>('stock'), query, ['id', 'reference', 'name'], 'Composant');
  const linked = suppliers().filter(s => [s.id, s.code, s.name].some(v => normalize(v) === normalize(component.supplierId ?? component.supplier)));
  return { component, supplier: linked.length === 1 ? linked[0] : null,
    missing: linked.length === 1 ? [] : ['Fournisseur associé absent ou non identifiable avec certitude.'] };
}
export const purchaseSchema = z.object({ component: z.string().min(1).max(200), quantity: z.number().positive().max(1000000), kind: z.enum(['commande', 'devis', 'reapprovisionnement']) }).strict();
export function buildPurchase(raw: unknown) {
  const input = purchaseSchema.parse(raw);
  const { component, supplier } = componentSupplier(input.component);
  if (!supplier) throw new Error('Aucun fournisseur associé identifiable. Complétez la fiche composant avant de préparer une commande.');
  if (supplier.status === 'Inactif') throw new Error('Le fournisseur est inactif.');
  const rawPrice = component.unitCostMAD ?? component.priceMAD;
  const price = typeof rawPrice === 'number' && Number.isFinite(rawPrice) && rawPrice >= 0 ? rawPrice : null;
  const reference = component.refSupplier || null;
  const subject = `${input.kind === 'devis' ? 'Demande de devis' : 'Demande de commande'} — ${input.quantity} ${component.unit || 'unité(s)'} de ${component.name}`;
  const body = `Bonjour,\n\nNous souhaitons ${input.kind === 'devis' ? 'obtenir un devis pour' : 'commander'} ${input.quantity} ${component.unit || 'unité(s)'} de ${component.name}.\nRéférence fournisseur : ${reference || 'non renseignée, merci de la confirmer'}.\nÉquipement concerné : ${component.equipement || 'non renseigné'}.\n${price === null ? 'Prix non renseigné.' : `Prix unitaire connu : ${price} MAD (à confirmer).`}\n\nMerci de confirmer la disponibilité, le prix et le délai de livraison.\n\nCordialement,\nFabLab`;
  return { id: crypto.randomUUID(), reference: `CDE-${crypto.randomUUID().slice(0, 8)}`, createdAt: new Date().toISOString(),
    kind: input.kind, status: 'En attente', componentId: component.id, componentReference: component.reference, componentName: component.name,
    supplierId: supplier.id, supplierName: supplier.name, quantity: input.quantity, unit: component.unit || null,
    productReference: reference, unitPriceMAD: price, totalEstimatedMAD: price === null ? null : price * input.quantity,
    email: { to: supplier.email || null, subject, body, status: 'Brouillon — non envoyé' },
    missing: [!reference && 'Référence fournisseur', !supplier.email && 'Email fournisseur', price === null && 'Prix'].filter(Boolean),
    sourceComponent: component, sourceSupplier: supplier,
  };
}
