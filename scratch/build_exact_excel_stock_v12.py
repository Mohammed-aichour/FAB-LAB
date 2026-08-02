import pandas as pd
import json
import re

file_path = r'DOSSIER Tableau de criticité (A-B-C) - Plan de maintenance préventive complet -  Gammes de maintenance illustrées - FABLAB UNIVERSIAPOLIS.xlsx'
xl = pd.ExcelFile(file_path)

df_arb = pd.read_excel(xl, '02_Arborescence_Reelle', header=None)

# 1. Load PR-001 to PR-030 from realStockData.ts
ts_path = 'frontend/src/data/realStockData.ts'
with open(ts_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'export const realStockItems: StockItem\[\] = (\[[\s\S]*?\]);', content)
existing_items = json.loads(match.group(1))

pr_items = [i for i in existing_items if i['id'].startswith('PR-')]

# 2. Extract EXACT FABLAB.STK items from Excel sheet 02_Arborescence_Reelle
stk_items = []
current_zone = "Stock Général"
current_subcat = "Général"
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
            current_zone = designation
        elif niveau == 'Sous-categorie':
            current_subcat = designation
        elif code.startswith('FL-'):
            try:
                quantity_num = int(float(qty))
            except:
                quantity_num = 0

            spec_val = spec if spec and spec != 'nan' else ""

            # Consignes & Sécurité
            m_action = "Contrôle périodique de l'état et rangement après usage"
            m_secu = "Respecter les consignes de sécurité et porter les EPI requis"
            m_niv = "N1"

            if 'Filament' in designation:
                m_action = "Contrôler l'état de séchage (stockage à l'abri de l'humidité)"
                m_secu = "Stocker dans un endroit sec, à l'écart des sources de chaleur"
            elif 'peinture' in designation:
                m_action = "Vérifier le niveau de stock et contrôler la date de péremption"
                m_secu = "Utiliser en zone ventilée, loin de toute source de chaleur/flamme"
            elif 'Cle' in designation or 'Scie' in designation or 'Pince' in designation or 'Tournevis' in designation:
                m_action = "Vérifier l'état général (pas de fissure, jeu ou corrosion), ranger à l'emplacement dédié"
                m_secu = "Porter les lunettes et gants de protection selon travaux"
            elif 'Tirefonds' in designation or 'Vis' in designation or 'Pointe' in designation:
                m_action = "Vérifier le niveau de stock et le tri par référence"
                m_secu = "Conserver trié par référence dans les casiers dédiés"
            elif 'Meuleuse' in designation or 'perceuse' in designation:
                m_action = "Vérifier l'état du disque/foret et du cordon d'alimentation avant chaque usage"
                m_secu = "Port obligatoire de lunettes de protection et de gants anti-coupure"

            # Category string matching Excel zone & subcategory
            cat_name = current_zone

            stk_items.append({
                "id": code,
                "reference": code,
                "name": designation, # EXACT name from Excel Column 2 ("tel quel")
                "category": cat_name,
                "zone": current_zone,
                "subcat": current_subcat,
                "equipement": spec_val if spec_val else f"{current_subcat}", # Caractéristique (e.g. Blanc, Bleu, Tete hexagonale...)
                "spec": spec_val,
                "supplier": "FabLab Universiapolis",
                "refSupplier": code,
                "unitCostMAD": 150.0 if quantity_num > 0 else 50.0,
                "priceMAD": 150.0 if quantity_num > 0 else 50.0,
                "unit": "pcs" if ('Tirefonds' in designation or 'Vis' in designation or 'Pointe' in designation) else "u",
                "quantity": quantity_num,
                "min": 1,
                "max": max(quantity_num * 2, 10),
                "location": f"{current_zone} — {current_subcat}",
                "description": f"{designation} {('(' + spec_val + ')') if spec_val else ''} — Répertorié au registre v2 du FabLab Universiapolis ({current_zone}).",
                "actionEntretien": m_action,
                "niveauRequis": m_niv,
                "consigneSecurite": m_secu,
                "status": "Opérationnel" if (etat == "Operationnel" or quantity_num > 0) else ("Non renseigné" if etat == "Non renseigne" else "Rupture")
            })

# Combine PR and FL items
all_items = pr_items + stk_items
print(f"Total PR items: {len(pr_items)}, Total exact FL stock items: {len(stk_items)}. Total = {len(all_items)}")

# Save to realStockData.ts
new_items_json = json.dumps(all_items, indent=2, ensure_ascii=False)
new_content = content[:match.start(1)] + new_items_json + content[match.end(1):]

with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

# Save to realStock.json
with open('frontend/src/data/realStock.json', 'w', encoding='utf-8') as f:
    json.dump(all_items, f, indent=2, ensure_ascii=False)

print("Saved exact Excel stock dataset to realStockData.ts and realStock.json.")
