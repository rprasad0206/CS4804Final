import pandas as pd
import os

# Folder containing your Excel files
folder_path = "C:/Users/rohan/OneDrive/Desktop/Data Viz/CS4804Final/CS4804Final/EXLFiles"

# Get all Excel files in the folder
excel_files = [f for f in os.listdir(folder_path) if f.endswith(".xlsx")]

# Initialize an empty list to store DataFrames
dfs = []

# Read each file and append to the list
for file in excel_files:
    file_path = os.path.join(folder_path, file)
    df = pd.read_excel(file_path)
    dfs.append(df)

# Combine all DataFrames, keeping all columns (even uncommon ones)
combined_df = pd.concat(dfs, ignore_index=True, sort=False)

# Save the merged file
combined_df.to_excel("combined_output.xlsx", index=False)

print("All files have been merged into 'combined_output.xlsx'")
