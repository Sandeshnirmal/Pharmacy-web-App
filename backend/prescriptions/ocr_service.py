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
from backend.settings import GOOGLE_API_KEY

class OCRService:
    def __init__(self):
        # Configure Google Gemini AI
        self.api_key = os.getenv('GOOGLE_API_KEY', GOOGLE_API_KEY) # Use environment variable
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set.")
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

    def process_prescription_image(self, image_path: str) -> Dict[str, Any]:
        """
        Main method to process a prescription image end-to-end.
        """
        try:
            # Step 1: Extract medicines from prescription
            extraction_result = self.extract_text_from_prescription(image_path)
        except Exception as e:
            return {
                'success': False,
                'error': f'OCR extraction failed: {str(e)}',
                'medicines': [],
                'processing_summary': {'high_confidence_matches': 0}
            }

        if not extraction_result['success']:
            return {
                'success': False,
                'error': extraction_result.get('error', 'Unknown OCR error.'),
                'medicines': [],
                'processing_summary': {'high_confidence_matches': 0}
            }

        # Step 2: Analyze and match based on composition
        analyzed_medicines = self.match_medicines_by_composition(extraction_result['medicines'])

        # Step 3: Compile final result
        total_medicines_extracted = len(extraction_result['medicines'])
        high_confidence_matches = sum(1 for m in analyzed_medicines if m.get('match_confidence', 0) >= 0.8)

        final_result = {
            'success': True,
            'ocr_confidence': extraction_result['confidence_score'],
            'total_medicines_found': total_medicines_extracted,
            'medicines': analyzed_medicines,
            'processing_summary': {
                'total_medicines_extracted': total_medicines_extracted,
                'matched_medicines': len([m for m in analyzed_medicines if m.get('local_equivalent')]),
                'unmatched_medicines': len([m for m in analyzed_medicines if not m.get('local_equivalent')]),
                'high_confidence_matches': high_confidence_matches
            }
        }
        return final_result

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

            Analyze the provided image and extract any medicine-related information. This includes medicine names, dosages, frequencies, and forms, even if presented within a question or sentence.

            For each medicine found:
            1. Extract the medicine name (brand or generic).
            2. Identify strength/dosage (e.g., 500mg, 10ml).
            3. Determine dosage form (e.g., tablet, syrup).
            4. Extract frequency (e.g., once daily, tid).

            IMPORTANT RULES:
            - Focus ONLY on pharmacologically relevant medicines.
            - Ignore non-medicine items, patient details, or doctor information.
            - Extract information as accurately as possible from the text.

            Format response as JSON:
            {
                "medicines": [
                    {
                        "medicine_name": "extracted medicine name",
                        "strength": "dosage with unit",
                        "form": "tablet/capsule/syrup/etc",
                        "frequency": "how often to take"
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
        with a robust fallback for non-JSON text.
        """
        try:
            if not text:
                return []

            # Clean the response text from markdown
            text = text.strip()
            if text.startswith('```json'):
                text = text.removeprefix('```json')
            if text.endswith('```'):
                text = text.removesuffix('```')
            text = text.strip()

            # Attempt to parse as JSON
            data = json.loads(text)
            medicines = data.get('medicines', [])

            # Normalize the medicine data
            normalized_medicines = []
            for medicine in medicines:
                normalized = {
                    'medicine_name': medicine.get('medicine_name', '').strip(),
                    'strength': medicine.get('strength', '').strip(),
                    'form': medicine.get('form', 'tablet').strip().lower(),
                    'frequency': medicine.get('frequency', '').strip(),
                    # 'duration': medicine.get('duration', '').strip(), # Removed as per new prompt
                    # 'instructions': medicine.get('instructions', '').strip(), # Removed as per new prompt
                    # 'generic_mentioned': medicine.get('generic_mentioned', '').strip() # Removed as per new prompt
                }

                if normalized['medicine_name']:
                    normalized_medicines.append(normalized)

            return normalized_medicines

        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}. Falling back to text-based parsing.")
            return self._find_medicines_in_text(text)
        except Exception as e:
            print(f"Error parsing JSON response: {e}. Returning empty list.")
            return []

    def _find_medicines_in_text(self, text: str) -> List[Dict[str, Any]]:
        """
        A robust fallback parser for non-JSON responses.
        Searches for medicine names and other medicine-related keywords using more general regex.
        """
        medicines = []
        full_text = text.lower()

        # General patterns for medicine name, strength, form, frequency
        # This is a simplified approach; a more advanced NLP library would be better for complex cases.
        medicine_name_pattern = r'\b(?:paracetamol|ibuprofen|amoxicillin|azithromycin|omeprazole|metformin|cetirizine|amlodipine|aspirin)\b'
        strength_pattern = r'(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|iu|units?)'
        form_pattern = r'\b(tablet|capsule|syrup|injection|cream|ointment|drops|inhaler|patch)\b'
        frequency_pattern = r'\b(once daily|twice daily|thrice daily|four times daily|bid|tid|qid|od|bd|tds)\b'

        # Find all potential medicine mentions
        for match in re.finditer(medicine_name_pattern, full_text):
            medicine_name = match.group(0)
            
            # Search for strength, form, frequency around the medicine name
            # This is a very basic proximity search; could be improved with windowing
            context_start = max(0, match.start() - 50)
            context_end = min(len(full_text), match.end() + 50)
            context = full_text[context_start:context_end]

            strength_match = re.search(strength_pattern, context)
            form_match = re.search(form_pattern, context)
            frequency_match = re.search(frequency_pattern, context)

            medicines.append({
                'medicine_name': medicine_name,
                'strength': strength_match.group(0) if strength_match else '',
                'form': form_match.group(0) if form_match else '',
                'frequency': frequency_match.group(0) if frequency_match else ''
            })
        
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
            # Removed duration and instructions from confidence calculation as per new prompt
            total_score += score
        
        return min(total_score / len(medicines), 1.0)

    def match_medicines_by_composition(self, extracted_medicines: List[Dict]) -> List[Dict[str, Any]]:
        """
        Match extracted medicines with local database based on composition
        """
        matched_results = []

        for medicine in extracted_medicines:
            medicine_name = medicine.get('medicine_name', '').strip()
            if not medicine_name:
                continue

            # Step 1: Identify generic name and composition from medicine name
            generic_info = self._identify_generic_from_medicine_name(medicine_name)

            # Step 2: Extract strength from prescription or medicine name
            strength = self._extract_strength_from_medicine_data(medicine, medicine_name)

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
                'input_medicine_name': medicine_name,
                'generic_name': generic_info['generic_name'],
                'composition': standardized_composition,
                'form': medicine.get('form', 'tablet').title(),
                'local_equivalent': local_equivalent,
                'match_confidence': local_equivalent['confidence'] if local_equivalent else 0.0,
                'notes': local_equivalent['notes'] if local_equivalent else 'No matching composition found in local database'
            }

            matched_results.append(result)

        return matched_results

    def _identify_generic_from_medicine_name(self, medicine_name: str) -> Dict[str, Any]:
        """
        Identify generic name and composition from medicine name
        """
        medicine_lower = medicine_name.lower().strip()

        # Remove common suffixes and numbers for better matching
        clean_medicine_name = re.sub(r'\s*\d+\s*(mg|ml|g|mcg|iu).*$', '', medicine_lower)
        clean_medicine_name = re.sub(r'\s*(tablet|capsule|syrup|injection).*$', '', clean_medicine_name)

        # Direct mapping lookup
        for brand_key, info in self.brand_to_generic_mapping.items():
            if brand_key in clean_medicine_name or clean_medicine_name.startswith(brand_key):
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
            score = difflib.SequenceMatcher(None, clean_medicine_name, brand_key).ratio()
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

        # If no mapping found, try to extract from medicine name
        return {
            'generic_name': medicine_name,  # Use medicine name as fallback
            'composition': 'Unknown',
            'common_strengths': [],
            'mapping_confidence': 0.3,
            'source': 'fallback'
        }

    def _extract_strength_from_medicine_data(self, medicine: Dict, medicine_name: str) -> str:
        """
        Extract strength/dosage from medicine data or medicine name
        """
        # First try to get from extracted medicine data
        strength = medicine.get('strength', '').strip()
        if strength:
            return strength

        # Try to extract from medicine name using regex
        strength_patterns = [
            r'(\d+(?:\.\d+)?)\s*(mg|g|ml|mcg|iu|units?)',
            r'(\d+(?:\.\d+)?)\s*(milligram|gram|milliliter|microgram)',
        ]

        for pattern in strength_patterns:
            match = re.search(pattern, medicine_name.lower())
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
        
        common_parts = comp1_parts.intersection(comp2_parts)
        if common_parts:
            # A simple boost based on the number of common words
            similarity += (len(common_parts) / max(len(comp1_parts), len(comp2_parts))) * 0.1

        return min(similarity, 1.0)

    def _check_form_compatibility(self, form1: str, form2: str) -> float:
        """
        Check if two dosage forms are compatible
        """
        form1 = form1.lower().strip()
        form2 = form2.lower().strip()

        if form1 == form2:
            return 1.0
        
        # Consider tablet and capsule as a potential match
        if (form1 in ['tablet', 'capsule'] and form2 in ['tablet', 'capsule']):
            return 0.9
        
        # Consider syrups and drops as a potential match
        if (form1 in ['syrup', 'drops'] and form2 in ['syrup', 'drops']):
            return 0.9

        return 0.0
