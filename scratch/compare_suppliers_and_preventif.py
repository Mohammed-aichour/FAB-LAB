import json
import pandas as pd

f1 = 'DOSSIER Tableau de criticité (A-B-C) - Plan de maintenance préventive complet -  Gammes de maintenance illustrées - FABLAB UNIVERSIAPOLIS.xlsx'
f2 = 'GMAO_FabLab_Universiapolis_Dossier_complet_8-9-12-13-14.xlsx'

print("=== FOURNISSEURS AUDIT ===")
with open('data_db/suppliers_db.json', 'r', encoding='utf-8') as f:
    supp_json = json.load(f)

df_fourn = pd.read_excel(f2, sheet_name='9b. Fournisseurs', header=3)
fourn_xl = {}
for _, r in df_fourn.iterrows():
    c = str(r.iloc[0]).strip()
    if c and c != 'nan' and not c.startswith('A.'):
        fourn_xl[c] = {
            'code': c,
            'name': str(r.iloc[1]).strip(),
            'domaine': str(r.iloc[2]).strip(),
            'contact': str(r.iloc[3]).strip(),
            'telEmail': str(r.iloc[4]).strip(),
            'delaiMoyenJours': str(r.iloc[5]).strip(),
            'conditions': str(r.iloc[6]).strip(),
            'franco': str(r.iloc[7]).strip(),
            'evaluation': str(r.iloc[8]).strip()
        }

print(f"Suppliers in Excel: {len(fourn_xl)}")
print(f"Suppliers in JSON: {len(supp_json)}")
for sj in supp_json:
    code = sj.get('code') or sj.get('id')
    if code in fourn_xl:
        xl = fourn_xl[code]
        if sj.get('name') != xl['name']:
            print(f"Mismatch {code}: JSON name='{sj.get('name')}' vs XL='{xl['name']}'")
    else:
        print(f"JSON supplier {code} ({sj.get('name')}) not in clean Excel list")

print("\n=== PREVENTIF & AMDEC AUDIT ===")
with open('data_db/preventif_db.json', 'r', encoding='utf-8') as f:
    prev_json = json.load(f)
with open('data_db/amdec_db.json', 'r', encoding='utf-8') as f:
    amdec_json = json.load(f)

print(f"Preventif DB items: {len(prev_json)}")
print(f"AMDEC DB items: {len(amdec_json)}")
