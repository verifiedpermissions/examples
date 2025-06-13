#!/bin/bash

# Script to convert Cedar policy files to AWS Verified Permissions format
# This script takes Cedar policy files with comments and converts them to the JSON format
# expected by the AWS Verified Permissions create-policy command

# Create output directory if it doesn't exist
mkdir -p policies/json

# Process each Cedar policy file
for policy_file in policies/*.cedar; do
    # Get the filename without path and extension
    filename=$(basename "$policy_file" .cedar)
    
    # Output JSON file path
    output_file="policies/json/${filename}.json"
    
    echo "Converting $policy_file to $output_file"
    
    # Extract the comment (description) - take all lines starting with //
    description=$(grep "^//" "$policy_file" | sed 's/^\/\/ //')
    
    # If no description found, use a default
    if [ -z "$description" ]; then
        description="Cedar policy for $filename"
    fi
    
    # Extract the policy statement (all lines except comments)
    statement=$(grep -v "^//" "$policy_file" | tr -d '\n' | sed 's/"/\\"/g')
    
    # Create the JSON structure
    cat > "$output_file" << EOF
{
  "static": {
    "description": "$description",
    "statement": "$statement"
  }
}
EOF
    
    echo "Created $output_file"
done

echo "Conversion complete. JSON policy files are in ../policies/json/"
echo "You can now upload them using:"
echo "aws verifiedpermissions create-policy --policy-store-id YOUR_POLICY_STORE_ID --definition file://path/to/policy.json"
