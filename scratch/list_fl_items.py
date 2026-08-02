import pandas as pd
import json

file_path = r'DOSSIER Tableau de criticité (A-B-C) - Plan de maintenance préventive complet -  Gammes de maintenance illustrées - FABLAB UNIVERSIAPOLIS.xlsx'
xl = pd.ExcelFile(file_path)
df_arb = pd.read_excel(xl, '02_Arborescence_Reelle', header=None)

fl_items = []
curr_zone = 'Général'
curr_subcat = 'Général'

for idx, row in df_arb.iterrows():
    c0 = str(row[0]).strip() if pd.notna(row[0]) else ''
    c1 = str(row[1]).strip() if pd.notna(row[1]) else ''
    c2 = str(row[2]).strip() if pd.notna(row[2]) else ''
    c3 = str(row[3]).strip() if len(row)>3 and pd.notna(row[3]) else ''
    c4 = str(row[4]).strip() if len(row)>4 and pd.notna(row[4]) else ''
    c5 = str(row[5]).strip() if len(row)>5 and pd.notna(row[5]) else ''

    if c2 == 'Zone / Stock':
        curr_zone = c1
    elif c2 == 'Sous-categorie':
        curr_subcat = c1
    elif c0.startswith('FL-'):
        fl_items.append({
            'code': c0,
            'name': c1,
            'spec': c3 if c3 != 'nan' else '',
            'qty': c4 if c4 != 'nan' else '0',
            'etat': c5 if c5 != 'nan' else '',
            'zone': curr_zone,
            'subcat': curr_subcat
        })

print(f"Total individual FL items: {len(fl_items)}")
for item in fl_items:
    spec_str = f" [{item['spec']}]" if item['spec'] else ""
    print(f"{item['code']} | {item['name']}{spec_str} | Qty: {item['qty']} | Zone: {item['zone']}")
