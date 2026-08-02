import os
import re

src_dir = r'd:\Apps\Desktop\Downloads\Stage_3A\Anti\frontend\src'
results = []

for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith('.ts') or f.endswith('.tsx'):
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
                for line_idx, line in enumerate(fp, 1):
                    if 'localStorage' in line:
                        results.append(f"{f}:{line_idx}: {line.strip()}")

print(f"Found {len(results)} occurrences:")
for r in results:
    print(r)
