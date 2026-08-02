import openpyxl
import re
import json

# Read realMachineData.ts
with open('frontend/src/data/realMachineData.ts', 'r', encoding='utf-8') as f:
    m_text = f.read()

# Read realStockData.ts
with open('frontend/src/data/realStockData.ts', 'r', encoding='utf-8') as f:
    s_text = f.read()

m_ids = re.findall(r'"id"\s*:\s*"([^"]+)"', m_text)
m_refs = re.findall(r'"reference"\s*:\s*"([^"]+)"', m_text)
m_names = re.findall(r'"name"\s*:\s*"([^"]+)"', m_text)

s_ids = re.findall(r'"id"\s*:\s*"([^"]+)"', s_text)
s_refs = re.findall(r'"reference"\s*:\s*"([^"]+)"', s_text)
s_names = re.findall(r'"name"\s*:\s*"([^"]+)"', s_text)

print(f"App realMachineData.ts: {len(m_ids)} machines")
print(f"App realStockData.ts: {len(s_ids)} stock items")

# Load WB1 02_Arborescence_Reelle
f1 = 'DOSSIER Tableau de criticité (A-B-C) - Plan de maintenance préventive complet -  Gammes de maintenance illustrées - FABLAB UNIVERSIAPOLIS.xlsx'
wb1 = openpyxl.load_workbook(f1, data_only=True)
ws_arb = wb1['02_Arborescence_Reelle']

arb_items = []
for r in list(ws_arb.iter_rows(values_only=True))[3:]:
    if any(r) and r[0] and not str(r[0]).startswith('ARBORESCENCE') and not str(r[0]).startswith('Base'):
        arb_items.append({
            'code': str(r[0]).strip(),
            'name': str(r[1]).strip() if len(r)>1 and r[1] else '',
            'niveau': str(r[2]).strip() if len(r)>2 and r[2] else '',
            'desc': str(r[3]).strip() if len(r)>3 and r[3] else '',
            'qty': str(r[4]).strip() if len(r)>4 and r[4] else '1',
            'etat': str(r[5]).strip() if len(r)>5 and r[5] else '',
            'traitement': str(r[6]).strip() if len(r)>6 and r[6] else ''
        })

print(f"Excel 02_Arborescence_Reelle total entries: {len(arb_items)}")

fl_codes = [x for x in arb_items if x['code'].startswith('FL-')]
print(f"Excel equipment/tools (FL-xxx): {len(fl_codes)}")

# Compare FL- codes in Excel vs Machines and Stock in App
all_app_ids = set(m_ids + m_refs + s_ids + s_refs)

present_in_app = []
missing_in_app = []

for item in fl_codes:
    code = item['code']
    if code in all_app_ids or any(code in m_id for m_id in m_ids) or any(code in s_id for s_id in s_ids):
        present_in_app.append(item)
    else:
        missing_in_app.append(item)

print(f"\nFL- Items present in App: {len(present_in_app)} / {len(fl_codes)} ({len(present_in_app)/len(fl_codes)*100:.1f}%)")
print(f"FL- Items missing in App: {len(missing_in_app)}")

if missing_in_app:
    print("\nMissing items list:")
    for x in missing_in_app:
        print(f"  [MISSING] {x['code']:12s} | {x['name']:40s} | {x['niveau']:15s} | Qty: {x['qty']:3s} | Etat: {x['etat']}")

