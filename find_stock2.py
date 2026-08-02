import pandas as pd
file_path = r'd:\Apps\Desktop\Downloads\Stage_3A\Anti\DOSSIER Tableau de criticité (A-B-C) - Plan de maintenance préventive complet -  Gammes de maintenance illustrées - FABLAB UNIVERSIAPOLIS.xlsx'
xl = pd.ExcelFile(file_path)
for sheet in ['02_Arborescence_Reelle', '05_Plan_Maintenance_Preventive', '06_Gammes_Entetes']:
    df = pd.read_excel(file_path, sheet_name=sheet)
    print(f"\n--- Sheet: {sheet} ---")
    print("Columns:", list(df.columns))
    # print a few rows where a string contains 'Stock'
    mask = df.astype(str).apply(lambda x: x.str.contains('Stock|Pièces|Rechange', case=False, na=False)).any(axis=1)
    if not df[mask].empty:
        print(df[mask].head(3))
