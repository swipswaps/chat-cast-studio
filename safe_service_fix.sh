#!/bin/bash
# safe_service_fix.sh
# Updates all TS/TSX service imports only if the target file exists

# Find all TS/TSX files
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
    dir=$(dirname "$file")
    
    # Check each line with a services import
    grep -n 'from ["'\''].*services/.*["'\'']' "$file" | while read -r match; do
        # Extract line number and import path
        line_num=$(echo "$match" | cut -d: -f1)
        import_path=$(echo "$match" | grep -oP 'from ["'\'']\K.*(?=["'\''])')
        
        # Construct full path to check
        full_path="$dir/$import_path.ts"
        
        if [ -f "$full_path" ]; then
            # File exists — fix the import to have "./" if it starts with "./" or "../" correctly
            fixed_path=$(realpath --relative-to="$dir" "$full_path" | sed 's|\\|/|g')
            sed -i "${line_num}s|$import_path|$fixed_path|" "$file"
            echo "✅ Fixed import in $file: $import_path → $fixed_path"
        else
            echo "⚠️  Skipped import in $file (target missing): $import_path"
        fi
    done
done
