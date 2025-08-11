from django.core.management.base import BaseCommand
from courier.models import CourierPartner, CourierServiceArea, CourierRateCard

class Command(BaseCommand):
    help = 'Setup initial courier data'

    def handle(self, *args, **options):
        # Create Professional Courier Partner
        courier_partner, created = CourierPartner.objects.get_or_create(
            courier_type='professional',
            defaults={
                'name': 'Professional Courier Services',
                'api_endpoint': 'https://api.professionalcourier.com/v1/',
                'api_key': 'demo_api_key_12345',
                'api_secret': 'demo_secret_67890',
                'is_active': True,
                'service_areas': ['560001', '560002', '560003', '560004', '560005'],
                'pricing_config': {
                    'base_rate': 50.0,
                    'cod_percentage': 2.0,
                    'fuel_surcharge': 5.0
                }
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Created courier partner: {courier_partner.name}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Courier partner already exists: {courier_partner.name}')
            )

        # Create service areas
        service_areas = [
            {'pincode': '560001', 'city': 'Bangalore', 'state': 'Karnataka'},
            {'pincode': '560002', 'city': 'Bangalore', 'state': 'Karnataka'},
            {'pincode': '560003', 'city': 'Bangalore', 'state': 'Karnataka'},
            {'pincode': '560004', 'city': 'Bangalore', 'state': 'Karnataka'},
            {'pincode': '560005', 'city': 'Bangalore', 'state': 'Karnataka'},
            {'pincode': '110001', 'city': 'New Delhi', 'state': 'Delhi'},
            {'pincode': '400001', 'city': 'Mumbai', 'state': 'Maharashtra'},
            {'pincode': '600001', 'city': 'Chennai', 'state': 'Tamil Nadu'},
            {'pincode': '700001', 'city': 'Kolkata', 'state': 'West Bengal'},
            {'pincode': '500001', 'city': 'Hyderabad', 'state': 'Telangana'},
        ]

        for area_data in service_areas:
            area, created = CourierServiceArea.objects.get_or_create(
                courier_partner=courier_partner,
                pincode=area_data['pincode'],
                defaults={
                    'city': area_data['city'],
                    'state': area_data['state'],
                    'is_cod_available': True,
                    'is_express_available': True,
                    'standard_delivery_days': 3,
                    'express_delivery_days': 1
                }
            )
            
            if created:
                self.stdout.write(f'Created service area: {area.city} ({area.pincode})')

        # Create rate cards
        rate_cards = [
            {
                'zone': 'Local',
                'weight_slab_start': 0.0,
                'weight_slab_end': 1.0,
                'rate_per_kg': 50.0,
                'minimum_charge': 50.0
            },
            {
                'zone': 'Local',
                'weight_slab_start': 1.0,
                'weight_slab_end': 5.0,
                'rate_per_kg': 40.0,
                'minimum_charge': 50.0
            },
            {
                'zone': 'Metro',
                'weight_slab_start': 0.0,
                'weight_slab_end': 1.0,
                'rate_per_kg': 75.0,
                'minimum_charge': 75.0
            },
            {
                'zone': 'Metro',
                'weight_slab_start': 1.0,
                'weight_slab_end': 5.0,
                'rate_per_kg': 60.0,
                'minimum_charge': 75.0
            },
            {
                'zone': 'Rest of India',
                'weight_slab_start': 0.0,
                'weight_slab_end': 1.0,
                'rate_per_kg': 100.0,
                'minimum_charge': 100.0
            },
            {
                'zone': 'Rest of India',
                'weight_slab_start': 1.0,
                'weight_slab_end': 5.0,
                'rate_per_kg': 80.0,
                'minimum_charge': 100.0
            }
        ]

        for rate_data in rate_cards:
            rate, created = CourierRateCard.objects.get_or_create(
                courier_partner=courier_partner,
                zone=rate_data['zone'],
                weight_slab_start=rate_data['weight_slab_start'],
                weight_slab_end=rate_data['weight_slab_end'],
                defaults={
                    'rate_per_kg': rate_data['rate_per_kg'],
                    'minimum_charge': rate_data['minimum_charge'],
                    'cod_percentage': 2.0,
                    'fuel_surcharge_percentage': 5.0
                }
            )
            
            if created:
                self.stdout.write(f'Created rate card: {rate.zone} ({rate.weight_slab_start}-{rate.weight_slab_end}kg)')

        self.stdout.write(
            self.style.SUCCESS('Successfully setup courier data!')
        )
