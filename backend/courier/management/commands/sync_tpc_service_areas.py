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
    help = 'Fetches serviceable pincodes and area names from TPC API based on an area name and stores them in the local database.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--area-name',
            type=str,
            help='The area name to search for in the TPC API (e.g., "Mumbai", "Delhi").',
            required=True,
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting TPC serviceable area synchronization by area name...'))
        
        # Initialize the TPC service
        try:
            tpc_service = TPCCourierService() 
            # Removed the explicit check for placeholder credentials based on user feedback
            # The TPCCourierService constructor itself will raise ValueError if they are truly empty
        except ValueError as e:
            self.stderr.write(self.style.ERROR(f"TPC Service initialization failed: {e}"))
            return

        area_name = options['area_name']
        self.stdout.write(f"Searching for serviceable areas with name: '{area_name}'...")

        try:
            # Call the search_area_name method
            # This method now returns the raw JSON response from the TPC API
            raw_response = tpc_service.search_area_name(area_name)
            
            serviceable_areas = []
            if isinstance(raw_response, dict):
                # If the response is a single dictionary, wrap it in a list
                serviceable_areas.append(raw_response)
            elif isinstance(raw_response, list):
                # If the response is already a list, use it directly
                serviceable_areas = raw_response
            # If raw_response is empty or not a dict/list, serviceable_areas remains empty

            if serviceable_areas:
                self.stdout.write(f"Found {len(serviceable_areas)} serviceable areas for '{area_name}'.")

                for area_data in serviceable_areas:
                    pincode = area_data.get('PINCODE')
                    area_name_from_api = area_data.get('AREANAME', '')
                    state_from_api = area_data.get('STATE', '')
                    
                    # Derived field
                    is_serviceable = (area_data.get('DOC_DELIVERY') == 'YES' or area_data.get('PARCEL_DELIVERY') == 'YES')

                    if pincode:
                        TPCServiceableArea.objects.update_or_create(
                            pincode=pincode,
                            defaults={
                                'area_name': area_name_from_api,
                                'city': area_name_from_api, # Using AREANAME for city as well for now
                                'state': state_from_api,
                                'station_code': area_data.get('STATION_CODE', ''),
                                'sub_branch_code': area_data.get('SUB_BRANCH_CODE', ''),
                                'doc_delivery': area_data.get('DOC_DELIVERY', ''),
                                'parcel_delivery': area_data.get('PARCEL_DELIVERY', ''),
                                'propremium_delivery': area_data.get('PROPREMIUM_DELIVERY', ''),
                                'doc_delivery_schedule': area_data.get('DOC_DELIVERY_SCHEDULE', ''),
                                'parcel_delivery_schedule': area_data.get('PARCEL_DELIVERY_SCHEDULE', ''),
                                'prodlyschedule': area_data.get('PRODLYSCHEDULE', ''),
                                'cod_delivery': area_data.get('COD_DELIVERY', ''),
                                'is_serviceable': is_serviceable,
                                'last_updated': timezone.now()
                            }
                        )
                        self.stdout.write(self.style.SUCCESS(f"Updated {pincode} ({area_name_from_api}, {state_from_api}) as serviceable: {is_serviceable}."))
                    else:
                        self.stderr.write(self.style.WARNING(f"Skipping area data with missing PINCODE: {area_data}"))
            else:
                self.stdout.write(self.style.WARNING(f"No serviceable areas found for '{area_name}' or invalid API response format."))
                
        except ValueError as ve: # Catch the custom ValueError from _make_request
            self.stderr.write(self.style.ERROR(f"API Response Error: {ve}"))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error during TPC area search for '{area_name}': {e}"))
            
        self.stdout.write(self.style.SUCCESS('TPC serviceable area synchronization completed.'))
