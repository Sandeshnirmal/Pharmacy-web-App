import requests
import json
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from .models import CourierPartner, CourierShipment, CourierServiceArea, CourierRateCard
from orders.models import Order
import logging

logger = logging.getLogger(__name__)

class CourierService:
    """
    Base class for courier service integration

    This class provides the interface for all courier service implementations.
    Each courier service (Delhivery, Blue Dart, Professional Courier, etc.)
    should inherit from this class and implement the required methods.
    """

    def __init__(self, courier_partner):
        """
        Initialize courier service with partner configuration

        Args:
            courier_partner: CourierPartner model instance
        """
        if not courier_partner:
            raise ValueError("Courier partner is required")

        self.courier_partner = courier_partner
        self.api_endpoint = courier_partner.api_endpoint
        self.api_key = courier_partner.api_key
        self.api_secret = courier_partner.api_secret

        # Validate configuration
        if not self.api_endpoint:
            raise ValueError("API endpoint is required for courier service")
        if not self.api_key:
            raise ValueError("API key is required for courier service")

    def create_shipment(self, order, pickup_address, delivery_address, shipment_data=None):
        """Create a new shipment"""
        raise NotImplementedError("Subclasses must implement create_shipment")

    def track_shipment(self, tracking_identifier, new_version=False, with_contact=False):
        """Track shipment status. tracking_identifier can be tracking_number or podno."""
        raise NotImplementedError("Subclasses must implement track_shipment")

    def cancel_shipment(self, tracking_identifier):
        """Cancel a shipment. tracking_identifier can be tracking_number or podno."""
        raise NotImplementedError("Subclasses must implement cancel_shipment")

    def schedule_pickup(self, shipment_id, pickup_date):
        """Schedule pickup for shipment"""
        raise NotImplementedError("Subclasses must implement schedule_pickup")

    def validate_address(self, address):
        """Validate address format"""
        required_fields = ['name', 'phone', 'address_line_1', 'city', 'state', 'pincode']

        if not isinstance(address, dict):
            raise ValueError("Address must be a dictionary")

        for field in required_fields:
            if not address.get(field):
                raise ValueError(f"Missing required address field: {field}")

        return True

class TPCCourierService(CourierService):
    """TPC courier service implementation"""

    def __init__(self, courier_partner):
        super().__init__(courier_partner)
        self.user_id = self.api_key # Map api_key to TPC UserID
        self.password = self.api_secret # Map api_secret to TPC Pwd
        self.base_url = self.api_endpoint.rstrip('/') + '/tpcwebservice/' # Ensure base URL ends with /

        if not self.user_id:
            raise ValueError("TPC UserID (api_key) is required")
        if not self.password:
            raise ValueError("TPC Password (api_secret) is required")

    def _make_request(self, method, endpoint, params=None, json_data=None):
        """Helper to make requests to TPC API"""
        url = f"{self.base_url}{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, params=params, headers=headers)
            elif method.upper() == 'POST':
                response = requests.post(url, params=params, json=json_data, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
            return response.json()
        except requests.exceptions.HTTPError as http_err:
            logger.error(f"HTTP error occurred: {http_err} - Response: {response.text}")
            raise
        except requests.exceptions.ConnectionError as conn_err:
            logger.error(f"Connection error occurred: {conn_err}")
            raise
        except requests.exceptions.Timeout as timeout_err:
            logger.error(f"Timeout error occurred: {timeout_err}")
            raise
        except requests.exceptions.RequestException as req_err:
            logger.error(f"An unexpected error occurred: {req_err}")
            raise
        except json.JSONDecodeError:
            logger.error(f"Failed to decode JSON response from {url}. Response: {response.text}")
            raise ValueError("Invalid JSON response from TPC API")

    def check_pincode_service(self, pincode):
        """
        Web API used for PIN code service checking.
        Before booking the consignments you can check the PIN code is served by TPC or not.
        """
        endpoint = "PINcodeService.ashx"
        params = {'pincode': pincode}
        return self._make_request('GET', endpoint, params=params)

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


def get_courier_service(courier_type='TPC'):
    """Factory method to get courier service instance based on courier_type"""
    try:
        courier_partner = CourierPartner.objects.get(
            name=courier_type,
            is_active=True
        )
        return TPCCourierService(courier_partner)
            
    except CourierPartner.DoesNotExist:
        logger.error(f"No active TPC courier partner named 'TPC' found.")
        return None
