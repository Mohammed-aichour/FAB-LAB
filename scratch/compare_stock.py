import json
import pandas as pd

f2 = 'GMAO_FabLab_Universiapolis_Dossier_complet_8-9-12-13-14.xlsx'

with open('data_db/stock_db.json', 'r', encoding='utf-8') as f:
    stock_json = json.load(f)

df_stock_xl = pd.read_excel(f2, sheet_name='9. Pièces de rechange', header=3)
ref_col = [c for c in df_stock_xl.columns if 'R' in c and 'pi' in c][0]
name_col = [c for c in df_stock_xl.columns if 'signation' in c][0]
cat_col = [c for c in df_stock_xl.columns if 'gorie' in c][0]
eq_col = [c for c in df_stock_xl.columns if 'quip' in c][0]
fourn_col = [c for c in df_stock_xl.columns if 'Fourn' in c and 'R' not in c][0]
ref_fourn_col = [c for c in df_stock_xl.columns if 'R' in c and 'fourn' in c][0]
prix_col = [c for c in df_stock_xl.columns if 'Prix' in c][0]
unite_col = [c for c in df_stock_xl.columns if 'nit' in c][0]
stock_col = [c for c in df_stock_xl.columns if c == 'Stock' or ('Stock' in c and 'mini' not in c and 'maxi' not in c and 'Valeur' not in c)][0]
mini_col = [c for c in df_stock_xl.columns if 'mini' in c][0]
maxi_col = [c for c in df_stock_xl.columns if 'maxi' in c][0]
loc_col = [c for c in df_stock_xl.columns if 'Emplacement' in c][0]

stock_xl_dict = {}
for _, r in df_stock_xl.dropna(subset=[ref_col]).iterrows():
    ref = str(r[ref_col]).strip()
    if not ref or ref == 'nan': continue
    stock_xl_dict[ref] = {
        'name': str(r[name_col]).strip(),
        'category': str(r[cat_col]).strip(),
        'equipement': str(r[eq_col]).strip(),
        'supplier': str(r[fourn_col]).strip(),
        'refSupplier': str(r[ref_fourn_col]).strip(),
        'priceMAD': float(r[prix_col]) if pd.notna(r[prix_col]) else 0.0,
        'unit': str(r[unite_col]).strip(),
        'quantity': int(r[stock_col]) if pd.notna(r[stock_col]) else 0,
        'min': int(r[mini_col]) if pd.notna(r[mini_col]) else 0,
        'max': int(r[maxi_col]) if pd.notna(r[maxi_col]) else 0,
        'location': str(r[loc_col]).strip()
    }

print(f"Loaded {len(stock_xl_dict)} items from Excel sheet '9. Pièces de rechange'")

mismatches = []
for sj in stock_json:
    ref = sj.get('reference') or sj.get('id')
    if ref in stock_xl_dict:
        xl = stock_xl_dict[ref]
        diffs = []
        q = sj.get('quantity')
        p = sj.get('priceMAD') if sj.get('priceMAD') is not None else sj.get('unitCostMAD')
        mn = sj.get('min')
        mx = sj.get('max')
        u = sj.get('unit')
        
        if q != xl['quantity']:
            diffs.append(f"quantity: JSON={q} vs XL={xl['quantity']}")
        if p != xl['priceMAD']:
            diffs.append(f"priceMAD: JSON={p} vs XL={xl['priceMAD']}")
        if mn != xl['min']:
            diffs.append(f"min: JSON={mn} vs XL={xl['min']}")
        if mx != xl['max']:
            diffs.append(f"max: JSON={mx} vs XL={xl['max']}")
        if u != xl['unit']:
            diffs.append(f"unit: JSON={u} vs XL={xl['unit']}")
            
        if diffs:
            mismatches.append((ref, xl['name'], diffs))

print(f"\n--- Stock Mismatches in stock_db.json ({len(mismatches)} / {len(stock_json)}) ---")
for ref, name, diffs in mismatches[:15]:
    print(f"[{ref}] {name}:")
    for d in diffs:
        print(f"   - {d}")
