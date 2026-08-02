import json

with open('frontend/src/data/realStock.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

for idx, i in enumerate(items, 1):
    print(f"{idx:02d}. [{i['id']}] {i['name']}")
    print(f"   --> Équipement: {i.get('equipement')}\n")
