import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, PlusCircle, Edit, RotateCcw, XCircle, Trash2, CheckCircle } from 'lucide-react'; // Icons
import { inventoryAPI } from '../api/apiService';

const PurchaseBillPage = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryAPI.getPurchaseOrders();
      // Ensure purchaseOrders is always an array
      setPurchaseOrders(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      setError("Failed to fetch purchase orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredPurchaseOrders = purchaseOrders.filter(po =>
    po.id.toString().includes(searchTerm) ||
    po.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (poId) => {
    // Assuming a route for editing purchase bills
    window.location.href = `/purchase-bill/edit/${poId}`;
  };

  const handleReceiveItems = async (poId) => {
    if (window.confirm(`Are you sure you want to mark Purchase Order #${poId} as RECEIVED?`)) {
      try {
        await inventoryAPI.updatePurchaseOrder(poId, { status: 'RECEIVED' });
        fetchPurchaseOrders(); // Refresh the list
        alert(`Purchase Order #${poId} marked as RECEIVED.`);
      } catch (error) {
        console.error("Error receiving items:", error);
        alert("Failed to mark purchase order as received.");
      }
    }
  };

  const handleReturnItems = async (poId) => {
    // Navigate to a return items page, passing the PO ID
    window.location.href = `/purchase-bill-return/${poId}`;
  };

  const handleCancelPO = async (poId) => {
    if (window.confirm(`Are you sure you want to CANCEL Purchase Order #${poId}?`)) {
      try {
        await inventoryAPI.updatePurchaseOrder(poId, { status: 'CANCELLED' });
        fetchPurchaseOrders(); // Refresh the list
        alert(`Purchase Order #${poId} has been CANCELLED.`);
      } catch (error) {
        console.error("Error cancelling purchase order:", error);
        alert("Failed to cancel purchase order.");
      }
    }
  };

  const handleDelete = async (poId) => {
    if (window.confirm(`Are you sure you want to DELETE Purchase Order #${poId}? This action cannot be undone.`)) {
      try {
        await inventoryAPI.deletePurchaseOrder(poId);
        fetchPurchaseOrders(); // Refresh the list
        alert(`Purchase Order #${poId} has been DELETED.`);
      } catch (error) {
        console.error("Error deleting purchase order:", error);
        alert("Failed to delete purchase order.");
      }
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading purchase orders...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Purchase Bills</h1>
        <Link
          to="/purchase-bill/create" // Assuming a route for creating new purchase bills
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Create New Purchase Bill
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by PO ID, Supplier, or Status..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PO ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPurchaseOrders.length > 0 ? (
              filteredPurchaseOrders.map((po) => (
                <tr key={po.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{po.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {po.supplier_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(po.order_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    ₹{po.total_amount ? parseFloat(po.total_amount).toFixed(2) : '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        po.status === 'RECEIVED'
                          ? 'bg-green-100 text-green-800'
                          : po.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : po.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : po.status === 'PARTIALLY_RECEIVED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {po.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleEdit(po.id)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        title="Edit Purchase Order"
                      >
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => handleReceiveItems(po.id)}
                        className="text-green-600 hover:text-green-900 flex items-center"
                        title="Receive Items"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Receive Items
                      </button>
                      <button
                        onClick={() => handleReturnItems(po.id)}
                        className="text-yellow-600 hover:text-yellow-900 flex items-center"
                        title="Return Items"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" /> Return Items
                      </button>
                      <button
                        onClick={() => handleCancelPO(po.id)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                        title="Cancel Purchase Order"
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Cancel PO
                      </button>
                      <button
                        onClick={() => handleDelete(po.id)}
                        className="text-gray-600 hover:text-gray-900 flex items-center"
                        title="Delete Purchase Order"
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                  No purchase orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseBillPage;
