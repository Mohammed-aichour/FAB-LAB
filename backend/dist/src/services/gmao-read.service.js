"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchEntity = matchEntity;
exports.resolveMachine = resolveMachine;
exports.matchesMachineRecord = matchesMachineRecord;
exports.legacyReadTool = legacyReadTool;
const json_store_1 = require("./json-store");
function stripAccents(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function normalize(value) {
    return stripAccents(String(value ?? '').trim().toLowerCase()).replace(/\s+/g, ' ');
}
function matchEntity(record, query, fields) {
    if (!query || !query.trim())
        return true;
    const q = normalize(query);
    const refMatch = query.match(/\b(FL-[A-Z0-9-]+|PR-[0-9]+|OT-[A-Z0-9-]+)\b/i);
    if (refMatch) {
        const targetRef = normalize(refMatch[0]);
        if (normalize(record.reference) === targetRef ||
            normalize(record.id) === targetRef ||
            normalize(record.otNumber) === targetRef ||
            normalize(record.codeArborescence).includes(targetRef)) {
            return true;
        }
    }
    if (fields.some(f => {
        const val = normalize(record[f]);
        if (!val)
            return false;
        if (val.includes(q))
            return true;
        if ((f === 'reference' || f === 'id' || f === 'otNumber') && val.length >= 3 && q.includes(val))
            return true;
        return false;
    })) {
        return true;
    }
    const stopWords = new Set(['pour', 'cette', 'machine', 'les', 'des', 'dans', 'sur', 'une', 'avec', 'actuellement', 'donne', 'moi', 'informations', 'cree', 'fais', 'intervention', 'statut']);
    const words = q.split(' ').filter(w => w.length > 2 && !stopWords.has(w));
    if (words.length > 0) {
        const fullText = normalize(fields.map(f => record[f]).join(' '));
        return words.some(w => fullText.includes(w));
    }
    return false;
}
const matches = (record, query, fields) => matchEntity(record, query, fields);
function resolveMachine(query) {
    if (!query || typeof query !== 'string' || !query.trim())
        return null;
    const raw = query.trim();
    const nQuery = normalize(raw);
    const machines = (0, json_store_1.readEntity)('machines');
    if (!machines || machines.length === 0)
        return null;
    // 1. Direct reference pattern extraction (e.g. FL-009, FL-CNC-02, FL-ELE-01, FL-IMP-068, fl-cnc-009)
    const refMatch = raw.match(/\b(FL-[A-Z0-9-]+)\b/i);
    if (refMatch) {
        const targetRef = normalize(refMatch[1]);
        const found = machines.find((m) => normalize(m.reference) === targetRef ||
            normalize(m.id) === targetRef ||
            normalize(m.codeArborescence) === targetRef ||
            (m.codeArborescence && normalize(m.codeArborescence).split('/').some((part) => normalize(part) === targetRef)));
        if (found)
            return found;
    }
    // 2. Exact match on normalized reference, id, name, designation
    const exact = machines.find((m) => normalize(m.reference) === nQuery ||
        normalize(m.id) === nQuery ||
        normalize(m.name) === nQuery ||
        normalize(m.designation) === nQuery);
    if (exact)
        return exact;
    // 3. Substring match on reference, id, name, designation, codeArborescence
    const substringMatches = machines.filter((m) => {
        const ref = normalize(m.reference);
        const id = normalize(m.id);
        const name = normalize(m.name);
        const des = normalize(m.designation);
        const code = normalize(m.codeArborescence);
        if (ref && (nQuery.includes(ref) || (ref.length >= 3 && ref.includes(nQuery))))
            return true;
        if (id && (nQuery.includes(id) || id.includes(nQuery)))
            return true;
        if (name && (nQuery.includes(name) || name.includes(nQuery)))
            return true;
        if (des && (nQuery.includes(des) || des.includes(nQuery)))
            return true;
        if (code && (nQuery.includes(code) || code.includes(nQuery)))
            return true;
        return false;
    });
    if (substringMatches.length === 1)
        return substringMatches[0];
    // 4. Token-based match / scoring
    const stopWords = new Set([
        'pour', 'cette', 'machine', 'les', 'des', 'dans', 'sur', 'une', 'avec',
        'actuellement', 'donne', 'moi', 'informations', 'cree', 'fais', 'intervention',
        'statut', 'quelle', 'est', 'la', 'de', 'du', 'des', 'pannes', 'interventions',
        'liees', 'a', 'bientot', 'analyse', 'maintenance', 'preventive', 'corrective',
        'panne', 'raison'
    ]);
    const words = nQuery.split(' ').filter((w) => w.length > 2 && !stopWords.has(w));
    if (words.length > 0) {
        const pool = substringMatches.length > 0 ? substringMatches : machines;
        const scored = pool
            .map((m) => {
            const fullText = normalize([m.reference, m.id, m.name, m.designation, m.codeArborescence, m.category, m.atelier].join(' '));
            const score = words.reduce((acc, w) => acc + (fullText.includes(w) ? 1 : 0), 0);
            return { machine: m, score };
        })
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score);
        if (scored.length > 0 && (scored.length === 1 || scored[0].score > scored[1].score)) {
            return scored[0].machine;
        }
    }
    return null;
}
function matchesMachineRecord(record, machine) {
    if (!record || !machine)
        return false;
    const mRef = normalize(machine.reference);
    const mId = normalize(machine.id);
    const mName = normalize(machine.name);
    const mDes = normalize(machine.designation);
    const mCode = normalize(machine.codeArborescence);
    const recEqId = normalize(record.equipmentId || record.fl_id);
    const recEqName = normalize(record.equipmentName || record.equipement);
    if (recEqId) {
        if (mRef && recEqId === mRef)
            return true;
        if (mId && recEqId === mId)
            return true;
        if (mCode && mCode.includes(recEqId))
            return true;
        if (mRef && recEqId.includes(mRef))
            return true;
    }
    if (recEqName) {
        if (mRef && recEqName.includes(mRef))
            return true;
        if (mName && (recEqName.includes(mName) || mName.includes(recEqName)))
            return true;
        if (mDes && (recEqName.includes(mDes) || mDes.includes(recEqName)))
            return true;
    }
    return false;
}
function legacyReadTool(name, args) {
    if (name === 'search_machines') {
        const resolved = resolveMachine(args.query);
        if (resolved)
            return [resolved];
        return (0, json_store_1.readEntity)('machines').filter((record) => matchEntity(record, args.query, ['id', 'reference', 'name', 'designation', 'atelier', 'category', 'status', 'codeArborescence']));
    }
    if (name === 'search_stock') {
        return (0, json_store_1.readEntity)('stock').filter((record) => matches(record, args.query, ['id', 'reference', 'name', 'category', 'equipement', 'supplier']) && (!args.lowStockOnly || Number(record.quantity) <= Number(record.min)));
    }
    if (name === 'list_interventions') {
        const resolvedMachine = args.machine ? resolveMachine(args.machine) : null;
        return (0, json_store_1.readEntity)('interventions').filter((record) => {
            if (args.machine) {
                if (resolvedMachine) {
                    if (!matchesMachineRecord(record, resolvedMachine))
                        return false;
                }
                else {
                    if (!matches(record, args.machine, ['equipmentId', 'equipmentName']))
                        return false;
                }
            }
            if (args.status && !normalize(record.status).includes(normalize(args.status)))
                return false;
            if (args.technician && !normalize(record.technician).includes(normalize(args.technician)))
                return false;
            return true;
        });
    }
    if (name === 'list_maintenance') {
        const today = new Date().toISOString().slice(0, 10);
        const resolvedMachine = args.machine ? resolveMachine(args.machine) : null;
        return (0, json_store_1.readEntity)('preventif').filter((record) => {
            if (args.machine) {
                if (resolvedMachine) {
                    if (!matchesMachineRecord(record, resolvedMachine))
                        return false;
                }
                else {
                    if (!matches(record, args.machine, ['fl_id', 'equipement']))
                        return false;
                }
            }
            if (args.overdueOnly && (!record.prochaineEcheance || record.prochaineEcheance >= today || record.statut === 'Terminé'))
                return false;
            return true;
        });
    }
    if (name === 'list_technicians') {
        return (0, json_store_1.readEntity)('users').filter((record) => record.status === 'Actif' && ['Technicien', 'Ingénieur', 'Superviseur'].includes(record.role)).map(({ id, name, email, role, status }) => ({ id, name, email, role, status }));
    }
    if (name === 'get_statistics')
        return statistics();
    if (name === 'get_daily_summary')
        return dailySummary(args.date);
    throw new Error(`Outil de lecture inconnu : ${name}`);
}
function statistics() {
    const machines = (0, json_store_1.readEntity)('machines');
    const stock = (0, json_store_1.readEntity)('stock');
    const interventions = (0, json_store_1.readEntity)('interventions');
    const preventive = (0, json_store_1.readEntity)('preventif');
    const downStatuses = ['hors service', 'en panne', 'ne marche pas'];
    const byStatus = (records, field) => records.reduce((acc, record) => { const key = String(record[field] || 'Non renseigné'); acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    return {
        generatedAt: new Date().toISOString(),
        machines: { total: machines.length, byStatus: byStatus(machines, 'status'), unavailable: machines.filter((m) => downStatuses.includes(normalize(m.status))).length },
        stock: { references: stock.length, lowOrOut: stock.filter((item) => Number(item.quantity) <= Number(item.min)).length, outOfStock: stock.filter((item) => Number(item.quantity) === 0).length, totalValueMAD: stock.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCostMAD || item.priceMAD || 0), 0) },
        interventions: { total: interventions.length, byStatus: byStatus(interventions, 'status'), totalCostMAD: interventions.reduce((sum, item) => sum + Number(item.totalCostMAD || 0), 0) },
        preventive: { total: preventive.length, byStatus: byStatus(preventive, 'statut') },
    };
}
function dailySummary(date) {
    const machines = (0, json_store_1.readEntity)('machines');
    const stock = (0, json_store_1.readEntity)('stock');
    const interventions = (0, json_store_1.readEntity)('interventions');
    const preventive = (0, json_store_1.readEntity)('preventif');
    return {
        date,
        interventionsCreated: interventions.filter((item) => item.creationDate === date),
        interventionsPlanned: interventions.filter((item) => item.plannedDate === date),
        interventionsCompleted: interventions.filter((item) => (item.endDate || '').startsWith(date) || (item.updatedAt || '').startsWith(date) && normalize(item.status).includes('termin')),
        maintenanceDue: preventive.filter((item) => item.prochaineEcheance === date),
        unavailableMachines: machines.filter((item) => ['hors service', 'en panne', 'ne marche pas'].includes(normalize(item.status))),
        stockAlerts: stock.filter((item) => Number(item.quantity) <= Number(item.min)),
    };
}
