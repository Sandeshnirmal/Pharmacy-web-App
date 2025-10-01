import requests
import json
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from orders.models import Order
from courier.models import TPCServiceableArea
from company_details.models import CompanyDetails # Import CompanyDetails model
import logging

logger = logging.getLogger(__name__)

class TPCCourierService:
    """TPC courier service implementation"""

    def __init__(self):
        self.user_id = settings.TPC_API_KEY
        self.password = settings.TPC_API_SECRET
        self.base_url = settings.TPC_API_ENDPOINT.rstrip('/') + '/tpcwebservice/' # Ensure base URL ends with /
        self.company_details = self._get_company_details() # Fetch company details on initialization

        if not self.user_id:
            raise ValueError("TPC UserID (TPC_API_KEY) is required in settings.py")
        if not self.password:
            raise ValueError("TPC Password (TPC_API_SECRET) is required in settings.py")
        if not self.base_url:
            raise ValueError("TPC API Endpoint (TPC_API_ENDPOINT) is required in settings.py")

    def _get_company_details(self):
        """Retrieves the primary company details from the database."""
        try:
            # Assuming there's only one company or we take the first one
            return CompanyDetails.objects.first()
        except Exception as e:
            logger.error(f"Error fetching company details: {e}")
            return None

    def _make_request(self, method, endpoint, params=None, json_data=None):
        """Helper to make requests to TPC API"""
        url = f"{self.base_url}{endpoint}"
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36', # Mimic a common browser
            'Accept': 'application/json',
        }
        
        logger.debug(f"Making {method} request to TPC API: {url}")
        logger.debug(f"Params: {params}, JSON Data: {json_data}")
        logger.debug(f"Headers: {headers}")

        try:
            if method.upper() == 'GET':
                response = requests.get(url, params=params, headers=headers, verify=False) # Temporarily disable SSL verification
            elif method.upper() == 'POST':
                response = requests.post(url, params=params, json=json_data, headers=headers, verify=False) # Temporarily disable SSL verification
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            logger.debug(f"TPC API Response Status: {response.status_code}")
            logger.debug(f"TPC API Response Text: {response.text}")

            response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
            
            # Attempt to parse JSON, but handle cases where it might not be JSON
            try:
                json_response = response.json()
                return json_response
            except json.JSONDecodeError:
                logger.error(f"Failed to decode JSON response from {url}. Raw Response: {response.text}")
                # If the API returns non-JSON but a 200 status, it might be a valid non-JSON response
                # or an error that's not a 4xx/5xx HTTP status.
                return {'status': 'error', 'error': 'Invalid JSON response from TPC API', 'raw_response': response.text}

        except requests.exceptions.HTTPError as http_err:
            logger.error(f"HTTP error occurred: {http_err} - Response: {response.text}")
            # Return a standardized error dictionary for HTTP errors
            return {'status': 'error', 'error': f"HTTP error: {http_err}", 'raw_response': response.text}
        except requests.exceptions.ConnectionError as conn_err:
            logger.error(f"Connection error occurred: {conn_err}")
            raise
        except requests.exceptions.Timeout as timeout_err:
            logger.error(f"Timeout error occurred: {timeout_err}")
            raise
        except requests.exceptions.RequestException as req_err:
            logger.error(f"An unexpected request error occurred: {req_err}")
            raise
        except ValueError as val_err: # Catch the custom ValueError from JSONDecodeError
            raise val_err
        except Exception as e:
            logger.error(f"An unexpected error occurred in _make_request: {e}")
            raise

    def check_pincode_service(self, pincode):
        """
        Checks if a pincode is serviceable by TPC.
        First, checks the local database. If not found or outdated,
        it hits the TPC API and updates the database.
        """
        try:
            service_area = TPCServiceableArea.objects.get(pincode=pincode)
            # Check if the local data is outdated (e.g., older than 7 days)
            if (timezone.now() - service_area.last_updated) > timedelta(days=7):
                logger.info(f"Pincode {pincode} data in local DB is outdated, re-fetching from TPC API.")
                api_response = self._fetch_pincode_service_from_api(pincode)
                
                if api_response and api_response.get('is_serviceable') is not None:
                    service_area.city = api_response.get('city', service_area.city)
                    service_area.state = api_response.get('state', service_area.state)
                    service_area.is_serviceable = api_response['is_serviceable']
                    service_area.last_updated = timezone.now()
                    service_area.save()
                    logger.info(f"Pincode {pincode} updated from API. Serviceable: {service_area.is_serviceable}.")
                    return {
                        'status': 'success' if service_area.is_serviceable else 'error',
                        'city': service_area.city,
                        'state': service_area.state,
                        'is_serviceable': service_area.is_serviceable
                    }
                else:
                    logger.warning(f"Failed to get valid serviceability response from TPC API for outdated pincode {pincode}. Keeping existing local data.")
                    # If API call fails or returns invalid data, use existing local data
                    return {
                        'status': 'success' if service_area.is_serviceable else 'error',
                        'city': service_area.city,
                        'state': service_area.state,
                        'is_serviceable': service_area.is_serviceable
                    }
            else:
                logger.info(f"Pincode {pincode} found in local DB and is up-to-date. Serviceable: {service_area.is_serviceable}")
                return {
                    'status': 'success' if service_area.is_serviceable else 'error',
                    'city': service_area.city,
                    'state': service_area.state,
                    'is_serviceable': service_area.is_serviceable
                }

        except TPCServiceableArea.DoesNotExist:
            logger.info(f"Pincode {pincode} not found in local DB, fetching from TPC API.")
            api_response = self._fetch_pincode_service_from_api(pincode)
            
            is_serviceable = api_response.get('is_serviceable', False)
            city = api_response.get('city', 'Unknown')
            state = api_response.get('state', 'Unknown')
            
            TPCServiceableArea.objects.create(
                pincode=pincode,
                city=city,
                state=state,
                is_serviceable=is_serviceable,
                last_updated=timezone.now()
            )
            logger.info(f"Pincode {pincode} added to local DB. Serviceable: {is_serviceable}.")
            return {
                'status': 'success' if is_serviceable else 'error',
                'city': city,
                'state': state,
                'is_serviceable': is_serviceable
            }
        except Exception as e:
            logger.error(f"Error checking pincode {pincode}: {e}", exc_info=True)
            return {'status': 'error', 'error': str(e), 'is_serviceable': False}

    def _fetch_pincode_service_from_api(self, pincode):
        """Internal method to hit the TPC API for pincode service checking."""
        endpoint = "PINcodeService.ashx"
        params = {'pincode': pincode}
        api_response = self._make_request('GET', endpoint, params=params)

        # TPC API can return a list of dictionaries or a single dictionary
        # We need to normalize the response to a consistent format
        if isinstance(api_response, list) and api_response:
            pincode_data = api_response[0] # Assuming the first item contains the relevant data
        elif isinstance(api_response, dict):
            pincode_data = api_response
        else:
            logger.error(f"Unexpected raw_response format from TPC API for pincode {pincode}: {api_response}")
            return {'status': 'error', 'error': 'Failed to parse TPC API response', 'is_serviceable': False}

        is_serviceable = False
        # Check various delivery options to determine serviceability
        if pincode_data.get('DOC_DELIVERY', 'NO').upper() == 'YES' or \
           pincode_data.get('PARCEL_DELIVERY', 'NO').upper() == 'YES' or \
           pincode_data.get('PROPREMIUM_DELIVERY', 'NO').upper() == 'YES':
            is_serviceable = True
        
        return {
            'status': 'success' if is_serviceable else 'error',
            'city': pincode_data.get('AREANAME', 'Unknown'), # TPC API returns AREANAME as city
            'state': pincode_data.get('STATE', 'Unknown'), # TPC API might have state, or it might be 'Unknown'
            'is_serviceable': is_serviceable
        }

    def search_area_name(self, area_name):
        """This API used for Areaname search."""
        endpoint = "PINcodeCitysearch.ashx"
        params = {'AreaName': area_name}
        return self._make_request('GET', endpoint, params=params)

    def request_consignment_notes(self, qty):
        """
        Before booking you need ensure that enough stock of consignment notes in your TPC account.
        The below API will help you to get the consignment notes stock issue.
        """
        endpoint = "CnoteRequest.ashx"
        params = {
            'client': self.user_id,
            'tpcpwd': self.password,
            'Qty': qty
        }
        return self._make_request('GET', endpoint, params=params)

    def get_consignment_note_stock(self):
        """The below API will help you to get the number of consignment notes stock."""
        endpoint = "ClientCnoteStock.ashx"
        params = {
            'client': self.user_id,
            'tpcpwd': self.password
        }
        return self._make_request('GET', endpoint, params=params)

    def get_consignment_note_stock_details(self):
        """Consignment note number stock details API"""
        endpoint = "ClientStockDetails.ashx"
        params = {
            'client': self.user_id,
            'tpcpwd': self.password
        }
        return self._make_request('GET', endpoint, params=params)

    def create_shipment(self, order, pickup_address, delivery_address, shipment_data=None):
        """
        Create a new shipment using the TPC Pickup Information API.
        This method maps to the PickupRequest.ashx API.
        """
        endpoint = "PickupRequest.ashx"
        params = {
            'client': self.user_id,
            'tpcpwd': self.password
        }

        # Construct the request data based on the documentation
        # The shipment_data dictionary should contain all necessary fields
        # like REF_NO, BDATE, SENDER, RECIPIENT, WEIGHT, PIECES, etc.
        # The order and address details can be used to populate this.
        
        # Example mapping (adjust as per actual data structure in your system)
        # Use company_details for sender information if available
        sender_name = self.company_details.name if self.company_details else pickup_address.get("name", "")
        sender_address1 = self.company_details.address_line1 if self.company_details else pickup_address.get("address_line_1", "")
        sender_city = self.company_details.city if self.company_details else pickup_address.get("city", "")
        sender_pincode = self.company_details.postal_code if self.company_details else pickup_address.get("pincode", "")
        sender_phone = self.company_details.phone_number if self.company_details else pickup_address.get("phone", "")
        sender_email = self.company_details.email if self.company_details else pickup_address.get("email", "")
        sender_gstin = self.company_details.gstin if self.company_details else shipment_data.get("GSTIN", "")

        request_data = {
            "REF_NO": shipment_data.get("REF_NO", str(order.id)),
            "BDATE": shipment_data.get("BDATE", timezone.now().strftime("%Y-%m-%d")),
            "SENDER": sender_name,
            "SENDER_CODE": shipment_data.get("SENDER_CODE", ""), # Assuming a default or configured sender code
            "SENDER_ADDRESS": sender_address1,
            "SENDER_CITY": sender_city,
            "SENDER_PINCODE": sender_pincode,
            "SENDER_MOB": sender_phone,
            "SENDER_EMAIL": sender_email,
            "GSTIN": sender_gstin, # Sender's GSTIN
            "RECIPIENT": delivery_address.get("name", ""),
            "RECIPIENT_COMPANY": delivery_address.get("company", ""),
            "RECIPIENT_ADDRESS": delivery_address.get("address_line_1", ""),
            "RECIPIENT_CITY": delivery_address.get("city", ""),
            "RECIPIENT_PINCODE": delivery_address.get("pincode", ""),
            "RECIPIENT_MOB": delivery_address.get("phone", ""),
            "RECIPIENT_EMAIL": delivery_address.get("email", ""),
            "WEIGHT": str(shipment_data.get("WEIGHT", "0.1")),
            "PIECES": str(shipment_data.get("PIECES", "1")),
            "RECIPIENT_GSTIN": shipment_data.get("RECIPIENT_GSTIN", ""),
            "FLYER_NO": shipment_data.get("FLYER_NO", ""),
            "CUST_INVOICE": shipment_data.get("CUST_INVOICE", ""),
            "CUST_INVOICEAMT": str(shipment_data.get("CUST_INVOICEAMT", "0.00")),
            "VOL_LENGTH": str(shipment_data.get("VOL_LENGTH", "5")),
            "VOL_WIDTH": str(shipment_data.get("VOL_WIDTH", "10")),
            "VOL_HEIGHT": str(shipment_data.get("VOL_HEIGHT", "10")),
            "DESCRIPTION": shipment_data.get("DESCRIPTION", "Pharmacy Order"),
            "REMARKS": shipment_data.get("REMARKS", "Pharmacy Order"),
            "COD_AMOUNT": str(shipment_data.get("COD_AMOUNT", "0.00")),
            "PAYMENT_MODE": shipment_data.get("PAYMENT_MODE", "CASH"), # CASH/CREDIT
            "TYPE": shipment_data.get("TYPE", "PICKUP"), # PICKUP
            "ORDER_STATUS": shipment_data.get("ORDER_STATUS", "HOLD"), # HOLD
            "MODE": shipment_data.get("MODE", "AT"), # AT (Air Transit) or ST (Surface Transit)
            "SERVICE": shipment_data.get("SERVICE", ""), # PRO for Premium
            "POD_NO": shipment_data.get("POD_NO", "") # Optional, if provided, same number will be considered
        }

        response_data = self._make_request('POST', endpoint, params=params, json_data=request_data)
        return response_data

    def create_cod_booking(self, order, pickup_address, delivery_address, cod_data):
        """
        Create a COD booking using the TPC CODBooking.ASHX API.
        """
        endpoint = "CODBooking.ASHX"
        params = {
            'client': self.user_id,
            'tpcpwd': self.password
        }

        # Use company_details for sender information if available
        sender_name = self.company_details.name if self.company_details else pickup_address.get("name", "")
        sender_address1 = self.company_details.address_line1 if self.company_details else pickup_address.get("address_line_1", "")
        sender_city = self.company_details.city if self.company_details else pickup_address.get("city", "")
        sender_pincode = self.company_details.postal_code if self.company_details else pickup_address.get("pincode", "")
        sender_phone = self.company_details.phone_number if self.company_details else pickup_address.get("phone", "")
        sender_email = self.company_details.email if self.company_details else pickup_address.get("email", "")
        sender_gstin = self.company_details.gstin if self.company_details else cod_data.get("GSTIN", "")

        request_data = {
            "REF_NO": cod_data.get("REF_NO", str(order.id)),
            "BDATE": cod_data.get("BDATE", timezone.now().strftime("%Y-%m-%d")),
            "SENDER": sender_name,
            "SENDER_CODE": cod_data.get("SENDER_CODE", ""),
            "SENDER_ADDRESS": sender_address1,
            "SENDER_CITY": sender_city,
            "SENDER_PINCODE": sender_pincode,
            "SENDER_MOB": sender_phone,
            "SENDER_EMAIL": sender_email,
            "GSTIN": sender_gstin,
            "RECIPIENT": delivery_address.get("name", ""),
            "RECIPIENT_COMPANY": delivery_address.get("company", ""),
            "RECIPIENT_ADDRESS": delivery_address.get("address_line_1", ""),
            "RECIPIENT_CITY": delivery_address.get("city", ""),
            "RECIPIENT_PINCODE": delivery_address.get("pincode", ""),
            "RECIPIENT_MOB": delivery_address.get("phone", ""),
            "RECIPIENT_EMAIL": delivery_address.get("email", ""),
            "WEIGHT": str(cod_data.get("WEIGHT", "0.05")),
            "PIECES": str(cod_data.get("PIECES", "1")),
            "RECIPIENT_GSTIN": cod_data.get("RECIPIENT_GSTIN", ""),
            "FLYER_NO": cod_data.get("FLYER_NO", ""),
            "CUST_INVOICE": cod_data.get("CUST_INVOICE", ""),
            "CUST_INVOICEAMT": str(cod_data.get("CUST_INVOICEAMT", "0.00")),
            "VOL_LENGTH": str(cod_data.get("VOL_LENGTH", "10")),
            "VOL_WIDTH": str(cod_data.get("VOL_WIDTH", "10")),
            "VOL_HEIGHT": str(cod_data.get("VOL_HEIGHT", "10")),
            "DESCRIPTION": cod_data.get("DESCRIPTION", "COD Order"),
            "REMARKS": cod_data.get("REMARKS", "COD Order"),
            "COD_AMOUNT": str(cod_data.get("COD_AMOUNT", "0.00")),
            "PAYMENT_MODE": cod_data.get("PAYMENT_MODE", "CASH"),
            "TYPE": cod_data.get("TYPE", ""),
            "ORDER_STATUS": cod_data.get("ORDER_STATUS", "HOLD")
        }
        
        response_data = self._make_request('POST', endpoint, params=params, json_data=request_data)
        return response_data

    def print_consignment_note(self, podno, single_copy=False):
        """
        For taking A4 sheet print out of the AWB/POD/Consignment Note number.
        """
        if single_copy:
            endpoint = "CnotePrintingsingle.aspx"
        else:
            endpoint = "CnotePrinting.aspx"
        
        params = {
            'client': self.user_id,
            'tpcpwd': self.password,
            'podno': podno
        }
        # This API returns an ASPX page, not JSON. So, we just return the URL.
        # The client (frontend) would typically open this URL in a new tab/window.
        return f"{self.base_url}{endpoint}?client={self.user_id}&tpcpwd={self.password}&podno={podno}"

    def cancel_shipment(self, podno):
        """
        For Canceling AWB/Cnote number after booking and before despatch.
        This method maps to CancelCnoteBKG.ashx API.
        """
        endpoint = "CancelCnoteBKG.ashx"
        params = {
            'client': self.user_id,
            'tpcpwd': self.password,
            'podno': podno
        }
        return self._make_request('GET', endpoint, params=params)

    def add_pickup_addon_details(self, addon_data):
        """
        Adding additional details API (weight (kgs), pieces, invoice number etc., )
        after generating the consignment note before dispatching the consignments
        from your dispatching department.
        This method maps to PickupAddon.ashx API.
        """
        endpoint = "PickupAddon.ashx"
        params = {
            'client': self.user_id,
            'tpcpwd': self.password
        }
        # addon_data should be a dictionary like:
        # {"POD_NO":"BLR123456","WEIGHT":"0.5","PIECES":"2","CONTENT":"TEST","DECLARED_VALUE":"100","CUST_INVOICE":"INV123","CUST_INVOICEAMT":"100"}
        return self._make_request('POST', endpoint, params=params, json_data=addon_data)

    def check_duplicate_ref_no(self, refno):
        """
        You can retrieve all the booked consignments related to this reference number (RefNo).
        A response will be provided with the details of the consignments booked against this RefNo.
        This method maps to tracktracejsonRefNo.ashx API.
        """
        endpoint = "tracktracejsonRefNo.ashx"
        params = {
            'refno': refno,
            'client': self.user_id,
            'tpcpwd': self.password
        }
        return self._make_request('GET', endpoint, params=params)

    def track_shipment(self, podno, new_version=False, with_contact=False):
        """
        Consignments tracking details will be available through this API.
        This method maps to tracktracejson.ashx, tracktracejsonnew.ashx, or tracktracejsonContact.ashx.
        """
        if with_contact:
            endpoint = "tracktracejsonContact.ashx"
        elif new_version:
            endpoint = "tracktracejsonnew.ashx"
        else:
            endpoint = "tracktracejson.ashx"
        
        params = {
            'podno': podno,
            'client': self.user_id,
            'tpcpwd': self.password
        }
        
        api_response = self._make_request('GET', endpoint, params=params)

        if api_response and isinstance(api_response, list) and api_response:
            try:
                from courier.models import CourierShipment # Import here to avoid circular dependency
                shipment = CourierShipment.objects.get(tracking_number=podno)
                self._process_tracking_data(shipment, api_response)
                return {'status': 'success', 'message': 'Tracking data updated successfully', 'tracking_data': shipment.tracking_history}
            except CourierShipment.DoesNotExist:
                logger.warning(f"No CourierShipment found for tracking number {podno}. Cannot update tracking history.")
                return {'status': 'error', 'error': f"No shipment found for tracking number {podno}", 'raw_response': api_response}
            except Exception as e:
                logger.error(f"Error processing tracking data for {podno}: {e}", exc_info=True)
                return {'status': 'error', 'error': f"Failed to process tracking data: {e}", 'raw_response': api_response}
        elif api_response and api_response.get('status') == 'error':
            return api_response # Return the error dictionary from _make_request
        else:
            logger.warning(f"TPC API returned unexpected response for tracking number {podno}: {api_response}")
            return {'status': 'error', 'error': 'Unexpected API response', 'raw_response': api_response}

    def get_tracking_webpage_url(self, consignment_id):
        """
        For getting tpcglobe.com website tracking page in a new window.
        This method maps to trackcnote.aspx.
        """
        endpoint = "trackcnote.aspx"
        params = {
            'id': consignment_id,
            'client': self.user_id,
            'PSWD': self.password # Note: documentation uses PSWD here, not tpcpwd
        }
        # This API returns an ASPX page, not JSON. So, we just return the URL.
        return f"{self.base_url.rstrip('/')}/{endpoint}?id={consignment_id}&client={self.user_id}&PSWD={self.password}"

    def _process_tracking_data(self, shipment, tracking_data):
        """
        Processes raw tracking data from TPC API and updates CourierShipment.
        """
        if not isinstance(tracking_data, list):
            logger.error(f"Expected tracking_data to be a list, but got {type(tracking_data)}")
            return

        # Clear existing history if we're getting a fresh set
        shipment.tracking_history = []
        
        latest_event = None
        for event_data in tracking_data:
            try:
                # Convert date and time strings to datetime objects
                date_str = event_data.get('Date')
                time_str = event_data.get('Time')
                
                event_datetime = None
                if date_str and time_str:
                    try:
                        # Assuming date format DD/MM/YYYY and time format HH:MM
                        event_datetime = datetime.strptime(f"{date_str} {time_str}", "%d/%m/%Y %H:%M")
                        # Make it timezone-aware, assuming it's in the local timezone and then converting to UTC
                        event_datetime = timezone.make_aware(event_datetime, timezone.get_current_timezone())
                    except ValueError:
                        logger.warning(f"Could not parse datetime for tracking event: {date_str} {time_str}")
                        event_datetime = None # Keep it None if parsing fails

                event = {
                    'Date': event_data.get('Date'),
                    'Time': event_data.get('Time'),
                    'City': event_data.get('City'),
                    'Activity': event_data.get('Activity'),
                    'Forwardingno': event_data.get('Forwardingno'),
                    'Pod_no': event_data.get('Pod_no'),
                    'Remarks': event_data.get('Remarks'),
                    'Pieces': event_data.get('Pieces'),
                    'Weight': event_data.get('Weight'),
                    'Receiver': event_data.get('Receiver'),
                    'Receiver Phno': event_data.get('Receiver Phno'),
                    'Stamp': event_data.get('Stamp'),
                    'Refno': event_data.get('Refno'),
                    'Idproof': event_data.get('Idproof'),
                    'Type': event_data.get('Type'),
                    'timestamp_iso': event_datetime.isoformat() if event_datetime else None
                }
                shipment.tracking_history.append(event)

                # Determine the latest event for status update
                if not latest_event or (event_datetime and event_datetime > latest_event['datetime']):
                    latest_event = {
                        'datetime': event_datetime,
                        'activity': event_data.get('Activity'),
                        'city': event_data.get('City'),
                        'type': event_data.get('Type')
                    }
            except Exception as e:
                logger.error(f"Error processing tracking event: {event_data}. Error: {e}", exc_info=True)
                continue

        if latest_event:
            shipment.current_location = latest_event['city']
            # Map TPC activity to internal status choices
            if "Delivered" in latest_event['activity']:
                shipment.status = 'delivered'
                if latest_event['datetime']:
                    shipment.actual_delivery = latest_event['datetime']
            elif "Out for Delivery" in latest_event['activity']:
                shipment.status = 'out_for_delivery'
            elif "In Transit" in latest_event['type'] or "Despatched" in latest_event['activity'] or "Received at" in latest_event['activity']:
                shipment.status = 'in_transit'
            elif "Picked Up" in latest_event['activity'] or "Booking Completed" in latest_event['activity']:
                shipment.status = 'picked_up'
            elif "Cancelled" in latest_event['activity']:
                shipment.status = 'cancelled'
            elif "Exception" in latest_event['activity']:
                shipment.status = 'exception'
            else:
                shipment.status = 'in_transit' # Default to in_transit if not explicitly matched

        shipment.updated_at = timezone.now()
        shipment.save()
        logger.info(f"CourierShipment {shipment.tracking_number} updated with tracking data.")


def get_tpc_courier_service():
    """Returns a TPC courier service instance"""
    return TPCCourierService()
