#!/bin/bash

# prepare-cedar-schema.sh
# This script prepares a Cedar schema JSON file for use with Amazon Verified Permissions
# It adds a top-level key "cedarJson", escapes quotes inside the object,
# and outputs the result as a single line

# Usage: ./prepare-cedar-schema.sh input.json output.json [namespace]
# Where:
#   input.json - The original Cedar schema JSON file
#   output.json - The output file to create

set -e

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 input.json output.json"
    echo "Example: $0 v2.cedarschema.json prepared-schema.json"
    exit 1
fi

INPUT_FILE=$1
OUTPUT_FILE=$2

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Error: Input file '$INPUT_FILE' not found"
    exit 1
fi

# This creates a temporary file with the structure: {"NAMESPACE": {...original content...}}
TEMP_CONTENT=$(jq '.' "$INPUT_FILE")

# Create a new JSON with cedarJson as the top-level key
echo "{\"cedarJson\": $TEMP_CONTENT}" > "$OUTPUT_FILE.tmp"

# Convert to a single line and properly format for Verified Permissions CLI
# 1. First convert the schema to a compact JSON (single line)
# 2. Then escape the quotes inside the cedarJson value
jq -c '.' "$OUTPUT_FILE.tmp" > "$OUTPUT_FILE.compact"

# Extract the schema content (without the surrounding {"cedarJson":...})
CONTENT=$(jq -c '.cedarJson' "$OUTPUT_FILE.compact")

# Escape quotes in the content
ESCAPED_CONTENT=$(echo "$CONTENT" | sed 's/"/\\"/g')

# Create the final output with the proper format
echo "{\"cedarJson\":\"$ESCAPED_CONTENT\"}" > "$OUTPUT_FILE"

# Clean up additional temporary file
rm "$OUTPUT_FILE.compact"

# Clean up temporary file
rm "$OUTPUT_FILE.tmp"

echo "Cedar schema prepared successfully: $OUTPUT_FILE"
echo "You can now use it with AWS CLI:"
echo "aws verifiedpermissions put-schema --definition file://$OUTPUT_FILE --policy-store-id <your-policy-store-id> --region <your-region>"
