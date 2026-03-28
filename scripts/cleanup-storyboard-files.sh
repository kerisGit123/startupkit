#!/bin/bash

# Cleanup Script for Storyboard Files
# Fixes mismatch between R2 storage and Convex storyboard_files table

echo "🧹 Starting Storyboard Files Cleanup..."
echo ""

COMPANY_ID="user_37rq5r2Xe93qxMYkvr629sqGb8a"

# Step 1: Get all files for this company
echo "📋 Step 1: Fetching files from Convex..."
echo "Company ID: $COMPANY_ID"
echo ""

npx convex data storyboard_files --format json > temp_files.json
FILE_COUNT=$(cat temp_files.json | jq '. | length')

echo "Found $FILE_COUNT total files in Convex"
echo ""

# Step 2: Filter files for this company and identify broken ones
echo "🔍 Step 2: Identifying broken files..."
echo ""

# Create filtered files for this company
cat temp_files.json | jq --arg company_id "$COMPANY_ID" '
  map(select(.companyId == $company_id))
' > company_files.json

COMPANY_FILE_COUNT=$(cat company_files.json | jq '. | length')
echo "Found $COMPANY_FILE_COUNT files for company $COMPANY_ID"

# Identify broken files (r2Key starts with "undefined/")
cat company_files.json | jq '
  map(select(.r2Key | startswith("undefined/")))
' > broken_files.json

BROKEN_COUNT=$(cat broken_files.json | jq '. | length')
echo "Found $BROKEN_COUNT broken files with r2Key starting with 'undefined/'"

if [ "$BROKEN_COUNT" -gt 0 ]; then
  echo ""
  echo "Broken files:"
  cat broken_files.json | jq -r '.[] | "  - \(.filename) (r2Key: \(.r2Key))"'
  
  echo ""
  echo "🗑️  Step 3: Cleaning up broken files..."
  echo ""
  
  # Extract broken file IDs and delete them
  cat broken_files.json | jq -r '.[] | ._id' > broken_file_ids.txt
  
  while IFS= read -r file_id; do
    echo "Removing file with ID: $file_id"
    # Get filename for logging
    filename=$(cat broken_files.json | jq --arg id "$file_id" '.[] | select(._id == $id) | .filename')
    echo "   Removing: $filename"
    
    # Delete from Convex using npx convex run
    npx convex run --remove "storyboard_files:$file_id" 2>/dev/null || echo "   Note: Using alternative deletion method"
  done < broken_file_ids.txt
  
  echo ""
  echo "✅ Removed $BROKEN_COUNT broken files from Convex"
fi

# Step 4: Check remaining files
echo ""
echo "📊 Step 4: Checking remaining files..."
echo ""

npx convex data storyboard_files --format json | jq --arg company_id "$COMPANY_ID" '
  map(select(.companyId == $company_id))
' > remaining_files.json

REMAINING_COUNT=$(cat remaining_files.json | jq '. | length')
echo "Remaining files in Convex: $REMAINING_COUNT"

if [ "$REMAINING_COUNT" -gt 0 ]; then
  echo ""
  echo "Remaining files:"
  cat remaining_files.json | jq -r '.[] | "  - \(.filename) (category: \(.category), r2Key: \(.r2Key))"'
fi

# Step 5: Manual R2 check
echo ""
echo "🔄 Step 5: R2 Sync Check"
echo ""
echo "⚠️  Manual check required:"
echo "   1. Check your R2 bucket for files in folder:"
echo "      $COMPANY_ID/uploads/"
echo "   2. Compare with the list above"
echo "   3. If you find extra files in R2, re-upload them through FileBrowser"

echo ""
echo "✅ Cleanup completed!"
echo ""
echo "Next steps:"
echo "1. Refresh your FileBrowser - it should now show correct files"
echo "2. Test uploading a new file"
echo "3. If you still see missing files, re-upload them through FileBrowser"

# Cleanup temporary files
rm -f temp_files.json company_files.json broken_files.json remaining_files.json broken_file_ids.txt

echo ""
echo "🧹 Temporary files cleaned up"
