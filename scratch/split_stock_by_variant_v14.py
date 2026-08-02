import json
import re
import pandas as pd

file_path = r'DOSSIER Tableau de criticité (A-B-C) - Plan de maintenance préventive complet -  Gammes de maintenance illustrées - FABLAB UNIVERSIAPOLIS.xlsx'
xl = pd.ExcelFile(file_path)
df_arb = pd.read_excel(xl, '02_Arborescence_Reelle', header=None)

ts_path = 'frontend/src/data/realStockData.ts'
with open(ts_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'export const realStockItems: StockItem\[\] = (\[[\s\S]*?\]);', content)
existing_items = json.loads(match.group(1))

# Base PR items to keep (non-filament/color grouped)
base_pr_items = []
for item in existing_items:
    if item['id'].startswith('PR-'):
        # We will replace PR-005, PR-006, PR-008, PR-001, PR-024 with split color/variant rows
        if item['id'] not in ['PR-005', 'PR-006', 'PR-008', 'PR-001', 'PR-024']:
            base_pr_items.append(item)

# Expanded PR variant items (Filaments PLA/ABS by color, Resins by color, Threads by color)
pr_splits = [
    # PR-001 Buses
    {
        "id": "PR-001-04", "reference": "PR-001-04", "name": "Buse laiton 0.4 mm (FDM standard)",
        "category": "Usure", "zone": "Magasin GMAO", "subcat": "Usure",
        "equipement": "Imprimantes 3D FDM (Creality / Raise3D / Ultimaker)",
        "supplier": "3D Distrib. Maroc", "refSupplier": "NZ-04-BR",
        "unitCostMAD": 25.0, "priceMAD": 25.0, "unit": "u", "quantity": 8, "min": 4, "max": 15, "location": "Casier A1",
        "description": "Buse d'extrusion laiton M6 0.4mm pour filament 1.75mm.",
        "actionEntretien": "Nettoyage périodique et remplacement selon état.", "niveauRequis": "N1",
        "consigneSecurite": "Effectuer le changement à chaud (200°C) avec précaution.", "status": "Opérationnel"
    },
    {
        "id": "PR-001-02", "reference": "PR-001-02", "name": "Buse laiton 0.2 mm (FDM haute précision)",
        "category": "Usure", "zone": "Magasin GMAO", "subcat": "Usure",
        "equipement": "Imprimantes 3D FDM (Creality / Raise3D / Ultimaker)",
        "supplier": "3D Distrib. Maroc", "refSupplier": "NZ-02-BR",
        "unitCostMAD": 25.0, "priceMAD": 25.0, "unit": "u", "quantity": 2, "min": 1, "max": 5, "location": "Casier A1",
        "description": "Buse d'extrusion laiton M6 0.2mm pour impression fine.",
        "actionEntretien": "Débouchage à l'aiguille fine si besoin.", "niveauRequis": "N1",
        "consigneSecurite": "Attention aux températures d'extrusion.", "status": "Opérationnel"
    },
    {
        "id": "PR-001-06", "reference": "PR-001-06", "name": "Buse laiton 0.6 mm (FDM fort débit)",
        "category": "Usure", "zone": "Magasin GMAO", "subcat": "Usure",
        "equipement": "Imprimantes 3D FDM (Creality / Raise3D / Ultimaker)",
        "supplier": "3D Distrib. Maroc", "refSupplier": "NZ-06-BR",
        "unitCostMAD": 25.0, "priceMAD": 25.0, "unit": "u", "quantity": 2, "min": 1, "max": 5, "location": "Casier A1",
        "description": "Buse d'extrusion laiton M6 0.6mm pour impression rapide.",
        "actionEntretien": "Contrôle d'usure visuel.", "niveauRequis": "N1",
        "consigneSecurite": "Attendre le refroidissement avant manipulation.", "status": "Opérationnel"
    },

    # PR-005 Filament PLA par couleur
    {
        "id": "PR-005-BLA", "reference": "PR-005-BLA", "name": "Filament PLA 1.75 mm — Blanc (1 kg)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Filaments",
        "equipement": "Imprimantes 3D FDM (Creality / Raise3D / Ultimaker)",
        "supplier": "3D Distrib. Maroc", "refSupplier": "PLA-175-WHT",
        "unitCostMAD": 190.0, "priceMAD": 190.0, "unit": "u", "quantity": 5, "min": 2, "max": 10, "location": "Étagère B1",
        "description": "Bobine de filament PLA 1.75mm couleur Blanc (1 kg).",
        "actionEntretien": "Conserver en sachet hermétique avec dessiccant.", "niveauRequis": "N1",
        "consigneSecurite": "Protéger de l'humidité et de la chaleur.", "status": "Opérationnel"
    },
    {
        "id": "PR-005-NOI", "reference": "PR-005-NOI", "name": "Filament PLA 1.75 mm — Noir (1 kg)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Filaments",
        "equipement": "Imprimantes 3D FDM (Creality / Raise3D / Ultimaker)",
        "supplier": "3D Distrib. Maroc", "refSupplier": "PLA-175-BLK",
        "unitCostMAD": 190.0, "priceMAD": 190.0, "unit": "u", "quantity": 4, "min": 2, "max": 10, "location": "Étagère B1",
        "description": "Bobine de filament PLA 1.75mm couleur Noir (1 kg).",
        "actionEntretien": "Conserver en sachet hermétique avec dessiccant.", "niveauRequis": "N1",
        "consigneSecurite": "Protéger de l'humidité et de la chaleur.", "status": "Opérationnel"
    },
    {
        "id": "PR-005-ROU", "reference": "PR-005-ROU", "name": "Filament PLA 1.75 mm — Rouge (1 kg)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Filaments",
        "equipement": "Imprimantes 3D FDM (Creality / Raise3D / Ultimaker)",
        "supplier": "3D Distrib. Maroc", "refSupplier": "PLA-175-RED",
        "unitCostMAD": 190.0, "priceMAD": 190.0, "unit": "u", "quantity": 3, "min": 1, "max": 8, "location": "Étagère B1",
        "description": "Bobine de filament PLA 1.75mm couleur Rouge (1 kg).",
        "actionEntretien": "Conserver en sachet hermétique avec dessiccant.", "niveauRequis": "N1",
        "consigneSecurite": "Protéger de l'humidité et de la chaleur.", "status": "Opérationnel"
    },
    {
        "id": "PR-005-BLE", "reference": "PR-005-BLE", "name": "Filament PLA 1.75 mm — Bleu (1 kg)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Filaments",
        "equipement": "Imprimantes 3D FDM (Creality / Raise3D / Ultimaker)",
        "supplier": "3D Distrib. Maroc", "refSupplier": "PLA-175-BLU",
        "unitCostMAD": 190.0, "priceMAD": 190.0, "unit": "u", "quantity": 3, "min": 1, "max": 8, "location": "Étagère B1",
        "description": "Bobine de filament PLA 1.75mm couleur Bleu (1 kg).",
        "actionEntretien": "Conserver en sachet hermétique avec dessiccant.", "niveauRequis": "N1",
        "consigneSecurite": "Protéger de l'humidité et de la chaleur.", "status": "Opérationnel"
    },
    {
        "id": "PR-005-GRI", "reference": "PR-005-GRI", "name": "Filament PLA 1.75 mm — Gris (1 kg)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Filaments",
        "equipement": "Imprimantes 3D FDM (Creality / Raise3D / Ultimaker)",
        "supplier": "3D Distrib. Maroc", "refSupplier": "PLA-175-GRY",
        "unitCostMAD": 190.0, "priceMAD": 190.0, "unit": "u", "quantity": 3, "min": 1, "max": 8, "location": "Étagère B1",
        "description": "Bobine de filament PLA 1.75mm couleur Gris (1 kg).",
        "actionEntretien": "Conserver en sachet hermétique avec dessiccant.", "niveauRequis": "N1",
        "consigneSecurite": "Protéger de l'humidité et de la chaleur.", "status": "Opérationnel"
    },

    # PR-006 Filament ABS par couleur
    {
        "id": "PR-006-BLA", "reference": "PR-006-BLA", "name": "Filament ABS 1.75 mm — Blanc (1 kg)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Filaments",
        "equipement": "Imprimantes 3D FDM (Creality / Raise3D / Industrielle)",
        "supplier": "3D Distrib. Maroc", "refSupplier": "ABS-175-WHT",
        "unitCostMAD": 210.0, "priceMAD": 210.0, "unit": "u", "quantity": 3, "min": 1, "max": 6, "location": "Étagère B2",
        "description": "Bobine de filament ABS 1.75mm couleur Blanc (1 kg).",
        "actionEntretien": "Stocker au sec avec dessiccant.", "niveauRequis": "N1",
        "consigneSecurite": "Impression en enceinte fermée recommandée (vapeurs ABS).", "status": "Opérationnel"
    },
    {
        "id": "PR-006-BLE", "reference": "PR-006-BLE", "name": "Filament ABS 1.75 mm — Bleu (1 kg)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Filaments",
        "equipement": "Imprimantes 3D FDM (Creality / Raise3D / Industrielle)",
        "supplier": "3D Distrib. Maroc", "refSupplier": "ABS-175-BLU",
        "unitCostMAD": 210.0, "priceMAD": 210.0, "unit": "u", "quantity": 2, "min": 1, "max": 6, "location": "Étagère B2",
        "description": "Bobine de filament ABS 1.75mm couleur Bleu (1 kg).",
        "actionEntretien": "Stocker au sec avec dessiccant.", "niveauRequis": "N1",
        "consigneSecurite": "Impression en enceinte fermée recommandée.", "status": "Opérationnel"
    },
    {
        "id": "PR-006-ORA", "reference": "PR-006-ORA", "name": "Filament ABS 1.75 mm — Orange (1 kg)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Filaments",
        "equipement": "Imprimantes 3D FDM (Creality / Raise3D / Industrielle)",
        "supplier": "3D Distrib. Maroc", "refSupplier": "ABS-175-ORG",
        "unitCostMAD": 210.0, "priceMAD": 210.0, "unit": "u", "quantity": 3, "min": 1, "max": 6, "location": "Étagère B2",
        "description": "Bobine de filament ABS 1.75mm couleur Orange (1 kg).",
        "actionEntretien": "Stocker au sec avec dessiccant.", "niveauRequis": "N1",
        "consigneSecurite": "Impression en enceinte fermée recommandée.", "status": "Opérationnel"
    },
    {
        "id": "PR-006-NOI", "reference": "PR-006-NOI", "name": "Filament ABS 1.75 mm — Noir (1 kg)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Filaments",
        "equipement": "Imprimantes 3D FDM (Creality / Raise3D / Industrielle)",
        "supplier": "3D Distrib. Maroc", "refSupplier": "ABS-175-BLK",
        "unitCostMAD": 210.0, "priceMAD": 210.0, "unit": "u", "quantity": 1, "min": 1, "max": 6, "location": "Étagère B2",
        "description": "Bobine de filament ABS 1.75mm couleur Noir (1 kg).",
        "actionEntretien": "Stocker au sec avec dessiccant.", "niveauRequis": "N1",
        "consigneSecurite": "Impression en enceinte fermée recommandée.", "status": "Alerte"
    },
    {
        "id": "PR-006-ROU", "reference": "PR-006-ROU", "name": "Filament ABS 1.75 mm — Rouge (1 kg)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Filaments",
        "equipement": "Imprimantes 3D FDM (Creality / Raise3D / Industrielle)",
        "supplier": "3D Distrib. Maroc", "refSupplier": "ABS-175-RED",
        "unitCostMAD": 210.0, "priceMAD": 210.0, "unit": "u", "quantity": 4, "min": 1, "max": 6, "location": "Étagère B2",
        "description": "Bobine de filament ABS 1.75mm couleur Rouge (1 kg).",
        "actionEntretien": "Stocker au sec avec dessiccant.", "niveauRequis": "N1",
        "consigneSecurite": "Impression en enceinte fermée recommandée.", "status": "Opérationnel"
    },
    {
        "id": "PR-006-GRI", "reference": "PR-006-GRI", "name": "Filament ABS 1.75 mm — Gris (1 kg)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Filaments",
        "equipement": "Imprimantes 3D FDM (Creality / Raise3D / Industrielle)",
        "supplier": "3D Distrib. Maroc", "refSupplier": "ABS-175-GRY",
        "unitCostMAD": 210.0, "priceMAD": 210.0, "unit": "u", "quantity": 1, "min": 1, "max": 6, "location": "Étagère B2",
        "description": "Bobine de filament ABS 1.75mm couleur Gris (1 kg).",
        "actionEntretien": "Stocker au sec avec dessiccant.", "niveauRequis": "N1",
        "consigneSecurite": "Impression en enceinte fermée recommandée.", "status": "Alerte"
    },

    # PR-008 Résines SLA par couleur
    {
        "id": "PR-008-GRI", "reference": "PR-008-GRI", "name": "Résine standard SLA 405nm — Grise (1 L)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Résines",
        "equipement": "Imprimante 3D résine (Photocentric)",
        "supplier": "3D Distrib. Maroc", "refSupplier": "RES-405-GRY",
        "unitCostMAD": 450.0, "priceMAD": 450.0, "unit": "u", "quantity": 1, "min": 1, "max": 4, "location": "Armoire Produit B",
        "description": "Résine photopolymère standard 405nm couleur Grise (1 L).",
        "actionEntretien": "Bien agiter la bouteille avant remplissage de cuve.", "niveauRequis": "N1",
        "consigneSecurite": "Port de gants nitriles et masque respiratoire obligatoire.", "status": "Alerte"
    },
    {
        "id": "PR-008-CLA", "reference": "PR-008-CLA", "name": "Résine standard SLA 405nm — Transparente (1 L)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Résines",
        "equipement": "Imprimante 3D résine (Photocentric)",
        "supplier": "3D Distrib. Maroc", "refSupplier": "RES-405-CLR",
        "unitCostMAD": 450.0, "priceMAD": 450.0, "unit": "u", "quantity": 1, "min": 1, "max": 4, "location": "Armoire Produit B",
        "description": "Résine photopolymère standard 405nm Transparente (1 L).",
        "actionEntretien": "Bien agiter avant usage, filtrer après impression.", "niveauRequis": "N1",
        "consigneSecurite": "Port de gants nitriles et masque respiratoire obligatoire.", "status": "Alerte"
    },
    {
        "id": "PR-008-NOI", "reference": "PR-008-NOI", "name": "Résine standard SLA 405nm — Noire (1 L)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Résines",
        "equipement": "Imprimante 3D résine (Photocentric)",
        "supplier": "3D Distrib. Maroc", "refSupplier": "RES-405-BLK",
        "unitCostMAD": 450.0, "priceMAD": 450.0, "unit": "u", "quantity": 1, "min": 1, "max": 4, "location": "Armoire Produit B",
        "description": "Résine photopolymère standard 405nm couleur Noire (1 L).",
        "actionEntretien": "Filtrer la résine usagée avant stockage.", "niveauRequis": "N1",
        "consigneSecurite": "Port de gants nitriles et masque respiratoire obligatoire.", "status": "Alerte"
    },

    # PR-024 Fils de broderie par couleur
    {
        "id": "PR-024-BLA", "reference": "PR-024-BLA", "name": "Fil broderie polyester — Blanc (Bobine 1000m)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Textile",
        "equipement": "Brodeuse numérique (Espace Textile FabLab)",
        "supplier": "Mercerie Industrielle Agadir", "refSupplier": "FIL-BROD-WHT",
        "unitCostMAD": 40.0, "priceMAD": 40.0, "unit": "u", "quantity": 2, "min": 1, "max": 5, "location": "Boîte Textile",
        "description": "Bobine de fil de broderie haute résistance Blanc (1000m).",
        "actionEntretien": "Vérifier la tension lors de l'enfilage.", "niveauRequis": "N1",
        "consigneSecurite": "Stockage à l'abri des poussières.", "status": "Opérationnel"
    },
    {
        "id": "PR-024-NOI", "reference": "PR-024-NOI", "name": "Fil broderie polyester — Noir (Bobine 1000m)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Textile",
        "equipement": "Brodeuse numérique (Espace Textile FabLab)",
        "supplier": "Mercerie Industrielle Agadir", "refSupplier": "FIL-BROD-BLK",
        "unitCostMAD": 40.0, "priceMAD": 40.0, "unit": "u", "quantity": 2, "min": 1, "max": 5, "location": "Boîte Textile",
        "description": "Bobine de fil de broderie haute résistance Noir (1000m).",
        "actionEntretien": "Vérifier la tension lors de l'enfilage.", "niveauRequis": "N1",
        "consigneSecurite": "Stockage à l'abri des poussières.", "status": "Opérationnel"
    },
    {
        "id": "PR-024-ROU", "reference": "PR-024-ROU", "name": "Fil broderie polyester — Rouge (Bobine 1000m)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Textile",
        "equipement": "Brodeuse numérique (Espace Textile FabLab)",
        "supplier": "Mercerie Industrielle Agadir", "refSupplier": "FIL-BROD-RED",
        "unitCostMAD": 40.0, "priceMAD": 40.0, "unit": "u", "quantity": 2, "min": 1, "max": 5, "location": "Boîte Textile",
        "description": "Bobine de fil de broderie haute résistance Rouge (1000m).",
        "actionEntretien": "Vérifier la tension lors de l'enfilage.", "niveauRequis": "N1",
        "consigneSecurite": "Stockage à l'abri des poussières.", "status": "Opérationnel"
    },
    {
        "id": "PR-024-BLE", "reference": "PR-024-BLE", "name": "Fil broderie polyester — Bleu (Bobine 1000m)",
        "category": "Consommable", "zone": "Magasin GMAO", "subcat": "Textile",
        "equipement": "Brodeuse numérique (Espace Textile FabLab)",
        "supplier": "Mercerie Industrielle Agadir", "refSupplier": "FIL-BROD-BLU",
        "unitCostMAD": 40.0, "priceMAD": 40.0, "unit": "u", "quantity": 2, "min": 1, "max": 5, "location": "Boîte Textile",
        "description": "Bobine de fil de broderie haute résistance Bleu (1000m).",
        "actionEntretien": "Vérifier la tension lors de l'enfilage.", "niveauRequis": "N1",
        "consigneSecurite": "Stockage à l'abri des poussières.", "status": "Opérationnel"
    }
]

# Extract clean individual FL items from Excel
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

            spec_clean = spec
            if 'doublon' in spec_clean:
                spec_clean = '17/16'
            elif 'Nature' in spec_clean:
                spec_clean = 'À identifier'
            elif spec_clean == 'nan':
                spec_clean = ''

            # Build exact name per color / variant in separate line
            line_name = designation.strip()
            if spec_clean and spec_clean not in ['Equipement', 'Equipement Atelier']:
                line_name = f"{designation.strip()} — {spec_clean}"

            assigned_eq = f"Atelier {curr_zone}"
            if 'Filament' in designation:
                assigned_eq = "Imprimantes 3D FDM (Creality / Raise3D / Industrielle)"
            elif 'peinture' in designation:
                assigned_eq = "Poste de Finition & Peinture Atelier"
            elif 'Tirefonds' in designation or 'Vis' in designation or 'Pointe' in designation:
                assigned_eq = "Outillage Usinage & Assemblage Mécanique"
            elif 'Cle' in designation or 'Scie' in designation or 'Pince' in designation or 'Tournevis' in designation:
                assigned_eq = "Équipements Atelier & Outillage à Main"
            elif 'Meuleuse' in designation or 'perceuse' in designation:
                assigned_eq = "Poste de Coupe & Meulage Atelier"

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
                m_secu = "Maintenir le rangement par référence."

            fl_clean_items.append({
                "id": code,
                "reference": code,
                "name": line_name, # Each variant presented as its own distinct line
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
                "description": f"Équipement d'atelier répertorié au FabLab ({line_name}).",
                "actionEntretien": m_action,
                "niveauRequis": "N1",
                "consigneSecurite": m_secu,
                "status": "Opérationnel" if (etat == "Operationnel" or quantity_num > 0) else ("Non renseigné" if etat == "Non renseigne" else "Rupture")
            })

all_items_v14 = base_pr_items + pr_splits + fl_clean_items
print(f"Total Base PR: {len(base_pr_items)}, Total Split PR: {len(pr_splits)}, Total Clean FL: {len(fl_clean_items)}, Combined Total: {len(all_items_v14)}")

# Save to realStockData.ts
new_items_json = json.dumps(all_items_v14, indent=2, ensure_ascii=False)
new_content = content[:match.start(1)] + new_items_json + content[match.end(1):]

with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

# Save to realStock.json
with open('frontend/src/data/realStock.json', 'w', encoding='utf-8') as f:
    json.dump(all_items_v14, f, indent=2, ensure_ascii=False)

print("Saved split variant stock dataset to realStockData.ts and realStock.json.")
