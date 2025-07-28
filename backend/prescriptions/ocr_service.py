"""
Composition-Based Prescription OCR System
- Performs OCR on prescription images to extract medicine names and compositions
- Matches medicines based on active ingredients/salts, not brand names
- Provides composition-based suggestions for user manual selection
- No auto-cart addition - user controlled medicine selection
- Supports admin approval workflow
"""

import os
import re
import difflib
import json
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

        # Comprehensive brand-to-generic mapping database
        self.brand_to_generic_mapping = {
            # Paracetamol brands
            'dolo': {'generic': 'paracetamol', 'composition': 'paracetamol', 'common_strengths': ['500mg', '650mg']},
            'crocin': {'generic': 'paracetamol', 'composition': 'paracetamol', 'common_strengths': ['500mg', '650mg']},
            'tylenol': {'generic': 'paracetamol', 'composition': 'paracetamol', 'common_strengths': ['500mg', '650mg']},
            'calpol': {'generic': 'paracetamol', 'composition': 'paracetamol', 'common_strengths': ['120mg/5ml', '250mg/5ml']},
            'metacin': {'generic': 'paracetamol', 'composition': 'paracetamol', 'common_strengths': ['500mg', '650mg']},

            # Ibuprofen brands
            'brufen': {'generic': 'ibuprofen', 'composition': 'ibuprofen', 'common_strengths': ['200mg', '400mg', '600mg']},
            'advil': {'generic': 'ibuprofen', 'composition': 'ibuprofen', 'common_strengths': ['200mg', '400mg']},
            'nurofen': {'generic': 'ibuprofen', 'composition': 'ibuprofen', 'common_strengths': ['200mg', '400mg']},
            'combiflam': {'generic': 'ibuprofen + paracetamol', 'composition': 'ibuprofen + paracetamol', 'common_strengths': ['400mg+325mg']},

            # Antibiotics
            'amoxil': {'generic': 'amoxicillin', 'composition': 'amoxicillin', 'common_strengths': ['250mg', '500mg']},
            'cipmox': {'generic': 'amoxicillin', 'composition': 'amoxicillin', 'common_strengths': ['250mg', '500mg']},
            'azithral': {'generic': 'azithromycin', 'composition': 'azithromycin', 'common_strengths': ['250mg', '500mg']},
            'zithromax': {'generic': 'azithromycin', 'composition': 'azithromycin', 'common_strengths': ['250mg', '500mg']},
            'azee': {'generic': 'azithromycin', 'composition': 'azithromycin', 'common_strengths': ['250mg', '500mg']},
            'augmentin': {'generic': 'amoxicillin + clavulanic acid', 'composition': 'amoxicillin + clavulanic acid', 'common_strengths': ['625mg', '1g']},

            # Antacids and PPI
            'omez': {'generic': 'omeprazole', 'composition': 'omeprazole', 'common_strengths': ['20mg', '40mg']},
            'prilosec': {'generic': 'omeprazole', 'composition': 'omeprazole', 'common_strengths': ['20mg', '40mg']},
            'pantop': {'generic': 'pantoprazole', 'composition': 'pantoprazole', 'common_strengths': ['20mg', '40mg']},
            'rantac': {'generic': 'ranitidine', 'composition': 'ranitidine', 'common_strengths': ['150mg', '300mg']},
            'gelusil': {'generic': 'antacid', 'composition': 'aluminium hydroxide + magnesium hydroxide', 'common_strengths': ['tablet', 'syrup']},

            # Diabetes medications
            'glycomet': {'generic': 'metformin', 'composition': 'metformin', 'common_strengths': ['500mg', '850mg', '1g']},
            'glucophage': {'generic': 'metformin', 'composition': 'metformin', 'common_strengths': ['500mg', '850mg', '1g']},
            'amaryl': {'generic': 'glimepiride', 'composition': 'glimepiride', 'common_strengths': ['1mg', '2mg', '4mg']},

            # Antihistamines
            'cetrizine': {'generic': 'cetirizine', 'composition': 'cetirizine', 'common_strengths': ['5mg', '10mg']},
            'zyrtec': {'generic': 'cetirizine', 'composition': 'cetirizine', 'common_strengths': ['5mg', '10mg']},
            'allegra': {'generic': 'fexofenadine', 'composition': 'fexofenadine', 'common_strengths': ['120mg', '180mg']},
            'avil': {'generic': 'pheniramine', 'composition': 'pheniramine maleate', 'common_strengths': ['25mg']},

            # Cardiovascular
            'norvasc': {'generic': 'amlodipine', 'composition': 'amlodipine', 'common_strengths': ['2.5mg', '5mg', '10mg']},
            'telma': {'generic': 'telmisartan', 'composition': 'telmisartan', 'common_strengths': ['20mg', '40mg', '80mg']},
            'ecosprin': {'generic': 'aspirin', 'composition': 'aspirin', 'common_strengths': ['75mg', '150mg']},

            # Vitamins and supplements
            'becosules': {'generic': 'vitamin b complex', 'composition': 'vitamin b complex', 'common_strengths': ['capsule', 'tablet']},
            'calcimax': {'generic': 'calcium + vitamin d3', 'composition': 'calcium carbonate + vitamin d3', 'common_strengths': ['500mg+250iu']},
            'zincovit': {'generic': 'multivitamin', 'composition': 'multivitamin + multimineral', 'common_strengths': ['tablet', 'syrup']},
        }

        # Common dosage forms
        self.dosage_forms = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'patch']

        # Common instruction patterns
        self.instruction_patterns = {
            'frequency': ['once daily', 'twice daily', 'thrice daily', 'four times daily', 'bid', 'tid', 'qid', 'od', 'bd', 'tds'],
            'timing': ['before food', 'after food', 'with food', 'empty stomach', 'bedtime', 'morning', 'evening'],
            'duration': ['days', 'weeks', 'months', 'as needed', 'sos', 'prn']
        }

    def extract_text_from_prescription(self, image_path: str) -> Dict[str, Any]:
        """
        Intelligent medicine extraction from prescription image using Gemini AI
        Focuses on brand names, generic identification, and pharmacy mapping
        """
        try:
            image = Image.open(image_path)

            # Enhanced prompt for intelligent medicine analysis
            prompt = """
            You are an intelligent medical OCR and medicine analysis system.

            Analyze this prescription image and extract ONLY medicine-related information:

            For each medicine found:
            1. Extract the EXACT brand name as written (e.g., "Dolo 650", "Crocin", "Azithral")
            2. Identify strength/dosage (e.g., 650mg, 500mg, 5ml)
            3. Determine dosage form (tablet, capsule, syrup, injection, etc.)
            4. Extract frequency (once daily, twice daily, BID, TID, etc.)
            5. Extract duration (7 days, 2 weeks, etc.)
            6. Extract special instructions (after food, before meals, etc.)

            IMPORTANT RULES:
            - Focus ONLY on pharmacologically relevant medicines
            - Ignore patient details, doctor information, clinic details
            - Extract brand names exactly as written
            - If generic name is mentioned, capture it separately
            - Ignore non-medicine items (tests, procedures, advice)

            Format response as JSON:
            {
                "medicines": [
                    {
                        "brand_name": "exact brand name from prescription",
                        "strength": "dosage with unit",
                        "form": "tablet/capsule/syrup/etc",
                        "frequency": "how often to take",
                        "duration": "how long to take",
                        "instructions": "special instructions",
                        "generic_mentioned": "if generic name is also mentioned"
                    }
                ]
            }

            Return only valid JSON format.
            """

            response = self.model.generate_content([prompt, image])
            extracted_text = response.text.strip()

            # Parse the JSON response
            medicines = self._parse_json_response(extracted_text)

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

    def _parse_json_response(self, text: str) -> List[Dict[str, Any]]:
        """
        Parse JSON response from Gemini AI into medicine objects
        """
        try:
            # Handle None or empty text
            if not text or text is None:
                print("Warning: Empty or None response from OCR")
                return []

            # Clean the response text
            text = str(text).strip()

            # Remove markdown code blocks if present
            if text.startswith('```json'):
                text = text[7:]
            if text.endswith('```'):
                text = text[:-3]
            text = text.strip()

            # If still empty after cleaning
            if not text:
                print("Warning: Empty text after cleaning")
                return []

            # Parse JSON
            data = json.loads(text)
            medicines = data.get('medicines', [])

            # Normalize the medicine data
            normalized_medicines = []
            for medicine in medicines:
                normalized = {
                    'brand_name': medicine.get('brand_name', '').strip(),
                    'strength': medicine.get('strength', '').strip(),
                    'form': medicine.get('form', 'tablet').strip().lower(),
                    'frequency': medicine.get('frequency', '').strip(),
                    'duration': medicine.get('duration', '').strip(),
                    'instructions': medicine.get('instructions', '').strip(),
                    'generic_mentioned': medicine.get('generic_mentioned', '').strip()
                }

                # Only add if we have a brand name
                if normalized['brand_name']:
                    normalized_medicines.append(normalized)

            return normalized_medicines

        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            # Fallback to old parsing method if JSON fails
            return self._parse_extracted_text_fallback(text)
        except Exception as e:
            print(f"Error parsing JSON response: {e}")
            return []

    def _parse_extracted_text_fallback(self, text: str) -> List[Dict[str, Any]]:
        """
        Fallback parser for non-JSON responses
        """
        medicines = []
        current_medicine = {}

        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line or line == '---':
                if current_medicine.get('brand_name'):
                    medicines.append(current_medicine)
                    current_medicine = {}
                continue

            if line.startswith('Medicine:') or line.startswith('Brand:'):
                current_medicine['brand_name'] = line.split(':', 1)[1].strip()
            elif line.startswith('Strength:'):
                current_medicine['strength'] = line.replace('Strength:', '').strip()
            elif line.startswith('Form:'):
                current_medicine['form'] = line.replace('Form:', '').strip()
            elif line.startswith('Frequency:'):
                current_medicine['frequency'] = line.replace('Frequency:', '').strip()
            elif line.startswith('Duration:'):
                current_medicine['duration'] = line.replace('Duration:', '').strip()
            elif line.startswith('Instructions:'):
                current_medicine['instructions'] = line.replace('Instructions:', '').strip()

        # Add the last medicine if exists
        if current_medicine.get('brand_name'):
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
        Intelligent medicine matching with brand-to-generic mapping and pharmacy inventory
        """
        matched_results = []

        for medicine in extracted_medicines:
            brand_name = medicine.get('brand_name', '').strip()
            if not brand_name:
                continue

            # Step 1: Identify generic name and composition
            generic_info = self._identify_generic_from_brand(brand_name)

            # Step 2: Find exact match in pharmacy inventory
            exact_match = self._find_exact_pharmacy_match(brand_name, generic_info)

            # Step 3: Find alternative if exact match not available
            alternative_match = None
            if not exact_match:
                alternative_match = self._find_pharmacy_alternative(generic_info, medicine.get('strength', ''))

            # Step 4: Compile result in required format
            result = self._compile_medicine_result(
                medicine, brand_name, generic_info, exact_match, alternative_match
            )

            matched_results.append(result)

        return matched_results

    def _identify_generic_from_brand(self, brand_name: str) -> Dict[str, Any]:
        """
        Identify generic name and composition from brand name
        """
        brand_lower = brand_name.lower().strip()

        # Remove common suffixes and numbers for better matching
        clean_brand = re.sub(r'\s*\d+\s*(mg|ml|g|mcg|iu).*$', '', brand_lower)
        clean_brand = re.sub(r'\s*(tablet|capsule|syrup|injection).*$', '', clean_brand)

        # Direct mapping lookup
        for brand_key, info in self.brand_to_generic_mapping.items():
            if brand_key in clean_brand or clean_brand.startswith(brand_key):
                return {
                    'generic_name': info['generic'],
                    'composition': info['composition'],
                    'common_strengths': info['common_strengths'],
                    'mapping_confidence': 1.0,
                    'source': 'direct_mapping'
                }

        # Fuzzy matching for partial matches
        best_match = None
        best_score = 0.0

        for brand_key, info in self.brand_to_generic_mapping.items():
            score = difflib.SequenceMatcher(None, clean_brand, brand_key).ratio()
            if score > 0.7 and score > best_score:
                best_score = score
                best_match = info

        if best_match:
            return {
                'generic_name': best_match['generic'],
                'composition': best_match['composition'],
                'common_strengths': best_match['common_strengths'],
                'mapping_confidence': best_score,
                'source': 'fuzzy_mapping'
            }

        # If no mapping found, try to extract from brand name
        return {
            'generic_name': brand_name,  # Use brand name as fallback
            'composition': 'Unknown',
            'common_strengths': [],
            'mapping_confidence': 0.3,
            'source': 'fallback'
        }

    def _find_exact_pharmacy_match(self, brand_name: str, generic_info: Dict) -> Optional[Dict[str, Any]]:
        """
        Find exact match for the brand in pharmacy inventory
        """
        # Try exact brand name match first
        exact_matches = Product.objects.filter(
            Q(name__iexact=brand_name) |
            Q(name__icontains=brand_name.split()[0])  # Match first word of brand
        ).filter(stock_quantity__gt=0)  # Only in-stock items

        if exact_matches.exists():
            product = exact_matches.first()
            return self._format_product_result(product, 'exact_brand_match', 1.0)

        return None

    def _find_pharmacy_alternative(self, generic_info: Dict, strength: str = '') -> Optional[Dict[str, Any]]:
        """
        Find pharmacy's available alternative for the same generic
        """
        generic_name = generic_info.get('generic_name', '').lower()

        # Search by generic name
        alternatives = Product.objects.filter(
            Q(generic_name__name__icontains=generic_name) |
            Q(name__icontains=generic_name)
        ).filter(stock_quantity__gt=0)  # Only in-stock items

        # If strength is specified, try to match it
        if strength and alternatives.exists():
            strength_matches = alternatives.filter(strength__icontains=strength)
            if strength_matches.exists():
                product = strength_matches.first()
                return self._format_product_result(product, 'generic_strength_match', 0.9)

        # Return first available alternative
        if alternatives.exists():
            product = alternatives.first()
            return self._format_product_result(product, 'generic_match', 0.8)

        return None

    def _format_product_result(self, product: Product, match_type: str, confidence: float) -> Dict[str, Any]:
        """
        Format product information in standardized format
        """
        return {
            'product_id': product.id,
            'available_brand_name': product.name,
            'generic_name': product.generic_name.name if product.generic_name else 'Unknown',
            'strength': product.strength or 'Not specified',
            'form': product.form or 'tablet',
            'manufacturer': product.manufacturer,
            'price': float(product.price),
            'stock_quantity': product.stock_quantity,
            'match_type': match_type,
            'confidence': confidence,
            'is_prescription_required': product.is_prescription_required
        }

    def _compile_medicine_result(self, extracted_medicine: Dict, brand_name: str,
                               generic_info: Dict, exact_match: Optional[Dict],
                               alternative_match: Optional[Dict]) -> Dict[str, Any]:
        """
        Compile final result in the required format
        """
        # Determine which match to use
        selected_match = exact_match or alternative_match

        if selected_match:
            return {
                'input_brand_name': brand_name,
                'generic_name': generic_info.get('generic_name', 'Unknown'),
                'composition': generic_info.get('composition', 'Unknown'),
                'available_brand_name': selected_match['available_brand_name'],
                'form': selected_match['form'],
                'strength': selected_match['strength'],
                'manufacturer': selected_match['manufacturer'],
                'price': selected_match['price'],
                'stock_quantity': selected_match['stock_quantity'],
                'instructions': extracted_medicine.get('instructions', 'As prescribed'),
                'frequency': extracted_medicine.get('frequency', 'As directed'),
                'duration': extracted_medicine.get('duration', 'As prescribed'),
                'match_type': selected_match['match_type'],
                'confidence': selected_match['confidence'],
                'is_prescription_required': selected_match['is_prescription_required'],
                'mapping_confidence': generic_info.get('mapping_confidence', 0.0),
                'available': True
            }
        else:
            return {
                'input_brand_name': brand_name,
                'generic_name': generic_info.get('generic_name', 'Unknown'),
                'composition': generic_info.get('composition', 'Unknown'),
                'available_brand_name': None,
                'form': extracted_medicine.get('form', 'tablet'),
                'strength': extracted_medicine.get('strength', 'Not specified'),
                'manufacturer': None,
                'price': None,
                'stock_quantity': 0,
                'instructions': extracted_medicine.get('instructions', 'As prescribed'),
                'frequency': extracted_medicine.get('frequency', 'As directed'),
                'duration': extracted_medicine.get('duration', 'As prescribed'),
                'match_type': 'no_match',
                'confidence': 0.0,
                'is_prescription_required': True,  # Default to requiring prescription
                'mapping_confidence': generic_info.get('mapping_confidence', 0.0),
                'available': False,
                'note': 'Medicine not available in pharmacy inventory'
            }

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

    def analyze_prescription_medicines_by_composition(self, image_path: str) -> Dict[str, Any]:
        """
        Medical prescription OCR AI with composition-based matching
        Extracts brand names and finds local equivalents based on composition
        """
        # Step 1: Extract medicines from prescription
        try:
            extraction_result = self.extract_text_from_prescription(image_path)
        except Exception as e:
            return {
                'success': False,
                'error': f'OCR extraction failed: {str(e)}',
                'medicines': []
            }

        if not extraction_result['success']:
            return extraction_result

        # Step 2: Composition-based analysis and matching
        analyzed_medicines = self.match_medicines_by_composition(extraction_result['medicines'])

        return {
            'success': True,
            'ocr_confidence': extraction_result['confidence_score'],
            'total_medicines_extracted': len(extraction_result['medicines']),
            'total_medicines_analyzed': len(analyzed_medicines),
            'matched_medicines': len([m for m in analyzed_medicines if m.get('local_equivalent')]),
            'unmatched_medicines': len([m for m in analyzed_medicines if not m.get('local_equivalent')]),
            'medicines': analyzed_medicines,
            'raw_ocr_text': extraction_result['raw_text']
        }

    def match_medicines_by_composition(self, extracted_medicines: List[Dict]) -> List[Dict[str, Any]]:
        """
        Match extracted medicines with local database based on composition
        """
        matched_results = []

        for medicine in extracted_medicines:
            brand_name = medicine.get('brand_name', '').strip()
            if not brand_name:
                continue

            # Step 1: Identify generic name and composition from brand
            generic_info = self._identify_generic_from_brand(brand_name)

            # Step 2: Extract strength from prescription or brand name
            strength = self._extract_strength_from_medicine(medicine, brand_name)

            # Step 3: Build standardized composition
            standardized_composition = self._build_standardized_composition(
                generic_info['generic_name'],
                strength,
                medicine.get('form', 'tablet')
            )

            # Step 4: Find local equivalent by composition matching
            local_equivalent = self._find_local_equivalent_by_composition(
                standardized_composition,
                medicine.get('form', 'tablet')
            )

            # Step 5: Compile result in required format
            result = {
                'input_brand': brand_name,
                'generic_name': generic_info['generic_name'],
                'composition': standardized_composition,
                'form': medicine.get('form', 'tablet').title(),
                'local_equivalent': local_equivalent,
                'match_confidence': local_equivalent['confidence'] if local_equivalent else 0.0,
                'notes': local_equivalent['notes'] if local_equivalent else 'No matching composition found in local database'
            }

            matched_results.append(result)

        return matched_results

    def _extract_strength_from_medicine(self, medicine: Dict, brand_name: str) -> str:
        """
        Extract strength/dosage from medicine data or brand name
        """
        # First try to get from extracted medicine data
        strength = medicine.get('strength', '').strip()
        if strength:
            return strength

        # Try to extract from brand name using regex
        strength_patterns = [
            r'(\d+(?:\.\d+)?)\s*(mg|g|ml|mcg|iu|units?)',
            r'(\d+(?:\.\d+)?)\s*(milligram|gram|milliliter|microgram)',
        ]

        for pattern in strength_patterns:
            match = re.search(pattern, brand_name.lower())
            if match:
                return f"{match.group(1)}{match.group(2)}"

        return ''

    def _build_standardized_composition(self, generic_name: str, strength: str, form: str = None) -> str:
        """
        Build standardized composition string for matching
        """
        if not generic_name:
            return ''

        # Handle combination drugs
        if '+' in generic_name:
            # For combination drugs, try to match strengths
            components = [comp.strip() for comp in generic_name.split('+')]
            if strength and any(char.isdigit() for char in strength):
                # Try to parse multiple strengths for combination
                strength_parts = re.findall(r'\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu)', strength.lower())
                if len(strength_parts) == len(components):
                    composition_parts = []
                    for comp, str_part in zip(components, strength_parts):
                        composition_parts.append(f"{comp.title()} {str_part}")
                    return ' + '.join(composition_parts)
                else:
                    return f"{generic_name.title()} {strength}"
            else:
                return generic_name.title()
        else:
            # Single component drug
            if strength:
                return f"{generic_name.title()} {strength}"
            else:
                return generic_name.title()

    def _find_local_equivalent_by_composition(self, composition: str, form: str) -> Optional[Dict[str, Any]]:
        """
        Find local equivalent based on composition matching
        """
        if not composition:
            return None

        # Normalize composition for matching
        normalized_composition = self._normalize_composition(composition)

        # Search in local database by composition
        matching_products = Product.objects.filter(
            stock_quantity__gt=0  # Only in-stock items
        )

        best_match = None
        best_score = 0.0

        for product in matching_products:
            # Build product composition from available data
            product_composition = self._build_product_composition(product)
            normalized_product_comp = self._normalize_composition(product_composition)

            # Calculate composition similarity
            similarity = self._calculate_composition_similarity(
                normalized_composition,
                normalized_product_comp
            )

            # Check form compatibility
            form_match = self._check_form_compatibility(form, product.form or 'tablet')

            # Combined score
            total_score = similarity * 0.8 + form_match * 0.2

            if total_score > best_score and total_score >= 0.8:  # Minimum 80% match
                best_score = total_score
                best_match = product

        if best_match:
            return {
                'product_name': best_match.name,
                'composition': self._build_product_composition(best_match),
                'form': (best_match.form or 'tablet').title(),
                'manufacturer': best_match.manufacturer,
                'price': float(best_match.price),
                'available': best_match.stock_quantity > 0,
                'stock_quantity': best_match.stock_quantity,
                'confidence': best_score,
                'notes': 'Matched by composition.'
            }

        return None

    def _normalize_composition(self, composition: str) -> str:
        """
        Normalize composition string for better matching
        """
        if not composition:
            return ''

        # Convert to lowercase and remove extra spaces
        normalized = composition.lower().strip()

        # Standardize units
        unit_replacements = {
            'milligram': 'mg',
            'milligrams': 'mg',
            'gram': 'g',
            'grams': 'g',
            'milliliter': 'ml',
            'milliliters': 'ml',
            'microgram': 'mcg',
            'micrograms': 'mcg',
            'international unit': 'iu',
            'international units': 'iu',
            'units': 'unit',
        }

        for old_unit, new_unit in unit_replacements.items():
            normalized = normalized.replace(old_unit, new_unit)

        # Remove extra spaces and normalize separators
        normalized = re.sub(r'\s+', ' ', normalized)
        normalized = re.sub(r'\s*\+\s*', ' + ', normalized)

        return normalized.strip()

    def _build_product_composition(self, product: Product) -> str:
        """
        Build composition string from product data
        """
        # Try to get composition from product fields
        if hasattr(product, 'composition') and product.composition:
            return product.composition

        # Build from generic name and strength
        generic_name = product.generic_name.name if product.generic_name else product.name
        strength = product.strength or ''

        if strength:
            return f"{generic_name} {strength}"
        else:
            return generic_name

    def _calculate_composition_similarity(self, comp1: str, comp2: str) -> float:
        """
        Calculate similarity between two composition strings
        """
        if not comp1 or not comp2:
            return 0.0

        # Exact match
        if comp1 == comp2:
            return 1.0

        # Use sequence matcher for similarity
        similarity = difflib.SequenceMatcher(None, comp1, comp2).ratio()

        # Boost score if key components match
        comp1_parts = set(comp1.split())
        comp2_parts = set(comp2.split())

        # Check if main ingredients match
        common_parts = comp1_parts.intersection(comp2_parts)
        if common_parts:
            boost = len(common_parts) / max(len(comp1_parts), len(comp2_parts))
            similarity = min(1.0, similarity + boost * 0.2)

        return similarity

    def _check_form_compatibility(self, form1: str, form2: str) -> float:
        """
        Check compatibility between dosage forms
        """
        if not form1 or not form2:
            return 0.5  # Neutral score if form unknown

        form1 = form1.lower().strip()
        form2 = form2.lower().strip()

        # Exact match
        if form1 == form2:
            return 1.0

        # Compatible forms
        compatible_forms = {
            'tablet': ['tab', 'tablets'],
            'capsule': ['cap', 'capsules'],
            'syrup': ['liquid', 'suspension', 'solution'],
            'injection': ['inj', 'vial', 'ampoule'],
            'cream': ['ointment', 'gel', 'lotion'],
            'drops': ['drop', 'solution']
        }

        for main_form, alternatives in compatible_forms.items():
            if (form1 == main_form and form2 in alternatives) or \
               (form2 == main_form and form1 in alternatives):
                return 0.9

        return 0.3  # Different forms, low compatibility

    def extract_composition_based_medicines(self, image_path: str) -> Dict[str, Any]:
        """
        NEW: Composition-based prescription processing for user-controlled workflow

        Steps:
        1. OCR extraction of medicine names and compositions
        2. Composition-based matching with local database
        3. Return suggestions for manual user selection (NO auto-cart addition)
        4. Prepare data for admin approval workflow
        """
        try:
            # Step 1: OCR Extraction
            ocr_result = self._extract_text_from_image(image_path)
            if not ocr_result['success']:
                return {
                    'success': False,
                    'error': 'OCR extraction failed',
                    'extracted_medicines': [],
                    'composition_matches': []
                }

            # Step 2: Parse extracted medicines with composition focus
            extracted_medicines = self._parse_medicines_with_composition(ocr_result['extracted_text'])

            # Step 3: Find composition-based matches
            composition_matches = []
            for medicine in extracted_medicines:
                matches = self._find_composition_matches(medicine)
                composition_matches.append({
                    'extracted_medicine': medicine,
                    'composition_matches': matches,
                    'user_selected': False,  # User must manually select
                    'admin_approved': False  # Requires admin approval
                })

            return {
                'success': True,
                'ocr_confidence': ocr_result.get('confidence', 0.8),
                'extracted_text': ocr_result['extracted_text'],
                'extracted_medicines': extracted_medicines,
                'composition_matches': composition_matches,
                'total_medicines_found': len(extracted_medicines),
                'requires_manual_selection': True,
                'requires_admin_approval': True
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Composition-based processing failed: {str(e)}',
                'extracted_medicines': [],
                'composition_matches': []
            }

    def _parse_medicines_with_composition(self, extracted_text: str) -> List[Dict[str, Any]]:
        """
        Parse extracted text focusing on composition and salt extraction
        """
        medicines = []
        lines = extracted_text.split('\n')

        for i, line in enumerate(lines, 1):
            line = line.strip()
            if not line or len(line) < 3:
                continue

            # Extract medicine information with composition focus
            medicine_info = self._extract_medicine_composition_info(line)
            if medicine_info:
                medicine_info['line_number'] = i
                medicine_info['original_text'] = line
                medicines.append(medicine_info)

        return medicines

    def _extract_medicine_composition_info(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Extract medicine name, composition/salt, and dosage from text line
        """
        # Clean the text
        text = re.sub(r'^\d+\.?\s*', '', text)  # Remove numbering
        text = text.strip()

        if len(text) < 2:
            return None

        # Extract dosage/strength
        strength_pattern = r'(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|%|iu|units?)\b'
        strength_matches = re.findall(strength_pattern, text, re.IGNORECASE)
        strength = f"{strength_matches[0][0]}{strength_matches[0][1]}" if strength_matches else ""

        # Extract medicine name (before strength or special characters)
        medicine_name = re.split(r'\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|%|iu|units?)', text, 1)[0].strip()
        medicine_name = re.split(r'[-–—]', medicine_name)[0].strip()

        # Try to identify composition from brand name
        composition = self._identify_composition_from_name(medicine_name)

        # Extract frequency and duration if present
        frequency = self._extract_frequency(text)
        duration = self._extract_duration(text)

        return {
            'medicine_name': medicine_name,
            'composition': composition,
            'strength': strength,
            'frequency': frequency,
            'duration': duration,
            'form': self._extract_form(text)
        }

    def _identify_composition_from_name(self, medicine_name: str) -> str:
        """
        Identify active ingredient/composition from medicine brand name
        """
        name_lower = medicine_name.lower().strip()

        # Check brand-to-generic mapping
        for brand, info in self.brand_to_generic_mapping.items():
            if brand in name_lower or name_lower.startswith(brand):
                return info['composition']

        # If not found in mapping, return the name itself (might be generic)
        return medicine_name

    def _find_composition_matches(self, medicine_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Find medicines in database that match the composition/salt
        """
        composition = medicine_info.get('composition', '')
        strength = medicine_info.get('strength', '')
        form = medicine_info.get('form', '')

        matches = []

        # Query database for composition matches
        products = Product.objects.filter(is_active=True)

        for product in products:
            match_score = self._calculate_composition_match_score(
                medicine_info, product
            )

            if match_score > 0.3:  # Only include reasonable matches
                matches.append({
                    'product_id': str(product.id),
                    'product_name': product.name,
                    'composition': self._get_product_composition(product),
                    'strength': product.strength,
                    'form': product.form,
                    'manufacturer': product.manufacturer,
                    'price': float(product.price),
                    'mrp': float(product.mrp),
                    'stock_available': product.stock_quantity > 0,
                    'stock_quantity': product.stock_quantity,
                    'match_score': match_score,
                    'match_type': self._get_match_type(match_score),
                    'is_prescription_required': product.is_prescription_required
                })

        # Sort by match score (highest first)
        matches.sort(key=lambda x: x['match_score'], reverse=True)

        return matches[:10]  # Return top 10 matches

    def _calculate_composition_match_score(self, medicine_info: Dict[str, Any], product) -> float:
        """
        Calculate match score based on composition similarity
        """
        extracted_composition = medicine_info.get('composition', '').lower()
        product_composition = self._get_product_composition(product).lower()

        # Composition similarity (most important)
        comp_similarity = self._calculate_composition_similarity(
            extracted_composition, product_composition
        )

        # Strength similarity
        extracted_strength = medicine_info.get('strength', '').lower()
        product_strength = (product.strength or '').lower()
        strength_similarity = 1.0 if extracted_strength == product_strength else 0.5

        # Form compatibility
        extracted_form = medicine_info.get('form', '').lower()
        product_form = (product.form or '').lower()
        form_compatibility = self._check_form_compatibility(extracted_form, product_form)

        # Calculate weighted score
        total_score = (
            comp_similarity * 0.6 +      # Composition is most important
            strength_similarity * 0.3 +   # Strength is important
            form_compatibility * 0.1       # Form is least important
        )

        return min(1.0, total_score)

    def _get_match_type(self, score: float) -> str:
        """
        Categorize match type based on score
        """
        if score >= 0.9:
            return 'exact_match'
        elif score >= 0.7:
            return 'high_similarity'
        elif score >= 0.5:
            return 'moderate_similarity'
        else:
            return 'low_similarity'

    def process_prescription_image(self, image_path: str) -> Dict[str, Any]:
        """
        Legacy method for backward compatibility
        """
        return self.extract_composition_based_medicines(image_path)
