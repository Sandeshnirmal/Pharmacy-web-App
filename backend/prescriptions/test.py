from ocr_service import OCRService

ocr_service = OCRService()
result = ocr_service.analyze_prescription_medicines_by_composition('/path/to/prescription.jpg')

if result['success']:
    for med in result['medicines']:
        print(f"Medicine: {med['input_brand']} → Match: {med.get('local_equivalent', {}).get('product_name', 'Not found')}")
else:
    print("Error:", result['error'])
