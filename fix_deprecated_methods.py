#!/usr/bin/env python3
"""
Script to fix deprecated withOpacity methods in Flutter files
"""
import os
import re

def fix_with_opacity_in_file(file_path):
    """Fix withOpacity calls in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Pattern to match withOpacity calls
        pattern = r'(\w+)\.withOpacity\(([^)]+)\)'
        
        def replace_with_opacity(match):
            color = match.group(1)
            opacity = match.group(2)
            return f'{color}.withValues(alpha: {opacity})'
        
        # Replace all withOpacity calls
        new_content = re.sub(pattern, replace_with_opacity, content)
        
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"✅ Fixed withOpacity in: {file_path}")
            return True
        else:
            return False
            
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def fix_all_dart_files():
    """Fix withOpacity in all Dart files"""
    dart_files = []
    
    # Find all .dart files
    for root, dirs, files in os.walk('Pharmacy_mobile_app/lib'):
        for file in files:
            if file.endswith('.dart'):
                dart_files.append(os.path.join(root, file))
    
    print(f"🔍 Found {len(dart_files)} Dart files")
    
    fixed_count = 0
    for file_path in dart_files:
        if fix_with_opacity_in_file(file_path):
            fixed_count += 1
    
    print(f"🎯 Fixed withOpacity in {fixed_count} files")

if __name__ == "__main__":
    print("🔧 Fixing deprecated withOpacity methods...")
    fix_all_dart_files()
    print("✅ Done!")
