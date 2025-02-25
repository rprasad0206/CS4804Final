import csv
import json

# Change 'input.csv' to the path of your CSV file
csv_file = 'combined_output.csv'
json_file = 'combined_output.json'

# Read the CSV file
with open(csv_file, mode='r') as file:
    csv_reader = csv.DictReader(file)
    rows = list(csv_reader)

# Write to JSON file
with open(json_file, mode='w') as file:
    json.dump(rows, file, indent=4)

print(f'CSV has been converted to {json_file}')
