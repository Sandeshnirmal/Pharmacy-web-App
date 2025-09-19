# courier/management/commands/sync_tpc_pincodes.py
import requests
import json
import csv
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from courier.models import TPCServiceableArea
from courier.services import TPCCourierService 
import logging
import time

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    """
    A Django management command to synchronize serviceable pincodes 
    from a source (e.g., a CSV file) with the TPC API and store them
    in the local database.
    """
    help = 'Synchronizes TPC serviceable pincodes and area names from TPC API.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--source-file',
            type=str,
            help='Path to a CSV file containing a list of pincodes to check.',
            default='data/indian_pincodes.csv' # Assumes a data folder with a CSV file
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting TPC serviceable area synchronization...'))
        
        # Initialize the TPC service
        try:
            tpc_service = TPCCourierService() 
        except ValueError as e:
            self.stderr.write(self.style.ERROR(f"TPC Service initialization failed: {e}"))
            return

        pincode_source_file = options['source_file']
        pincodes_to_check = []
        
        try:
            with open(pincode_source_file, 'r') as f:
                reader = csv.reader(f)
                # Assuming the CSV has a header and pincodes are in the first column
                next(reader, None) 
                for row in reader:
                    pincodes_to_check.append(row[0].strip())
        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"Pincode source file not found at: {pincode_source_file}"))
            return
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error reading pincode source file: {e}"))
            return
            
        total_pincodes = len(pincodes_to_check)
        self.stdout.write(f"Found {total_pincodes} pincodes to check.")

        # Process pincodes in batches to manage API rate limits
        batch_size = 50 
        for i in range(0, total_pincodes, batch_size):
            pincode_batch = pincodes_to_check[i:i + batch_size]
            
            for pincode in pincode_batch:
                try:
                    # Note: We are assuming the TPC API has a `check_pincode_service`
                    # method that returns serviceability and location info.
                    response = tpc_service.check_pincode_service(pincode)
                    
                    if response and response.get('status') == 'success':
                        city = response.get('city', 'Unknown')
                        state = response.get('state', 'Unknown')
                        is_serviceable = True
                        
                        TPCServiceableArea.objects.update_or_create(
                            pincode=pincode,
                            defaults={
                                'city': city,
                                'state': state,
                                'is_serviceable': is_serviceable,
                                'last_updated': timezone.now()
                            }
                        )
                        self.stdout.write(self.style.SUCCESS(f"Updated {pincode} ({city}) as serviceable."))
                    else:
                        city = response.get('city', 'Unknown') if response else 'Unknown'
                        state = response.get('state', 'Unknown') if response else 'Unknown'
                        
                        TPCServiceableArea.objects.update_or_create(
                            pincode=pincode,
                            defaults={
                                'city': city,
                                'state': state,
                                'is_serviceable': False,
                                'last_updated': timezone.now()
                            }
                        )
                        error_msg = response.get('error', 'No details') if response else 'No response from API'
                        self.stdout.write(self.style.WARNING(f"Pincode {pincode} not serviceable. API Error: {error_msg}"))
                        
                except Exception as e:
                    self.stderr.write(self.style.ERROR(f"Error checking pincode {pincode}: {e}"))
            
            # Add a delay between batches to respect potential API rate limits
            self.stdout.write(f"Processed batch {i // batch_size + 1}. Pausing for 5 seconds...")
            time.sleep(5)

        self.stdout.write(self.style.SUCCESS('TPC serviceable area synchronization completed.'))
