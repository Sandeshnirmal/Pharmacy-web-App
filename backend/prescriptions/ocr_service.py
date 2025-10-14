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
import logging
from typing import List, Dict, Any, Optional
from PIL import Image
import google.generativeai as genai
from django.conf import settings
from django.db.models import Q, Sum
from product.models import Product, GenericName, Composition # Import Composition model
from backend.settings import GOOGLE_API_KEY

logger = logging.getLogger(__name__)

class OCRService:
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_API_KEY', GOOGLE_API_KEY)
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set.")
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel("models/gemini-2.0-flash")

        # Common dosage forms (still useful for validation/parsing)
        self.dosage_forms = ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'patch']

        # Common instruction patterns (still useful for validation/parsing)
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
            You are an intelligent medical OCR and medicine analysis system. Your primary goal is to extract medicine-related information from prescription images, even if the handwriting is challenging or unclear.

            Analyze the provided image and extract all possible medicine-related details. This includes:
            1.  **Medicine Name**: Identify the brand name or generic name. If unsure, provide your best guess.
            2.  **Generic Name**: Explicitly identify the generic (active ingredient) name(s). If it's a combination drug, list all generic names.
            3.  **Composition**: Provide the full chemical composition or active ingredients with their strengths (e.g., "Paracetamol 500mg", "Amoxicillin 250mg + Clavulanic Acid 125mg").
            4.  **Strength/Dosage**: Extract the dosage with units (e.g., 500mg, 10ml, 1g).
            5.  **Dosage Form**: Determine the form (e.g., tablet, capsule, syrup, injection, cream).
            6.  **Frequency**: Extract how often the medicine should be taken (e.g., once daily, twice daily, BID, TID, QID, OD, BD, TDS).
            7.  **Quantity/Duration**: If visible, extract the quantity (e.g., "60 tablets") or duration (e.g., "for 7 days").

            **CRITICAL INSTRUCTIONS FOR CHALLENGING HANDWRITING**:
            -   **Prioritize Extraction**: Even if the handwriting is difficult, make your best effort to interpret and extract *any* potential medicine information. Do not return empty if there's a plausible interpretation.
            -   **Best Guess**: If a word or number is ambiguous, provide your most probable interpretation.
            -   **Focus on Keywords**: Look for common medicine names, dosage units (mg, ml, g), and frequency indicators (daily, BID, TID).
            -   **Ignore Non-Medical Text**: Strictly focus on pharmacologically relevant items. Disregard patient names, doctor details, clinic information, or general notes unless they are directly part of a medicine instruction.

            Format your response as a JSON object. If multiple medicines are found, list them in an array. If no medicines are confidently identified, return an empty array for "medicines".

            JSON Format Example:
            {
                "medicines": [
                    {
                        "medicine_name": "extracted brand or generic name",
                        "generic_name": "identified generic name(s)",
                        "composition": "full composition with strengths",
                        "strength": "dosage with unit",
                        "form": "tablet/capsule/syrup/etc",
                        "frequency": "how often to take",
                        "quantity_duration": "e.g., 60 tablets or for 7 days"
                    },
                    // ... other medicines
                ]
            }

            Return ONLY the valid JSON object. Do not include any additional text or explanations outside the JSON.
            """

            response = self.model.generate_content([prompt, image])
            extracted_text = response.text.strip()
            
            # Log the raw AI response for debugging
            logger.info(f"Gemini AI Raw Response: {extracted_text}")
            
            # Parse the JSON response
            medicines = self._parse_json_response(extracted_text)
            
            # Log the parsed medicines for debugging
            logger.info(f"Parsed Medicines: {medicines}")

            return {
                'success': True,
                'raw_text': extracted_text,
                'medicines': medicines,
                'confidence_score': self._calculate_confidence(medicines)
            }

        except Exception as e:
            print(f"Error during OCR extraction: {e}")
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
        if not text:
            return []

        # Clean the response text from markdown code blocks
        text = text.strip()
        if text.startswith('```json'):
            text = text.removeprefix('```json')
        if text.endswith('```'):
            text = text.removesuffix('```')
        text = text.strip()

        try:
            data = json.loads(text)
            medicines = data.get('medicines', [])

            normalized_medicines = []
            for medicine in medicines:
                normalized = {
                    'medicine_name': (medicine.get('medicine_name') or '').strip(),
                    'generic_name': (medicine.get('generic_name') or '').strip(), # New field
                    'composition': (medicine.get('composition') or '').strip(),   # New field
                    'strength': (medicine.get('strength') or '').strip(),
                    'form': (medicine.get('form') or '').strip().lower(),
                    'frequency': (medicine.get('frequency') or '').strip(),
                }
                if normalized['medicine_name'] or normalized['generic_name'] or normalized['composition']:
                    normalized_medicines.append(normalized)
            return normalized_medicines
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}. Attempting text-based parsing as fallback.")
            return self._find_medicines_in_text(text)
        except Exception as e:
            logger.error(f"Error parsing JSON response: {e}. Returning empty list.")
            return []

    def _find_medicines_in_text(self, text: str) -> List[Dict[str, Any]]:
        """
        A more robust fallback parser for non-JSON responses.
        Uses a combination of keyword matching and regex to identify medicines.
        This fallback will now also try to infer generic name and composition.
        """
        medicines = []
        lines = text.lower().split('\n')
        
        # Compile regex patterns for common medicine components
        strength_pattern = re.compile(r'(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|iu|units?)\b')
        form_pattern = re.compile(r'\b(tablet|capsule|syrup|injection|cream|ointment|drops|inhaler|patch)\b')
        frequency_pattern = re.compile(r'\b(once daily|twice daily|thrice daily|four times daily|bid|tid|qid|od|bd|tds|daily)\b')
        
        # Combine all known generic names and product names for a comprehensive search
        all_known_generic_names = set(GenericName.objects.values_list('name', flat=True))
        all_known_product_names = set(Product.objects.values_list('name', flat=True))
        all_known_composition_names = set(Composition.objects.values_list('name', flat=True)) # Use Composition model

        all_search_terms = set()
        all_search_terms.update(name.lower() for name in all_known_generic_names)
        all_search_terms.update(name.lower() for name in all_known_product_names)
        all_search_terms.update(name.lower() for name in all_known_composition_names)

        # Sort by length to match longer names first
        sorted_search_terms = sorted(list(all_search_terms), key=len, reverse=True)

        for line in lines:
            if not line.strip():
                continue

            found_medicine_name = None
            found_generic_name = ''
            found_composition = ''
            best_match_score = 0.0

            for term in sorted_search_terms:
                score = difflib.SequenceMatcher(None, line, term).ratio()
                if score > 0.6 and score > best_match_score:
                    best_match_score = score
                    found_medicine_name = term # Could be product, generic, or composition name

                    # Try to infer generic/composition if a product name was matched
                    product = Product.objects.filter(name__iexact=term).first()
                    if product:
                        found_generic_name = product.generic_name.name if product.generic_name else ''
                        found_composition = self._build_product_composition(product)
                    else: # If not a product, check if it's a generic or composition name directly
                        generic = GenericName.objects.filter(name__iexact=term).first()
                        if generic:
                            found_generic_name = generic.name
                            found_composition = generic.name # Simple fallback for composition
                        else:
                            composition_obj = Composition.objects.filter(name__iexact=term).first()
                            if composition_obj:
                                found_composition = composition_obj.name
                                found_generic_name = composition_obj.name # Simple fallback for generic

            if found_medicine_name:
                strength = ''
                form = ''
                frequency = ''

                strength_match = strength_pattern.search(line)
                if strength_match:
                    strength = strength_match.group(0)
                
                form_match = form_pattern.search(line)
                if form_match:
                    form = form_match.group(0)
                
                frequency_match = frequency_pattern.search(line)
                if frequency_match:
                    frequency = frequency_match.group(0)

                medicines.append({
                    'medicine_name': found_medicine_name,
                    'generic_name': found_generic_name,
                    'composition': found_composition,
                    'strength': strength,
                    'form': form,
                    'frequency': frequency
                })
        
        unique_medicines = []
        seen = set()
        for med in medicines:
            med_tuple = tuple(med.items())
            if med_tuple not in seen:
                unique_medicines.append(med)
                seen.add(med_tuple)

        return unique_medicines

    def _calculate_confidence(self, medicines: List[Dict]) -> float:
        """
        Calculate overall confidence score based on extracted medicines
        """
        if not medicines:
            return 0.0
        
        total_score = 0
        for medicine in medicines:
            score = 0.2  # Base score for having a name
            if medicine.get('generic_name') or medicine.get('composition'): # Boost for generic/composition
                score += 0.2
            if medicine.get('strength'):
                score += 0.2
            if medicine.get('frequency'):
                score += 0.2
            if medicine.get('form'):
                score += 0.1
            total_score += score
        
        # Max score per medicine is 0.9 (name + generic/composition + strength + frequency + form)
        return min(total_score / (len(medicines) * 0.9), 1.0) if medicines else 0.0

    def match_medicines_by_composition(self, extracted_medicines: List[Dict]) -> List[Dict[str, Any]]:
        """
        Match extracted medicines with local database based on composition
        Now prioritizes Gemini's provided generic name and composition.
        """
        matched_results = []

        for medicine in extracted_medicines:
            medicine_name = medicine.get('medicine_name', '').strip()
            extracted_generic_name = medicine.get('generic_name', '').strip()
            extracted_composition_str = medicine.get('composition', '').strip()

            if not (medicine_name or extracted_generic_name or extracted_composition_str):
                continue

            # Prioritize Gemini's extracted generic name and composition
            generic_name_for_matching = extracted_generic_name if extracted_generic_name else medicine_name
            composition_for_matching = extracted_composition_str

            # If Gemini didn't provide a full composition string, try to build it
            if not composition_for_matching and (extracted_generic_name or medicine_name):
                strength = self._extract_strength_from_medicine_data(medicine, medicine_name)
                composition_for_matching = self._build_standardized_composition(
                    extracted_generic_name if extracted_generic_name else medicine_name,
                    strength,
                    medicine.get('form', 'tablet')
                )
            
            # If still no composition, use generic name as fallback
            if not composition_for_matching:
                composition_for_matching = generic_name_for_matching

            # Extract strength from prescription or medicine name (still useful for building if composition is missing)
            strength = self._extract_strength_from_medicine_data(medicine, medicine_name)

            # Find local equivalent by composition matching
            local_equivalent = self._find_local_equivalent_by_composition(
                composition_for_matching,
                medicine.get('form', 'tablet')
            )

            # Compile result in required format
            result = {
                'input_medicine_name': medicine_name,
                'extracted_generic_name': extracted_generic_name,
                'extracted_composition_str': extracted_composition_str,
                'generic_name_for_matching': generic_name_for_matching,
                'composition_for_matching': composition_for_matching,
                'form': medicine.get('form', 'tablet').title(),
                'local_equivalent': local_equivalent,
                'match_confidence': local_equivalent['confidence'] if local_equivalent else 0.0,
                'notes': local_equivalent['notes'] if local_equivalent else 'No matching composition found in local database'
            }

            matched_results.append(result)

        return matched_results

    def _identify_generic_from_medicine_name(self, medicine_name: str) -> Dict[str, Any]:
        """
        This method is now largely redundant if Gemini provides generic_name and composition.
        It can be kept as a very last resort fallback or for specific legacy cases,
        but its primary role is diminished.
        For now, it will simply return the medicine name as generic and 'Unknown' composition.
        """
        return {
            'generic_name': medicine_name,
            'composition': 'Unknown',
            'common_strengths': [],
            'mapping_confidence': 0.1,
            'source': 'fallback_after_gemini'
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

        # Corrected loop: Iterate through predefined regex patterns
        for pattern_regex in strength_patterns:
            match = re.search(pattern_regex, medicine_name.lower()) # Apply pattern_regex to medicine_name
            if match:
                # Always return the full matched string (group 0) if a match is found
                # This avoids IndexError if groups 1 and 2 are unexpectedly missing
                return match.group(0)
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
            logger.debug("No composition provided for matching.")
            return None

        # Normalize composition for matching
        normalized_composition = self._normalize_composition(composition)
        logger.debug(f"Searching for normalized composition: '{normalized_composition}' (Form: '{form}')")

        # Search in local database by composition
        # Extract only the composition names from the normalized_composition for initial filtering
        # This makes the initial filter less sensitive to strength variations
        composition_names_only = re.findall(r'[a-zA-Z]+', normalized_composition)
        
        composition_filters = Q()
        for comp_name in composition_names_only:
            composition_filters |= Q(compositions__name__icontains=comp_name)
        
        logger.debug(f"Composition filters (names only): {composition_filters}")

        matching_products = Product.objects.annotate(
            total_stock=Sum('batches__current_quantity')
        ).filter(
            composition_filters,
            is_active=True
        ).distinct()
        
        logger.debug(f"Found {matching_products.count()} matching products initially based on names.")

        best_match = None
        best_score = 0.0

        for product in matching_products:
            product_composition = self._build_product_composition(product)
            normalized_product_comp = self._normalize_composition(product_composition)

            # Calculate similarity based on the full normalized composition (including strength)
            # This allows for a more nuanced score even if initial filter was broad
            similarity = self._calculate_composition_similarity(
                normalized_composition, # This is the full composition from OCR (e.g., "amoxicillin 500mg")
                normalized_product_comp # This is the full composition from DB (e.g., "amoxicillin 500mg")
            )
            form_match = self._check_form_compatibility(form, product.form or 'tablet')
            
            # Adjust weights if needed, but 0.8/0.2 is a good starting point
            total_score = similarity * 0.8 + form_match * 0.2

            logger.debug(f"  - Product: {product.name}, Comp: '{normalized_product_comp}', Form: '{product.form}'")
            logger.debug(f"    - Similarity: {similarity:.2f}, Form Match: {form_match:.2f}, Total Score: {total_score:.2f}")

            # A lower threshold for initial match might be acceptable if human verification is always present
            if total_score > best_score and total_score >= 0.5: # Lowered threshold slightly for more matches
                best_score = total_score
                best_match = product
                logger.debug(f"    - NEW BEST MATCH: {product.name} with score {best_score:.2f}")

        if best_match:
            logger.debug(f"Final best match: {best_match.name} with score {best_score:.2f}")
            return {
                'product_object': best_match,
                'product_name': best_match.name,
                'composition': self._build_product_composition(best_match),
                'form': (best_match.form or 'tablet').title(),
                'manufacturer': best_match.manufacturer,
                'price': float(best_match.batches.first().selling_price if best_match.batches.first() else 0.0),
                'available': best_match.stock_quantity > 0,
                'stock_quantity': best_match.stock_quantity,
                'confidence': best_score,
                'notes': 'Matched by composition.'
            }
        
        logger.debug(f"No best match found for composition '{normalized_composition}' above threshold 0.5.")
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
        # Build composition string from related ProductComposition objects
        compositions_list = []
        for pc in product.product_compositions.all().order_by('-is_primary', 'composition__name'):
            comp_str = f"{pc.composition.name.title()} {pc.strength}{pc.unit}"
            compositions_list.append(comp_str)
        
        if compositions_list:
            return ' + '.join(compositions_list)
        
        # Fallback to generic name and strength if no detailed compositions are found
        generic_name = product.generic_name.name if product.generic_name else product.name
        strength = product.strength or ''

        if strength:
            return f"{generic_name.title()} {strength}"
        else:
            return generic_name.title()

    def _calculate_composition_similarity(self, comp1: str, comp2: str) -> float:
        """
        Calculate similarity between two composition strings, with emphasis on names and then strength.
        """
        if not comp1 or not comp2:
            return 0.0

        # Extract composition names and strengths
        comp1_names = set(re.findall(r'[a-zA-Z]+', comp1.lower()))
        comp2_names = set(re.findall(r'[a-zA-Z]+', comp2.lower()))

        comp1_strength_match = re.search(r'(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|iu|units?)', comp1.lower())
        comp2_strength_match = re.search(r'(\d+(?:\.\d+)?)\s*(mg|ml|g|mcg|iu|units?)', comp2.lower())

        comp1_strength = comp1_strength_match.group(0) if comp1_strength_match else ''
        comp2_strength = comp2_strength_match.group(0) if comp2_strength_match else ''

        # 1. Compare composition names (higher weight)
        name_similarity = 0.0
        if comp1_names or comp2_names:
            common_names = comp1_names.intersection(comp2_names)
            name_similarity = len(common_names) / max(len(comp1_names), len(comp2_names))

        # 2. Compare strengths (secondary weight)
        strength_similarity = 0.0
        if comp1_strength and comp2_strength:
            if comp1_strength == comp2_strength:
                strength_similarity = 1.0
            else:
                # Fuzzy match for strength if not exact
                strength_similarity = difflib.SequenceMatcher(None, comp1_strength, comp2_strength).ratio()
        elif not comp1_strength and not comp2_strength:
            strength_similarity = 1.0 # Both missing strength, consider them similar in that aspect

        # Combine similarities with weights
        # Adjust weights as needed. Name is more critical than exact strength match for initial identification.
        total_similarity = (name_similarity * 0.7) + (strength_similarity * 0.3)

        return min(total_similarity, 1.0)

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
