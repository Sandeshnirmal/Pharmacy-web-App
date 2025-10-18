import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../api/apiService';
import { Link, useSearchParams } from 'react-router-dom'; // For linking and URL params
import PurchaseReturnCreateForm from './PurchaseReturnCreateForm'; // Import the new form

const PurchaseBillReturn = () => {
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const poId = searchParams.get('poId'); // Get purchase order ID from URL

  const [showCreateForm, setShowCreateForm] = useState(false); // State to control form visibility
  const [currentPurchaseOrder, setCurrentPurchaseOrder] = useState(null); // To hold PO data for the form
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const fetchPurchaseOrdersAndReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const returnsResponse = await inventoryAPI.getPurchaseReturns();
      setPurchaseReturns(returnsResponse.data.results || returnsResponse.data);
    } catch (err) {
      setError('Failed to fetch purchase returns.');
      console.error('Error fetching purchase returns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrdersAndReturns();
  }, []);

  // Effect to fetch specific Purchase Order details if poId is in URL
  useEffect(() => {
    const fetchPurchaseOrderDetails = async () => {
      if (poId) {
        setFormLoading(true);
        setFormError(null);
        try {
          const response = await inventoryAPI.getPurchaseOrder(poId);
          setCurrentPurchaseOrder(response.data);
          setShowCreateForm(true); // Show form if poId is present
        } catch (err) {
          setFormError(`Failed to load Purchase Order #${poId} details.`);
          console.error(`Error fetching Purchase Order ${poId}:`, err);
        } finally {
          setFormLoading(false);
        }
      } else {
        setCurrentPurchaseOrder(null);
        setShowCreateForm(false); // Hide form if no poId
      }
    };

    fetchPurchaseOrderDetails();
  }, [poId]);

  const handleFormClose = () => {
    setCurrentPurchaseOrder(null); // Clear the PO data
    setShowCreateForm(false); // Hide the form
    fetchPurchaseOrdersAndReturns(); // Refresh the list of returns
  };

  const handleInitiateNewReturnClick = () => {
    setCurrentPurchaseOrder(null); // Ensure no PO is pre-selected
    setShowCreateForm(true); // Show the form for a new return
  };

  const filteredReturns = purchaseReturns.filter(pr =>
    pr.id.toString().includes(searchTerm.toLowerCase()) ||
    pr.purchase_order_id.toString().includes(searchTerm.toLowerCase()) ||
    pr.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pr.reason && pr.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading || formLoading) {
    return <div className="p-6 text-center">Loading data...</div>;
  }

  if (error || formError) {
    return <div className="p-6 text-center text-red-500">{error || formError}</div>;
  }

  if (showCreateForm && currentPurchaseOrder) { // Render form if explicitly shown and PO data is ready
    return (
      <PurchaseReturnCreateForm
        purchaseOrder={currentPurchaseOrder}
        onClose={handleFormClose}
        onReturnSuccess={handleFormClose} // Close form and refresh list on success
      />
    );
  }

  if (showCreateForm && !currentPurchaseOrder && !poId) { // Render form for new return without pre-selected PO
    return (
      <PurchaseReturnCreateForm
        purchaseOrder={null} // No pre-selected PO
        onClose={handleFormClose}
        onReturnSuccess={handleFormClose}
      />
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Purchase Bill Returns</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Search by Return ID, PO ID, Supplier, or Reason..."
            className="p-2 border border-gray-300 rounded-md w-1/3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            onClick={handleInitiateNewReturnClick}
          >
            Initiate New Return
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Return ID
                </th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  PO ID
                </th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Return Date
                </th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Reason
                </th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                {/* <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th> */}
              </tr>
            </thead>
            <tbody>
              {filteredReturns.length > 0 ? (
                filteredReturns.map((pr) => (
                  <tr key={pr.id}>
                    <td className="py-2 px-4 border-b border-gray-200">{pr.id}</td>
                    <td className="py-2 px-4 border-b border-gray-200">
                      <Link to={`/purchase-bill/inventory-upload?poId=${pr.purchase_order_id}`} className="text-blue-600 hover:underline">
                        {pr.purchase_order_id}
                      </Link>
                    </td>
                    <td className="py-2 px-4 border-b border-gray-200">{pr.supplier_name}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{pr.return_date}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{parseFloat(pr.total_amount).toFixed(2)}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{pr.reason}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{pr.status}</td>
                    {/* <td className="py-2 px-4 border-b border-gray-200">
                      <button className="text-blue-600 hover:text-blue-900 mr-2">View Details</button>
                    </td> */}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
                    No purchase returns found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseBillReturn;
