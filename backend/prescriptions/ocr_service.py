"""
Real OCR Service using Google Gemini AI for Prescription Processing
Integrates with existing pharmacy database for medicine matching
"""

import os
import re
import difflib
from typing import List, Dict, Any, Optional
from PIL import Image
import google.generativeai as genai
from django.conf import settings
from django.db.models import Q
from product.models import Product, GenericName

class OCRService:
    def __init__(self):
        # Configure Google Gemini AI
        self.api_key = getattr(settings, 'GOOGLE_API_KEY', 'AIzaSyA8JFwu5DpLSKBfTTk2K3dUW61y32gZeoo')
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel("models/gemini-2.0-flash")
        
        # Medicine patterns for better matching
        self.common_medicine_patterns = {
            'paracetamol': ['paracetamol', 'acetaminophen', 'tylenol', 'crocin', 'dolo'],
            'ibuprofen': ['ibuprofen', 'brufen', 'advil', 'nurofen'],
            'amoxicillin': ['amoxicillin', 'amoxil', 'amoxy', 'cipmox'],
            'omeprazole': ['omeprazole', 'omez', 'prilosec'],
            'metformin': ['metformin', 'glycomet', 'glucophage'],
            'cetirizine': ['cetirizine', 'zyrtec', 'cetrizet'],
            'azithromycin': ['azithromycin', 'azee', 'zithromax'],
        }

    def extract_text_from_prescription(self, image_path: str) -> Dict[str, Any]:
        """
        Extract medicine information from prescription image using Gemini AI
        """
        try:
            image = Image.open(image_path)
            
            # Enhanced prompt for better extraction
            prompt = """
            Analyze this doctor's prescription image and extract medicine information.
            
            For each medicine, provide:
            1. Medicine name (brand or generic)
            2. Strength/dosage (e.g., 500mg, 10ml)
            3. Frequency (e.g., twice daily, 1-0-1, BID)
            4. Duration (e.g., 7 days, 2 weeks)
            5. Instructions (e.g., after food, before meals)
            
            Format the response as a structured list:
            Medicine: [Name]
            Strength: [Dosage]
            Frequency: [How often]
            Duration: [How long]
            Instructions: [Special notes]
            ---
            
            Ignore patient details, doctor information, and clinic details.
            Focus only on prescribed medicines and their usage instructions.
            """
            
            response = self.model.generate_content([prompt, image])
            extracted_text = response.text.strip()
            
            # Parse the structured response
            medicines = self._parse_extracted_text(extracted_text)
            
            return {
                'success': True,
                'raw_text': extracted_text,
                'medicines': medicines,
                'confidence_score': self._calculate_confidence(medicines)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'raw_text': '',
                'medicines': [],
                'confidence_score': 0.0
            }

    def _parse_extracted_text(self, text: str) -> List[Dict[str, Any]]:
        """
        Parse the structured text response into medicine objects
        """
        medicines = []
        current_medicine = {}
        
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line or line == '---':
                if current_medicine.get('name'):
                    medicines.append(current_medicine)
                    current_medicine = {}
                continue
                
            if line.startswith('Medicine:'):
                current_medicine['name'] = line.replace('Medicine:', '').strip()
            elif line.startswith('Strength:'):
                current_medicine['strength'] = line.replace('Strength:', '').strip()
            elif line.startswith('Frequency:'):
                current_medicine['frequency'] = line.replace('Frequency:', '').strip()
            elif line.startswith('Duration:'):
                current_medicine['duration'] = line.replace('Duration:', '').strip()
            elif line.startswith('Instructions:'):
                current_medicine['instructions'] = line.replace('Instructions:', '').strip()
        
        # Add the last medicine if exists
        if current_medicine.get('name'):
            medicines.append(current_medicine)
        
        return medicines

    def _calculate_confidence(self, medicines: List[Dict]) -> float:
        """
        Calculate overall confidence score based on extracted medicines
        """
        if not medicines:
            return 0.0
        
        total_score = 0
        for medicine in medicines:
            score = 0.2  # Base score for having a name
            if medicine.get('strength'):
                score += 0.2
            if medicine.get('frequency'):
                score += 0.2
            if medicine.get('duration'):
                score += 0.2
            if medicine.get('instructions'):
                score += 0.2
            total_score += score
        
        return min(total_score / len(medicines), 1.0)

    def match_medicines_with_database(self, extracted_medicines: List[Dict]) -> List[Dict[str, Any]]:
        """
        Match extracted medicines with database products using fuzzy matching
        """
        matched_results = []
        
        for medicine in extracted_medicines:
            medicine_name = medicine.get('name', '').strip()
            if not medicine_name:
                continue
                
            # Find matching products
            matches = self._find_product_matches(medicine_name)
            
            # Enhance with extracted information
            result = {
                'extracted_info': medicine,
                'database_matches': matches,
                'match_confidence': self._calculate_match_confidence(medicine_name, matches),
                'recommended_product': matches[0] if matches else None
            }
            
            matched_results.append(result)
        
        return matched_results

    def _find_product_matches(self, medicine_name: str) -> List[Dict[str, Any]]:
        """
        Find matching products in database using multiple strategies
        """
        medicine_lower = medicine_name.lower().strip()
        matches = []
        
        # Strategy 1: Exact name match
        exact_matches = Product.objects.filter(
            Q(name__iexact=medicine_name) | 
            Q(generic_name__name__iexact=medicine_name)
        )
        
        for product in exact_matches:
            matches.append({
                'product_id': product.id,
                'name': product.name,
                'generic_name': product.generic_name.name if product.generic_name else None,
                'strength': product.strength,
                'manufacturer': product.manufacturer,
                'price': float(product.price),
                'stock_quantity': product.stock_quantity,
                'match_type': 'exact',
                'match_score': 1.0
            })
        
        # Strategy 2: Partial name match
        if not matches:
            partial_matches = Product.objects.filter(
                Q(name__icontains=medicine_name) | 
                Q(generic_name__name__icontains=medicine_name)
            )[:5]
            
            for product in partial_matches:
                score = self._calculate_similarity(medicine_lower, product.name.lower())
                matches.append({
                    'product_id': product.id,
                    'name': product.name,
                    'generic_name': product.generic_name.name if product.generic_name else None,
                    'strength': product.strength,
                    'manufacturer': product.manufacturer,
                    'price': float(product.price),
                    'stock_quantity': product.stock_quantity,
                    'match_type': 'partial',
                    'match_score': score
                })
        
        # Strategy 3: Pattern-based matching
        if not matches:
            for generic_key, patterns in self.common_medicine_patterns.items():
                if any(pattern in medicine_lower for pattern in patterns):
                    pattern_matches = Product.objects.filter(
                        Q(name__icontains=generic_key) | 
                        Q(generic_name__name__icontains=generic_key)
                    )[:3]
                    
                    for product in pattern_matches:
                        matches.append({
                            'product_id': product.id,
                            'name': product.name,
                            'generic_name': product.generic_name.name if product.generic_name else None,
                            'strength': product.strength,
                            'manufacturer': product.manufacturer,
                            'price': float(product.price),
                            'stock_quantity': product.stock_quantity,
                            'match_type': 'pattern',
                            'match_score': 0.7
                        })
                    break
        
        # Sort by match score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        return matches[:5]  # Return top 5 matches

    def _calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity between two text strings
        """
        return difflib.SequenceMatcher(None, text1, text2).ratio()

    def _calculate_match_confidence(self, medicine_name: str, matches: List[Dict]) -> float:
        """
        Calculate confidence score for medicine matching
        """
        if not matches:
            return 0.0
        
        best_match = matches[0]
        return best_match.get('match_score', 0.0)

    def process_prescription_image(self, image_path: str) -> Dict[str, Any]:
        """
        Complete pipeline: Extract text -> Match with database -> Return results
        """
        # Step 1: Extract text from image
        try:
            extraction_result = self.extract_text_from_prescription(image_path)
        except Exception as e:
            return {
                'success': False,
                'error': f'Text extraction failed: {str(e)}',
                'ocr_confidence': 0.0,
                'medicines': []
            }

        if not extraction_result['success']:
            return extraction_result
        
        # Step 2: Match with database
        matched_medicines = self.match_medicines_with_database(extraction_result['medicines'])
        
        # Step 3: Compile final result
        return {
            'success': True,
            'ocr_confidence': extraction_result['confidence_score'],
            'raw_extracted_text': extraction_result['raw_text'],
            'total_medicines_found': len(matched_medicines),
            'medicines': matched_medicines,
            'processing_summary': {
                'extracted_count': len(extraction_result['medicines']),
                'matched_count': len([m for m in matched_medicines if m['database_matches']]),
                'high_confidence_matches': len([m for m in matched_medicines if m['match_confidence'] > 0.8])
            }
        }
