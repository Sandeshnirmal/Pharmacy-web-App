# Intelligent Medicine Search and Composition Matching with OCR
import re
import base64
import io
from PIL import Image
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from product.models import Product, Composition
from difflib import SequenceMatcher
import logging
import google.generativeai as genai
from django.conf import settings

logger = logging.getLogger(__name__)

# Configure Google AI
genai.configure(api_key=settings.GOOGLE_API_KEY)


class MedicineSearchEngine:
    """Intelligent medicine search with composition matching"""
    
    def __init__(self):
        self.common_medicine_patterns = {
            # Common medicine name patterns
            'paracetamol': ['acetaminophen', 'tylenol', 'crocin', 'dolo'],
            'ibuprofen': ['brufen', 'combiflam', 'advil'],
            'amoxicillin': ['amoxil', 'augmentin', 'clavamox'],
            'azithromycin': ['zithromax', 'azee', 'azithral'],
            'metformin': ['glucophage', 'glycomet', 'obimet'],
            'amlodipine': ['norvasc', 'amlong', 'stamlo'],
            'omeprazole': ['prilosec', 'omez', 'ocid'],
            'cetirizine': ['zyrtec', 'alerid', 'cetcip'],
        }
        
        self.strength_patterns = [
            r'(\d+(?:\.\d+)?)\s*mg',
            r'(\d+(?:\.\d+)?)\s*g',
            r'(\d+(?:\.\d+)?)\s*mcg',
            r'(\d+(?:\.\d+)?)\s*iu',
            r'(\d+(?:\.\d+)?)\s*ml',
        ]
        
        self.form_patterns = {
            'tablet': ['tab', 'tablet', 'tablets', 'pill'],
            'capsule': ['cap', 'capsule', 'capsules'],
            'syrup': ['syrup', 'liquid', 'suspension'],
            'injection': ['inj', 'injection', 'vial'],
            'cream': ['cream', 'ointment', 'gel'],
            'drops': ['drops', 'eye drops', 'ear drops'],
        }

    def extract_medicine_info(self, text):
        """Extract medicine name, strength, and form from text"""
        text = text.lower().strip()
        
        # Extract strength
        strength = None
        for pattern in self.strength_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                strength = match.group(0)
                break
        
        # Extract form
        form = None
        for form_key, patterns in self.form_patterns.items():
            for pattern in patterns:
                if pattern in text:
                    form = form_key
                    break
            if form:
                break
        
        # Extract medicine name (remove strength and form)
        medicine_name = text
        if strength:
            medicine_name = re.sub(re.escape(strength), '', medicine_name, flags=re.IGNORECASE)
        
        # Remove common form words
        for form_patterns in self.form_patterns.values():
            for pattern in form_patterns:
                medicine_name = re.sub(r'\b' + re.escape(pattern) + r'\b', '', medicine_name, flags=re.IGNORECASE)
        
        medicine_name = re.sub(r'\s+', ' ', medicine_name).strip()
        
        return {
            'name': medicine_name,
            'strength': strength,
            'form': form,
            'original_text': text
        }

    def find_similar_medicines(self, medicine_info, limit=10):
        """Find similar medicines in the database"""
        name = medicine_info['name']
        strength = medicine_info['strength']
        form = medicine_info['form']
        
        # Start with exact matches
        exact_matches = Product.objects.filter(
            Q(name__icontains=name) |
            Q(generic_name__name__icontains=name)
        )
        
        if strength:
            strength_num = re.findall(r'\d+(?:\.\d+)?', strength)
            if strength_num:
                exact_matches = exact_matches.filter(
                    strength__icontains=strength_num[0]
                )
        
        if form:
            exact_matches = exact_matches.filter(
                Q(medicine_type=form) |
                Q(form__icontains=form)
            )
        
        results = []
        
        # Add exact matches with high confidence
        for product in exact_matches[:5]:
            confidence = self.calculate_confidence(medicine_info, product)
            results.append({
                'product': product,
                'confidence': confidence,
                'match_type': 'exact'
            })
        
        # If we don't have enough results, find fuzzy matches
        if len(results) < limit:
            fuzzy_matches = self.find_fuzzy_matches(medicine_info, limit - len(results))
            results.extend(fuzzy_matches)
        
        # Sort by confidence
        results.sort(key=lambda x: x['confidence'], reverse=True)
        
        return results[:limit]

    def find_fuzzy_matches(self, medicine_info, limit):
        """Find fuzzy matches using string similarity"""
        name = medicine_info['name']
        all_products = Product.objects.filter(is_active=True)
        
        fuzzy_results = []
        
        for product in all_products:
            # Calculate name similarity
            name_similarity = SequenceMatcher(None, name.lower(), product.name.lower()).ratio()
            generic_similarity = 0
            
            if product.generic_name:
                generic_similarity = SequenceMatcher(None, name.lower(), product.generic_name.name.lower()).ratio()
            
            max_similarity = max(name_similarity, generic_similarity)
            
            # Check for common medicine patterns
            pattern_match = self.check_pattern_match(name, product)
            if pattern_match:
                max_similarity = max(max_similarity, 0.8)
            
            if max_similarity > 0.6:  # Threshold for fuzzy matching
                confidence = self.calculate_confidence(medicine_info, product)
                fuzzy_results.append({
                    'product': product,
                    'confidence': confidence * max_similarity,
                    'match_type': 'fuzzy'
                })
        
        # Sort by confidence and return top results
        fuzzy_results.sort(key=lambda x: x['confidence'], reverse=True)
        return fuzzy_results[:limit]

    def check_pattern_match(self, search_name, product):
        """Check if the search name matches any known patterns"""
        search_name = search_name.lower()
        product_name = product.name.lower()
        
        for generic, alternatives in self.common_medicine_patterns.items():
            if generic in search_name or any(alt in search_name for alt in alternatives):
                if generic in product_name or any(alt in product_name for alt in alternatives):
                    return True
        
        return False

    def calculate_confidence(self, medicine_info, product):
        """Calculate confidence score for a match"""
        confidence = 0.0
        
        # Name matching (40% weight)
        name_similarity = SequenceMatcher(None, medicine_info['name'].lower(), product.name.lower()).ratio()
        confidence += name_similarity * 0.4
        
        # Generic name matching (30% weight)
        if product.generic_name:
            generic_similarity = SequenceMatcher(None, medicine_info['name'].lower(), product.generic_name.name.lower()).ratio()
            confidence += generic_similarity * 0.3
        
        # Strength matching (20% weight)
        if medicine_info['strength'] and product.strength:
            strength_similarity = SequenceMatcher(None, medicine_info['strength'].lower(), product.strength.lower()).ratio()
            confidence += strength_similarity * 0.2
        
        # Form matching (10% weight)
        if medicine_info['form'] and product.medicine_type:
            if medicine_info['form'] == product.medicine_type:
                confidence += 0.1
            elif medicine_info['form'] in product.form.lower() if product.form else False:
                confidence += 0.05
        
        return min(confidence, 1.0)


class PrescriptionOCREngine:
    """OCR-based prescription analysis with composition matching"""

    def __init__(self):
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def extract_medicines_from_image(self, image_data):
        """Extract medicines from prescription image using OCR"""
        try:
            # Convert base64 to PIL Image if needed
            if isinstance(image_data, str):
                image_data = base64.b64decode(image_data)

            image = Image.open(io.BytesIO(image_data))

            # Prepare prompt for medicine extraction
            prompt = """
            Analyze this prescription image and extract all medicines mentioned.
            For each medicine, provide:
            1. Medicine name (generic or brand name)
            2. Strength/dosage (e.g., 500mg, 250mg)
            3. Form (tablet, capsule, syrup, etc.)
            4. Frequency (if mentioned)
            5. Duration (if mentioned)
            6. Composition/active ingredients (if visible)

            Format the response as JSON:
            {
                "medicines": [
                    {
                        "name": "medicine name",
                        "strength": "dosage",
                        "form": "tablet/capsule/etc",
                        "frequency": "frequency if mentioned",
                        "duration": "duration if mentioned",
                        "composition": ["active ingredient 1", "active ingredient 2"]
                    }
                ]
            }

            Only extract medicines that are clearly visible and readable.
            """

            response = self.model.generate_content([prompt, image])

            # Parse the response
            import json
            try:
                # Extract JSON from response
                response_text = response.text
                # Find JSON in the response
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1

                if start_idx != -1 and end_idx != -1:
                    json_str = response_text[start_idx:end_idx]
                    extracted_data = json.loads(json_str)
                    return extracted_data.get('medicines', [])
                else:
                    logger.error(f'No JSON found in OCR response: {response_text}')
                    return []

            except json.JSONDecodeError as e:
                logger.error(f'JSON decode error: {e}, Response: {response.text}')
                return []

        except Exception as e:
            logger.error(f'OCR extraction error: {e}')
            return []

    def find_matching_products(self, extracted_medicines):
        """Find matching products in database for extracted medicines"""
        search_engine = MedicineSearchEngine()
        results = []

        for medicine in extracted_medicines:
            # Create search text from extracted data
            search_text = f"{medicine.get('name', '')} {medicine.get('strength', '')} {medicine.get('form', '')}"

            # Extract medicine info
            medicine_info = search_engine.extract_medicine_info(search_text)

            # Find matches
            matches = search_engine.find_similar_medicines(medicine_info, limit=3)

            # Add composition matching
            if medicine.get('composition'):
                composition_matches = self.find_by_composition(medicine['composition'])
                # Merge composition matches with name matches
                for comp_match in composition_matches:
                    # Check if already in matches
                    existing = next((m for m in matches if m['product'].id == comp_match.id), None)
                    if not existing:
                        matches.append({
                            'product': comp_match,
                            'confidence': 0.8,  # High confidence for composition match
                            'match_type': 'composition'
                        })

            results.append({
                'extracted_medicine': medicine,
                'search_text': search_text,
                'matches': matches
            })

        return results

    def find_by_composition(self, compositions):
        """Find products by composition/active ingredients"""
        products = Product.objects.filter(is_active=True)

        for comp_name in compositions:
            # Search in product compositions
            products = products.filter(
                Q(compositions__name__icontains=comp_name) | # Corrected lookup
                Q(generic_name__name__icontains=comp_name) |
                Q(name__icontains=comp_name)
            )

        return products.distinct()[:5]


@api_view(['POST'])
@permission_classes([AllowAny])
def prescription_ocr_analysis(request):
    """
    Analyze prescription image with OCR and find matching medicines

    Body: {
        "image": "base64_encoded_image_data",
        "image_url": "url_to_image" // alternative to base64
    }
    """
    try:
        image_data = request.data.get('image')
        image_url = request.data.get('image_url')

        if not image_data and not image_url:
            return Response({
                'error': 'Either image data or image URL is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        ocr_engine = PrescriptionOCREngine()

        # Handle image URL
        if image_url and not image_data:
            import requests
            try:
                response = requests.get(image_url)
                image_data = response.content
            except Exception as e:
                return Response({
                    'error': f'Failed to fetch image from URL: {str(e)}'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Extract medicines from image
        extracted_medicines = ocr_engine.extract_medicines_from_image(image_data)

        if not extracted_medicines:
            return Response({
                'success': True,
                'extracted_medicines': [],
                'matches': [],
                'message': 'No medicines could be extracted from the prescription image'
            })

        # Find matching products
        matches = ocr_engine.find_matching_products(extracted_medicines)

        # Format response
        formatted_matches = []
        for match_group in matches:
            medicine_matches = []
            for match in match_group['matches']:
                product = match['product']
                medicine_matches.append({
                    'id': product.id,
                    'name': product.name,
                    'generic_name': product.generic_name.name if product.generic_name else None,
                    'manufacturer': product.manufacturer,
                    'strength': product.strength,
                    'form': product.form,
                    'medicine_type': product.medicine_type,
                    'price': float(product.price),
                    'mrp': float(product.mrp),
                    'stock_quantity': product.stock_quantity,
                    'is_prescription_required': product.is_prescription_required,
                    'image_url': product.image_url,
                    'confidence': round(match['confidence'], 2),
                    'match_type': match['match_type'],
                    'compositions': [
                        {
                            'name': pc.composition.name,
                            'strength': pc.strength,
                            'unit': pc.unit
                        } for pc in product.product_compositions.all()
                    ] if hasattr(product, 'product_compositions') else []
                })

            formatted_matches.append({
                'extracted_medicine': match_group['extracted_medicine'],
                'search_text': match_group['search_text'],
                'matches': medicine_matches
            })

        return Response({
            'success': True,
            'extracted_medicines': extracted_medicines,
            'matches': formatted_matches,
            'total_extracted': len(extracted_medicines)
        })

    except Exception as e:
        logger.error(f'Prescription OCR analysis error: {str(e)}')
        return Response({
            'error': f'OCR analysis failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def intelligent_medicine_search(request):
    """
    Intelligent medicine search with composition matching
    
    Body: {
        "medicines": ["Paracetamol 500mg tablet", "Amoxicillin 250mg capsule"],
        "limit": 5
    }
    """
    try:
        medicines = request.data.get('medicines', [])
        limit = request.data.get('limit', 5)
        
        if not medicines:
            return Response({
                'error': 'No medicines provided for search'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        search_engine = MedicineSearchEngine()
        results = []
        
        for medicine_text in medicines:
            # Extract medicine information
            medicine_info = search_engine.extract_medicine_info(medicine_text)
            
            # Find similar medicines
            matches = search_engine.find_similar_medicines(medicine_info, limit)
            
            # Format results
            medicine_results = []
            for match in matches:
                product = match['product']
                medicine_results.append({
                    'id': product.id,
                    'name': product.name,
                    'generic_name': product.generic_name.name if product.generic_name else None,
                    'manufacturer': product.manufacturer,
                    'strength': product.strength,
                    'form': product.form,
                    'medicine_type': product.medicine_type,
                    'price': float(product.price),
                    'mrp': float(product.mrp),
                    'stock_quantity': product.stock_quantity,
                    'is_prescription_required': product.is_prescription_required,
                    'image_url': product.image_url,
                    'confidence': round(match['confidence'], 2),
                    'match_type': match['match_type'],
                    'compositions': [
                        {
                            'name': pc.composition.name,
                            'strength': pc.strength,
                            'unit': pc.unit
                        } for pc in product.product_compositions.all()
                    ] if hasattr(product, 'product_compositions') else []
                })
            
            results.append({
                'search_text': medicine_text,
                'extracted_info': medicine_info,
                'matches': medicine_results
            })
        
        return Response({
            'success': True,
            'results': results,
            'total_searches': len(medicines)
        })
        
    except Exception as e:
        logger.error(f'Medicine search error: {str(e)}')
        return Response({
            'error': f'Search failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def search_by_composition(request):
    """
    Search medicines by composition
    
    Body: {
        "compositions": [
            {"name": "Paracetamol", "strength": "500", "unit": "mg"},
            {"name": "Caffeine", "strength": "30", "unit": "mg"}
        ]
    }
    """
    try:
        compositions = request.data.get('compositions', [])
        
        if not compositions:
            return Response({
                'error': 'No compositions provided for search'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Find products with matching compositions
        matching_products = Product.objects.filter(is_active=True)
        
        for comp in compositions:
            comp_name = comp.get('name', '').lower()
            comp_strength = comp.get('strength', '')
            
            # Filter products that have this composition
            matching_products = matching_products.filter(
                compositions__name__icontains=comp_name # Corrected lookup
            )
            
            if comp_strength:
                matching_products = matching_products.filter(
                    compositions__strength__icontains=comp_strength
                )
        
        # Format results
        results = []
        for product in matching_products.distinct()[:20]:
            results.append({
                'id': product.id,
                'name': product.name,
                'generic_name': product.generic_name.name if product.generic_name else None,
                'manufacturer': product.manufacturer,
                'strength': product.strength,
                'form': product.form,
                'price': float(product.price),
                'mrp': float(product.mrp),
                'stock_quantity': product.stock_quantity,
                'is_prescription_required': product.is_prescription_required,
                'image_url': product.image_url,
                'compositions': [
                    {
                        'name': pc.composition.name,
                        'strength': pc.strength,
                        'unit': pc.unit
                    } for pc in product.product_compositions.all()
                ] if hasattr(product, 'product_compositions') else []
            })
        
        return Response({
            'success': True,
            'results': results,
            'total_found': len(results)
        })
        
    except Exception as e:
        logger.error(f'Composition search error: {str(e)}')
        return Response({
            'error': f'Search failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
