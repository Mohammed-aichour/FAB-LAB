const fs = require('fs');
const data = JSON.parse(fs.readFileSync('dump.json'));

// 1. Process Arborescence
const arboRaw = data['02_Arborescence_Reelle'] || [];
const machines = [];
arboRaw.forEach((row, i) => {
  if (i < 5) return; // Skip headers
  const id = Object.values(row)[0];
  if (!id || !id.startsWith('FL-')) return;
  
  machines.push({
    id: id,
    name: row['__EMPTY'] || 'Inconnu',
    type: row['__EMPTY_1'] || 'Equipement',
    model: row['__EMPTY_2'] || '',
    status: row['__EMPTY_4'] || 'Non renseigne',
    level: row['__EMPTY_5'] == '1' ? 1 : 2,
    codeEQ: row['__EMPTY_6'] || null
  });
});

// 2. Process Criticite (AMDEC)
const amdecRaw = data['04_Criticite'] || [];
const amdec = [];
amdecRaw.forEach((row, i) => {
  if (i < 2) return;
  const eq = row['ANALYSE DE CRITICITE PAR SOUS-SYSTEME - 8 MACHINES COMPLEXES'];
  if (!eq) return;
  amdec.push({
    codeEq: eq,
    equipement: row['__EMPTY'] || '',
    codeSys: row['__EMPTY_1'] || '',
    systeme: row['__EMPTY_2'] || '',
    defaillance: row['__EMPTY_3'] || '',
    F: row['__EMPTY_4'] || 1,
    G: row['__EMPTY_5'] || 1,
    D: row['__EMPTY_6'] || 1,
    IC: row['__EMPTY_7'] || 1,
    classe: row['__EMPTY_8'] || 'C',
    action: row['__EMPTY_9'] || '',
    niveau: row['__EMPTY_10'] || 'N1'
  });
});

// 3. Process Preventive
const prevRaw = data['05_Plan_Maintenance_Preventive'] || [];
const preventif = [];
prevRaw.forEach((row, i) => {
  if (i < 2) return;
  const eq = row['PLAN DE MAINTENANCE PREVENTIVE - MACHINES COMPLEXES'];
  if (!eq) return;
  preventif.push({
    codeEq: eq,
    equipement: row['__EMPTY'] || '',
    codeComp: row['__EMPTY_1'] || '',
    composant: row['__EMPTY_2'] || '',
    nature: row['__EMPTY_3'] || '',
    action: row['__EMPTY_4'] || '',
    frequence: row['__EMPTY_5'] || '',
    duree: row['__EMPTY_6'] || '',
    niveau: row['__EMPTY_7'] || 'N1',
    arret: row['__EMPTY_8'] || 'Non',
    outillage: row['__EMPTY_9'] || '',
    gamme: row['__EMPTY_10'] || ''
  });
});

const tsContent = `export const initialMachines = ${JSON.stringify(machines, null, 2)};\n` +
                  `export const amdecData = ${JSON.stringify(amdec, null, 2)};\n` +
                  `export const preventifData = ${JSON.stringify(preventif, null, 2)};\n`;

if (!fs.existsSync('../frontend/src/data')) {
  fs.mkdirSync('../frontend/src/data', { recursive: true });
}
fs.writeFileSync('../frontend/src/data/amdecData.ts', tsContent);
console.log('Data generated successfully at frontend/src/data/amdecData.ts');
