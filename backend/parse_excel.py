import pandas as pd
import json

df = pd.read_excel('Anuvaad_INDB_2024.11.xlsx', nrows=5)
print("Columns:")
print(df.columns.tolist())
print("\nFirst row:")
print(df.iloc[0].to_dict())
