import openpyxl
import os

file_path = r"d:\Apps\Desktop\Downloads\Stage_3A\Anti\DOSSIER Tableau de criticité (A-B-C) - Plan de maintenance préventive complet -  Gammes de maintenance illustrées - FABLAB UNIVERSIAPOLIS.xlsx"

if os.path.exists(file_path):
    wb = openpyxl.load_workbook(file_path, data_only=True)
    print("Sheets in DOSSIER:", wb.sheetnames)
    for idx, name in enumerate(wb.sheetnames):
        sheet = wb[name]
        print(f"Sheet {idx}: '{name}' ({sheet.max_row} rows, {sheet.max_column} cols)")
        # Print first 5 rows
        for r in range(1, min(sheet.max_row + 1, 10)):
            vals = [sheet.cell(r, c).value for c in range(1, min(sheet.max_column + 1, 12))]
            if any(v is not None for v in vals):
                print(f"  Row {r}: {vals}")
else:
    print("File not found!")
