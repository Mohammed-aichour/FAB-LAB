import pandas as pd
file_path = r'd:\Apps\Desktop\Downloads\Stage_3A\Anti\DOSSIER Tableau de criticité (A-B-C) - Plan de maintenance préventive complet -  Gammes de maintenance illustrées - FABLAB UNIVERSIAPOLIS.xlsx'
xl = pd.ExcelFile(file_path)
found = False
for sheet in xl.sheet_names:
    df = pd.read_excel(file_path, sheet_name=sheet, header=None)
    for col in df.columns:
        if df[col].astype(str).str.contains('Stock|Pièces|Rechange', case=False, na=False).any():
            print(f'Found in sheet: {sheet}, column: {col}')
            found = True
if not found: print('Not found')
