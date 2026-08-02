import pandas as pd
import json

file_path = r'DOSSIER Tableau de criticité (A-B-C) - Plan de maintenance préventive complet -  Gammes de maintenance illustrées - FABLAB UNIVERSIAPOLIS.xlsx'
xl = pd.ExcelFile(file_path)

df_arb = pd.read_excel(xl, '02_Arborescence_Reelle', header=None)

# Extract 08_Fiche_Entretien_Outillage info for maintenance actions
df_fiche = pd.read_excel(xl, '08_Fiche_Entretien_Outillage', header=None)
fiche_dict = {}
for idx, row in df_fiche.iterrows():
    if idx < 4: continue
    code_range = str(row[0]).strip() if pd.notna(row[0]) else ''
    des = str(row[1]).strip() if len(row)>1 and pd.notna(row[1]) else ''
    cat = str(row[2]).strip() if len(row)>2 and pd.notna(row[2]) else ''
    action = str(row[3]).strip() if len(row)>3 and pd.notna(row[3]) else ''
    freq = str(row[4]).strip() if len(row)>4 and pd.notna(row[4]) else ''
    niv = str(row[5]).strip() if len(row)>5 and pd.notna(row[5]) else 'N1'
    secu = str(row[6]).strip() if len(row)>6 and pd.notna(row[6]) else ''
    fiche_dict[code_range] = {
        'action': action,
        'niv': niv,
        'secu': secu,
        'cat': cat
    }

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

            # Determine maintenance action and security from fiche
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

            stk_items.append({
                "id": code,
                "reference": code,
                "name": designation, # EXACT name as requested by user ("prendre les nom telqueller")
                "category": current_zone,
                "zone": current_zone,
                "subcat": current_subcat,
                "equipement": spec_val if spec_val else "Équipement Atelier", # Caractéristiques / Spécification (e.g. Blanc, Bleu, Tete hexagonale...)
                "spec": spec_val,
                "supplier": "FabLab Universiapolis",
                "refSupplier": code,
                "unitCostMAD": 150.0 if quantity_num > 0 else 50.0,
                "priceMAD": 150.0 if quantity_num > 0 else 50.0,
                "unit": "u" if not ('Tirefonds' in designation or 'Vis' in designation or 'Pointe' in designation) else "pcs",
                "quantity": quantity_num,
                "min": 1,
                "max": max(quantity_num * 2, 10),
                "location": f"{current_zone} — {current_subcat}",
                "description": f"{designation} {('(' + spec_val + ')') if spec_val else ''} — Répertorié au registre v2 du FabLab Universiapolis.",
                "actionEntretien": m_action,
                "niveauRequis": m_niv,
                "consigneSecurite": m_secu,
                "status": "Opérationnel" if etat == "Operationnel" else ("Non renseigné" if etat == "Non renseigne" else "Hors service")
            })

print(f"Total FABLAB.STK items extracted: {len(stk_items)}")
for item in stk_items:
    print(f"{item['id']} | Name: '{item['name']}' | Spec/Eq: '{item['equipement']}' | Qty: {item['quantity']} | Zone: '{item['zone']}' | Subcat: '{item['subcat']}'")

with open('scratch/exact_stk_items.json', 'w', encoding='utf-8') as f:
    json.dump(stk_items, f, indent=2, ensure_ascii=False)
