import React, { useState } from 'react';
import { Plus as PlusIcon, ArrowLeft as ArrowLeftIcon } from 'lucide-react';

// Medicines List Page Component
const MedicinesListPage = ({ onAddMedicineClick }) => {
  const medicines = [
    { id: 1, image: 'https://placehold.co/40x40/f0f0f0/333?text=A', name: 'Doxofur', brand: 'MedCorp', type: 'Pain Relif', strength: '25mg', price: '25.99', stock: 50 },
    { id: 2, image: 'https://placehold.co/40x40/f0f0f0/333?text=B', name: 'Acetaminophen', brand: 'MedCorp', type: 'Pain Relif', strength: '500mg', price: '44.80', stock: 220 },
    { id: 3, image: 'https://placehold.co/40x40/f0f0f0/333?text=C', name: 'Amoxicillin', brand: 'MedCorp', type: 'Antibiotic', strength: '250mg', price: '21.99', stock: 100 },
    { id: 4, image: 'https://placehold.co/40x40/f0f0f0/333?text=D', name: 'Lisinopril', brand: 'MedCorp', type: 'Blood Pressure', strength: '10mg', price: '18.70', stock: 90 },
    { id: 5, image: 'https://placehold.co/40x40/f0f0f0/333?text=E', name: 'Metformin', brand: 'MedCorp', type: 'Diabetes', strength: '500mg', price: '12.39', stock: 80 },
    { id: 6, image: 'https://placehold.co/40x40/f0f0f0/333?text=F', name: 'Atorvastatin', brand: 'MedCorp', type: 'Cholesterol', strength: '20mg', price: '27.49', stock: 65 },
    { id: 7, image: 'https://placehold.co/40x40/f0f0f0/333?text=G', name: 'Levothyroxine', brand: 'MedCorp', type: 'Thyroid', strength: '100mcg', price: '10.99', stock: 70 },
    { id: 8, image: 'https://placehold.co/40x40/f0f0f0/333?text=H', name: 'Omeprazole', brand: 'MedCorp', type: 'Acid Reflux', strength: '20mg', price: '15.50', stock: 55 },
    { id: 9, image: 'https://placehold.co/40x40/f0f0f0/333?text=I', name: 'Sertraline', brand: 'MedCorp', type: 'Antidepressant', strength: '50mg', price: '21.20', stock: 120 },
    { id: 10, image: 'https://placehold.co/40x40/f0f0f0/333?text=J', name: 'Albuterol', brand: 'MedCorp', type: 'Asthma', strength: '90mcg', price: '14.70', stock: 20 },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Medicines</h1>
        <button
          onClick={onAddMedicineClick}
          className="flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Medicine
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-blue-50 border-b border-gray-200 text-blue-700 text-left text-sm uppercase font-semibold">
                <th className="px-5 py-3 rounded-tl-lg">Image</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Brand</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Strength</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3 rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med, index) => (
                <tr key={med.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200 last:border-b-0`}>
                  <td className="px-5 py-4 text-sm text-gray-900">
                    <img src={med.image} alt={med.name} className="w-10 h-10 rounded-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/40x40/e0e0e0/888?text=N/A"; }} />
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-900">{med.name}</td>
                  <td className="px-5 py-4 text-sm text-gray-900">{med.brand}</td>
                  <td className="px-5 py-4 text-sm text-gray-900">{med.type}</td>
                  <td className="px-5 py-4 text-sm text-gray-900">{med.strength}</td>
                  <td className="px-5 py-4 text-sm text-gray-900">${med.price}</td>
                  <td className="px-5 py-4 text-sm text-gray-900">{med.stock}</td>
                  <td className="px-5 py-4 text-sm">
                    <button className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};


// Add/Edit Medicine Form Component
const AddMedicineForm = ({ onGoBack }) => {
  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add/Edit Medicine</h1>
        <button
          onClick={onGoBack}
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
        <div>
          <label htmlFor="brandName" className="block text-gray-700 text-sm font-bold mb-2">Brand Name</label>
          <input type="text" id="brandName" placeholder="Enter brand name" className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label htmlFor="genericComposition" className="block text-gray-700 text-sm font-bold mb-2">Generic Composition</label>
          <input type="text" id="genericComposition" placeholder="Enter generic composition" className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description</label>
          <textarea id="description" placeholder="Enter description" rows="4" className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
        </div>
        <div>
          <label htmlFor="uses" className="block text-gray-700 text-sm font-bold mb-2">Uses</label>
          <textarea id="uses" placeholder="Enter uses" rows="4" className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
        </div>
        <div>
          <label htmlFor="dosage" className="block text-gray-700 text-sm font-bold mb-2">Dosage</label>
          <input type="text" id="dosage" placeholder="Enter dosage" className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        {/* Upload Image Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <p className="text-gray-500 mb-4">Drag and drop to upload or</p>
            <button className="bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors duration-200">
                Browse
            </button>
        </div>
        <div>
          <label htmlFor="inventoryCount" className="block text-gray-700 text-sm font-bold mb-2">Inventory Count</label>
          <input type="number" id="inventoryCount" placeholder="Enter inventory count" className="shadow-sm appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div className="flex items-center">
          <input type="checkbox" id="prescriptionRequired" className="form-checkbox h-5 w-5 text-blue-600 rounded" />
          <label htmlFor="prescriptionRequired" className="ml-2 text-gray-700 text-sm font-bold">Is Prescription Required?</label>
        </div>
        <div className="flex justify-end">
          <button className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200">
            Save
          </button>
        </div>
      </div>
    </>
  );
};


function Medicine() {
  // State to manage the sub-page within 'Medicines' section
  const [medicineSubPage, setMedicineSubPage] = useState('list'); // 'list' or 'add'

  const handleAddMedicineClick = () => {
    setMedicineSubPage('add');
  };

  const handleGoBackFromAddMedicine = () => {
    setMedicineSubPage('list');
  };

  return (
    <div className="flex-1 p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
      {medicineSubPage === 'list' ? (
        <MedicinesListPage onAddMedicineClick={handleAddMedicineClick} />
      ) : (
        <AddMedicineForm onGoBack={handleGoBackFromAddMedicine} />
      )}
    </div>
  );
}

export default Medicine;
