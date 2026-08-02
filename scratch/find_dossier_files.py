import os

workspace_root = r"d:\Apps\Desktop\Downloads\Stage_3A\Anti"

for root, dirs, files in os.walk(workspace_root):
    for f in files:
        if any(kw in f.lower() for kw in ['dossier', 'criticite', 'criticité', 'stock', 'pièce', 'piece', 'fablab', '9.']):
            print(os.path.join(root, f))
