import requests
import json
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from orders.models import Order
from courier.models import TPCServiceableArea
import logging

logger = logging.getLogger(__name__)

class TPCCourierService:
    """TPC courier service implementation"""

    def __init__(self):
        self.user_id = settings.TPC_API_KEY
        self.password = settings.TPC_API_SECRET
        self.base_url = settings.TPC_API_ENDPOINT.rstrip('/') + '/tpcwebservice/' # Ensure base URL ends with /

        if not self.user_id:
            raise ValueError("TPC UserID (TPC_API_KEY) is required in settings.py")
        if not self.password:
            raise ValueError("TPC Password (TPC_API_SECRET) is required in settings.py")
        if not self.base_url:
            raise ValueError("TPC API Endpoint (TPC_API_ENDPOINT) is required in settings.py")

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
                if isinstance(json_response, list):
                    logger.warning(f"TPC API returned a list for {url}. Expected a dictionary. Response: {json_response}")
                    # Return a standardized error dictionary if a list is received
                    return {'status': 'error', 'error': 'Unexpected list response from TPC API', 'raw_response': json_response}
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
            # Optionally, add logic here to re-check API if last_updated is too old
            if (timezone.now() - service_area.last_updated) > timedelta(days=7): # Check weekly
                logger.info(f"Pincode {pincode} data is outdated, re-fetching from TPC API.")
                api_response = self._fetch_pincode_service_from_api(pincode)
                logger.debug(f"API response for outdated pincode {pincode}: {api_response}")
                if api_response and api_response.get('status') == 'success':
                    service_area.city = api_response.get('city', service_area.city)
                    service_area.state = api_response.get('state', service_area.state)
                    service_area.is_serviceable = True
                    service_area.last_updated = timezone.now()
                    service_area.save()
                    logger.info(f"Pincode {pincode} updated from API: serviceable.")
                    return {'status': 'success', 'city': service_area.city, 'state': service_area.state, 'is_serviceable': True}
                else:
                    service_area.is_serviceable = False
                    service_area.last_updated = timezone.now()
                    service_area.save()
                    logger.warning(f"Pincode {pincode} not serviceable via API. Local DB updated to not serviceable.")
                    return {'status': 'error', 'error': 'Pincode not serviceable via API'}
            else:
                logger.info(f"Pincode {pincode} found in local DB and is up-to-date. Serviceable: {service_area.is_serviceable}")
            
            return {'status': 'success' if service_area.is_serviceable else 'error',
                    'city': service_area.city,
                    'state': service_area.state,
                    'is_serviceable': service_area.is_serviceable}

        except TPCServiceableArea.DoesNotExist:
            logger.info(f"Pincode {pincode} not found in local DB, fetching from TPC API.")
            api_response = self._fetch_pincode_service_from_api(pincode)
            logger.debug(f"API response for new pincode {pincode}: {api_response}")
            if api_response and api_response.get('status') == 'success':
                TPCServiceableArea.objects.create(
                    pincode=pincode,
                    city=api_response.get('city', 'Unknown'),
                    state=api_response.get('state', 'Unknown'),
                    is_serviceable=True,
                    last_updated=timezone.now()
                )
                logger.info(f"Pincode {pincode} added to local DB: serviceable.")
                return {'status': 'success', 'city': api_response.get('city', 'Unknown'), 'state': api_response.get('state', 'Unknown'), 'is_serviceable': True}
            else:
                TPCServiceableArea.objects.create(
                    pincode=pincode,
                    city=api_response.get('city', 'Unknown'),
                    state=api_response.get('state', 'Unknown'),
                    is_serviceable=False,
                    last_updated=timezone.now()
                )
                logger.warning(f"Pincode {pincode} not serviceable via API. Added to local DB as not serviceable.")
                return {'status': 'error', 'error': 'Pincode not serviceable via API'}
        except Exception as e:
            logger.error(f"Error checking pincode {pincode}: {e}", exc_info=True) # Added exc_info for full traceback
            return {'status': 'error', 'error': str(e)}

    def _fetch_pincode_service_from_api(self, pincode):
        """Internal method to hit the TPC API for pincode service checking."""
        endpoint = "PINcodeService.ashx"
        params = {'pincode': pincode}
        api_response = self._make_request('GET', endpoint, params=params)

        # Check if the response is an error dictionary due to unexpected list
        if api_response and api_response.get('status') == 'error' and 'Unexpected list response' in api_response.get('error', ''):
            raw_list_response = api_response.get('raw_response')
            if isinstance(raw_list_response, list) and raw_list_response:
                # Assuming the first item in the list contains the serviceability info
                pincode_data = raw_list_response[0]
                is_serviceable = False
                if pincode_data.get('DOC_DELIVERY') == 'YES' or \
                   pincode_data.get('PARCEL_DELIVERY') == 'YES' or \
                   pincode_data.get('PROPREMIUM_DELIVERY') == 'YES':
                    is_serviceable = True
                
                return {
                    'status': 'success' if is_serviceable else 'error',
                    'city': pincode_data.get('AREANAME', 'Unknown'), # TPC API returns AREANAME as city
                    'state': 'Unknown', # TPC API response doesn't seem to have state directly in this endpoint
                    'is_serviceable': is_serviceable
                }
            else:
                logger.error(f"Unexpected raw_response format for pincode {pincode}: {raw_list_response}")
                return {'status': 'error', 'error': 'Failed to parse TPC API list response'}
        
        # If it's not an unexpected list error, return the original API response
        return api_response

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
        request_data = {
            "REF_NO": shipment_data.get("REF_NO", str(order.id)),
            "BDATE": shipment_data.get("BDATE", timezone.now().strftime("%Y-%m-%d")),
            "SENDER": pickup_address.get("name", ""),
            "SENDER_CODE": shipment_data.get("SENDER_CODE", ""), # Assuming a default or configured sender code
            "SENDER_ADDRESS": pickup_address.get("address_line_1", ""),
            "SENDER_CITY": pickup_address.get("city", ""),
            "SENDER_PINCODE": pickup_address.get("pincode", ""),
            "SENDER_MOB": pickup_address.get("phone", ""),
            "SENDER_EMAIL": pickup_address.get("email", ""),
            "GSTIN": shipment_data.get("GSTIN", ""), # Sender's GSTIN
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

        request_data = {
            "REF_NO": cod_data.get("REF_NO", str(order.id)),
            "BDATE": cod_data.get("BDATE", timezone.now().strftime("%Y-%m-%d")),
            "SENDER": pickup_address.get("name", ""),
            "SENDER_CODE": cod_data.get("SENDER_CODE", ""),
            "SENDER_ADDRESS": pickup_address.get("address_line_1", ""),
            "SENDER_CITY": pickup_address.get("city", ""),
            "SENDER_PINCODE": pickup_address.get("pincode", ""),
            "SENDER_MOB": pickup_address.get("phone", ""),
            "SENDER_EMAIL": pickup_address.get("email", ""),
            "GSTIN": cod_data.get("GSTIN", ""),
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
        return self._make_request('GET', endpoint, params=params)

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
        return f"{self.api_endpoint.rstrip('/')}/{endpoint}?id={consignment_id}&client={self.user_id}&PSWD={self.password}"


def get_tpc_courier_service():
    """Returns a TPC courier service instance"""
    return TPCCourierService()
