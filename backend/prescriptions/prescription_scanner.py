import re
import json
from typing import List, Dict, Any
from django.db.models import Q
from product.models import Product, Composition, ProductComposition
from .models import PrescriptionScanResult, MedicineSuggestion
import logging

logger = logging.getLogger(__name__)

class PrescriptionScanner:
    """
    Service for scanning prescriptions and suggesting medicines based on composition

    This service provides:
    1. Prescription text parsing and medicine extraction
    2. Medicine suggestions based on composition matching
    3. Search functionality by name, composition, or generic name
    4. Confidence scoring for suggestions

    Note: This is for search-only functionality, not for placing orders
    """

    def __init__(self):
        self.common_medicine_patterns = self._load_medicine_patterns()
        self.composition_aliases = self._load_composition_aliases()
        self.min_confidence_threshold = 0.3  # Minimum confidence for suggestions
    
    def scan_prescription_text(self, prescription_text: str, user=None) -> Dict[str, Any]:
        """
        Scan prescription text and suggest medicines from database

        Args:
            prescription_text: The prescription text to scan
            user: Optional user for tracking scan history

        Returns:
            Dictionary with scan results and medicine suggestions

        Note: This is for search-only functionality, does not create orders or affect admin dashboard
        """
        try:
            # Validate input
            if not prescription_text or not isinstance(prescription_text, str):
                raise ValueError("Prescription text must be a non-empty string")

            if len(prescription_text.strip()) < 5:
                raise ValueError("Prescription text is too short (minimum 5 characters)")

            # Extract medicine names and compositions from text
            extracted_medicines = self._extract_medicines_from_text(prescription_text)

            if not extracted_medicines:
                return {
                    'success': True,
                    'extracted_medicines': [],
                    'suggestions': [],
                    'total_suggestions': 0,
                    'scan_result_id': None,
                    'message': 'No medicines could be extracted from the prescription text'
                }

            # Find suggestions for each extracted medicine
            suggestions = []
            for medicine_data in extracted_medicines:
                medicine_suggestions = self._find_medicine_suggestions(medicine_data)
                if medicine_suggestions:
                    # Filter by confidence threshold
                    filtered_suggestions = [
                        s for s in medicine_suggestions
                        if s.get('confidence_score', 0) >= self.min_confidence_threshold
                    ]
                    suggestions.extend(filtered_suggestions)

            # Remove duplicates and sort by confidence
            unique_suggestions = self._remove_duplicate_suggestions(suggestions)
            unique_suggestions.sort(key=lambda x: x.get('confidence_score', 0), reverse=True)

            # Create scan result for tracking (optional)
            scan_result = None
            if user:
                try:
                    scan_result = PrescriptionScanResult.objects.create(
                        user=user,
                        scanned_text=prescription_text[:1000],  # Limit text length
                        extracted_medicines=extracted_medicines,
                        total_suggestions=len(unique_suggestions),
                        scan_type='composition_search'
                    )
                except Exception as e:
                    logger.warning(f"Failed to create scan result: {str(e)}")

            return {
                'success': True,
                'extracted_medicines': extracted_medicines,
                'suggestions': unique_suggestions,
                'total_suggestions': len(unique_suggestions),
                'scan_result_id': scan_result.id if scan_result else None,
                'message': f'Found {len(unique_suggestions)} medicine suggestions based on composition matching'
            }
            
        except Exception as e:
            logger.error(f"Error scanning prescription: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'suggestions': [],
                'total_suggestions': 0
            }
    
    def _extract_medicines_from_text(self, text: str) -> List[Dict[str, Any]]:
        """Extract medicine names and compositions from prescription text"""
        medicines = []
        
        # Clean and normalize text
        text = self._clean_text(text)
        
        # Split text into lines and process each line
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 3:
                continue
            
            # Try to extract medicine information from line
            medicine_info = self._parse_medicine_line(line)
            if medicine_info:
                medicines.append(medicine_info)
        
        return medicines
    
    def _parse_medicine_line(self, line: str) -> Dict[str, Any]:
        """Parse a single line to extract medicine information"""
        # Common patterns for medicine names and compositions
        patterns = [
            # Pattern: Medicine Name (Composition) Strength
            r'([A-Za-z\s]+)\s*\(([^)]+)\)\s*(\d+\s*mg|mg\s*\d+)?',
            # Pattern: Medicine Name - Composition - Strength
            r'([A-Za-z\s]+)\s*-\s*([A-Za-z\s]+)\s*-\s*(\d+\s*mg|mg\s*\d+)?',
            # Pattern: Medicine Name Strength (Composition)
            r'([A-Za-z\s]+)\s*(\d+\s*mg|mg\s*\d+)?\s*\(([^)]+)\)',
            # Pattern: Just medicine name with strength
            r'([A-Za-z\s]+)\s*(\d+\s*mg|mg\s*\d+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                groups = match.groups()
                
                medicine_name = groups[0].strip() if groups[0] else ''
                composition = ''
                strength = ''
                
                # Determine which group contains what based on pattern
                if len(groups) >= 3:
                    if 'mg' in groups[1] if groups[1] else '':
                        strength = groups[1].strip() if groups[1] else ''
                        composition = groups[2].strip() if groups[2] else ''
                    else:
                        composition = groups[1].strip() if groups[1] else ''
                        strength = groups[2].strip() if groups[2] else ''
                elif len(groups) == 2:
                    if 'mg' in groups[1] if groups[1] else '':
                        strength = groups[1].strip()
                    else:
                        composition = groups[1].strip()
                
                if medicine_name:
                    return {
                        'extracted_name': medicine_name,
                        'composition': composition,
                        'strength': strength,
                        'original_line': line
                    }
        
        # If no pattern matches, treat the whole line as medicine name
        if len(line.split()) <= 4:  # Likely a medicine name
            return {
                'extracted_name': line,
                'composition': '',
                'strength': '',
                'original_line': line
            }
        
        return None
    
    def _find_medicine_suggestions(self, medicine_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Find medicine suggestions based on extracted data"""
        suggestions = []
        
        extracted_name = medicine_data.get('extracted_name', '').strip()
        composition = medicine_data.get('composition', '').strip()
        strength = medicine_data.get('strength', '').strip()
        
        # Search strategies (in order of preference)
        search_strategies = [
            self._search_by_exact_name,
            self._search_by_composition,
            self._search_by_partial_name,
            self._search_by_generic_name
        ]
        
        for strategy in search_strategies:
            results = strategy(extracted_name, composition, strength)
            if results:
                suggestions.extend(results)
                break  # Use first successful strategy
        
        # Remove duplicates and limit results
        unique_suggestions = self._remove_duplicate_suggestions(suggestions)
        return unique_suggestions[:10]  # Limit to top 10 suggestions
    
    def _search_by_exact_name(self, name: str, composition: str, strength: str) -> List[Dict[str, Any]]:
        """Search by exact medicine name"""
        if not name:
            return []
        
        products = Product.objects.filter(
            Q(name__iexact=name) | Q(brand_name__iexact=name),
            is_active=True
        ).select_related('generic_name', 'category').prefetch_related('product_compositions__composition')
        
        return self._format_product_suggestions(products, 'exact_name', name)
    
    def _search_by_composition(self, name: str, composition: str, strength: str) -> List[Dict[str, Any]]:
        """Search by composition name"""
        if not composition:
            return []
        
        # Find compositions that match
        compositions = Composition.objects.filter(
            name__icontains=composition
        )
        
        if not compositions.exists():
            return []
        
        # Find products with these compositions
        product_compositions = ProductComposition.objects.filter(
            composition__in=compositions,
            is_active=True
        ).select_related('product', 'composition')

        products = [pc.product for pc in product_compositions if pc.product.is_active]
        
        return self._format_product_suggestions(products, 'composition', composition)
    
    def _search_by_partial_name(self, name: str, composition: str, strength: str) -> List[Dict[str, Any]]:
        """Search by partial medicine name"""
        if not name or len(name) < 3:
            return []
        
        products = Product.objects.filter(
            Q(name__icontains=name) | Q(brand_name__icontains=name),
            is_active=True
        ).select_related('generic_name', 'category').prefetch_related('product_compositions__composition')
        
        return self._format_product_suggestions(products, 'partial_name', name)
    
    def _search_by_generic_name(self, name: str, composition: str, strength: str) -> List[Dict[str, Any]]:
        """Search by generic name"""
        if not name:
            return []
        
        products = Product.objects.filter(
            generic_name__name__icontains=name,
            is_active=True
        ).select_related('generic_name', 'category').prefetch_related('product_compositions__composition')
        
        return self._format_product_suggestions(products, 'generic_name', name)
    
    def _format_product_suggestions(self, products, match_type: str, search_term: str) -> List[Dict[str, Any]]:
        """Format products as suggestions"""
        suggestions = []
        
        for product in products:
            # Get compositions for this product
            compositions = []
            for pc in product.product_compositions.filter(is_active=True):
                compositions.append({
                    'name': pc.composition.name,
                    'strength': pc.strength,
                    'unit': pc.unit,
                    'is_primary': pc.is_primary
                })
            
            suggestion = {
                'product_id': product.id,
                'name': product.name,
                'brand_name': product.brand_name,
                'generic_name': product.generic_name.name if product.generic_name else '',
                'manufacturer': product.manufacturer,
                'category': product.category.name if product.category else '',
                'compositions': compositions,
                'price': float(product.price) if product.price else 0,
                'mrp': float(product.mrp) if product.mrp else 0,
                'is_prescription_required': product.is_prescription_required,
                'stock_quantity': product.stock_quantity,
                'image_url': product.image_url,
                'match_type': match_type,
                'search_term': search_term,
                'confidence_score': self._calculate_confidence_score(product, search_term, match_type)
            }
            suggestions.append(suggestion)
        
        # Sort by confidence score
        suggestions.sort(key=lambda x: x['confidence_score'], reverse=True)
        return suggestions
    
    def _calculate_confidence_score(self, product, search_term: str, match_type: str) -> float:
        """Calculate confidence score for suggestion"""
        base_scores = {
            'exact_name': 1.0,
            'composition': 0.8,
            'partial_name': 0.6,
            'generic_name': 0.4
        }
        
        score = base_scores.get(match_type, 0.5)
        
        # Boost score for exact matches
        if search_term.lower() in product.name.lower():
            score += 0.1
        
        # Boost score for popular/common medicines
        if product.stock_quantity > 100:
            score += 0.05
        
        return min(score, 1.0)
    
    def _remove_duplicate_suggestions(self, suggestions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate suggestions based on product_id"""
        seen_ids = set()
        unique_suggestions = []
        
        for suggestion in suggestions:
            product_id = suggestion.get('product_id')
            if product_id not in seen_ids:
                seen_ids.add(product_id)
                unique_suggestions.append(suggestion)
        
        return unique_suggestions
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize prescription text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove common prescription headers/footers
        text = re.sub(r'(prescription|rx|doctor|clinic|hospital)', '', text, flags=re.IGNORECASE)
        
        # Remove numbers that look like dates
        text = re.sub(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', '', text)
        
        return text.strip()
    
    def _load_medicine_patterns(self) -> Dict[str, str]:
        """Load common medicine name patterns"""
        # This can be expanded with a database or file
        return {
            'paracetamol': r'(paracetamol|acetaminophen|tylenol|crocin)',
            'ibuprofen': r'(ibuprofen|brufen|advil)',
            'aspirin': r'(aspirin|disprin)',
            'amoxicillin': r'(amoxicillin|amoxil)',
        }
    
    def _load_composition_aliases(self) -> Dict[str, List[str]]:
        """Load composition aliases and alternative names"""
        return {
            'paracetamol': ['acetaminophen', 'tylenol'],
            'ibuprofen': ['brufen'],
            'aspirin': ['acetylsalicylic acid'],
        }
