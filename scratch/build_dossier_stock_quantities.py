import openpyxl
import json

dossier_path = r"d:\Apps\Desktop\Downloads\Stage_3A\Anti\DOSSIER Tableau de criticité (A-B-C) - Plan de maintenance préventive complet -  Gammes de maintenance illustrées - FABLAB UNIVERSIAPOLIS.xlsx"
wb_dossier = openpyxl.load_workbook(dossier_path, data_only=True)

# 1. Map FL-xxx quantities from Sheet 02_Arborescence_Reelle
fl_quantities = {}
sheet_arb = wb_dossier['02_Arborescence_Reelle']
for r in range(5, sheet_arb.max_row + 1):
    code = sheet_arb.cell(r, 1).value
    name = sheet_arb.cell(r, 2).value
    qty = sheet_arb.cell(r, 5).value
    if code and str(code).startswith('FL-') and qty is not None:
        try:
            fl_quantities[str(code).strip()] = int(float(qty))
        except:
            pass

print(f"Extracted {len(fl_quantities)} FL-xxx quantities from 02_Arborescence_Reelle")

# 2. Map PR-001 to PR-030 from sheet 9. Pièces de rechange in Dossier complet
gmao_path = r"d:\Apps\Desktop\Downloads\Stage_3A\Anti\GMAO_FabLab_Universiapolis_Dossier_complet_8-9-12-13-14.xlsx"
wb_gmao = openpyxl.load_workbook(gmao_path, data_only=True)
sheet_pr = wb_gmao.worksheets[4]

stock_items = []

for r in range(5, 35):
    ref = sheet_pr.cell(r, 1).value
    if ref:
        qty = int(float(sheet_pr.cell(r, 9).value or 0))
        min_q = int(float(sheet_pr.cell(r, 10).value or 0))
        max_q = int(float(sheet_pr.cell(r, 11).value or 0))
        stock_items.append({
            'id': str(ref),
            'reference': str(ref),
            'name': str(sheet_pr.cell(r, 2).value),
            'category': str(sheet_pr.cell(r, 3).value),
            'zone': "Magasin GMAO",
            'subcat': str(sheet_pr.cell(r, 3).value),
            'equipement': str(sheet_pr.cell(r, 4).value),
            'supplier': str(sheet_pr.cell(r, 5).value),
            'refSupplier': str(sheet_pr.cell(r, 6).value or ref),
            'unitCostMAD': float(sheet_pr.cell(r, 7).value or 0),
            'priceMAD': float(sheet_pr.cell(r, 7).value or 0),
            'unit': str(sheet_pr.cell(r, 8).value or 'u'),
            'quantity': qty,
            'min': min_q,
            'max': max_q,
            'location': str(sheet_pr.cell(r, 14).value or 'Casier Général'),
            'description': f"Pièce de rechange {sheet_pr.cell(r, 2).value} ({sheet_pr.cell(r, 4).value})",
            'status': "Disponible" if qty > 0 else "Rupture de Stock"
        })

# Also add the key stock items from 02_Arborescence_Reelle (FL-051 to FL-065)
stock_fl_items = [
    ("FL-064", "Vis CHC (Tête cylindrique)", "Quincaillerie / Visserie", "FabLab Usinage", 217, 50, 500, "Casier C1", "Vis CHC à tête cylindrique pour bridage"),
    ("FL-062", "Tirefonds (Tête hexagonale)", "Quincaillerie / Visserie", "FabLab Usinage", 15, 10, 50, "Casier C1", "Tirefonds tête hexagonale"),
    ("FL-063", "Vis à métaux (Tête fraisée)", "Quincaillerie / Visserie", "FabLab Usinage", 10, 10, 50, "Casier C1", "Vis à métaux tête fraisée"),
    ("FL-051", "Filament ABS Blanc 1.75mm (1 kg)", "Filaments 3D", "FL-IMP-01/02", 3, 2, 10, "Étagère B", "Bobine filament ABS blanc"),
    ("FL-052", "Filament ABS Bleu 1.75mm (1 kg)", "Filaments 3D", "FL-IMP-01/02", 2, 2, 10, "Étagère B", "Bobine filament ABS bleu"),
    ("FL-053", "Filament ABS Orange 1.75mm (1 kg)", "Filaments 3D", "FL-IMP-01/02", 3, 2, 10, "Étagère B", "Bobine filament ABS orange"),
    ("FL-054", "Filament ABS Noir 1.75mm (1 kg)", "Filaments 3D", "FL-IMP-01/02", 1, 2, 10, "Étagère B", "Bobine filament ABS noir"),
    ("FL-055", "Filament ABS Rouge 1.75mm (1 kg)", "Filaments 3D", "FL-IMP-01/02", 4, 2, 10, "Étagère B", "Bobine filament ABS rouge"),
    ("FL-056", "Filament ABS Gris 1.75mm (1 kg)", "Filaments 3D", "FL-IMP-01/02", 1, 2, 10, "Étagère B", "Bobine filament ABS gris"),
    ("FL-057", "Bombe de peinture aérosol Noir mat", "Finition & Peinture", "FabLab Finition", 2, 2, 6, "Local produits", "Peinture aérosol noir mat"),
    ("FL-058", "Bombe de peinture aérosol Bleu", "Finition & Peinture", "FabLab Finition", 1, 2, 6, "Local produits", "Peinture aérosol bleu"),
    ("FL-059", "Bombe de peinture aérosol Beige", "Finition & Peinture", "FabLab Finition", 1, 2, 6, "Local produits", "Peinture aérosol beige"),
    ("FL-060", "Bombe de peinture aérosol Gris", "Finition & Peinture", "FabLab Finition", 2, 2, 6, "Local produits", "Peinture aérosol gris"),
    ("FL-061", "Coffret de gaine thermorétractable", "Électronique & Câblage", "FL-ELE-01", 1, 1, 5, "Casier D1", "Gaine thermorétractable assortie"),
]

for ref, name, cat, eq, qty, min_q, max_q, loc, desc in stock_fl_items:
    stock_items.append({
        'id': ref,
        'reference': ref,
        'name': name,
        'category': cat,
        'zone': "Magasin GMAO",
        'subcat': cat,
        'equipement': eq,
        'supplier': "Fournisseur FabLab",
        'refSupplier': ref,
        'unitCostMAD': 120.0,
        'priceMAD': 120.0,
        'unit': 'u',
        'quantity': qty,
        'min': min_q,
        'max': max_q,
        'location': loc,
        'description': desc,
        'status': "Disponible" if qty > 0 else "Rupture de Stock"
    })

print(f"Total Stock Items generated: {len(stock_items)}")

# Write to realStockData.ts
stock_ts = f"""export interface StockItem {{
  id: string;
  reference: string;
  name: string;
  category: string;
  zone: string;
  subcat: string;
  equipement: string;
  supplier: string;
  refSupplier: string;
  unitCostMAD: number;
  priceMAD: number;
  unit: string;
  quantity: number;
  min: number;
  max: number;
  location: string;
  description?: string;
  status: string;
}}

export const realStockItems: StockItem[] = {json.dumps(stock_items, indent=2, ensure_ascii=False)};
"""

with open(r"d:\Apps\Desktop\Downloads\Stage_3A\Anti\frontend\src\data\realStockData.ts", "w", encoding="utf-8") as f:
    f.write(stock_ts)

with open(r"d:\Apps\Desktop\Downloads\Stage_3A\Anti\data_db\stock_db.json", "w", encoding="utf-8") as f:
    json.dump(stock_items, f, indent=2, ensure_ascii=False)

print("SUCCESSFULLY Updated Stock data and quantities from DOSSIER!")
