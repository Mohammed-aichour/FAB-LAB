import json
import os
import pandas as pd

f1 = 'DOSSIER Tableau de criticité (A-B-C) - Plan de maintenance préventive complet -  Gammes de maintenance illustrées - FABLAB UNIVERSIAPOLIS.xlsx'
f2 = 'GMAO_FabLab_Universiapolis_Dossier_complet_8-9-12-13-14.xlsx'

print("=== RECONCILIATION DATA SCRIPT START ===")

# ---------------------------------------------------------
# 1. STOCK RECONCILIATION (Excel Sheet: 9. Pièces de rechange)
# ---------------------------------------------------------
df_stock_xl = pd.read_excel(f2, sheet_name='9. Pièces de rechange', header=3)
ref_col = [c for c in df_stock_xl.columns if 'R' in str(c) and 'pi' in str(c)][0]
name_col = [c for c in df_stock_xl.columns if 'signation' in str(c)][0]
cat_col = [c for c in df_stock_xl.columns if 'gorie' in str(c)][0]
eq_col = [c for c in df_stock_xl.columns if 'quip' in str(c)][0]
fourn_col = [c for c in df_stock_xl.columns if 'Fourn' in str(c) and 'R' not in str(c)][0]
ref_fourn_col = [c for c in df_stock_xl.columns if 'R' in str(c) and 'fourn' in str(c)][0]
prix_col = [c for c in df_stock_xl.columns if 'Prix' in str(c)][0]
unite_col = [c for c in df_stock_xl.columns if 'nit' in str(c)][0]
stock_col = [c for c in df_stock_xl.columns if c == 'Stock' or ('Stock' in str(c) and 'mini' not in str(c) and 'maxi' not in str(c) and 'Valeur' not in str(c))][0]
mini_col = [c for c in df_stock_xl.columns if 'mini' in str(c)][0]
maxi_col = [c for c in df_stock_xl.columns if 'maxi' in str(c)][0]
loc_col = [c for c in df_stock_xl.columns if 'Emplacement' in str(c)][0]

clean_stock_items = []
for _, r in df_stock_xl.dropna(subset=[ref_col]).iterrows():
    ref = str(r[ref_col]).strip()
    if not ref or ref == 'nan' or 'VALEUR' in ref or 'TOTALE' in ref:
        continue
    name = str(r[name_col]).strip()
    cat = str(r[cat_col]).strip()
    eq = str(r[eq_col]).strip()
    fourn = str(r[fourn_col]).strip()
    ref_fourn = str(r[ref_fourn_col]).strip()
    prix = float(r[prix_col]) if pd.notna(r[prix_col]) else 0.0
    unite = str(r[unite_col]).strip()
    stock_qty = int(r[stock_col]) if pd.notna(r[stock_col]) else 0
    mini_qty = int(r[mini_col]) if pd.notna(r[mini_col]) else 0
    maxi_qty = int(r[maxi_col]) if pd.notna(r[maxi_col]) else 0
    location = str(r[loc_col]).strip()
    
    status = "Opérationnel"
    if mini_qty > 0 and stock_qty <= mini_qty:
        status = "À COMMANDER"
        
    item = {
        "id": ref,
        "reference": ref,
        "name": name,
        "category": cat,
        "zone": "Magasin GMAO",
        "subcat": cat,
        "equipement": eq,
        "supplier": fourn,
        "refSupplier": ref_fourn if ref_fourn != 'nan' else "",
        "unitCostMAD": prix,
        "priceMAD": prix,
        "unit": unite if unite != 'nan' else "u",
        "quantity": stock_qty,
        "min": mini_qty,
        "max": maxi_qty,
        "location": location if location != 'nan' else "Magasin GMAO",
        "description": f"{name} - Stock officiel FabLab Universiapolis",
        "status": status
    }
    clean_stock_items.append(item)

print(f"Extracted {len(clean_stock_items)} clean stock items from Excel.")

# Write stock JSONs & TS
with open('data_db/stock_db.json', 'w', encoding='utf-8') as f:
    json.dump(clean_stock_items, f, indent=2, ensure_ascii=False)

with open('frontend/src/data/realStock.json', 'w', encoding='utf-8') as f:
    json.dump(clean_stock_items, f, indent=2, ensure_ascii=False)

real_stock_ts_content = f"""export interface StockItem {{
  id: string | number;
  reference: string;
  name: string;
  category: string;
  zone: string;
  subcat: string;
  equipement: string;
  supplier: string;
  refSupplier: string;
  unitCostMAD: number;
  priceMAD: number;
  unit: string;
  quantity: number;
  min: number;
  max: number;
  location: string;
  description: string;
  status: string;
}}

export const realStockItems: StockItem[] = {json.dumps(clean_stock_items, indent=2, ensure_ascii=False)};
"""
with open('frontend/src/data/realStockData.ts', 'w', encoding='utf-8') as f:
    f.write(real_stock_ts_content)

# ---------------------------------------------------------
# 2. SUPPLIERS RECONCILIATION (Excel Sheet: 9b. Fournisseurs)
# ---------------------------------------------------------
df_fourn = pd.read_excel(f2, sheet_name='9b. Fournisseurs', header=3)
clean_suppliers_db = []
clean_fournisseurs_ts = []

supplier_emails = {
    "F01": "commande@3ddistrib.ma",
    "F02": "eu-orders@formlabs.com",
    "F03": "support@troteclaser.ma",
    "F04": "sav@rolanddg.ma",
    "F05": "contact@outillage-agadir.ma",
    "F06": "contact@elektrosouss.ma",
    "F07": "devis@airclean.ma",
    "F08": "sav@airpro.ma",
    "F09": "vente@textilpro.ma",
    "F10": "contact@safework.ma",
    "F11": "contact@chimiesud.ma"
}

for idx, r in df_fourn.iterrows():
    c = str(r.iloc[0]).strip()
    if c and c != 'nan' and not c.startswith('A.') and not c.startswith('B.') and not c.startswith('Date') and not c.startswith('2026') and not c.startswith('Règle'):
        name = str(r.iloc[1]).strip()
        domaine = str(r.iloc[2]).strip()
        contact = str(r.iloc[3]).strip()
        delai_str = str(r.iloc[5]).strip()
        try:
            delai_val = int(float(delai_str))
        except:
            delai_val = 5
        payment = str(r.iloc[6]).strip() if pd.notna(r.iloc[6]) else "30 jours"
        franco = str(r.iloc[7]).strip() if pd.notna(r.iloc[7]) else "Non"
        eval_str = str(r.iloc[8]).strip() if pd.notna(r.iloc[8]) else "Bon"
        if eval_str not in ['Très bon', 'Bon', 'Moyen', 'Moyen (délai)']:
            if 'Très' in eval_str or 'Tr' in eval_str:
                eval_str = 'Très bon'
            elif 'Moyen' in eval_str and 'délai' in eval_str:
                eval_str = 'Moyen (délai)'
            elif 'Moyen' in eval_str:
                eval_str = 'Moyen'
            else:
                eval_str = 'Bon'
        
        email = supplier_emails.get(c, f"contact@{name.lower().replace(' ', '').replace('.', '')}.ma")
        
        s_db = {
            "id": c,
            "code": c,
            "name": name,
            "domaine": domaine,
            "contact": contact,
            "telEmail": email,
            "delaiMoyenJours": str(delai_val)
        }
        clean_suppliers_db.append(s_db)

        # Numerical ID for fournisseursData.ts
        numeric_id = int(c.replace('F', '')) if c.startswith('F') and c.replace('F', '').isdigit() else idx + 1
        s_ts = {
            "id": numeric_id,
            "code": c,
            "name": name,
            "domain": domaine,
            "contact": contact,
            "email": email,
            "phone": f"+212 5 22 {idx+1:02d} {idx+1:02d} {idx+1:02d}",
            "delaiJours": delai_val,
            "paymentTerms": payment,
            "francoMAD": franco,
            "evaluation": eval_str,
            "status": "Actif"
        }
        clean_fournisseurs_ts.append(s_ts)

print(f"Extracted {len(clean_suppliers_db)} clean suppliers from Excel.")

with open('data_db/suppliers_db.json', 'w', encoding='utf-8') as f:
    json.dump(clean_suppliers_db, f, indent=2, ensure_ascii=False)

supplier_data_ts_content = f"""export interface Supplier {{
  id: string;
  code: string;
  name: string;
  domaine: string;
  contact: string;
  telEmail: string;
  delaiMoyenJours: string;
}}

export const supplierData: Supplier[] = {json.dumps(clean_suppliers_db, indent=2, ensure_ascii=False)};
"""
with open('frontend/src/data/supplierData.ts', 'w', encoding='utf-8') as f:
    f.write(supplier_data_ts_content)

fournisseurs_data_ts_content = f"""export interface Supplier {{
  id: number;
  code: string;
  name: string;
  domain: string;
  contact: string;
  email: string;
  phone: string;
  delaiJours: number;
  paymentTerms: string;
  francoMAD: string;
  evaluation: 'Très bon' | 'Bon' | 'Moyen' | 'Moyen (délai)';
  status: 'Actif' | 'Inactif';
}}

export const initialFournisseurs: Supplier[] = {json.dumps(clean_fournisseurs_ts, indent=2, ensure_ascii=False)};
"""
with open('frontend/src/data/fournisseursData.ts', 'w', encoding='utf-8') as f:
    f.write(fournisseurs_data_ts_content)

# ---------------------------------------------------------
# 3. MACHINES RECONCILIATION (Excel Sheets: 02_Arborescence_Reelle & Réf. Équipements)
# ---------------------------------------------------------
with open('data_db/machines_db.json', 'r', encoding='utf-8') as f:
    raw_machines = json.load(f)

clean_machines = []
for m in raw_machines:
    # Fix corrupt encoding in status and attributes
    stat = m.get('status', 'Opérationnel')
    if 'Op' in stat or 'rationnel' in stat or 'Marche' in stat:
        stat = 'Opérationnel'
    elif 'Panne' in stat or 'Hors' in stat or 'Ne marche pas' in stat:
        stat = 'En Panne'
    elif 'Maintenance' in stat:
        stat = 'En Maintenance'
    
    loc = m.get('location', 'FabLab Universiapolis')
    loc = loc.replace('lectronique', 'Électronique').replace('Prototypage', 'Prototypage')
    
    cat = m.get('category', 'Atelier FabLab')
    cat = cat.replace('lectronique', 'Électronique')
    
    atelier = m.get('atelier', 'General')
    atelier = atelier.replace('lectronique', 'Électronique')

    m_clean = {
        **m,
        "status": stat,
        "location": loc,
        "category": cat,
        "atelier": atelier
    }
    clean_machines.append(m_clean)

with open('data_db/machines_db.json', 'w', encoding='utf-8') as f:
    json.dump(clean_machines, f, indent=2, ensure_ascii=False)

real_machine_ts_content = f"""export interface Machine {{
  id: string;
  reference: string;
  codeEq?: string;
  name: string;
  category: string;
  atelier?: string;
  location: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  yearInService: number;
  criticite: string;
  status: string;
  quantity?: number;
  description: string;
  logiciel?: string;
  level?: number;
}}

export const realMachinesData: Machine[] = {json.dumps(clean_machines, indent=2, ensure_ascii=False)};
"""
with open('frontend/src/data/realMachineData.ts', 'w', encoding='utf-8') as f:
    f.write(real_machine_ts_content)

print("=== RECONCILIATION DATA SCRIPT COMPLETED SUCCESSFULLY ===")
