#!/usr/bin/env python3
"""
Script to replace print statements with proper logging in Flutter files
"""
import os
import re

def fix_print_statements_in_file(file_path):
    """Fix print statements in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Add logger import if print statements exist and logger not already imported
        if "print(" in content and "import '../utils/logger.dart';" not in content and "import 'utils/logger.dart';" not in content:
            # Find the last import statement
            import_pattern = r"(import\s+['\"][^'\"]+['\"];)"
            imports = re.findall(import_pattern, content)
            
            if imports:
                # Add logger import after the last import
                last_import = imports[-1]
                if file_path.count('/') >= 3:  # In subdirectory
                    logger_import = "import '../utils/logger.dart';"
                else:
                    logger_import = "import 'utils/logger.dart';"
                
                content = content.replace(last_import, last_import + "\n" + logger_import)
        
        # Replace print statements with AppLogger.debug
        print_pattern = r"print\('([^']+)'\);"
        content = re.sub(print_pattern, r"AppLogger.debug('\1');", content)
        
        # Replace print statements with variables
        print_var_pattern = r"print\(([^)]+)\);"
        content = re.sub(print_var_pattern, r"AppLogger.debug('\$\1');", content)
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ Fixed print statements in: {file_path}")
            return True
        else:
            return False
            
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def fix_all_dart_files():
    """Fix print statements in all Dart files"""
    dart_files = []
    
    # Find all .dart files
    for root, dirs, files in os.walk('Pharmacy_mobile_app/lib'):
        for file in files:
            if file.endswith('.dart'):
                dart_files.append(os.path.join(root, file))
    
    print(f"🔍 Found {len(dart_files)} Dart files")
    
    fixed_count = 0
    for file_path in dart_files:
        if fix_print_statements_in_file(file_path):
            fixed_count += 1
    
    print(f"🎯 Fixed print statements in {fixed_count} files")

if __name__ == "__main__":
    print("🔧 Fixing print statements...")
    fix_all_dart_files()
    print("✅ Done!")
