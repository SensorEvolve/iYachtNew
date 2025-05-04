import csv
import json
import os  # To find the script's directory

# --- Configuration ---
# <<< CHANGE THIS to your exact CSV file name
csv_file_name = "yacht_credit.csv"
json_file_name = "credits.json"  # The output JSON file name
# -------------------

# Get the directory where the script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_file_path = os.path.join(script_dir, csv_file_name)
# Output JSON in the same directory
json_file_path = os.path.join(script_dir, json_file_name)

output_data = []

try:
    with open(csv_file_path, mode="r", encoding="utf-8") as infile:
        # Use semicolon as delimiter and handle quotes
        reader = csv.DictReader(infile, delimiter=";", quotechar='"')

        # Check if headers match expected (adjust keys if needed)
        # Expected keys based on your CSV structure:
        expected_headers = [
            "Image Filename",
            "Author/User",
            "License Info",
            "Source URL",
            "Modification",
        ]
        # You might need to adjust these slightly if the actual headers in the file differ subtly

        # Optional: Print headers found to help debug
        print(f"CSV Headers found: {reader.fieldnames}")

        # Check for essential headers
        missing_headers = [h for h in expected_headers if h not in reader.fieldnames]
        if missing_headers:
            print(f"Warning: Missing expected headers in CSV: {missing_headers}")
            # Decide if you want to stop or continue
            # return # uncomment to stop if headers are missing

        for row in reader:
            # Map CSV headers to JSON keys
            # Ensure all keys exist in the row, provide default empty string if not
            item = {
                "image_description": row.get("Image Filename", ""),
                "author": row.get("Author/User", ""),
                "license_url": row.get("License Info", ""),
                "source_url": row.get("Source URL", ""),
                "modification_notes": row.get("Modification", ""),
            }
            # Basic validation: check if essential fields have data (optional)
            if (
                not item["image_description"]
                or not item["author"]
                or not item["source_url"]
            ):
                print(f"Warning: Missing essential data in row: {row}")

            output_data.append(item)

    # Write the JSON output file
    with open(json_file_path, mode="w", encoding="utf-8") as outfile:
        # indent=2 for pretty printing
        json.dump(output_data, outfile, indent=2, ensure_ascii=False)

    print(f"Successfully converted '{csv_file_name}' to '{json_file_path}'")

except FileNotFoundError:
    print(
        f"Error: CSV file not found at '{
            csv_file_path
        }'. Make sure the file name is correct and it's in the same directory as the script."
    )
except Exception as e:
    print(f"An error occurred: {e}")
