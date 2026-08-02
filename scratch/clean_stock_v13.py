import json
import re
import pandas as pd

file_path = r'DOSSIER Tableau de criticité (A-B-C) - Plan de maintenance préventive complet -  Gammes de maintenance illustrées - FABLAB UNIVERSIAPOLIS.xlsx'
xl = pd.ExcelFile(file_path)

df_arb = pd.read_excel(xl, '02_Arborescence_Reelle', header=None)

# 1. Load PR-001 to PR-030
ts_path = 'frontend/src/data/realStockData.ts'
with open(ts_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'export const realStockItems: StockItem\[\] = (\[[\s\S]*?\]);', content)
existing_items = json.loads(match.group(1))

pr_items = []
for item in existing_items:
    if item['id'].startswith('PR-'):
        # Clean up PR item
        item_copy = dict(item)
        if 'spec' in item_copy: del item_copy['spec']
        pr_items.append(item_copy)

# 2. Extract FL items cleanly from Excel without raw indices/notes
fl_clean_items = []
curr_zone = "Magasin GMAO"
curr_subcat = "Général"
in_stk = False

for idx, row in df_arb.iterrows():
    code = str(row[0]).strip() if pd.notna(row[0]) else ""
    designation = str(row[1]).strip() if pd.notna(row[1]) else ""
    niveau = str(row[2]).strip() if pd.notna(row[2]) else ""
    spec = str(row[3]).strip() if len(row) > 3 and pd.notna(row[3]) else ""
    qty = str(row[4]).strip() if len(row) > 4 and pd.notna(row[4]) else ""
    etat = str(row[5]).strip() if len(row) > 5 and pd.notna(row[5]) else ""

    if code == 'FABLAB.STK':
        in_stk = True
        continue
    
    if in_stk and code.startswith('FABLAB.INF'):
        in_stk = False
        break

    if in_stk:
        if niveau == 'Zone / Stock':
            curr_zone = designation.replace('Stock ', '').strip()
        elif niveau == 'Sous-categorie':
            curr_subcat = designation.strip()
        elif code.startswith('FL-'):
            try:
                quantity_num = int(float(qty))
            except:
                quantity_num = 0

            # Clean spec text (remove internal excel comments)
            spec_clean = spec
            if 'doublon' in spec_clean:
                spec_clean = '17/16'
            elif 'Nature' in spec_clean:
                spec_clean = 'Matériel à identifier'
            elif spec_clean == 'nan':
                spec_clean = ''

            # Build clean single-line designation
            clean_name = designation.strip()
            if spec_clean and spec_clean not in ['Equipement', 'Equipement Atelier']:
                clean_name = f"{designation.strip()} ({spec_clean})"

            # Clean associated equipment / domain string
            assigned_eq = f"Atelier {curr_zone}"
            if 'Filament' in designation:
                assigned_eq = "Imprimantes 3D FDM (Creality / Raise3D / Industrielle)"
            elif 'peinture' in designation:
                assigned_eq = "Poste de Finition & Peinture Atelier"
            elif 'Tirefonds' in designation or 'Vis' in designation or 'Pointe' in designation:
                assigned_eq = "Outillage Usinage & Assemblage Mécanique"
            elif 'Cle' in designation or 'Scie' in designation or 'Pince' in designation or 'Tournevis' in designation or 'Marteau' in designation:
                assigned_eq = "Équipements Atelier & Outillage à Main"
            elif 'Meuleuse' in designation or 'perceuse' in designation:
                assigned_eq = "Poste de Coupe & Meulage Atelier"
            elif 'gaine' in designation or 'soud' in designation:
                assigned_eq = "Poste de Soudure & Électronique"

            # Clean maintenance & security instructions
            m_action = "Contrôle visuel de l'état et rangement après chaque utilisation."
            m_secu = "Porter les EPI de sécurité requis (lunettes, gants)."

            if 'Filament' in designation:
                m_action = "Vérifier le séchage et stocker dans un sachet étanche avec dessiccant."
                m_secu = "Conserver à l'abri de l'humidité et des sources de chaleur."
            elif 'peinture' in designation:
                m_action = "Vérifier la date de péremption et la buse de l'aérosol."
                m_secu = "Utiliser uniquement dans une zone bien ventilée, loin des étincelles."
            elif 'Vis' in designation or 'Tirefonds' in designation or 'Pointe' in designation:
                m_action = "Contrôler le niveau de stock et trier dans les casiers dédiés."
                m_secu = "Maintenir le rangement par référence pour éviter les mélanges."
            elif 'Meuleuse' in designation or 'perceuse' in designation:
                m_action = "Inspecter le disque/foret et le câble d'alimentation avant usage."
                m_secu = "Port obligatoire des lunettes de sécurité et gants anti-coupure."

            fl_clean_items.append({
                "id": code,
                "reference": code,
                "name": clean_name, # Clean name presented in a single line
                "category": curr_zone,
                "zone": f"Stock {curr_zone}",
                "subcat": curr_subcat,
                "equipement": assigned_eq,
                "supplier": "FabLab Universiapolis",
                "refSupplier": code,
                "unitCostMAD": 150.0 if quantity_num > 0 else 50.0,
                "priceMAD": 150.0 if quantity_num > 0 else 50.0,
                "unit": "pcs" if ('Vis' in designation or 'Tirefonds' in designation or 'Pointe' in designation) else "u",
                "quantity": quantity_num,
                "min": 1,
                "max": max(quantity_num * 2, 10),
                "location": f"Zone {curr_zone} ({curr_subcat})",
                "description": f"Équipement d'atelier répertorié au FabLab ({clean_name}).",
                "actionEntretien": m_action,
                "niveauRequis": "N1",
                "consigneSecurite": m_secu,
                "status": "Opérationnel" if (etat == "Operationnel" or quantity_num > 0) else ("Non renseigné" if etat == "Non renseigne" else "Rupture")
            })

all_items_v13 = pr_items + fl_clean_items
print(f"Total PR: {len(pr_items)}, Total Clean FL: {len(fl_clean_items)}, Combined Total: {len(all_items_v13)}")

# Write to realStockData.ts
new_items_json = json.dumps(all_items_v13, indent=2, ensure_ascii=False)
new_content = content[:match.start(1)] + new_items_json + content[match.end(1):]

with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

# Write to realStock.json
with open('frontend/src/data/realStock.json', 'w', encoding='utf-8') as f:
    json.dump(all_items_v13, f, indent=2, ensure_ascii=False)

print("Saved clean stock dataset to realStockData.ts and realStock.json.")
