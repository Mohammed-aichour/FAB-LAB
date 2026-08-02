import pandas as pd
import json

file_path = r'd:\Apps\Desktop\Downloads\Stage_3A\Anti\DOSSIER Tableau de criticité (A-B-C) - Plan de maintenance préventive complet -  Gammes de maintenance illustrées - FABLAB UNIVERSIAPOLIS.xlsx'
df = pd.read_excel(file_path, sheet_name='02_Arborescence_Reelle', header=None)

machines = []
for idx, row in df.iterrows():
    code = str(row[0]).strip() if pd.notna(row[0]) else ""
    designation = str(row[1]).strip() if pd.notna(row[1]) else ""
    niveau = str(row[2]).strip() if pd.notna(row[2]) else ""
    desc = str(row[3]).strip() if pd.notna(row[3]) else ""
    qty = str(row[4]).strip() if pd.notna(row[4]) else ""
    etat = str(row[5]).strip() if pd.notna(row[5]) else ""
    gmao = str(row[6]).strip() if pd.notna(row[6]) else ""
    code_eq = str(row[7]).strip() if pd.notna(row[7]) else ""

    if code.startswith('FL-') and gmao == '1': # 1 = machine complexe (analyse AMDEC, machines principales)
        machines.append({
            "reference": code,
            "name": designation,
            "description": desc if desc and desc != 'nan' else "",
            "category": "Machine Complexe / FabLab",
            "codeEQ": code_eq if code_eq and code_eq != 'nan' else "",
            "status": "Ne marche pas" if ('Hors service' in etat or 'confirmer' in etat or 'renseigne' in etat) else "Marche",
            "rawStatus": etat
        })

print(f"Total machines complexes (GMAO=1): {len(machines)}")
print(json.dumps(machines, indent=2, ensure_ascii=False))
