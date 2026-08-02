import json
import os

ged_dir = r'd:\Apps\Desktop\Downloads\Stage_3A\Anti\Documents_GED'
metadata_path = os.path.join(ged_dir, 'metadata.json')

existing_metadata = {}
if os.path.exists(metadata_path):
    try:
        with open(metadata_path, 'r', encoding='utf-8') as f:
            existing_metadata = json.load(f)
    except:
        existing_metadata = {}

# File descriptions map
file_map = {
    "FICHE — Historique des interventions (par équipement).pdf": {
        "title": "Fiche — Historique des Interventions (Par Équipement)",
        "type": "Fiche d'Entretien",
        "machine": "Tous Équipements FabLab",
        "date": "2026-07-21"
    },
    "FORMULAIRE — Demande de réapprovisionnement.pdf": {
        "title": "Formulaire — Demande de Réapprovisionnement Stock",
        "type": "Formulaire GMAO",
        "machine": "Magasin GMAO",
        "date": "2026-07-21"
    },
    "FORMULAIRE — Fiche pièce de rechange.pdf": {
        "title": "Formulaire — Fiche Pièce de Rechange",
        "type": "Formulaire GMAO",
        "machine": "Stock & Pièces",
        "date": "2026-07-21"
    },
    "FORMULAIRE — Fiche équipement.pdf": {
        "title": "Formulaire — Fiche Équipement & Fiche Signalétique",
        "type": "Formulaire GMAO",
        "machine": "Ensemble des Machines",
        "date": "2026-07-21"
    },
    "Fiche Technique Raise3D E2CF.docx": {
        "title": "Fiche Technique — Imprimante 3D Raise3D E2CF (FDM/IDEX)",
        "type": "Fiche Technique",
        "machine": "Raise3D E2CF (EQ3)",
        "date": "2026-07-21"
    },
    "Fiche_Technique_3D_Raise3D_E2CF.docx": {
        "title": "Manuel Constructeur — Raise3D E2CF IDEX Composite",
        "type": "Manuel Constructeur",
        "machine": "Raise3D E2CF (EQ3)",
        "date": "2026-07-21"
    },
    "Fiche_Technique_Perceuse_Fraiseuse_Technodrill.docx": {
        "title": "Fiche Technique — Perceuse / Fraiseuse Technodrill 3 CNC",
        "type": "Fiche Technique",
        "machine": "Technodrill 3 (EQ1)",
        "date": "2026-07-21"
    },
    "Fiche_Technique_TPROD_6060.docx": {
        "title": "Fiche Technique — Fraiseuse CNC TPROD 6060 (PIPROD)",
        "type": "Fiche Technique",
        "machine": "TPROD 6060 (EQ2)",
        "date": "2026-07-21"
    },
    "Fiche_Technique_Technodrill_3_CNC.docx": {
        "title": "Manuel d'Utilisation — Technodrill 3 C.I.F",
        "type": "Manuel Constructeur",
        "machine": "Technodrill 3 (EQ1)",
        "date": "2026-07-21"
    },
    "INVENTAIRE PHYSIQUE UNIVERSIAPOLIS.xlsx": {
        "title": "Inventaire Physique Complet — FabLab Universiapolis",
        "type": "Inventaire & Registre",
        "machine": "Magasin & Parc Machines",
        "date": "2026-07-21"
    },
    "Registre_Equipements_Fablab.xlsx": {
        "title": "Registre Officiel des Équipements FabLab (69 Références)",
        "type": "Registre GMAO",
        "machine": "Tout le Parc FabLab",
        "date": "2026-07-21"
    }
}

for fname, meta in file_map.items():
    if os.path.exists(os.path.join(ged_dir, fname)):
        existing_metadata[fname] = meta

with open(metadata_path, 'w', encoding='utf-8') as f:
    json.dump(existing_metadata, f, indent=2, ensure_ascii=False)

print(f"Updated metadata.json for {len(existing_metadata)} files.")
