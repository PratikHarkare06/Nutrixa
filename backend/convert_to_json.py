import pandas as pd
import json

print("Loading Excel...")
df = pd.read_excel('Anuvaad_INDB_2024.11.xlsx')

# Keep only necessary columns for the analysis service
cols_to_keep = ['food_name', 'energy_kcal', 'carb_g', 'protein_g', 'fat_g', 'fibre_g']

# Fill NA with 0
df[cols_to_keep] = df[cols_to_keep].fillna(0)

records = df[cols_to_keep].to_dict('records')

with open('anuvaad_db.json', 'w') as f:
    json.dump(records, f)

print(f"Exported {len(records)} records to anuvaad_db.json")
