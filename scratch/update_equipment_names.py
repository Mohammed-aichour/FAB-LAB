import json
import re

# Read realStockData.ts
ts_path = 'frontend/src/data/realStockData.ts'
with open(ts_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'export const realStockItems: StockItem\[\] = (\[[\s\S]*?\]);', content)
if not match:
    print("Error: Could not find realStockItems in ts file")
    exit(1)

items = json.loads(match.group(1))

# Mapping logic based on Excel file (DOSSIER Tableau de criticite...)
equipment_mapping = {
    # Stock PR-001 à PR-030
    "PR-001": "FL-003, FL-004, FL-005, FL-068 - Imprimantes 3D FDM (Creality / Raise3D E2CF)",
    "PR-002": "FL-003, FL-004, FL-005, FL-068 - Imprimantes 3D FDM (Creality / Raise3D E2CF)",
    "PR-003": "FL-003, FL-004, FL-005, FL-068 - Imprimantes 3D FDM (Creality / Raise3D E2CF)",
    "PR-004": "FL-003, FL-004, FL-005, FL-068 - Imprimantes 3D FDM (Creality / Raise3D E2CF)",
    "PR-005": "FL-003, FL-004, FL-005, FL-068, FL-069 - Imprimantes 3D FDM / FFF FabLab",
    "PR-006": "FL-003, FL-004, FL-005, FL-068, FL-069 - Imprimantes 3D FDM / FFF FabLab",
    "PR-007": "FL-006 - Imprimante 3D résine (Photocentric)",
    "PR-008": "FL-006 - Imprimante 3D résine (Photocentric)",
    "PR-009": "FL-006 - Imprimante 3D résine (Photocentric)",
    "PR-010": "FL-007, FL-008 - Machines de découpe laser (PIPROD / WC 3000)",
    "PR-011": "FL-007, FL-008 - Machines de découpe laser (PIPROD / WC 3000)",
    "PR-012": "FL-007, FL-008 - Machines de découpe laser (PIPROD / WC 3000)",
    "PR-013": "FL-007, FL-008, FL-013 - Laser PIPROD & Aspirateur de poussière",
    "PR-014": "Plotter de découpe vinyle (Espace Prototypage)",
    "PR-015": "FL-009, FL-010 - Fraiseuses CNC (TPROD 6060 & Technodrill 3 C.I.F)",
    "PR-016": "FL-009 - Fraiseuse CNC TPROD 6060 (PIPROD)",
    "PR-017": "FL-009, FL-010 - Fraiseuses CNC (TPROD 6060 & Technodrill 3 C.I.F)",
    "PR-018": "FL-046, FL-048, FL-049 - Stations de soudage & de reprise à air chaud (ZD-929B)",
    "PR-019": "FL-046, FL-048, FL-049 - Stations de soudage & de reprise à air chaud (ZD-929B)",
    "PR-020": "FL-017, FL-010 - Perceuse à colonne & Fraiseuse CNC Technodrill 3",
    "PR-021": "FL-018 - Scie à métaux / Scie à ruban",
    "PR-022": "FL-036 - Meuleuse d'angle & Outils de ponçage",
    "PR-023": "Brodeuse numérique (Espace Textile FabLab)",
    "PR-024": "Brodeuse numérique (Espace Textile FabLab)",
    "PR-025": "FL-012 - Compresseur d'air (8 bars)",
    "PR-026": "FL-012 - Compresseur d'air (8 bars)",
    "PR-027": "FL-013 - Aspirateur de poussière",
    "PR-028": "FL-001 - Armoires électriques & Équipements FabLab",
    "PR-029": "Tous Équipements FabLab (Consommable de Sécurité & EPI)",
    "PR-030": "FL-007, FL-008 - Machines de découpe laser (Optiques CO2)",

    # Stock Outillage & Instruments (FL-xxx) issue de la fiche d'entretien outillage (feuille 08 & 02)
    "FL-038": "FL-038 à FL-043 - Instruments de mesure (Oscilloscopes numériques/analogiques & Balances)",
    "FL-044": "FL-044, FL-045 - Instruments électroniques (Alimentation DC réglable & Générateur de signaux)",
    "FL-046": "FL-046, FL-048, FL-049 - Matériel de soudure (Stations de reprise à air chaud & soudage ZD-929B)",
    "FL-002": "FL-002 - Alimentations de laboratoire stabilisées (x10)",
    "FL-011": "FL-011 - Plieuse de plexiglas",
    "FL-012": "FL-012 - Compresseur d'air (8 bars)",
    "FL-013": "FL-013 - Aspirateur de poussière",
    "FL-014": "FL-014, FL-015, FL-016 - Equipements atelier (Pulvérisateur électrique, Pompe à eau KNF, Machine à air chaud)",
    "FL-017": "FL-017 - Perceuse à colonne",
    "FL-047": "FL-047 - Appareil photo / Scanner 3D",
    "FL-066": "FL-066 - Prototype Shell Eco-marathon 2015 (x7 - Prototype pédagogique)",
    "FL-061": "FL-061 - Coffret de gaine thermorétractable",
    "FL-062": "FL-062 à FL-065 - Quincaillerie / Visserie (Tirefonds, Vis à métaux, Vis CHC, Pointes)",
    "FL-051": "FL-051 à FL-056 - Filaments ABS (Blanc, Bleu, Orange, Noir, Rouge, Gris)",
    "FL-018": "FL-018 à FL-035 - Outillage à main (Scies, Clés plates 12/13 à 20/22, Clé six pans, Pinces, Tournevis, Pompe à dessouder)",
    "FL-036": "FL-036, FL-037 - Outils de coupe et meulage (Meuleuse d'angle & Mini perceuse CT13428)",
    "FL-057": "FL-057 à FL-060 - Bombes de peinture aérosol (Noir mat, Bleu, Beige, Gris)",
    "FL-001": "FL-001 - Armoire électrique (x2 - Infrastructure électrique)",
    "FL-050": "FL-050 - Distributeur de gel désinfectant",
    "FL-067": "FL-067 - Intertek (Matériel non identifié - Contrôle requis)"
}

count_updated = 0
for item in items:
    itemId = item['id']
    if itemId in equipment_mapping:
        item['equipement'] = equipment_mapping[itemId]
        count_updated += 1

print(f"Updated {count_updated} items out of {len(items)}.")

# Write back to realStockData.ts
new_items_json = json.dumps(items, indent=2, ensure_ascii=False)
new_content = content[:match.start(1)] + new_items_json + content[match.end(1):]

with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

# Also write to realStock.json
with open('frontend/src/data/realStock.json', 'w', encoding='utf-8') as f:
    json.dump(items, f, indent=2, ensure_ascii=False)

print("Saved updated items to realStockData.ts and realStock.json.")
