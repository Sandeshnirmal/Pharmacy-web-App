import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../api/apiService';

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
          setAvailablePurchaseOrders(response.data.results || response.data);
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
      setTimeout(onClose, 2000); // Close form after a delay
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
    return <div className="p-6 text-center">Loading data...</div>;
  }

  if (poSelectionError || error || (formMessage.type === 'error' && formMessage.text)) {
    return <div className="p-6 text-center text-red-500">{poSelectionError || error || formMessage.text}</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-xl font-bold text-gray-800 mb-4">
          {purchaseOrder ? `Return Items from Purchase Order #${purchaseOrder.id}` : 'Initiate New Purchase Return'}
        </h1>

        {formMessage.text && (
          <div
            className={`mb-4 p-3 rounded-md text-center ${
              formMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {formMessage.text}
          </div>
        )}

        {!purchaseOrder && ( // Show PO selection if no purchaseOrder prop is provided
          <div className="mb-4">
            <label htmlFor="purchaseOrderSelect" className="block text-sm font-medium text-gray-700">
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
                  PO #{po.id} - {po.supplier_name} - {po.order_date}
                </option>
              ))}
            </select>
          </div>
        )}

        {(purchaseOrder || selectedPurchaseOrderId) && itemsToReturn.length > 0 ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="overflow-x-auto border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Batch No.
                    </th>
                    <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Received Qty
                    </th>
                    <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Already Returned
                    </th>
                    <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Max Returnable
                    </th>
                    <th className="py-2 px-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Quantity to Return
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {itemsToReturn.map((item, index) => (
                    <tr key={item.id}>
                      <td className="py-2 px-3 whitespace-nowrap">{item.product_name}</td>
                      <td className="py-2 px-3 whitespace-nowrap">{item.batch_number}</td>
                      <td className="py-2 px-3 whitespace-nowrap">{item.expiry_date}</td>
                      <td className="py-2 px-3 whitespace-nowrap">{item.received_quantity}</td>
                      <td className="py-2 px-3 whitespace-nowrap">{item.returned_quantity}</td>
                      <td className="py-2 px-3 whitespace-nowrap">{item.max_returnable_quantity}</td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.quantity_to_return}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-full p-1 border border-gray-200 rounded-md"
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
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                disabled={submitting}
              >
                {submitting ? 'Returning...' : 'Return Selected Items'}
              </button>
              <button
                type="button"
                className="bg-gray-400 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-500"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 text-center text-gray-600">
            {purchaseOrder ? 'No items found for this purchase order.' : 'Please select a Purchase Order to view its items.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseReturnCreateForm;

// export default PurchaseReturnForm;
