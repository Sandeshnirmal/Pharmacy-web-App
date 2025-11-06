import os
import sys
from datetime import date
from decimal import Decimal

# Management commands automatically handle the Django setup, so we don't need:
# import django
# django.setup()

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db import transaction

# Corrected model import based on your directory structure:
# 'product' is an app in your main project folder (/app)
from product.models import Product, Composition, GenericName, Category, ProductComposition, Batch

User = get_user_model()

# --- Utility Functions (Corrected to use 'email' instead of 'username') ---

def create_superuser(stdout):
    """Create a superuser if it doesn't exist, checking by email."""
    superuser_email = 'admin@example.com'
    superuser_password = 'admin123'
    
    try:
        # Check if the user exists using the correct unique field (email)
        if not User.objects.filter(email=superuser_email).exists():
            
            # Assuming your Custom User Model uses 'email' as the unique identifier (USERNAME_FIELD):
            User.objects.create_superuser(
                email=superuser_email, 
                password=superuser_password,
                # Include mandatory fields based on your custom user model (e.g., first_name, phone_number)
                first_name='Admin', 
                last_name='User', 
                phone_number='0000000000'
            )
            stdout.write(f"✅ Superuser '{superuser_email}' created successfully.")
        else:
            stdout.write(f"ℹ️ Superuser '{superuser_email}' already exists.")
    except Exception as e:
        # This will be caught by the outer handle method and printed as an error
        stdout.write(CommandError(f"❌ Error creating superuser: {e}"))

def insert_product_data(products_data, stdout):
    """Inserts all product, composition, category, and batch data within a transaction."""
    
    try:
        # Get the default user using the correct field (email)
        default_user = User.objects.get(email='admin@example.com')
    except User.DoesNotExist:
        stdout.write(CommandError("❌ Error: Superuser 'admin@example.com' not found. Data insertion aborted. Run migrations and create a user first."))
        return

    stdout.write(f"\nProcessing {len(products_data)} products...")

    with transaction.atomic():
        for row_data in products_data:
            product_name = row_data.get('product_name')
            stdout.write(f"-> Processing product: {product_name}")

            try:
                # 1. Get or create GenericName, Category, Composition
                generic_name_obj, _ = GenericName.objects.get_or_create(
                    name=row_data['generic_name'],
                    defaults={'description': f"Generic name for {row_data['generic_name']}"}
                )

                category_obj, _ = Category.objects.get_or_create(
                    name=row_data['category_name'],
                    defaults={'description': f"Category for {row_data['category_name']}"}
                )

                composition_obj, _ = Composition.objects.get_or_create(
                    name=row_data['composition_name'],
                    defaults={'description': f"Composition: {row_data['composition_name']}", 'created_by': default_user}
                )

                # 2. Create or update Product
                product_defaults = {
                    'brand_name': row_data['brand_name'], 'generic_name': generic_name_obj, 'manufacturer': row_data['manufacturer'],
                    'medicine_type': row_data['medicine_type'], 'prescription_type': row_data['prescription_type'],
                    'strength': row_data['strength'], 'form': row_data['form'],
                    'min_stock_level': int(row_data['min_stock_level']), 'dosage_form': row_data['dosage_form'],
                    'pack_size': row_data['pack_size'], 'packaging_unit': row_data['packaging_unit'],
                    'description': row_data['description'], 'uses': row_data['uses'], 'side_effects': row_data['side_effects'],
                    'how_to_use': row_data['how_to_use'], 'precautions': row_data['precautions'], 'storage': row_data['storage'],
                    'image_url': row_data['image_url'], 'hsn_code': row_data['hsn_code'], 'category': category_obj,
                    'is_featured': row_data['is_featured'].lower() == 'true',
                    'is_prescription_required': row_data['prescription_type'].lower() == 'rx',
                    'created_by': default_user,
                }
                
                product, created = Product.objects.update_or_create(
                    name=product_name,
                    manufacturer=row_data['manufacturer'],
                    dosage_form=row_data['dosage_form'],
                    defaults=product_defaults
                )

                stdout.write(f"   -> Product {'Created' if created else 'Updated'}: {product.name}")

                # 3. Create ProductComposition
                ProductComposition.objects.update_or_create(
                    product=product,
                    composition=composition_obj,
                    defaults={
                        'strength': row_data['composition_strength'], 'unit': row_data['composition_unit'],
                        'percentage': Decimal(row_data['composition_percentage']),
                        'is_primary': row_data['composition_is_primary'].lower() == 'true',
                    }
                )

                # 4. Create Batch
                mrp = Decimal(row_data['mrp_price'])
                discount = Decimal(row_data['discount_percentage'])
                selling_price = mrp * (1 - discount / 100)

                Batch.objects.update_or_create(
                    product=product,
                    batch_number=row_data['batch_number'],
                    defaults={
                        'manufacturing_date': row_data['manufacturing_date'], 'expiry_date': row_data['expiry_date'],
                        'quantity': int(row_data['quantity']), 'current_quantity': int(row_data['quantity']),
                        'mrp_price': mrp, 'discount_percentage': discount, 'selling_price': selling_price,
                        'online_mrp_price': mrp, 'online_discount_percentage': discount, 'online_selling_price': selling_price,
                        'offline_mrp_price': mrp, 'offline_discount_percentage': discount, 'offline_selling_price': selling_price,
                    }
                )
                stdout.write(f"   -> Successfully added/updated batch: {row_data['batch_number']}")

            except Exception as e:
                # If any product fails, we raise a CommandError to stop the process and show the issue
                stdout.write(f"❌ Error inserting data for product {product_name}: {e}")
                raise CommandError(f"Seeding failed on product {product_name}: {e}")
                
        stdout.write("\n✅ All data successfully inserted.")

# --- Product Data (This list is unchanged) ---
products_to_insert = [
    # Products from images (Original 4)
    {
        'product_name': 'IndiNature Ayurvedic Hair Oil Ideal For Men & Women | 100% Ayurvedic Medicinal Oil for Hair Strength & Shine | Power of 27 Ingredients With Bhringraj, Neem, Amla & Coconut Oil | Chemical-Free | 100 ml (I)',
        'brand_name': 'IndiNature', 'generic_name': 'Ayurvedic Hair Oil', 'manufacturer': 'IndiNature Labs',
        'medicine_type': 'Ayurvedic', 'prescription_type': 'OTC', 'strength': '100 ml', 'form': 'Oil',
        'min_stock_level': 5, 'dosage_form': 'Topical', 'pack_size': '1', 'packaging_unit': 'Bottle',
        'description': '100% Ayurvedic Medicinal Oil for Hair Strength & Shine. Power of 27 Ingredients With Bhringraj, Neem, Amla & Coconut Oil. Chemical-Free.',
        'uses': 'Hair strength, shine, and scalp nourishment.', 'side_effects': 'None reported.',
        'how_to_use': 'Apply to scalp and hair, massage gently.', 'precautions': 'For external use only.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/indinature_hair_oil.jpg',
        'hsn_code': '33059090', 'category_name': 'Hair Care', 'is_featured': 'true',
        'composition_name': 'Bhringraj, Neem, Amla, Coconut Oil', 'composition_strength': 'N/A',
        'composition_unit': 'N/A', 'composition_percentage': '100.0', 'composition_is_primary': 'true',
        'batch_number': 'INH001', 'manufacturing_date': date(2023, 1, 1), 'expiry_date': date(2025, 12, 31),
        'quantity': 15, 'mrp_price': '290.00', 'discount_percentage': '0.0',
    },
    {
        'product_name': 'Ayurvedic Cleanser/Shampoo | Best For Dandruff & Lice Control | Power of 6 Ingredients - Reetha, Neem & Bhringraj | Shampoo for Men & Women | All Hair Types, 200 ml (I)',
        'brand_name': 'VedaMe', 'generic_name': 'Ayurvedic Shampoo', 'manufacturer': 'VedaMe Organics',
        'medicine_type': 'Ayurvedic', 'prescription_type': 'OTC', 'strength': '200 ml', 'form': 'Liquid',
        'min_stock_level': 5, 'dosage_form': 'Topical', 'pack_size': '1', 'packaging_unit': 'Bottle',
        'description': 'Best For Dandruff & Lice Control. Power of 6 Ingredients - Reetha, Neem & Bhringraj. Shampoo for Men & Women. All Hair Types.',
        'uses': 'Dandruff control, lice prevention, hair cleansing.', 'side_effects': 'None reported.',
        'how_to_use': 'Apply to wet hair, lather, rinse thoroughly.', 'precautions': 'Avoid contact with eyes.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/vedame_shampoo.jpg',
        'hsn_code': '33051090', 'category_name': 'Hair Care', 'is_featured': 'true',
        'composition_name': 'Reetha, Neem, Bhringraj', 'composition_strength': 'N/A', 'composition_unit': 'N/A',
        'composition_percentage': '100.0', 'composition_is_primary': 'true', 'batch_number': 'VMS002',
        'manufacturing_date': date(2023, 2, 1), 'expiry_date': date(2025, 11, 30), 'quantity': 15,
        'mrp_price': '290.00', 'discount_percentage': '0.0',
    },
    {
        'product_name': 'Pain Relief Oil Roll-On (2*50ml) 100 ml | Powerful Ayurvedic Ingredients for Joint, Muscle, Knee & Back Pain | Fast-Absorbing, Cooling Relief for Shoulder & Arthritis Pain | FDA Approved | Value Pack (Pack of 2)',
        'brand_name': 'Regain', 'generic_name': 'Pain Relief Oil', 'manufacturer': 'Regain Pharma',
        'medicine_type': 'Ayurvedic', 'prescription_type': 'OTC', 'strength': '100 ml (2x50ml)', 'form': 'Oil',
        'min_stock_level': 5, 'dosage_form': 'Topical', 'pack_size': '2', 'packaging_unit': 'Roll-On Bottle',
        'description': 'Powerful Ayurvedic Ingredients for Joint, Muscle, Knee & Back Pain. Fast-Absorbing, Cooling Relief for Shoulder & Arthritis Pain. FDA Approved. Value Pack (Pack of 2).',
        'uses': 'Relief from joint pain, muscle pain, back pain, arthritis.', 'side_effects': 'None reported.',
        'how_to_use': 'Roll on affected area, massage gently.', 'precautions': 'For external use only. Do not apply on broken skin.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/regain_pain_oil.jpg',
        'hsn_code': '30049011', 'category_name': 'Pain Relief', 'is_featured': 'true',
        'composition_name': 'Menthol, Camphor, Eucalyptus Oil', 'composition_strength': 'N/A', 'composition_unit': 'N/A',
        'composition_percentage': '100.0', 'composition_is_primary': 'true', 'batch_number': 'RPO003',
        'manufacturing_date': date(2023, 3, 1), 'expiry_date': date(2025, 10, 31), 'quantity': 15,
        'mrp_price': '458.00', 'discount_percentage': '0.0',
    },
    {
        'product_name': 'NutraCeutical Hair Supplement | Power of 34 Ingredients with Biotin, Beet Root, Amla, Grape Seed Extract | For Stronger Hair, Boosts Growth, Nourishes Scalp | 30 Tablets | 100% Vegan (1)',
        'brand_name': 'NutraCeutical', 'generic_name': 'Hair Supplement', 'manufacturer': 'NutraCeutical Health',
        'medicine_type': 'Nutraceutical', 'prescription_type': 'OTC', 'strength': '30 Tablets', 'form': 'Tablet',
        'min_stock_level': 5, 'dosage_form': 'Oral', 'pack_size': '1', 'packaging_unit': 'Bottle',
        'description': 'Power of 34 Ingredients with Biotin, Beet Root, Amla, Grape Seed Extract. For Stronger Hair, Boosts Growth, Nourishes Scalp. 30 Tablets. 100% Vegan.',
        'uses': 'Hair growth, hair strength, scalp nourishment.', 'side_effects': 'None reported.',
        'how_to_use': 'Take one tablet daily after meals.', 'precautions': 'Consult physician if pregnant or lactating.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/nutraceutical_hair_supplement.jpg',
        'hsn_code': '21069099', 'category_name': 'Supplements', 'is_featured': 'true',
        'composition_name': 'Biotin, Beet Root, Amla, Grape Seed Extract', 'composition_strength': 'N/A',
        'composition_unit': 'N/A', 'composition_percentage': '100.0', 'composition_is_primary': 'true',
        'batch_number': 'NHS004', 'manufacturing_date': date(2023, 4, 1), 'expiry_date': date(2025, 9, 30),
        'quantity': 15, 'mrp_price': '395.00', 'discount_percentage': '0.0',
    },
    # Additional 15 generic products (Completed Data)
    {
        'product_name': 'Generic Pain Reliever 1',
        'brand_name': 'Generic Pharma', 'generic_name': 'Pain Reliever', 'manufacturer': 'Generic Meds Inc.',
        'medicine_type': 'Allopathic', 'prescription_type': 'OTC', 'strength': '500 mg', 'form': 'Tablet',
        'min_stock_level': 5, 'dosage_form': 'Oral', 'pack_size': '10', 'packaging_unit': 'Strip',
        'description': 'Fast-acting pain relief for headaches and body aches.',
        'uses': 'Relief from mild to moderate pain.', 'side_effects': 'May cause drowsiness.',
        'how_to_use': 'Take one tablet with water every 4-6 hours.', 'precautions': 'Do not exceed recommended dosage.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/generic_pain_reliever1.jpg',
        'hsn_code': '30049099', 'category_name': 'Pain Relief', 'is_featured': 'false',
        'composition_name': 'Paracetamol', 'composition_strength': '500', 'composition_unit': 'mg',
        'composition_percentage': '100.0', 'composition_is_primary': 'true', 'batch_number': 'GPR001',
        'manufacturing_date': date(2023, 5, 1), 'expiry_date': date(2025, 8, 31), 'quantity': 15,
        'mrp_price': '25.00', 'discount_percentage': '0.0',
    },
    {
        'product_name': 'Generic Cough Syrup 2',
        'brand_name': 'Health Aid', 'generic_name': 'Cough Suppressant', 'manufacturer': 'Health Aid Pharma',
        'medicine_type': 'Allopathic', 'prescription_type': 'OTC', 'strength': '100 ml', 'form': 'Syrup',
        'min_stock_level': 5, 'dosage_form': 'Oral', 'pack_size': '1', 'packaging_unit': 'Bottle',
        'description': 'Effective relief from dry cough and throat irritation.',
        'uses': 'Suppresses cough, soothes throat.', 'side_effects': 'May cause drowsiness.',
        'how_to_use': 'Take 10ml three times a day.', 'precautions': 'Consult doctor if cough persists.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/generic_cough_syrup2.jpg',
        'hsn_code': '30049087', 'category_name': 'Cough & Cold', 'is_featured': 'false',
        'composition_name': 'Dextromethorphan', 'composition_strength': '15', 'composition_unit': 'mg/5ml',
        'composition_percentage': '100.0', 'composition_is_primary': 'true', 'batch_number': 'GCS002',
        'manufacturing_date': date(2023, 6, 1), 'expiry_date': date(2025, 7, 31), 'quantity': 15,
        'mrp_price': '80.00', 'discount_percentage': '0.0',
    },
    {
        'product_name': 'Generic Antacid Liquid 3',
        'brand_name': 'Stomach Soothe', 'generic_name': 'Antacid', 'manufacturer': 'Stomach Soothe Labs',
        'medicine_type': 'Allopathic', 'prescription_type': 'OTC', 'strength': '200 ml', 'form': 'Liquid',
        'min_stock_level': 5, 'dosage_form': 'Oral', 'pack_size': '1', 'packaging_unit': 'Bottle',
        'description': 'Quick relief from acidity and heartburn.',
        'uses': 'Relief from indigestion, heartburn, and sour stomach.', 'side_effects': 'May cause constipation.',
        'how_to_use': 'Take 10ml after meals or as directed by physician.', 'precautions': 'Shake well before use.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/generic_antacid_liquid3.jpg',
        'hsn_code': '30049079', 'category_name': 'Digestive Health', 'is_featured': 'false',
        'composition_name': 'Magnesium Hydroxide, Aluminum Hydroxide', 'composition_strength': 'N/A',
        'composition_unit': 'N/A', 'composition_percentage': '100.0', 'composition_is_primary': 'true',
        'batch_number': 'GAL003',
        'manufacturing_date': date(2023, 7, 1), 'expiry_date': date(2025, 6, 30), 'quantity': 15,
        'mrp_price': '120.00', 'discount_percentage': '0.0',
    },
    {
        'product_name': 'Generic Multivitamin Tablet 4',
        'brand_name': 'VitaBoost', 'generic_name': 'Multivitamin', 'manufacturer': 'VitaBoost Health',
        'medicine_type': 'Nutraceutical', 'prescription_type': 'OTC', 'strength': '30 Tablets', 'form': 'Tablet',
        'min_stock_level': 5, 'dosage_form': 'Oral', 'pack_size': '1', 'packaging_unit': 'Bottle',
        'description': 'Daily supplement for overall health and well-being.',
        'uses': 'Dietary supplement, boosts immunity.', 'side_effects': 'None reported.',
        'how_to_use': 'Take one tablet daily after meals.', 'precautions': 'Do not exceed recommended dosage.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/generic_multivitamin_tablet4.jpg',
        'hsn_code': '21069099', 'category_name': 'Supplements', 'is_featured': 'false',
        'composition_name': 'Vitamins A, B, C, D, E, Zinc', 'composition_strength': 'N/A', 'composition_unit': 'N/A',
        'composition_percentage': '100.0', 'composition_is_primary': 'true', 'batch_number': 'GMT004',
        'manufacturing_date': date(2023, 8, 1), 'expiry_date': date(2025, 5, 31), 'quantity': 15,
        'mrp_price': '180.00', 'discount_percentage': '0.0',
    },
    {
        'product_name': 'Generic Antiseptic Cream 5',
        'brand_name': 'HealFast', 'generic_name': 'Antiseptic', 'manufacturer': 'HealFast Solutions',
        'medicine_type': 'Allopathic', 'prescription_type': 'OTC', 'strength': '20 gm', 'form': 'Cream',
        'min_stock_level': 5, 'dosage_form': 'Topical', 'pack_size': '1', 'packaging_unit': 'Tube',
        'description': 'For cuts, wounds, and minor skin infections.',
        'uses': 'Antiseptic for minor cuts and wounds.', 'side_effects': 'May cause mild irritation.',
        'how_to_use': 'Apply a thin layer on the affected area twice daily.', 'precautions': 'For external use only.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/generic_antiseptic_cream5.jpg',
        'hsn_code': '30049069', 'category_name': 'First Aid', 'is_featured': 'false',
        'composition_name': 'Povidone-iodine', 'composition_strength': '10', 'composition_unit': '%',
        'composition_percentage': '100.0', 'composition_is_primary': 'true', 'batch_number': 'GAC005',
        'manufacturing_date': date(2023, 9, 1), 'expiry_date': date(2025, 4, 30), 'quantity': 15,
        'mrp_price': '50.00', 'discount_percentage': '0.0',
    },
    {
        'product_name': 'Generic Eye Drops 6',
        'brand_name': 'ClearSight', 'generic_name': 'Eye Drops', 'manufacturer': 'ClearSight Pharma',
        'medicine_type': 'Allopathic', 'prescription_type': 'OTC', 'strength': '10 ml', 'form': 'Liquid',
        'min_stock_level': 5, 'dosage_form': 'Ophthalmic', 'pack_size': '1', 'packaging_unit': 'Bottle',
        'description': 'Relieves dry eyes and irritation.',
        'uses': 'Lubricates and moisturizes eyes.', 'side_effects': 'Temporary blurring of vision.',
        'how_to_use': 'Instill 1-2 drops in each eye as needed.', 'precautions': 'Do not touch dropper tip to any surface.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/generic_eye_drops6.jpg',
        'hsn_code': '30049059', 'category_name': 'Eye Care', 'is_featured': 'false',
        'composition_name': 'Carboxymethylcellulose', 'composition_strength': '0.5', 'composition_unit': '%',
        'composition_percentage': '100.0', 'composition_is_primary': 'true', 'batch_number': 'GED006',
        'manufacturing_date': date(2023, 10, 1), 'expiry_date': date(2025, 3, 31), 'quantity': 15,
        'mrp_price': '90.00', 'discount_percentage': '0.0',
    },
    {
        'product_name': 'Generic Nasal Spray 7',
        'brand_name': 'BreatheEasy', 'generic_name': 'Nasal Decongestant', 'manufacturer': 'BreatheEasy Solutions',
        'medicine_type': 'Allopathic', 'prescription_type': 'OTC', 'strength': '10 ml', 'form': 'Spray',
        'min_stock_level': 5, 'dosage_form': 'Nasal', 'pack_size': '1', 'packaging_unit': 'Bottle',
        'description': 'Relieves nasal congestion due to colds or allergies.',
        'uses': 'Nasal decongestion.', 'side_effects': 'Temporary burning, stinging, dryness in the nose.',
        'how_to_use': 'Spray once or twice in each nostril every 10-12 hours.', 'precautions': 'Do not use for more than 3 days.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/generic_nasal_spray7.jpg',
        'hsn_code': '30049049', 'category_name': 'Cough & Cold', 'is_featured': 'false',
        'composition_name': 'Oxymetazoline', 'composition_strength': '0.05', 'composition_unit': '%',
        'composition_percentage': '100.0', 'composition_is_primary': 'true', 'batch_number': 'GNS007',
        'manufacturing_date': date(2023, 11, 1), 'expiry_date': date(2025, 2, 28), 'quantity': 15,
        'mrp_price': '70.00', 'discount_percentage': '0.0',
    },
    {
        'product_name': 'Generic Oral Rehydration Salts 8',
        'brand_name': 'Rehydrate', 'generic_name': 'ORS', 'manufacturer': 'Rehydrate Solutions',
        'medicine_type': 'Allopathic', 'prescription_type': 'OTC', 'strength': '21.8 gm', 'form': 'Powder',
        'min_stock_level': 5, 'dosage_form': 'Oral', 'pack_size': '1', 'packaging_unit': 'Sachet',
        'description': 'Restores body fluids and electrolytes lost due to dehydration.',
        'uses': 'Treatment of dehydration.', 'side_effects': 'None reported.',
        'how_to_use': 'Mix contents of sachet in 1 liter of water and consume.', 'precautions': 'Use with caution in patients with kidney problems.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/generic_ors8.jpg',
        'hsn_code': '30049039', 'category_name': 'Digestive Health', 'is_featured': 'false',
        'composition_name': 'Sodium Chloride, Potassium Chloride, Glucose', 'composition_strength': 'N/A',
        'composition_unit': 'N/A', 'composition_percentage': '100.0', 'composition_is_primary': 'true',
        'batch_number': 'GORS008',
        'manufacturing_date': date(2023, 12, 1), 'expiry_date': date(2025, 1, 31), 'quantity': 15,
        'mrp_price': '20.00', 'discount_percentage': '0.0',
    },
    {
        'product_name': 'Generic Vitamin C Tablet 9',
        'brand_name': 'ImmunoBoost', 'generic_name': 'Vitamin C', 'manufacturer': 'ImmunoBoost Health',
        'medicine_type': 'Nutraceutical', 'prescription_type': 'OTC', 'strength': '500 mg', 'form': 'Tablet',
        'min_stock_level': 5, 'dosage_form': 'Oral', 'pack_size': '10', 'packaging_unit': 'Strip',
        'description': 'Boosts immunity and acts as an antioxidant.',
        'uses': 'Immunity booster, antioxidant.', 'side_effects': 'None reported.',
        'how_to_use': 'Take one tablet daily after meals.', 'precautions': 'Do not exceed recommended dosage.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/generic_vitamin_c9.jpg',
        'hsn_code': '21069099', 'category_name': 'Supplements', 'is_featured': 'false',
        'composition_name': 'Ascorbic Acid', 'composition_strength': '500', 'composition_unit': 'mg',
        'composition_percentage': '100.0', 'composition_is_primary': 'true', 'batch_number': 'GVCT009',
        'manufacturing_date': date(2024, 1, 1), 'expiry_date': date(2026, 12, 31), 'quantity': 15,
        'mrp_price': '40.00', 'discount_percentage': '0.0',
    },
    {
        'product_name': 'Generic Hand Sanitizer 10',
        'brand_name': 'CleanHands', 'generic_name': 'Hand Sanitizer', 'manufacturer': 'CleanHands Hygiene',
        'medicine_type': 'General', 'prescription_type': 'OTC', 'strength': '100 ml', 'form': 'Gel',
        'min_stock_level': 5, 'dosage_form': 'Topical', 'pack_size': '1', 'packaging_unit': 'Bottle',
        'description': 'Kills 99.9% of germs without water.',
        'uses': 'Hand hygiene.', 'side_effects': 'May cause skin dryness.',
        'how_to_use': 'Apply a small amount to palms and rub thoroughly.', 'precautions': 'Flammable. Keep away from fire.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/generic_hand_sanitizer10.jpg',
        'hsn_code': '34022090', 'category_name': 'Hygiene', 'is_featured': 'false',
        'composition_name': 'Ethyl Alcohol', 'composition_strength': '70', 'composition_unit': '%',
        'composition_percentage': '100.0', 'composition_is_primary': 'true', 'batch_number': 'GHS010',
        'manufacturing_date': date(2024, 2, 1), 'expiry_date': date(2026, 11, 30), 'quantity': 15,
        'mrp_price': '60.00', 'discount_percentage': '0.0',
    },
    {
        'product_name': 'Generic Pain Balm 11',
        'brand_name': 'Relief Balm', 'generic_name': 'Pain Balm', 'manufacturer': 'Relief Pharma',
        'medicine_type': 'Ayurvedic', 'prescription_type': 'OTC', 'strength': '25 gm', 'form': 'Balm',
        'min_stock_level': 5, 'dosage_form': 'Topical', 'pack_size': '1', 'packaging_unit': 'Jar',
        'description': 'Provides quick relief from headaches and body pains.',
        'uses': 'Relief from headaches, muscle pain, joint pain.', 'side_effects': 'May cause mild irritation.',
        'how_to_use': 'Apply on affected area and gently massage.', 'precautions': 'For external use only.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/generic_pain_balm11.jpg',
        'hsn_code': '30049011', 'category_name': 'Pain Relief', 'is_featured': 'false',
        'composition_name': 'Menthol, Camphor, Wintergreen Oil', 'composition_strength': 'N/A', 'composition_unit': 'N/A',
        'composition_percentage': '100.0', 'composition_is_primary': 'true', 'batch_number': 'GPB011',
        'manufacturing_date': date(2024, 3, 1), 'expiry_date': date(2026, 10, 31), 'quantity': 15,
        'mrp_price': '35.00', 'discount_percentage': '0.0',
    },
    {
        'product_name': 'Generic Digestive Enzyme 12',
        'brand_name': 'DigestiCare', 'generic_name': 'Digestive Enzyme', 'manufacturer': 'DigestiCare Health',
        'medicine_type': 'Nutraceutical', 'prescription_type': 'OTC', 'strength': '10 Tablets', 'form': 'Tablet',
        'min_stock_level': 5, 'dosage_form': 'Oral', 'pack_size': '1', 'packaging_unit': 'Strip',
        'description': 'Aids in digestion and reduces bloating.',
        'uses': 'Improves digestion, reduces bloating and gas.', 'side_effects': 'None reported.',
        'how_to_use': 'Take one tablet after heavy meals.', 'precautions': 'Consult physician if pregnant or lactating.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/generic_digestive_enzyme12.jpg',
        'hsn_code': '21069099', 'category_name': 'Digestive Health', 'is_featured': 'false',
        'composition_name': 'Papain, Fungal Diastase', 'composition_strength': 'N/A', 'composition_unit': 'N/A',
        'composition_percentage': '100.0', 'composition_is_primary': 'true', 'batch_number': 'GDE012',
        'manufacturing_date': date(2024, 4, 1), 'expiry_date': date(2026, 9, 30), 'quantity': 15,
        'mrp_price': '75.00', 'discount_percentage': '0.0',
    },
    {
        'product_name': 'Generic Calcium Supplement 13',
        'brand_name': 'BoneStrong', 'generic_name': 'Calcium', 'manufacturer': 'BoneStrong Health',
        'medicine_type': 'Nutraceutical', 'prescription_type': 'OTC', 'strength': '30 Tablets', 'form': 'Tablet',
        'min_stock_level': 5, 'dosage_form': 'Oral', 'pack_size': '1', 'packaging_unit': 'Bottle',
        'description': 'Helps maintain strong bones and healthy muscle function.',
        'uses': 'Bone health, calcium deficiency.', 'side_effects': 'May cause mild stomach upset.',
        'how_to_use': 'Take one tablet daily with food.', 'precautions': 'Consult physician before use.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/generic_calcium_13.jpg',
        'hsn_code': '21069099', 'category_name': 'Supplements', 'is_featured': 'false',
        'composition_name': 'Calcium Carbonate, Vitamin D3', 'composition_strength': 'N/A', 'composition_unit': 'N/A',
        'composition_percentage': '100.0', 'composition_is_primary': 'true', 'batch_number': 'GCS013',
        'manufacturing_date': date(2024, 5, 1), 'expiry_date': date(2026, 8, 31), 'quantity': 15,
        'mrp_price': '150.00', 'discount_percentage': '0.0',
    },
    {
        'product_name': 'Generic Throat Lozenge 14',
        'brand_name': 'SootheThroat', 'generic_name': 'Throat Lozenge', 'manufacturer': 'SootheThroat Pharma',
        'medicine_type': 'Allopathic', 'prescription_type': 'OTC', 'strength': '10 Lozenges', 'form': 'Lozenge',
        'min_stock_level': 5, 'dosage_form': 'Oral', 'pack_size': '1', 'packaging_unit': 'Strip',
        'description': 'Provides temporary relief from sore throat pain and irritation.',
        'uses': 'Sore throat, cough relief.', 'side_effects': 'Numbness in mouth/throat.',
        'how_to_use': 'Dissolve one lozenge slowly in the mouth every 2 hours.', 'precautions': 'Keep out of reach of children.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/generic_lozenge_14.jpg',
        'hsn_code': '30049089', 'category_name': 'Cough & Cold', 'is_featured': 'false',
        'composition_name': 'Menthol, Dichlorobenzyl Alcohol', 'composition_strength': 'N/A', 'composition_unit': 'N/A',
        'composition_percentage': '100.0', 'composition_is_primary': 'true', 'batch_number': 'GTL014',
        'manufacturing_date': date(2024, 6, 1), 'expiry_date': date(2026, 7, 31), 'quantity': 15,
        'mrp_price': '30.00', 'discount_percentage': '0.0',
    },
    {
        'product_name': 'Generic First Aid Bandages 15',
        'brand_name': 'CareStrip', 'generic_name': 'Adhesive Bandages', 'manufacturer': 'CareStrip Health',
        'medicine_type': 'General', 'prescription_type': 'OTC', 'strength': '10 Strips', 'form': 'Strip',
        'min_stock_level': 5, 'dosage_form': 'Topical', 'pack_size': '1', 'packaging_unit': 'Box',
        'description': 'Sterile, flexible bandages for minor cuts and scrapes.',
        'uses': 'Protects minor wounds.', 'side_effects': 'May cause allergic reaction in sensitive skin.',
        'how_to_use': 'Apply to clean, dry skin.', 'precautions': 'Change daily.',
        'storage': 'Store in a cool, dry place.', 'image_url': 'https://example.com/generic_bandage_15.jpg',
        'hsn_code': '30051010', 'category_name': 'First Aid', 'is_featured': 'false',
        'composition_name': 'N/A', 'composition_strength': 'N/A', 'composition_unit': 'N/A',
        'composition_percentage': '0.0', 'composition_is_primary': 'false', 'batch_number': 'GFAB015',
        'manufacturing_date': date(2024, 7, 1), 'expiry_date': date(2029, 7, 31), 'quantity': 15,
        'mrp_price': '20.00', 'discount_percentage': '0.0',
    },
]

class Command(BaseCommand):
    help = 'Seeds the database with initial Superuser (using email) and Product data.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("🚀 Starting database seeding process..."))
        
        # 1. Create superuser first (needed for created_by fields)
        create_superuser(self.stdout)
        
        # 2. Insert all product data
        insert_product_data(products_to_insert, self.stdout)
