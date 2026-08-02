import json
import os

ged_dir = r'd:\Apps\Desktop\Downloads\Stage_3A\Anti\Documents_GED'
metadata_path = os.path.join(ged_dir, 'metadata.json')

simple_file_map = {
    "FICHE — Historique des interventions (par équipement).pdf": {
        "title": "Historique des interventions",
        "type": "Fiche d'entretien",
        "machine": "Tous équipements",
        "date": "21/07/2026"
    },
    "FORMULAIRE — Demande de réapprovisionnement.pdf": {
        "title": "Demande de réapprovisionnement",
        "type": "Formulaire",
        "machine": "Magasin GMAO",
        "date": "21/07/2026"
    },
    "FORMULAIRE — Fiche pièce de rechange.pdf": {
        "title": "Fiche pièce de rechange",
        "type": "Formulaire",
        "machine": "Stock & Pièces",
        "date": "21/07/2026"
    },
    "FORMULAIRE — Fiche équipement.pdf": {
        "title": "Fiche équipement",
        "type": "Formulaire",
        "machine": "Toutes machines",
        "date": "21/07/2026"
    },
    "Fiche Technique Raise3D E2CF.docx": {
        "title": "Fiche technique Raise3D E2CF",
        "type": "Fiche technique",
        "machine": "Raise3D E2CF",
        "date": "21/07/2026"
    },
    "Fiche_Technique_3D_Raise3D_E2CF.docx": {
        "title": "Manuel Raise3D E2CF",
        "type": "Manuel",
        "machine": "Raise3D E2CF",
        "date": "21/07/2026"
    },
    "Fiche_Technique_Perceuse_Fraiseuse_Technodrill.docx": {
        "title": "Fiche technique Technodrill 3",
        "type": "Fiche technique",
        "machine": "Technodrill 3",
        "date": "21/07/2026"
    },
    "Fiche_Technique_TPROD_6060.docx": {
        "title": "Fiche technique TPROD 6060",
        "type": "Fiche technique",
        "machine": "TPROD 6060",
        "date": "21/07/2026"
    },
    "Fiche_Technique_Technodrill_3_CNC.docx": {
        "title": "Manuel Technodrill 3",
        "type": "Manuel",
        "machine": "Technodrill 3",
        "date": "21/07/2026"
    },
    "INVENTAIRE PHYSIQUE UNIVERSIAPOLIS.xlsx": {
        "title": "Inventaire physique",
        "type": "Registre",
        "machine": "Magasin & Machines",
        "date": "21/07/2026"
    },
    "Registre_Equipements_Fablab.xlsx": {
        "title": "Registre des équipements",
        "type": "Registre",
        "machine": "FabLab Universiapolis",
        "date": "21/07/2026"
    }
}

with open(metadata_path, 'w', encoding='utf-8') as f:
    json.dump(simple_file_map, f, indent=2, ensure_ascii=False)

print(f"Saved simple metadata for {len(simple_file_map)} files.")
