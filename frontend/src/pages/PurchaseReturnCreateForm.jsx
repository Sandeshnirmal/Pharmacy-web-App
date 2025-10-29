import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../api/apiService';
import { CircularProgress, Alert } from '@mui/material'; // Assuming MUI is available for these components

const PurchaseReturnCreateForm = ({ purchaseOrder, onClose, onReturnSuccess }) => {
  const [itemsToReturn, setItemsToReturn] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState(purchaseOrder?.id || '');
  const [availablePurchaseOrders, setAvailablePurchaseOrders] = useState([]);
  const [poSelectionLoading, setPoSelectionLoading] = useState(false);
  const [poSelectionError, setPoSelectionError] = useState(null);

  // Effect to fetch available purchase orders if none is pre-selected
  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      if (!purchaseOrder) { // Only fetch if no purchaseOrder prop is provided
        setPoSelectionLoading(true);
        setPoSelectionError(null);
        try {
          const response = await inventoryAPI.getPurchaseOrders();
          const fetchedOrders = response.data.results || response.data;
          setAvailablePurchaseOrders(fetchedOrders);
          console.log('Fetched available purchase orders:', fetchedOrders); // Debug log
        } catch (err) {
          setPoSelectionError('Failed to fetch available purchase orders.');
          console.error('Error fetching available purchase orders:', err);
        } finally {
          setPoSelectionLoading(false);
        }
      }
    };
    fetchPurchaseOrders();
  }, [purchaseOrder]);

  // Effect to set selectedPurchaseOrderId if purchaseOrder prop is provided
  useEffect(() => {
    if (purchaseOrder) {
      setSelectedPurchaseOrderId(purchaseOrder.id);
    }
  }, [purchaseOrder]);

  // Effect to load items based on selectedPurchaseOrderId or purchaseOrder prop
  useEffect(() => {
    const loadPurchaseOrderItems = async () => {
      let currentPo = purchaseOrder;
      if (!currentPo && selectedPurchaseOrderId) {
        setLoading(true);
        setError(null);
        try {
          const response = await inventoryAPI.getPurchaseOrder(selectedPurchaseOrderId);
          currentPo = response.data;
        } catch (err) {
          setError(`Failed to load items for Purchase Order #${selectedPurchaseOrderId}.`);
          console.error(`Error fetching Purchase Order ${selectedPurchaseOrderId}:`, err);
          setLoading(false);
          return;
        }
      } else if (!currentPo) { // No PO selected yet
        setItemsToReturn([]);
        setLoading(false);
        return;
      }

      if (!currentPo || !currentPo.id || !currentPo.items) {
        console.log('Debug: No purchase order or items found in currentPo:', currentPo);
        setError('No purchase order or items provided for return.');
        setLoading(false);
        return;
      }

      console.log('Debug: currentPo.items before mapping:', currentPo.items);
      const initialItems = currentPo.items.map(item => ({
        id: item.id, // PurchaseOrderItem ID
        product_name: item.product_details?.name || 'N/A',
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
        received_quantity: item.received_quantity,
        returned_quantity: item.returned_quantity,
        quantity_to_return: 0, // User input field
        max_returnable_quantity: item.received_quantity - item.returned_quantity,
      }));
      setItemsToReturn(initialItems);
      setLoading(false);
    };

    loadPurchaseOrderItems();
  }, [purchaseOrder, selectedPurchaseOrderId]);

  const handleQuantityChange = (index, value) => {
    const newItems = [...itemsToReturn];
    const parsedValue = parseInt(value, 10);

    if (isNaN(parsedValue) || parsedValue < 0) {
      newItems[index].quantity_to_return = 0;
    } else if (parsedValue > newItems[index].max_returnable_quantity) {
      newItems[index].quantity_to_return = newItems[index].max_returnable_quantity;
    } else {
      newItems[index].quantity_to_return = parsedValue;
    }
    setItemsToReturn(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFormMessage({ type: '', text: '' });

    const targetPurchaseOrderId = purchaseOrder?.id || selectedPurchaseOrderId;

    if (!targetPurchaseOrderId) {
      setError('Please select a Purchase Order.');
      setSubmitting(false);
      return;
    }

    const payload = itemsToReturn
      .filter(item => item.quantity_to_return > 0)
      .map(item => ({
        id: item.id,
        quantity: item.quantity_to_return,
      }));

    if (payload.length === 0) {
      setError('Please enter a quantity greater than 0 for at least one item to return.');
      setSubmitting(false);
      return;
    }

    try {
      await inventoryAPI.returnPurchaseOrderItems(targetPurchaseOrderId, payload);
      setFormMessage({ type: 'success', text: 'Items returned successfully!' });
      if (onReturnSuccess) onReturnSuccess(); // Notify parent to refresh list
      // onClose(); // Let parent component handle closing, or add a manual close button to success message
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to process return. Please check your input.';
      setError(errorMessage);
      console.error('Error returning items:', err);
      setFormMessage({ type: 'error', text: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  if (poSelectionLoading || loading) {
    return (
      <div className="flex justify-center items-center p-6">
        <CircularProgress />
        <span className="ml-2 text-gray-700">Loading data...</span>
      </div>
    );
  }

  if (poSelectionError || error || (formMessage.type === 'error' && formMessage.text)) {
    return (
      <div className="p-6">
        <Alert severity="error">
          {poSelectionError || error || formMessage.text}
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-100 min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {purchaseOrder ? `Return Items from Purchase Order #${purchaseOrder.id}` : 'Initiate New Purchase Return'}
        </h1>

        {formMessage.text && (
          <Alert
            severity={formMessage.type === 'success' ? 'success' : 'error'}
            sx={{ mb: 2 }}
          >
            {formMessage.text}
          </Alert>
        )}

        {!purchaseOrder && ( // Show PO selection if no purchaseOrder prop is provided
          <div className="mb-4">
            <label htmlFor="purchaseOrderSelect" className="block text-sm font-medium text-gray-700 mb-1">
              Select Purchase Order <span className="text-red-500">*</span>
            </label>
            <select
              id="purchaseOrderSelect"
              name="purchaseOrderSelect"
              value={selectedPurchaseOrderId}
              onChange={(e) => setSelectedPurchaseOrderId(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a Purchase Order</option>
              {availablePurchaseOrders.map((po) => (
                <option key={po.id} value={po.id}>
                  PO #{po.id} - {po.supplier_name} - {new Date(po.order_date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}

        {(purchaseOrder || selectedPurchaseOrderId) && itemsToReturn.length > 0 ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Batch No.
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Received Qty
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Already Returned
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Max Returnable
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Quantity to Return
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {itemsToReturn.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{item.product_name}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{item.batch_number}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{item.expiry_date}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{item.received_quantity}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{item.returned_quantity}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{item.max_returnable_quantity}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.quantity_to_return}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-24 p-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                          min="0"
                          max={item.max_returnable_quantity}
                          disabled={item.max_returnable_quantity === 0}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-5 py-2 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                disabled={submitting}
              >
                {submitting ? 'Returning...' : 'Return Selected Items'}
              </button>
              <button
                type="button"
                className="bg-gray-300 text-gray-800 px-5 py-2 rounded-md hover:bg-gray-400 transition-colors duration-200"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 text-center text-gray-600 bg-white rounded-md shadow-sm">
            {purchaseOrder ? 'No items found for this purchase order.' : 'Please select a Purchase Order to view its items.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseReturnCreateForm;

// export default PurchaseReturnForm;
