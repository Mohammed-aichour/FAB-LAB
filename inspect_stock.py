import re
import json

path = r'd:\Apps\Desktop\Downloads\Stage_3A\Anti\frontend\src\data\realStockData.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract items
items_str = content.split('realStockItems: StockItem[] = ')[1]
# evaluate or parse JSON
# remove export and typescript syntax
items_json = items_str.strip().rstrip(';')

print(items_json[:500])
