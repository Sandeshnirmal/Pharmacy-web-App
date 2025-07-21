import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';

const GenericsTable = () => {
  const [activeTab, setActiveTab] = useState('generics');
  const [genericsData, setGenericsData] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Fetch generics on load
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = () => {
    const endpoint = activeTab === 'generics' ? 'generic-names' : 'categories';
    axiosInstance.get(`product/${endpoint}/`)
      .then(res => {
        if (activeTab === 'generics') {
          setGenericsData(res.data);
        } else {
          setCategoriesData(res.data);
        }
      })
      .catch(err => console.error('Error fetching data:', err));
  };

  const handleAddNew = () => {
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = activeTab === 'generics' ? 'generic-names' : 'categories';
    try {
      await axiosInstance.post(`product/${endpoint}/`, formData);
      fetchData();
      setShowModal(false);
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 font-inter">
      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-200">
        <button
          className={`pb-2 px-4 font-medium ${activeTab === 'generics' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('generics')}
        >Generics</button>
        <button
          className={`pb-2 px-4 font-medium ${activeTab === 'categories' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('categories')}
        >Categories</button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-gray-800 capitalize">{activeTab}</h1>
        <button
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md shadow-md"
        >Add new</button>
      </div>

      {/* Table */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(activeTab === 'generics' ? genericsData : categoriesData).map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Add {activeTab.slice(0, -1)}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:ring focus:ring-blue-300"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  required
                  className="w-full mt-1 px-3 py-2 border rounded-md shadow-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium bg-gray-200 rounded-md"
                >Cancel</button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenericsTable;
