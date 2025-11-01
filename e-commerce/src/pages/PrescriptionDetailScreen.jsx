import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import { prescriptionAPI } from '../api/apiService.js'; // Import prescriptionAPI

const PrescriptionDetailScreen = () => {
  const { prescriptionId } = useParams();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth(); // Use isAuthenticated
  const navigate = useNavigate();
  const { addNotification } = useNotification(); // Use addNotification

  useEffect(() => {
    const fetchPrescriptionDetails = async () => {
      if (!isAuthenticated) { // Check isAuthenticated
        addNotification('You must be logged in to view prescription details.', 'error');
        navigate('/login');
        return;
      }

      try {
        const response = await prescriptionAPI.getPrescriptionById(prescriptionId); // Use the mobile-specific API
        
        if (response.success) {
          setPrescription(response.data);
          console.log(response.data)
        } else {
          throw new Error(response.error || 'Failed to fetch prescription details.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to fetch prescription details.');
        addNotification(err.message || 'Error fetching prescription details.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptionDetails();
  }, [prescriptionId, isAuthenticated, navigate, addNotification]); // Update dependencies

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading prescription details...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">Error: {error}</div>;
  }

  if (!prescription) {
    return <div className="container mx-auto p-4 text-center">No prescription found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Prescription Details</h1>
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-lg space-y-6">
        {/* General Prescription Info */}
        <section className="border-b pb-4">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">General Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
            <p><strong>Prescription ID:</strong> {prescription.id}</p>
            <p><strong>Status:</strong> <span className={`font-medium ${prescription.status === 'verified' ? 'text-green-600' : 'text-orange-500'}`}>{prescription.status}</span></p>
            <p><strong>Uploaded On:</strong> {new Date(prescription.upload_date).toLocaleString()}</p>
            <p><strong>Last Updated:</strong> {new Date(prescription.updated_at).toLocaleString()}</p>
            {prescription.prescription_number && <p><strong>Prescription Number:</strong> {prescription.prescription_number}</p>}
          </div>
        </section>

        {/* User Information */}
        <section className="border-b pb-4">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
            <p><strong>User Name:</strong> {prescription.user_name}</p>
            <p><strong>User Email:</strong> {prescription.user_email}</p>
            <p><strong>User Phone:</strong> {prescription.user_phone}</p>
          </div>
        </section>

        {/* Doctor & Patient Information */}
        {(prescription.doctor_name || prescription.patient_name) && (
          <section className="border-b pb-4">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Doctor & Patient Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
              {prescription.doctor_name && <p><strong>Doctor Name:</strong> {prescription.doctor_name}</p>}
              {prescription.doctor_license && <p><strong>Doctor License:</strong> {prescription.doctor_license}</p>}
              {prescription.hospital_clinic && <p><strong>Hospital/Clinic:</strong> {prescription.hospital_clinic}</p>}
              {prescription.patient_name && <p><strong>Patient Name:</strong> {prescription.patient_name}</p>}
              {prescription.patient_age && <p><strong>Patient Age:</strong> {prescription.patient_age}</p>}
              {prescription.patient_gender && <p><strong>Patient Gender:</strong> {prescription.patient_gender}</p>}
              {prescription.prescription_date && <p><strong>Prescription Date:</strong> {new Date(prescription.prescription_date).toLocaleDateString()}</p>}
            </div>
          </section>
        )}

        {/* Prescription Image */}
        {prescription.image_url && (
          <section className="border-b pb-4">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Prescription Image</h2>
            <div className="flex justify-center">
              <img src={prescription.image_url} alt="Prescription" className="max-w-full h-auto rounded-lg shadow-sm border border-gray-200" />
            </div>
          </section>
        )}

        {/* AI Processing Details */}
        <section className="border-b pb-4">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">AI Processing & Verification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
            <p><strong>AI Processed:</strong> {prescription.ai_processed ? 'Yes' : 'No'}</p>
            {prescription.ai_confidence_score && <p><strong>AI Confidence:</strong> {(prescription.ai_confidence_score * 100).toFixed(2)}%</p>}
            {prescription.ai_processing_time && <p><strong>AI Processing Time:</strong> {prescription.ai_processing_time}s</p>}
            <p><strong>Verification Status:</strong> <span className={`font-medium ${prescription.verification_status === 'Verified' ? 'text-green-600' : 'text-orange-500'}`}>{prescription.verification_status}</span></p>
            {prescription.verified_by_name && <p><strong>Verified By:</strong> {prescription.verified_by_name}</p>}
            {prescription.verification_date && <p><strong>Verification Date:</strong> {new Date(prescription.verification_date).toLocaleString()}</p>}
            {prescription.rejection_reason && <p className="col-span-2 text-red-600"><strong>Rejection Reason:</strong> {prescription.rejection_reason}</p>}
            {prescription.pharmacist_notes && <p className="col-span-2"><strong>Pharmacist Notes:</strong> {prescription.pharmacist_notes}</p>}
            {prescription.clarification_notes && <p className="col-span-2"><strong>Clarification Notes:</strong> {prescription.clarification_notes}</p>}
          </div>
        </section>

        {/* Extracted Medicines */}
        {prescription.prescription_medicines && prescription.prescription_medicines.length > 0 && (
          <section className="border-b pb-4">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Extracted Medicines</h2>
            <div className="space-y-4">
              {prescription.prescription_medicines.map((medicine, index) => (
                <div key={medicine.id} className="bg-gray-50 p-4 rounded-md shadow-sm border border-gray-100">
                  <p className="font-semibold text-gray-800">Medicine {index + 1}: {medicine.extracted_medicine_name}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mt-2">
                    {medicine.extracted_dosage && <p><strong>Dosage:</strong> {medicine.extracted_dosage}</p>}
                    {medicine.extracted_quantity && <p><strong>Quantity:</strong> {medicine.extracted_quantity}</p>}
                    {medicine.extracted_frequency && <p><strong>Frequency:</strong> {medicine.extracted_frequency}</p>}
                    {medicine.extracted_duration && <p><strong>Duration:</strong> {medicine.extracted_duration}</p>}
                    {medicine.extracted_instructions && <p className="col-span-2"><strong>Instructions:</strong> {medicine.extracted_instructions}</p>}
                    <p><strong>Valid for Order:</strong> {medicine.is_valid_for_order ? 'Yes' : 'No'}</p>
                    <p><strong>Verification Status:</strong> <span className={`font-medium ${medicine.verification_status === 'verified' ? 'text-green-600' : 'text-orange-500'}`}>{medicine.verification_status}</span></p>
                    {medicine.pharmacist_comment && <p className="col-span-2"><strong>Pharmacist Comment:</strong> {medicine.pharmacist_comment}</p>}
                  </div>
                  {medicine.mapped_product && (
                    <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-md">
                      <h3 className="font-semibold text-teal-700">Mapped Product:</h3>
                      <p className="text-sm text-teal-600"><strong>Name:</strong> {medicine.mapped_product.name} ({medicine.mapped_product.brand_name})</p>
                      <p className="text-sm text-teal-600"><strong>Price:</strong> ${medicine.mapped_product.price}</p>
                      <p className="text-sm text-teal-600"><strong>Strength:</strong> {medicine.mapped_product.strength}</p>
                      <p className="text-sm text-teal-600"><strong>Manufacturer:</strong> {medicine.mapped_product.manufacturer}</p>
                    </div>
                  )}
                  {medicine.suggested_products && medicine.suggested_products.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <h3 className="font-semibold text-blue-700">Suggested Alternatives:</h3>
                      <ul className="list-disc list-inside text-sm text-blue-600">
                        {medicine.suggested_products.map(sp => (
                          <li key={sp.id}>{sp.name} (${sp.price}) - {sp.manufacturer}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Raw OCR Text */}
        {prescription.ocr_text && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Raw OCR Text</h2>
            <div className="bg-gray-100 p-4 rounded-md text-sm text-gray-700 whitespace-pre-wrap">
              {prescription.ocr_text}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default PrescriptionDetailScreen;
