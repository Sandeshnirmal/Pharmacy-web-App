// Enhanced Medicine Form Component
// Based on the enhanced backend Product model with compositions support

import React, { useState, useEffect } from 'react';
import { productAPI, apiUtils } from '../api/apiService';

const EnhancedMedicineForm = ({ medicine, onSave, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    brand_name: '',
    generic_name: '',
    manufacturer: 'MedCorp',
    medicine_type: 'tablet',
    prescription_type: 'otc',
    strength: '',
    form: '',
    dosage_form: '',
    pack_size: '',
    packaging_unit: '',
    price: '',
    mrp: '',
    stock_quantity: 0,
    min_stock_level: 10,
    description: '',
    uses: '',
    side_effects: '',
    how_to_use: '',
    precautions: '',
    storage: '',
    image_url: '',
    hsn_code: '',
    category: '',
    is_active: true,
    is_featured: false,
    is_prescription_required: false,
  });

  const [categories, setCategories] = useState([]);
  const [generics, setGenerics] = useState([]);
  const [compositions, setCompositions] = useState([]);
  const [selectedCompositions, setSelectedCompositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Medicine type options
  const medicineTypes = [
    { value: 'tablet', label: 'Tablet' },
    { value: 'capsule', label: 'Capsule' },
    { value: 'syrup', label: 'Syrup' },
    { value: 'injection', label: 'Injection' },
    { value: 'cream', label: 'Cream' },
    { value: 'drops', label: 'Drops' },
    { value: 'inhaler', label: 'Inhaler' },
    { value: 'other', label: 'Other' },
  ];

  // Prescription type options
  const prescriptionTypes = [
    { value: 'otc', label: 'Over The Counter' },
    { value: 'prescription', label: 'Prescription Required' },
    { value: 'controlled', label: 'Controlled Substance' },
  ];

  useEffect(() => {
    loadFormData();
    if (isEdit && medicine) {
      populateFormData(medicine);
    }
  }, [medicine, isEdit]);

  const loadFormData = async () => {
    try {
      const [categoriesRes, genericsRes, compositionsRes] = await Promise.allSettled([
        productAPI.getCategories(),
        productAPI.getGenericNames(),
        productAPI.getCompositions(),
      ]);

      if (categoriesRes.status === 'fulfilled') {
        setCategories(categoriesRes.value.data || []);
      }

      if (genericsRes.status === 'fulfilled') {
        setGenerics(genericsRes.value.data || []);
      }

      if (compositionsRes.status === 'fulfilled') {
        setCompositions(compositionsRes.value.data || []);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const populateFormData = (medicine) => {
    setFormData({
      ...formData,
      ...medicine,
      generic_name: medicine.generic_name?.id || medicine.generic_name,
      category: medicine.category?.id || medicine.category,
    });

    // Set selected compositions if available
    if (medicine.compositions) {
      setSelectedCompositions(medicine.compositions);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCompositionAdd = (compositionId) => {
    const composition = compositions.find(c => c.id === compositionId);
    if (composition && !selectedCompositions.find(c => c.id === compositionId)) {
      setSelectedCompositions(prev => [...prev, { ...composition, strength: '', unit: 'mg' }]);
    }
  };

  const handleCompositionRemove = (compositionId) => {
    setSelectedCompositions(prev => prev.filter(c => c.id !== compositionId));
  };

  const handleCompositionStrengthChange = (compositionId, strength, unit) => {
    setSelectedCompositions(prev =>
      prev.map(c =>
        c.id === compositionId ? { ...c, strength, unit } : c
      )
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Medicine name is required';
    if (!formData.generic_name) newErrors.generic_name = 'Generic name is required';
    if (!formData.manufacturer.trim()) newErrors.manufacturer = 'Manufacturer is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Valid price is required';
    if (!formData.mrp || formData.mrp <= 0) newErrors.mrp = 'Valid MRP is required';
    if (parseFloat(formData.price) > parseFloat(formData.mrp)) {
      newErrors.price = 'Price cannot be greater than MRP';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const medicineData = {
        ...formData,
        compositions: selectedCompositions.map(c => ({
          composition_id: c.id,
          strength: c.strength,
          unit: c.unit || 'mg'
        }))
      };

      let response;
      if (isEdit) {
        response = await productAPI.updateProduct(medicine.id, medicineData);
      } else {
        response = await productAPI.createProduct(medicineData);
      }

      onSave(response.data);
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      setErrors({ submit: errorInfo.message });
    } finally {
      setLoading(false);
    }
  };

  const FormField = ({ label, name, type = 'text', required = false, options = null, ...props }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'select' ? (
        <select
          name={name}
          value={formData[name]}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors[name] ? 'border-red-500' : 'border-gray-300'
          }`}
          {...props}
        >
          <option value="">Select {label}</option>
          {options?.map(option => (
            <option key={option.value || option.id} value={option.value || option.id}>
              {option.label || option.name}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          name={name}
          value={formData[name]}
          onChange={handleInputChange}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors[name] ? 'border-red-500' : 'border-gray-300'
          }`}
          {...props}
        />
      ) : type === 'checkbox' ? (
        <div className="flex items-center">
          <input
            type="checkbox"
            name={name}
            checked={formData[name]}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            {...props}
          />
          <span className="ml-2 text-sm text-gray-600">{label}</span>
        </div>
      ) : (
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors[name] ? 'border-red-500' : 'border-gray-300'
          }`}
          {...props}
        />
      )}
      {errors[name] && <p className="mt-1 text-sm text-red-500">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Medicine' : 'Add New Medicine'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {errors.submit && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
              
              <FormField
                label="Medicine Name"
                name="name"
                required
                placeholder="Enter medicine name"
              />

              <FormField
                label="Brand Name"
                name="brand_name"
                placeholder="Enter brand name (optional)"
              />

              <FormField
                label="Generic Name"
                name="generic_name"
                type="select"
                required
                options={generics}
              />

              <FormField
                label="Manufacturer"
                name="manufacturer"
                required
                placeholder="Enter manufacturer name"
              />

              <FormField
                label="Medicine Type"
                name="medicine_type"
                type="select"
                required
                options={medicineTypes}
              />

              <FormField
                label="Prescription Type"
                name="prescription_type"
                type="select"
                required
                options={prescriptionTypes}
              />
            </div>

            {/* Dosage & Packaging */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Dosage & Packaging</h3>
              
              <FormField
                label="Strength"
                name="strength"
                placeholder="e.g., 500mg"
              />

              <FormField
                label="Dosage Form"
                name="dosage_form"
                placeholder="e.g., 500mg, 10ml"
              />

              <FormField
                label="Pack Size"
                name="pack_size"
                placeholder="e.g., 10 Tablets, 100ml"
              />

              <FormField
                label="Packaging Unit"
                name="packaging_unit"
                placeholder="e.g., Box, Strip, Bottle"
              />

              <FormField
                label="HSN Code"
                name="hsn_code"
                placeholder="Enter HSN code"
              />

              <FormField
                label="Category"
                name="category"
                type="select"
                options={categories}
              />
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Pricing & Inventory</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                label="Price (₹)"
                name="price"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
              />

              <FormField
                label="MRP (₹)"
                name="mrp"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="0.00"
              />

              <FormField
                label="Stock Quantity"
                name="stock_quantity"
                type="number"
                min="0"
                placeholder="0"
              />

              <FormField
                label="Min Stock Level"
                name="min_stock_level"
                type="number"
                min="0"
                placeholder="10"
              />
            </div>
          </div>

          {/* Compositions */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Compositions</h3>
            
            <div className="mb-4">
              <select
                onChange={(e) => handleCompositionAdd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Add Composition</option>
                {compositions.map(comp => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCompositions.length > 0 && (
              <div className="space-y-2">
                {selectedCompositions.map(comp => (
                  <div key={comp.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <span className="flex-1">{comp.name}</span>
                    <input
                      type="text"
                      placeholder="Strength"
                      value={comp.strength || ''}
                      onChange={(e) => handleCompositionStrengthChange(comp.id, e.target.value, comp.unit)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <select
                      value={comp.unit || 'mg'}
                      onChange={(e) => handleCompositionStrengthChange(comp.id, comp.strength, e.target.value)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="mg">mg</option>
                      <option value="ml">ml</option>
                      <option value="g">g</option>
                      <option value="%">%</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleCompositionRemove(comp.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medicine Information */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FormField
                label="Description"
                name="description"
                type="textarea"
                placeholder="Enter medicine description"
              />

              <FormField
                label="Uses"
                name="uses"
                type="textarea"
                placeholder="Medical uses and indications"
              />

              <FormField
                label="How to Use"
                name="how_to_use"
                type="textarea"
                placeholder="Dosage and administration instructions"
              />
            </div>

            <div className="space-y-4">
              <FormField
                label="Side Effects"
                name="side_effects"
                type="textarea"
                placeholder="Possible side effects"
              />

              <FormField
                label="Precautions"
                name="precautions"
                type="textarea"
                placeholder="Warnings and precautions"
              />

              <FormField
                label="Storage"
                name="storage"
                type="textarea"
                placeholder="Storage conditions"
              />
            </div>
          </div>

          {/* Additional Options */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Additional Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Active Medicine"
                name="is_active"
                type="checkbox"
              />

              <FormField
                label="Featured Medicine"
                name="is_featured"
                type="checkbox"
              />

              <FormField
                label="Prescription Required (Legacy)"
                name="is_prescription_required"
                type="checkbox"
              />
            </div>

            <FormField
              label="Image URL"
              name="image_url"
              type="url"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Medicine' : 'Add Medicine')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedMedicineForm;
