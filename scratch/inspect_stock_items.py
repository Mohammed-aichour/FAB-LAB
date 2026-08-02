import json
import re

content = open('frontend/src/data/realStockData.ts', encoding='utf-8').read()
match = re.search(r'export const realStockItems: StockItem\[\] = (\[[\s\S]*?\]);', content)
if match:
    items = json.loads(match.group(1))
    for idx, i in enumerate(items, 1):
        print(f"{idx:02d}. {i['id']} | {i['name']} | Eq: {i.get('equipement')}")
