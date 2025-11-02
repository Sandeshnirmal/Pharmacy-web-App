import openpyxl
from datetime import date

def generate_excel_file(file_path="product_data.xlsx"):
    workbook = openpyxl.Workbook()
    sheet = workbook.active
    sheet.title = "Products"

    headers = [
        'product_name', 'brand_name', 'generic_name', 'manufacturer',
        'medicine_type', 'prescription_type', 'strength', 'form',
        'dosage_form', 'pack_size', 'packaging_unit', 'description',
        'uses', 'side_effects', 'how_to_use', 'precautions', 'storage',
        'image_url', 'hsn_code', 'category_name', 'is_featured',
        'composition_name', 'composition_strength', 'composition_unit',
        'composition_percentage', 'composition_is_primary',
        'batch_number', 'manufacturing_date', 'expiry_date', 'quantity',
        'mrp_price', 'discount_percentage', 'min_stock_level'
    ]
    sheet.append(headers)

    # Sample Product Data
    products_data = [
        {
            'product_name': 'Paracetamol 500mg',
            'brand_name': 'Crocin',
            'generic_name': 'Paracetamol',
            'manufacturer': 'GSK',
            'medicine_type': 'tablet',
            'prescription_type': 'otc',
            'strength': '500mg',
            'form': 'Tablet',
            'dosage_form': 'Oral',
            'pack_size': '10',
            'packaging_unit': 'Strips',
            'description': 'Pain reliever and fever reducer.',
            'uses': 'Fever, headache, body pain.',
            'side_effects': 'Nausea, stomach pain.',
            'how_to_use': 'Take with water after food.',
            'precautions': 'Do not exceed recommended dose.',
            'storage': 'Store in a cool, dry place.',
            'image_url': 'https://example.com/paracetamol.jpg',
            'hsn_code': '3004',
            'category_name': 'Pain Relief',
            'is_featured': 'True',
            'composition_name': 'Paracetamol',
            'composition_strength': '500',
            'composition_unit': 'mg',
            'composition_percentage': '100',
            'composition_is_primary': 'True',
            'batch_number': 'BATCH001',
            'manufacturing_date': date(2024, 1, 1),
            'expiry_date': date(2025, 12, 31),
            'quantity': '100',
            'mrp_price': '25.00',
            'discount_percentage': '10',
            'min_stock_level': '20'
        },
        {
            'product_name': 'Amoxicillin 250mg',
            'brand_name': 'Mox',
            'generic_name': 'Amoxicillin',
            'manufacturer': 'Cipla',
            'medicine_type': 'capsule',
            'prescription_type': 'rx',
            'strength': '250mg',
            'form': 'Capsule',
            'dosage_form': 'Oral',
            'pack_size': '10',
            'packaging_unit': 'Strips',
            'description': 'Antibiotic for bacterial infections.',
            'uses': 'Bacterial infections.',
            'side_effects': 'Diarrhea, nausea.',
            'how_to_use': 'As directed by physician.',
            'precautions': 'Complete the full course.',
            'storage': 'Store in a cool, dry place.',
            'image_url': 'https://example.com/amoxicillin.jpg',
            'hsn_code': '3004',
            'category_name': 'Antibiotics',
            'is_featured': 'False',
            'composition_name': 'Amoxicillin',
            'composition_strength': '250',
            'composition_unit': 'mg',
            'composition_percentage': '100',
            'composition_is_primary': 'True',
            'batch_number': 'BATCH002',
            'manufacturing_date': date(2024, 3, 1),
            'expiry_date': date(2026, 2, 28),
            'quantity': '50',
            'mrp_price': '80.00',
            'discount_percentage': '5',
            'min_stock_level': '15'
        }
    ]

    for product in products_data:
        row = [product.get(header, '') for header in headers]
        sheet.append(row)

    workbook.save(file_path)
    print(f"Excel file '{file_path}' generated successfully.")

if __name__ == "__main__":
    generate_excel_file()
