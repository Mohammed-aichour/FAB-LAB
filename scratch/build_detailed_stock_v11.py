import json
import re
import pandas as pd

file_path = r'DOSSIER Tableau de criticité (A-B-C) - Plan de maintenance préventive complet -  Gammes de maintenance illustrées - FABLAB UNIVERSIAPOLIS.xlsx'
xl = pd.ExcelFile(file_path)

# Load 08_Fiche_Entretien_Outillage for maintenance actions & safety
df_fiche = pd.read_excel(xl, '08_Fiche_Entretien_Outillage', header=None)

fiche_info = {}
for idx, row in df_fiche.iterrows():
    if idx < 4: continue
    code_range = str(row[0]).strip() if pd.notna(row[0]) else ''
    des = str(row[1]).strip() if len(row)>1 and pd.notna(row[1]) else ''
    cat = str(row[2]).strip() if len(row)>2 and pd.notna(row[2]) else ''
    action = str(row[3]).strip() if len(row)>3 and pd.notna(row[3]) else ''
    freq = str(row[4]).strip() if len(row)>4 and pd.notna(row[4]) else ''
    niv = str(row[5]).strip() if len(row)>5 and pd.notna(row[5]) else 'N1'
    vigilance = str(row[6]).strip() if len(row)>6 and pd.notna(row[6]) else ''
    
    fiche_info[code_range] = {
        'action': action,
        'niv': niv,
        'vigilance': vigilance,
        'cat': cat
    }

# Read PR items from existing realStockData.ts
ts_path = 'frontend/src/data/realStockData.ts'
with open(ts_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'export const realStockItems: StockItem\[\] = (\[[\s\S]*?\]);', content)
existing_items = json.loads(match.group(1))

# Keep PR-001 to PR-030
pr_items = [i for i in existing_items if i['id'].startswith('PR-')]

# Now build individual FL items from Excel
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
        qty_num = 1
        try:
            qty_num = int(float(c4))
        except:
            qty_num = 1 if c5 == 'Operationnel' else 0

        spec_text = c3 if c3 and c3 != 'nan' else ''
        
        # Build exact name with color / spec
        full_display_name = c1
        if spec_text and not spec_text.startswith('Equipement') and not spec_text.startswith('Nature'):
            full_display_name = f"{c1} — {spec_text}"

        # Equipment mapping logic
        eq_mapping = f"{c0} - {c1}"
        if spec_text:
            eq_mapping += f" ({spec_text})"
        
        # Special equipment links for machines / zones
        if c0 in ['FL-003', 'FL-004', 'FL-005']:
            eq_mapping = f"{c0} - Imprimante 3D FDM (Shenzhen Creality 3D Technology)"
        elif c0 == 'FL-006':
            eq_mapping = f"FL-006 - Imprimante 3D résine (Photocentric)"
        elif c0 == 'FL-007':
            eq_mapping = f"FL-007 - Machine de découpe laser (Fabricant PIPROD)"
        elif c0 == 'FL-008':
            eq_mapping = f"FL-008 - Machine WC 3000 (découpe laser)"
        elif c0 == 'FL-009':
            eq_mapping = f"FL-009 - Fraiseuse CNC TPROD 6060 (Fabricant PIPROD)"
        elif c0 == 'FL-010':
            eq_mapping = f"FL-010 - Perceuse/Fraiseuse CNC (Technodrill 3 C.I.F)"
        elif c0 == 'FL-068':
            eq_mapping = f"FL-068 - Imprimante 3D FFF IDEX Raise3D E2CF"
        elif c0 == 'FL-069':
            eq_mapping = f"FL-069 - Imprimante 3D industrielle FDM/FFF (NATO SPS)"
        elif c0.startswith('FL-051') or c0.startswith('FL-052') or c0.startswith('FL-053') or c0.startswith('FL-054') or c0.startswith('FL-055') or c0.startswith('FL-056'):
            eq_mapping = f"{c0} - Filament ABS {spec_text} (Stock Fabrication Additive)"
        elif c0.startswith('FL-057') or c0.startswith('FL-058') or c0.startswith('FL-059') or c0.startswith('FL-060'):
            eq_mapping = f"{c0} - Peinture Aérosol {spec_text} (Stock Finition)"
        elif c0 in ['FL-062', 'FL-063', 'FL-064', 'FL-065']:
            eq_mapping = f"{c0} - Visserie & Quincaillerie ({c1} {spec_text})"
        elif c0 in ['FL-021', 'FL-022', 'FL-023', 'FL-024', 'FL-025', 'FL-026', 'FL-028']:
            eq_mapping = f"{c0} - Outillage à main ({c1} {spec_text})"

        # Find maintenance info
        m_action = "Contrôle périodique de l'état et nettoyage après usage"
        m_niv = "N1"
        m_secu = "Respecter les consignes de sécurité et porter les EPI"

        if c0 in ['FL-051', 'FL-052', 'FL-053', 'FL-054', 'FL-055', 'FL-056']:
            m_action = "Contrôler l'état de séchage et de stockage à l'abri de l'humidité"
            m_secu = "Stocker dans un endroit sec, à l'écart des sources de chaleur"
        elif c0 in ['FL-057', 'FL-058', 'FL-059', 'FL-060']:
            m_action = "Vérifier le niveau de stock et contrôler la date de péremption"
            m_secu = "Utiliser en zone ventilée, loin de toute source de chaleur ou flamme"
        elif c0 in ['FL-062', 'FL-063', 'FL-064', 'FL-065']:
            m_action = "Vérifier le niveau de stock et le tri par référence"
            m_secu = "Ranger par référence dans les casiers dédiés"
        elif c0 in ['FL-038', 'FL-039', 'FL-040', 'FL-041', 'FL-042', 'FL-043']:
            m_action = "Vérifier l'état des câbles/sondes, nettoyer l'écran, contrôler l'étalonnage"
            m_secu = "Ne jamais dépasser la tension d'entrée maximale de la sonde"
        elif c0 in ['FL-044', 'FL-045']:
            m_action = "Vérifier l'état des cordons et connecteurs, contrôler l'affichage"
            m_secu = "Vérifier l'absence de court-circuit avant mise sous tension"
        elif c0 in ['FL-046', 'FL-048', 'FL-049']:
            m_action = "Nettoyer la panne, vérifier la température de consigne et le cordon"
            m_secu = "Risque de brûlure - toujours reposer le fer sur son support ; ventilation requise"

        fl_items.append({
            "id": c0,
            "reference": c0,
            "name": full_display_name,
            "category": f"{curr_zone}",
            "zone": curr_zone,
            "subcat": curr_subcat,
            "equipement": eq_mapping,
            "supplier": "FabLab Universiapolis",
            "refSupplier": c0,
            "unitCostMAD": 150.0 if qty_num > 0 else 50.0,
            "priceMAD": 150.0 if qty_num > 0 else 50.0,
            "unit": "u",
            "quantity": qty_num,
            "min": 1,
            "max": max(qty_num * 3, 5),
            "location": f"Atelier {curr_zone}",
            "description": f"Article répertorié au registre FabLab ({c1} {spec_text}). Zone : {curr_zone}.",
            "actionEntretien": m_action,
            "niveauRequis": m_niv,
            "consigneSecurite": m_secu,
            "status": "Opérationnel" if qty_num > 0 else "Rupture"
        })

print(f"Loaded {len(pr_items)} PR items and created {len(fl_items)} detailed FL items.")

all_stock_items = pr_items + fl_items
print(f"Total Combined Stock Items: {len(all_stock_items)}")

# Save to realStockData.ts
new_items_json = json.dumps(all_stock_items, indent=2, ensure_ascii=False)
new_content = content[:match.start(1)] + new_items_json + content[match.end(1):]

with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

# Save to realStock.json
with open('frontend/src/data/realStock.json', 'w', encoding='utf-8') as f:
    json.dump(all_stock_items, f, indent=2, ensure_ascii=False)

print("Saved updated dataset to realStockData.ts and realStock.json.")
