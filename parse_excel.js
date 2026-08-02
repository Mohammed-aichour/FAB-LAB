const xlsx = require('xlsx');
const fs = require('fs');

try {
  const workbook = xlsx.readFile('Registre_Equipements_Fablab.xlsx');
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  fs.writeFileSync('machines_data.json', JSON.stringify(data, null, 2));
  console.log('Parsed successfully');
} catch (e) {
  console.error(e);
}
