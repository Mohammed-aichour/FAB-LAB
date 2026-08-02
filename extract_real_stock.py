import pandas as pd
import json

file_path = r'd:\Apps\Desktop\Downloads\Stage_3A\Anti\DOSSIER Tableau de criticité (A-B-C) - Plan de maintenance préventive complet -  Gammes de maintenance illustrées - FABLAB UNIVERSIAPOLIS.xlsx'
df = pd.read_excel(file_path, sheet_name='02_Arborescence_Reelle', header=None)

# Find rows starting from FABLAB.STK
stock_items = []
current_zone = "Stock Général"
current_subcat = "Général"

in_stk = False

for idx, row in df.iterrows():
    code = str(row[0]).strip() if pd.notna(row[0]) else ""
    designation = str(row[1]).strip() if pd.notna(row[1]) else ""
    niveau = str(row[2]).strip() if pd.notna(row[2]) else ""
    desc = str(row[3]).strip() if pd.notna(row[3]) else ""
    qty = str(row[4]).strip() if pd.notna(row[4]) else ""
    etat = str(row[5]).strip() if pd.notna(row[5]) else ""

    if code == 'FABLAB.STK':
        in_stk = True
        continue
    
    if in_stk and code.startswith('FABLAB.INF'):
        in_stk = False
        break

    if in_stk:
        if niveau == 'Zone / Stock':
            current_zone = designation
        elif niveau == 'Sous-categorie':
            current_subcat = designation
        elif code.startswith('FL-'):
            # It's an item
            try:
                quantity_num = int(float(qty))
            except:
                quantity_num = 0
            
            stock_items.append({
                "id": code,
                "reference": code,
                "name": designation,
                "category": f"{current_zone} - {current_subcat}",
                "zone": current_zone,
                "subcat": current_subcat,
                "description": desc,
                "quantity": quantity_num,
                "min": 2 if quantity_num > 2 else 1,
                "status": etat if etat and etat != 'nan' else "Non renseigné"
            })

print(f"Total stock items extracted: {len(stock_items)}")
print(json.dumps(stock_items, indent=2, ensure_ascii=False))

with open(r'd:\Apps\Desktop\Downloads\Stage_3A\Anti\frontend\src\data\realStock.json', 'w', encoding='utf-8') as f:
    json.dump(stock_items, f, indent=2, ensure_ascii=False)
