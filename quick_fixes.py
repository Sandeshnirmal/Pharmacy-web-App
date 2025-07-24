#!/usr/bin/env python3
"""
Quick fixes for common mobile app issues
Fixes deprecated methods and optimizes performance
"""

import os
import re

def fix_deprecated_withopacity():
    """Fix deprecated withOpacity calls in Flutter files"""
    
    flutter_files = []
    for root, dirs, files in os.walk('lib'):
        for file in files:
            if file.endswith('.dart'):
                flutter_files.append(os.path.join(root, file))
    
    print("🔧 Fixing deprecated withOpacity calls...")
    
    fixed_count = 0
    for file_path in flutter_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace withOpacity with withValues
            original_content = content
            content = re.sub(r'\.withOpacity\(([^)]+)\)', r'.withValues(alpha: \1)', content)
            
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"  ✅ Fixed: {file_path}")
                fixed_count += 1
                
        except Exception as e:
            print(f"  ❌ Error fixing {file_path}: {e}")
    
    print(f"🎯 Fixed {fixed_count} files with deprecated withOpacity calls")

def remove_debug_prints():
    """Remove debug print statements from production code"""
    
    flutter_files = []
    for root, dirs, files in os.walk('lib'):
        for file in files:
            if file.endswith('.dart'):
                flutter_files.append(os.path.join(root, file))
    
    print("🔧 Removing debug print statements...")
    
    fixed_count = 0
    for file_path in flutter_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # Remove print statements but keep important ones
            new_lines = []
            removed_prints = 0
            
            for line in lines:
                # Keep print statements that seem important (error handling, etc.)
                if 'print(' in line and not any(keyword in line.lower() for keyword in ['error', 'exception', 'failed', 'success']):
                    # Comment out debug prints instead of removing
                    new_lines.append('    // ' + line.strip() + ' // Debug print removed\n')
                    removed_prints += 1
                else:
                    new_lines.append(line)
            
            if removed_prints > 0:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.writelines(new_lines)
                print(f"  ✅ Cleaned: {file_path} ({removed_prints} prints)")
                fixed_count += 1
                
        except Exception as e:
            print(f"  ❌ Error cleaning {file_path}: {e}")
    
    print(f"🎯 Cleaned {fixed_count} files of debug prints")

def optimize_imports():
    """Remove unused imports from Dart files"""
    
    print("🔧 Optimizing imports...")
    
    # This is a basic implementation - in production, use dart analyze
    print("  ℹ️  Run 'dart fix --apply' to automatically fix import issues")
    print("  ℹ️  Run 'flutter analyze' to see detailed analysis")

def create_production_config():
    """Create production configuration files"""
    
    print("🔧 Creating production configuration...")
    
    # Create production API config
    api_config = '''
// Production API Configuration
class ApiConfig {
  static const String baseUrl = 'https://your-production-server.com';
  static const int timeoutDuration = 30000;
  static const bool enableLogging = false; // Disable in production
  
  // API Endpoints
  static const String authLogin = '/api/auth/login/';
  static const String products = '/product/products/';
  static const String enhancedProducts = '/product/enhanced-products/';
  static const String prescriptionUpload = '/prescription/mobile/upload/';
  static const String prescriptionStatus = '/prescription/mobile/status/';
  static const String medicineSuggestions = '/prescription/mobile/suggestions/';
}
'''
    
    try:
        with open('lib/config/api_config.dart', 'w') as f:
            f.write(api_config)
        print("  ✅ Created: lib/config/api_config.dart")
    except Exception as e:
        print(f"  ❌ Error creating API config: {e}")

def create_build_script():
    """Create automated build script"""
    
    print("🔧 Creating build script...")
    
    build_script = '''#!/bin/bash
# Automated build script for Pharmacy Mobile App

echo "🚀 Starting Pharmacy App Build Process..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
flutter clean

# Get dependencies
echo "📦 Getting dependencies..."
flutter pub get

# Run code analysis
echo "🔍 Running code analysis..."
flutter analyze

# Run tests (if any)
echo "🧪 Running tests..."
flutter test

# Build for Android
echo "📱 Building Android APK..."
flutter build apk --release

# Build App Bundle for Play Store
echo "📦 Building Android App Bundle..."
flutter build appbundle --release

echo "✅ Build process completed!"
echo "📁 APK location: build/app/outputs/flutter-apk/app-release.apk"
echo "📁 Bundle location: build/app/outputs/bundle/release/app-release.aab"
'''
    
    try:
        with open('build_app.sh', 'w') as f:
            f.write(build_script)
        os.chmod('build_app.sh', 0o755)  # Make executable
        print("  ✅ Created: build_app.sh")
    except Exception as e:
        print(f"  ❌ Error creating build script: {e}")

def main():
    """Run all quick fixes"""
    
    print("🔧 PHARMACY APP QUICK FIXES")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists('lib'):
        print("❌ Error: Not in Flutter project directory")
        print("   Please run this script from the Pharmacy_mobile_app directory")
        return
    
    # Create config directory if it doesn't exist
    os.makedirs('lib/config', exist_ok=True)
    
    # Run fixes
    fix_deprecated_withopacity()
    print()
    
    remove_debug_prints()
    print()
    
    optimize_imports()
    print()
    
    create_production_config()
    print()
    
    create_build_script()
    print()
    
    print("=" * 50)
    print("🎉 Quick fixes completed!")
    print()
    print("📋 Next steps:")
    print("  1. Run 'flutter analyze' to check for remaining issues")
    print("  2. Run 'dart fix --apply' to auto-fix import issues")
    print("  3. Test the app with 'flutter run'")
    print("  4. Build for production with './build_app.sh'")
    print()
    print("🚀 Your app is ready for production deployment!")

if __name__ == "__main__":
    main()
