from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from product.models import Composition, Product, ProductComposition, GenericName, Category

User = get_user_model()

class Command(BaseCommand):
    help = 'Setup enhanced composition data with multiple compositions per medicine'

    def handle(self, *args, **options):
        # Get or create admin user for compositions
        admin_user, created = User.objects.get_or_create(
            email='admin@pharmacy.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True,
                'role': 'admin'
            }
        )
        
        # Create enhanced compositions with aliases
        compositions_data = [
            {
                'name': 'Paracetamol',
                'scientific_name': 'N-acetyl-p-aminophenol',
                'aliases': ['Acetaminophen', 'APAP', 'Tylenol'],
                'therapeutic_class': 'Analgesic, Antipyretic',
                'mechanism_of_action': 'Inhibits cyclooxygenase enzymes in the central nervous system',
                'description': 'Pain reliever and fever reducer',
                'category': 'Analgesics'
            },
            {
                'name': 'Ibuprofen',
                'scientific_name': '2-(4-isobutylphenyl)propionic acid',
                'aliases': ['Brufen', 'Advil', 'Motrin'],
                'therapeutic_class': 'NSAID',
                'mechanism_of_action': 'Non-selective COX inhibitor',
                'description': 'Anti-inflammatory, analgesic, and antipyretic',
                'category': 'NSAIDs'
            },
            {
                'name': 'Aspirin',
                'scientific_name': 'Acetylsalicylic acid',
                'aliases': ['ASA', 'Disprin', 'Ecosprin'],
                'therapeutic_class': 'NSAID, Antiplatelet',
                'mechanism_of_action': 'Irreversible COX inhibitor',
                'description': 'Anti-inflammatory, analgesic, antipyretic, and antiplatelet',
                'category': 'NSAIDs'
            },
            {
                'name': 'Amoxicillin',
                'scientific_name': '(2S,5R,6R)-6-[(2R)-2-amino-2-(4-hydroxyphenyl)acetamido]-3,3-dimethyl-7-oxo-4-thia-1-azabicyclo[3.2.0]heptane-2-carboxylic acid',
                'aliases': ['Amoxil', 'Augmentin'],
                'therapeutic_class': 'Beta-lactam antibiotic',
                'mechanism_of_action': 'Inhibits bacterial cell wall synthesis',
                'description': 'Broad-spectrum antibiotic',
                'category': 'Antibiotics'
            },
            {
                'name': 'Clavulanic Acid',
                'scientific_name': '(2R,5R)-3-(2-hydroxyethylidene)-7-oxo-4-oxa-1-azabicyclo[3.2.0]heptane-2-carboxylic acid',
                'aliases': ['Clavulanate'],
                'therapeutic_class': 'Beta-lactamase inhibitor',
                'mechanism_of_action': 'Inhibits beta-lactamase enzymes',
                'description': 'Beta-lactamase inhibitor used with antibiotics',
                'category': 'Antibiotic enhancers'
            },
            {
                'name': 'Metformin',
                'scientific_name': '3-(diaminomethylidene)-1,1-dimethylguanidine',
                'aliases': ['Glucophage', 'Glycomet'],
                'therapeutic_class': 'Biguanide antidiabetic',
                'mechanism_of_action': 'Decreases hepatic glucose production',
                'description': 'First-line treatment for type 2 diabetes',
                'category': 'Antidiabetics'
            },
            {
                'name': 'Atorvastatin',
                'scientific_name': '(3R,5R)-7-[2-(4-fluorophenyl)-3-phenyl-4-(phenylcarbamoyl)-5-propan-2-ylpyrrol-1-yl]-3,5-dihydroxyheptanoic acid',
                'aliases': ['Lipitor', 'Atorlip'],
                'therapeutic_class': 'HMG-CoA reductase inhibitor',
                'mechanism_of_action': 'Inhibits cholesterol synthesis',
                'description': 'Cholesterol-lowering medication',
                'category': 'Statins'
            },
            {
                'name': 'Amlodipine',
                'scientific_name': '3-ethyl 5-methyl 2-[(2-aminoethoxy)methyl]-4-(2-chlorophenyl)-6-methyl-1,4-dihydropyridine-3,5-dicarboxylate',
                'aliases': ['Norvasc', 'Amlong'],
                'therapeutic_class': 'Calcium channel blocker',
                'mechanism_of_action': 'Blocks L-type calcium channels',
                'description': 'Antihypertensive and antianginal',
                'category': 'Antihypertensives'
            },
            {
                'name': 'Losartan',
                'scientific_name': '2-butyl-4-chloro-1-[[2\'-(1H-tetrazol-5-yl)[1,1\'-biphenyl]-4-yl]methyl]-1H-imidazole-5-methanol',
                'aliases': ['Cozaar', 'Losartan Potassium'],
                'therapeutic_class': 'ARB (Angiotensin Receptor Blocker)',
                'mechanism_of_action': 'Blocks angiotensin II receptors',
                'description': 'Antihypertensive medication',
                'category': 'Antihypertensives'
            },
            {
                'name': 'Hydrochlorothiazide',
                'scientific_name': '6-chloro-3,4-dihydro-2H-1,2,4-benzothiadiazine-7-sulfonamide 1,1-dioxide',
                'aliases': ['HCTZ', 'Microzide'],
                'therapeutic_class': 'Thiazide diuretic',
                'mechanism_of_action': 'Inhibits sodium-chloride transporter',
                'description': 'Diuretic and antihypertensive',
                'category': 'Diuretics'
            }
        ]
        
        created_compositions = []
        for comp_data in compositions_data:
            composition, created = Composition.objects.get_or_create(
                name=comp_data['name'],
                defaults={
                    'scientific_name': comp_data['scientific_name'],
                    'aliases': comp_data['aliases'],
                    'therapeutic_class': comp_data['therapeutic_class'],
                    'mechanism_of_action': comp_data['mechanism_of_action'],
                    'description': comp_data['description'],
                    'category': comp_data['category'],
                    'created_by': admin_user
                }
            )
            
            if created:
                created_compositions.append(composition)
                self.stdout.write(f'Created composition: {composition.name}')
            else:
                self.stdout.write(f'Composition already exists: {composition.name}')
        
        # Create sample products with multiple compositions
        self._create_sample_products_with_compositions(admin_user)
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully setup {len(created_compositions)} compositions!')
        )
    
    def _create_sample_products_with_compositions(self, admin_user):
        """Create sample products with multiple compositions"""
        
        # Get or create categories and generic names
        analgesic_category, _ = Category.objects.get_or_create(name='Analgesics')
        antibiotic_category, _ = Category.objects.get_or_create(name='Antibiotics')
        antihypertensive_category, _ = Category.objects.get_or_create(name='Antihypertensives')
        
        paracetamol_generic, _ = GenericName.objects.get_or_create(name='Paracetamol')
        amoxicillin_generic, _ = GenericName.objects.get_or_create(name='Amoxicillin + Clavulanic Acid')
        amlodipine_generic, _ = GenericName.objects.get_or_create(name='Amlodipine + Losartan + HCTZ')
        
        # Get compositions
        paracetamol = Composition.objects.get(name='Paracetamol')
        amoxicillin = Composition.objects.get(name='Amoxicillin')
        clavulanic_acid = Composition.objects.get(name='Clavulanic Acid')
        amlodipine = Composition.objects.get(name='Amlodipine')
        losartan = Composition.objects.get(name='Losartan')
        hctz = Composition.objects.get(name='Hydrochlorothiazide')
        
        # Sample products with multiple compositions
        products_data = [
            {
                'name': 'Crocin 650mg',
                'brand_name': 'Crocin',
                'generic_name': paracetamol_generic,
                'category': analgesic_category,
                'compositions': [
                    {'composition': paracetamol, 'strength': '650', 'unit': 'mg', 'is_primary': True}
                ]
            },
            {
                'name': 'Augmentin 625mg',
                'brand_name': 'Augmentin',
                'generic_name': amoxicillin_generic,
                'category': antibiotic_category,
                'compositions': [
                    {'composition': amoxicillin, 'strength': '500', 'unit': 'mg', 'is_primary': True},
                    {'composition': clavulanic_acid, 'strength': '125', 'unit': 'mg', 'is_primary': False}
                ]
            },
            {
                'name': 'Amlong-H 5/50/12.5mg',
                'brand_name': 'Amlong-H',
                'generic_name': amlodipine_generic,
                'category': antihypertensive_category,
                'compositions': [
                    {'composition': amlodipine, 'strength': '5', 'unit': 'mg', 'is_primary': True},
                    {'composition': losartan, 'strength': '50', 'unit': 'mg', 'is_primary': True},
                    {'composition': hctz, 'strength': '12.5', 'unit': 'mg', 'is_primary': False}
                ]
            }
        ]
        
        for product_data in products_data:
            product, created = Product.objects.get_or_create(
                name=product_data['name'],
                defaults={
                    'brand_name': product_data['brand_name'],
                    'generic_name': product_data['generic_name'],
                    'category': product_data['category'],
                    'manufacturer': 'Sample Pharma Ltd',
                    'price': 100.00,
                    'mrp': 120.00,
                    'stock_quantity': 100,
                    'is_active': True,
                    'is_prescription_required': True
                }
            )
            
            if created:
                self.stdout.write(f'Created product: {product.name}')
                
                # Add compositions
                for comp_data in product_data['compositions']:
                    ProductComposition.objects.create(
                        product=product,
                        composition=comp_data['composition'],
                        strength=comp_data['strength'],
                        unit=comp_data['unit'],
                        is_primary=comp_data['is_primary'],
                        is_active=True
                    )
                    self.stdout.write(f'  Added composition: {comp_data["composition"].name} {comp_data["strength"]}{comp_data["unit"]}')
            else:
                self.stdout.write(f'Product already exists: {product.name}')
