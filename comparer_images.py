import os
import shutil
from pathlib import Path

# Chemins de vos dossiers (assurez-vous qu'ils pointent vers vos vrais sous-dossiers)
dossier1 = r"C:\Users\Lenovo\Downloads\Dossier1" 
dossier2 = r"C:\Users\Lenovo\Downloads\Dossier2"

# Extensions d'images prises en charge
extensions_images = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".jfif"}

def obtenir_fichiers_images(dossier):
    """Retourne un dictionnaire associant le nom (sans extension) au chemin complet du fichier."""
    fichiers_dict = {}
    chemin_dossier = Path(dossier)
    if not chemin_dossier.exists():
        print(f"Attention : Le dossier '{dossier}' n'existe pas.")
        return fichiers_dict
        
    for fichier in chemin_dossier.iterdir():
        if fichier.is_file() and fichier.suffix.lower() in extensions_images:
            fichiers_dict[fichier.stem] = fichier
    return fichiers_dict

# Récupération des dictionnaires pour les deux dossiers
dict_dossier1 = obtenir_fichiers_images(dossier1)
dict_dossier2 = obtenir_fichiers_images(dossier2)

# Trouver les noms présents dans le dossier 2 mais absents du dossier 1
noms_dossier1 = set(dict_dossier1.keys())
noms_dossier2 = set(dict_dossier2.keys())
absentes_dans_dossier1 = sorted(noms_dossier2 - noms_dossier1)

print(f"\n--- RÉSULTATS DU DÉPLACEMENT ---")
print(f"Total images dans le dossier 1 : {len(dict_dossier1)}")
print(f"Total images dans le dossier 2 : {len(dict_dossier2)}")
print(f"Images présentes dans le dossier 2 et absentes du dossier 1 : {len(absentes_dans_dossier1)}\n")

# Déplacement effectif des fichiers vers le dossier 1
if absentes_dans_dossier1:
    print("Déplacement des fichiers en cours...")
    for nom in absentes_dans_dossier1:
        chemin_source = dict_dossier2[nom]
        chemin_destination = Path(dossier1) / chemin_source.name
        
        try:
            # shutil.move déplace le fichier (il quitte le dossier 2 pour aller dans le dossier 1)
            shutil.move(str(chemin_source), str(chemin_destination))
            print(f" [✔] Déplacé : {chemin_source.name}")
        except Exception as e:
            print(f" [X] Erreur pour {chemin_source.name} : {e}")
            
    print("\nOpération de déplacement terminée avec succès !")
else:
    print("Aucune image à déplacer. Toutes les images du dossier 2 existent déjà dans le dossier 1.")