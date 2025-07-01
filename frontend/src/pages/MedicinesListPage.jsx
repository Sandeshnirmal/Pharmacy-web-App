import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusIcon } from '@heroicons/react/24/solid';

const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    generic_name_id: '',
    strength: '',
    form: '',
    manufacturer: 'MedCorp',
    price: '',
    mrp: '',
    hsn_code: '',
    category_id: '',
    packaging_unit: '',
    pack_size: '',
    image_url: '',
    description: '',
    is_prescription_required: false,
  });

  const [categories, setCategories] = useState([]);
  const [generics, setGenerics] = useState([]);

  useEffect(() => {
    fetchMedicines();
    fetchCategories();
    fetchGenerics();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await axios.get('http://localhost:8000/product/products/');
      setMedicines(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:8000/product/categories/');
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchGenerics = async () => {
    try {
      const res = await axios.get('http://localhost:8000/product/generic-names/');
      setGenerics(res.data);
    } catch (error) {
      console.error('Error fetching generics:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      price: parseFloat(formData.price || 0),
      mrp: parseFloat(formData.mrp || 0),
      category_id: parseInt(formData.category_id),
      generic_name_id: parseInt(formData.generic_name_id),
    };

    try {
      await axios.post('http://localhost:8000/product/products/', payload);
      fetchMedicines();
      setShowModal(false);
      setFormData({
        name: '',
        generic_name_id: '',
        strength: '',
        form: '',
        manufacturer: 'MedCorp',
        price: '',
        mrp: '',
        hsn_code: '',
        category_id: '',
        packaging_unit: '',
        pack_size: '',
        image_url: '',
        description: '',
        is_prescription_required: false,
      });
    } catch (error) {
      console.error('Error submitting medicine:', error.response?.data || error.message);
    }
  };

  const onAddMedicineClick = () => setShowModal(true);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Medicines</h1>
        <button
          onClick={onAddMedicineClick}
          className="flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Medicine
        </button>
      </div>

      {/* Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-blue-50 text-blue-700 text-sm uppercase font-semibold">
              <th className="px-5 py-3">Image</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Brand</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Strength</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Stock</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((med, index) => (
              <tr key={med.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b`}>
                <td className="px-5 py-4">
                  <img
                    src={med.image_url}
                    alt={med.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/40x40/e0e0e0/888?text=N/A';
                    }}
                  />
                </td>
                <td className="px-5 py-4">{med.name}</td>
                <td className="px-5 py-4">{med.manufacturer}</td>
                <td className="px-5 py-4">{med.form}</td>
                <td className="px-5 py-4">{med.strength}</td>
                <td className="px-5 py-4">${med.price}</td>
                <td className="px-5 py-4">{med.stock || 0}</td>
                <td className="px-5 py-4">
                  <button className="text-blue-600 mr-3">Edit</button>
                  <button className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-semibold mb-4">Add New Medicine</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <input type="text" name="name" placeholder="Name" className="border px-2 py-1" onChange={handleChange} required />

              <select name="generic_name_id" className="border px-2 py-1" onChange={handleChange} required>
                <option value="">Select Generic</option>
                {generics.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>

              <input type="text" name="strength" placeholder="Strength" className="border px-2 py-1" onChange={handleChange} />
              <input type="text" name="form" placeholder="Form" className="border px-2 py-1" onChange={handleChange} />
              <input type="text" name="manufacturer" placeholder="Manufacturer" className="border px-2 py-1" onChange={handleChange} />
              <input type="number" name="price" placeholder="Price" className="border px-2 py-1" onChange={handleChange} />
              <input type="number" name="mrp" placeholder="MRP" className="border px-2 py-1" onChange={handleChange} />
              <input type="text" name="hsn_code" placeholder="HSN Code" className="border px-2 py-1" onChange={handleChange} />

              <select name="category_id" className="border px-2 py-1" onChange={handleChange} required>
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <input type="text" name="packaging_unit" placeholder="Packaging Unit" className="border px-2 py-1" onChange={handleChange} />
              <input type="text" name="pack_size" placeholder="Pack Size" className="border px-2 py-1" onChange={handleChange} />
              <input type="url" name="image_url" placeholder="Image URL" className="border px-2 py-1" onChange={handleChange} />

              <div className="col-span-2">
                <textarea name="description" placeholder="Description" className="w-full border px-2 py-1" onChange={handleChange}></textarea>
              </div>

              <div className="col-span-2 flex items-center space-x-2">
                <input type="checkbox" name="is_prescription_required" onChange={handleChange} />
                <label>Prescription Required</label>
              </div>

              <div className="col-span-2 flex justify-end mt-4 space-x-2">
                <button type="button" onClick={() => setShowModal(false)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Medicines;
