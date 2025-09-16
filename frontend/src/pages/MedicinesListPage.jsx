import { useState, useEffect } from 'react';
import { productAPI, apiUtils } from '../api/apiService';
import EnhancedMedicineForm from '../components/EnhancedMedicineForm';

const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productAPI.getProducts();
      setMedicines(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setError(errorInfo.message);
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = () => {
    setEditingMedicine(null);
    setShowModal(true);
  };

  const handleEditMedicine = (medicine) => {
    setEditingMedicine(medicine);
    setShowModal(true);
  };

  const handleDeleteMedicine = async (medicineId) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return;
    try {
      await productAPI.deleteProduct(medicineId);
      setMedicines(prev => prev.filter(m => m.id !== medicineId));
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      alert(`Error deleting medicine: ${errorInfo.message}`);
    }
  };

  const handleSaveMedicine = (savedMedicine) => {
    if (editingMedicine) {
      setMedicines(prev => prev.map(m => m.id === savedMedicine.id ? savedMedicine : m));
    } else {
      setMedicines(prev => [...prev, savedMedicine]);
    }
    setShowModal(false);
    setEditingMedicine(null);
  };

  const handleCancelForm = () => {
    setShowModal(false);
    setEditingMedicine(null);
  };

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.brand_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'active' && medicine.is_active) ||
      (filterType === 'inactive' && !medicine.is_active) ||
      (filterType === 'prescription' && medicine.prescription_type === 'prescription') ||
      (filterType === 'otc' && medicine.prescription_type === 'otc');

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Medicines Management</h1>
        <button
          onClick={handleAddMedicine}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Medicine
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search medicines..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="sm:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Medicines</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
          <option value="prescription">Prescription Required</option>
          <option value="otc">Over The Counter</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button onClick={fetchMedicines} className="ml-2 text-red-800 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading medicines...</span>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type & Strength</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pricing</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMedicines.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm || filterType !== 'all'
                        ? 'No medicines found matching your criteria.'
                        : 'No medicines available. Add your first medicine to get started.'}
                    </td>
                  </tr>
                ) : (
                  filteredMedicines.map((medicine) => (
                    <tr key={medicine.id} className="hover:bg-gray-50">
                      {/* Medicine info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <img
                              className="h-12 w-12 rounded-lg object-cover"
                              src={medicine.image_url || 'https://placehold.co/48x48/e0e0e0/888?text=Med'}
                              alt={medicine.name}
                              onError={(e) => {
                                e.target.src = 'https://placehold.co/48x48/e0e0e0/888?text=Med';
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{medicine.name}</div>
                            <div className="text-sm text-gray-500">
                              {medicine.brand_name && `${medicine.brand_name} • `}
                              {medicine.manufacturer}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type & Strength */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {medicine.medicine_type?.charAt(0).toUpperCase() + medicine.medicine_type?.slice(1)}
                        </div>
                        <div className="text-sm text-gray-500">{medicine.strength || medicine.dosage_form}</div>
                      </td>

                      {/* Pricing */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{medicine.price}</div>
                        <div className="text-sm text-gray-500">MRP: ₹{medicine.mrp}</div>
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{medicine.stock_quantity || 0}</div>
                        <div className={`text-sm ${
                          (medicine.stock_quantity || 0) <= (medicine.min_stock_level || 0)
                            ? 'text-red-500'
                            : 'text-gray-500'
                        }`}>
                          Min: {medicine.min_stock_level || 0}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            medicine.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {medicine.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            medicine.prescription_type === 'prescription' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {medicine.prescription_type === 'prescription' ? 'Rx' : 'OTC'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => handleEditMedicine(medicine)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                          Edit
                        </button>
                        <button onClick={() => handleDeleteMedicine(medicine.id)} className="text-red-600 hover:text-red-900">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <EnhancedMedicineForm
          medicine={editingMedicine}
          onSave={handleSaveMedicine}
          onCancel={handleCancelForm}
          isEdit={!!editingMedicine}
        />
      )}
    </div>
  );
};

export default Medicines;
