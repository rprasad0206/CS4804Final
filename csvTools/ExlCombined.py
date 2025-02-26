#folder_path = "C:/Users/rohan/OneDrive/Desktop/Data Viz/CS4804Final/CS4804Final/EXLFiles"

import pandas as pd
import os

def standardize_columns(df, expected_columns, synonyms):
    """
    Renames columns in df to match expected_columns using a synonyms mapping.
    For each expected column, if any column in df matches one of its synonyms
    (case-insensitive, trimmed), it is renamed to the expected column name.
    """
    col_mapping = {}
    for expected in expected_columns:
        found = None
        for col in df.columns:
            for syn in synonyms.get(expected, [expected]):
                if col.strip().lower() == syn.strip().lower():
                    found = col
                    break
            if found:
                break
        if found:
            col_mapping[found] = expected
    df.rename(columns=col_mapping, inplace=True)
    return df

def split_date_time(df):
    """
    For rows where "Incident Time" is empty and "Incident Date" contains both date and time,
    split the "Incident Date" column into separate date and time parts using vectorized operations.
    """
    if "Incident Date" in df.columns and "Incident Time" in df.columns:
        # Ensure Incident Time is a string
        df["Incident Time"] = df["Incident Time"].fillna("")
        mask = (df["Incident Time"].str.strip() == "") & (df["Incident Date"].str.contains(" "))
        if mask.any():
            # Split only on the first space
            splits = df.loc[mask, "Incident Date"].str.split(" ", n=1, expand=True)
            df.loc[mask, "Incident Date"] = splits[0].str.strip()
            df.loc[mask, "Incident Time"] = splits[1].str.strip()
    return df

# --- Configuration ---

# Use a local folder outside OneDrive for testing
folder_path = "C:/Users/rohan/OneDrive/Desktop/Data Viz/CS4804Final/CS4804Final/EXLFiles" # Change this path as needed
output_folder = "C:/Users/rohan/OneDrive/Desktop/Data Viz/CS4804Final/CS4804Final/EXLFiles"        # Use a local folder for the output file

# Expected columns in the final merged output (in desired order)
expected_columns = [
    "Incident Date",
    "Incident Time",
    "Flight ID",
    "Aircraft",
    "Altitude",
    "Airport",
    "Laser Color",
    "Injury",
    "City",
    "State"
]

# Synonyms mapping for standardizing column names
column_synonyms = {
    "Incident Date": ["Incident Date", "Date"],
    "Incident Time": ["Incident Time", "Time"],
    "Flight ID": ["Flight ID", "FlightID", "Flight Number", "Flight No."],
    "Aircraft": ["Aircraft", "Airplane", "Plane"],
    "Altitude": ["Altitude"],
    "Airport": ["Airport", "Airfield"],
    "Laser Color": ["Laser Color", "Color"],
    "Injury": ["Injury", "Injuries"],
    "City": ["City", "Location"],
    "State": ["State", "Province"]
}

# --- Processing ---

# Get all .xlsx files in the folder_path
excel_files = [f for f in os.listdir(folder_path) if f.lower().endswith(".xlsx")]
print("Found Excel files:", excel_files)

if not excel_files:
    print("No Excel files found in the specified folder. Exiting.")
    exit()

dfs = []

for file in excel_files:
    file_path = os.path.join(folder_path, file)
    print(f"\nReading file: {file}")
    
    try:
        # Read the entire file (without restricting columns)
        df = pd.read_excel(file_path, dtype=str)
    except Exception as e:
        print(f"Error reading {file}: {e}")
        continue
    
    # Standardize the column names using synonyms
    df = standardize_columns(df, expected_columns, column_synonyms)
    
    # Check for any missing expected columns; if any are missing, skip this file
    missing = [col for col in expected_columns if col not in df.columns]
    if missing:
        print(f"Warning: File '{file}' is missing expected columns: {missing}. Skipping this file.")
        continue
    
    # Split the date and time if they are combined in "Incident Date"
    df = split_date_time(df)
    
    # Reorder the columns to match the expected order
    df = df[expected_columns]
    print(f"  → Shape of {file}: {df.shape}")
    dfs.append(df)

if not dfs:
    print("No files with a complete expected schema were processed. Exiting.")
    exit()

# Concatenate all valid DataFrames
combined_df = pd.concat(dfs, ignore_index=True)
print(f"\nCombined DataFrame shape: {combined_df.shape}")

# --- Output ---

# Define the output file path (using the local output folder)
output_file = os.path.join(output_folder, "combined_output.xlsx")

# Use xlsxwriter engine to write the file
try:
    with pd.ExcelWriter(output_file, engine="xlsxwriter") as writer:
        combined_df.to_excel(writer, index=False)
    print(f"\nMerged data saved to: {output_file}")
except Exception as e:
    print("Error writing the merged file:", e)
    exit()

# Verify the merged file by reading it back
print("\nVerifying the merged file by reading it back...")
try:
    test_df = pd.read_excel(output_file, dtype=str)
    print("Successfully read merged file. Here's the first few rows:")
    print(test_df.head())
except Exception as e:
    print("Error reading the merged file:", e)

print("\nProcess complete. If no errors occurred, the merged file should be valid and complete.")
