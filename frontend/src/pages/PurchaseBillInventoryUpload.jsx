import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../api/apiService';
import PurchaseOrderForm from './PurchaseOrderForm'; // Import the form component
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation

const PurchaseBillInventoryUpload = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false); // State to control PurchaseOrderForm visibility
  const [currentOrder, setCurrentOrder] = useState(null); // State to hold order data for editing

  const navigate = useNavigate(); // Initialize navigate hook

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getPurchaseOrders();
      setPurchaseOrders(response.data.results); // Assuming pagination with a 'results' array
    } catch (err) {
      setError('Failed to fetch purchase orders.');
      console.error('Error fetching purchase orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const handleAddNewClick = () => {
    setCurrentOrder(null); // Clear any existing order data
    setShowForm(true); // Show the PurchaseOrderForm for adding new
  };

  const handleEditClick = (order) => {
    setCurrentOrder(order); // Set the order data for editing
    setShowForm(true); // Show the PurchaseOrderForm
  };

  const handleReturnClick = (order) => {
    // Navigate to the Purchase Bill Return page, passing the purchase order ID
    navigate(`/purchase-bill/return?poId=${order.id}`);
  };

  const handleDeleteClick = async (orderId) => {
    if (window.confirm(`Are you sure you want to delete Purchase Order #${orderId}?`)) {
      try {
        await inventoryAPI.deletePurchaseOrder(orderId);
        fetchPurchaseOrders(); // Refresh the list
      } catch (err) {
        setError('Failed to delete purchase order.');
        console.error('Error deleting purchase order:', err);
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false); // Hide the PurchaseOrderForm
    setCurrentOrder(null); // Clear current order
    fetchPurchaseOrders(); // Refresh the list after form action
  };

  const filteredOrders = purchaseOrders.filter(order =>
    order.id.toString().includes(searchTerm.toLowerCase()) ||
    order.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.total_amount.toString().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="p-6 text-center">Loading purchase orders...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Purchase Bill Inventory Upload</h1>
      
      {!showForm ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <input
              type="text"
              placeholder="Search by Bill No, Supplier, or Amount..."
              className="p-2 border border-gray-300 rounded-md w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              onClick={handleAddNewClick}
            >
              Add New
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Bill No
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-2 px-4 border-b border-gray-200">{order.id}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{order.supplier_name}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{order.order_date}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{parseFloat(order.total_amount).toFixed(2)}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{order.status}</td>
                      <td className="py-2 px-4 border-b border-gray-200">
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-2"
                          onClick={() => handleEditClick(order)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteClick(order.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                      No purchase orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <PurchaseOrderForm onFormClose={handleFormClose} initialData={currentOrder} />
      )}
    </div>
  );
};

export default PurchaseBillInventoryUpload;
