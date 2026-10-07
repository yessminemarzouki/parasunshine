from pathlib import Path
import shutil
import zipfile

# 1. Paramètres
zip_path = "C:/Users/Lenovo/Downloads/zipzip.zip"
extract_dir = "dossier_extrait_temp"
output_base = Path("lots_produits_resultats")

# 2. Extraction du fichier ZIP
print("Extraction du fichier ZIP en cours...")
with zipfile.ZipFile(zip_path, "r") as zip_ref:
  zip_ref.extractall(extract_dir)

# Chemins vers les dossiers extraits
dossier1_path = Path(extract_dir) / "Dossier1"
dossier2_path = Path(extract_dir) / "Dossier2"

# Extensions d'images prises en charge
image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".gif"}

# 3. Récupération des fichiers avec le nom SANS extension comme clé (stem)
# Dictionnaire : { 'nom_du_produit' : chemin_complet }
images1_dict = {
    p.stem.lower(): p
    for p in dossier1_path.iterdir()
    if p.suffix.lower() in image_extensions
}
images2_dict = {
    p.stem.lower(): p
    for p in dossier2_path.iterdir()
    if p.suffix.lower() in image_extensions
}

print(f"Trouvé {len(images1_dict)} images dans Dossier1 (Principales).")
print(f"Trouvé {len(images2_dict)} images dans Dossier2 (Optionnelles).")

# 4. Recherche des correspondances et des restes par nom de produit
keys1 = set(images1_dict.keys())
keys2 = set(images2_dict.keys())

matching_keys = sorted(list(keys1.intersection(keys2)))
only_in_dossier1 = sorted(list(keys1 - keys2))
only_in_dossier2 = sorted(list(keys2 - keys1))

print(f"\nProduits avec correspondance parfaite : {len(matching_keys)}")
print(f"Restes uniquement dans Dossier1 : {len(only_in_dossier1)}")
print(f"Restes uniquement dans Dossier2 : {len(only_in_dossier2)}")

output_base.mkdir(exist_ok=True)
batch_size = 200

# 5. Création des lots par paquets de 200
num_lots = (len(matching_keys) + batch_size - 1) // batch_size

for i in range(num_lots):
  lot_num = i + 1
  lot_dir = output_base / f"lot{lot_num}"

  lot_d1 = lot_dir / "Dossier1_Principales"
  lot_d2 = lot_dir / "Dossier2_Optionnelles"

  lot_d1.mkdir(parents=True, exist_ok=True)
  lot_d2.mkdir(parents=True, exist_ok=True)

  batch_keys = matching_keys[i * batch_size : (i + 1) * batch_size]

  for key in batch_keys:
    path1 = images1_dict[key]
    path2 = images2_dict[key]
    # On conserve le nom et l'extension d'origine du fichier lors de la copie
    shutil.copy(path1, lot_d1 / path1.name)
    shutil.copy(path2, lot_d2 / path2.name)

  print(f"Lot {lot_num} créé avec {len(batch_keys)} paires de produits.")

# 6. Gestion des restes
if only_in_dossier1:
  reliquat_d1 = output_base / "Restes_Dossier1"
  reliquat_d1.mkdir(parents=True, exist_ok=True)
  for key in only_in_dossier1:
    path1 = images1_dict[key]
    shutil.copy(path1, reliquat_d1 / path1.name)
  print(
      f"Dossier 'Restes_Dossier1' créé avec {len(only_in_dossier1)} images"
      " sans correspondance."
  )

if only_in_dossier2:
  reliquat_d2 = output_base / "Restes_Dossier2"
  reliquat_d2.mkdir(parents=True, exist_ok=True)
  for key in only_in_dossier2:
    path2 = images2_dict[key]
    shutil.copy(path2, reliquat_d2 / path2.name)
  print(
      f"Dossier 'Restes_Dossier2' créé avec {len(only_in_dossier2)} images"
      " sans correspondance."
  )

print(
    f"\nTerminé ! Tous les lots et dossiers de restes sont prêts dans"
    f" '{output_base}'"
)