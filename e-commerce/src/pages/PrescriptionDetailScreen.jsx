import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import { prescriptionAPI } from '../api/apiService.js'; // Import prescriptionAPI
import { Info, User, Stethoscope, Image, Bot, Pill, FileText, ArrowLeft, XCircle, CheckCircle, Loader2 } from 'lucide-react';

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

  const getStatusBadge = (status) => {
    if (!status) {
      return <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">N/A</span>;
    }
    let colorClass = '';
    let displayStatus = status; // Default to original status

    if (!status) {
      return <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">N/A</span>;
    }

    switch (status.toLowerCase()) {
      case 'pending':
      case 'pending_verification':
        colorClass = 'bg-orange-100 text-orange-800';
        displayStatus = 'Pending Verification';
        break;
      case 'processing':
        colorClass = 'bg-blue-100 text-blue-800';
        break;
      case 'verified':
        colorClass = 'bg-green-100 text-green-800';
        break;
      case 'rejected':
        colorClass = 'bg-red-100 text-red-800';
        break;
      case 'pending_review':
        colorClass = 'bg-yellow-100 text-yellow-800';
        displayStatus = 'Pending Review';
        break;
      default:
        colorClass = 'bg-gray-100 text-gray-800';
    }
    return <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${colorClass}`}>{displayStatus}</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
        <p className="ml-3 text-lg text-gray-600">Loading prescription details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <XCircle className="h-16 w-16 text-red-500 mb-4" />
        <p className="text-xl font-semibold text-red-600">Error loading prescription</p>
        <p className="text-gray-600 mt-2">{error}</p>
        <button
          onClick={() => navigate('/profile/prescription-history')}
          className="mt-6 px-6 py-3 bg-teal-500 text-white rounded-md shadow-md hover:bg-teal-600 transition-colors flex items-center"
        >
          <ArrowLeft className="h-5 w-5 mr-2" /> Back to History
        </button>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-xl font-semibold text-gray-700">No prescription found.</p>
        <button
          onClick={() => navigate('/profile/prescription-history')}
          className="mt-6 px-6 py-3 bg-teal-500 text-white rounded-md shadow-md hover:bg-teal-600 transition-colors flex items-center"
        >
          <ArrowLeft className="h-5 w-5 mr-2" /> Back to History
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/profile/prescription-history')}
            className="flex items-center text-teal-600 hover:text-teal-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Prescription History
          </button>
        </div>
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-10">Prescription Details</h1>
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100 space-y-8">
          {/* General Prescription Info */}
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center">
              <Info className="h-6 w-6 text-teal-500 mr-3" /> General Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700">
              <p><strong>Prescription ID:</strong> {prescription.prescription.id || 'N/A'}</p>
              <p><strong>Status:</strong> {getStatusBadge(prescription.prescription.status)}</p>
              <p><strong>Uploaded On:</strong> {prescription.prescription.upload_date ? new Date(prescription.prescription.upload_date).toLocaleString() : 'N/A'}</p>
              <p><strong>Last Updated:</strong> {prescription.prescription.updated_at ? new Date(prescription.prescription.updated_at).toLocaleString() : 'N/A'}</p>
              {prescription.prescription.prescription_number && <p><strong>Prescription Number:</strong> {prescription.prescription.prescription_number || 'N/A'}</p>}
            </div>
          </section>

          {/* User Information */}
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center">
              <User className="h-6 w-6 text-teal-500 mr-3" /> User Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700">
              <p><strong>User Name:</strong> {prescription.prescription.user_name || 'N/A'}</p>
              <p><strong>User Email:</strong> {prescription.prescription.user_email || 'N/A'}</p>
              <p><strong>User Phone:</strong> {prescription.prescription.user_phone || 'N/A'}</p>
            </div>
          </section>

          {/* Doctor & Patient Information */}
          {(prescription.prescription.doctor_name || prescription.prescription.patient_name || prescription.prescription.hospital_clinic || prescription.prescription.doctor_license || prescription.prescription.patient_age || prescription.prescription.patient_gender || prescription.prescription.prescription_date) && (
            <section className="border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center">
                <Stethoscope className="h-6 w-6 text-teal-500 mr-3" /> Doctor & Patient Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700">
                {prescription.prescription.doctor_name && <p><strong>Doctor Name:</strong> {prescription.prescription.doctor_name || 'N/A'}</p>}
                {prescription.prescription.doctor_license && <p><strong>Doctor License:</strong> {prescription.prescription.doctor_license || 'N/A'}</p>}
                {prescription.prescription.hospital_clinic && <p><strong>Hospital/Clinic:</strong> {prescription.prescription.hospital_clinic || 'N/A'}</p>}
                {prescription.prescription.patient_name && <p><strong>Patient Name:</strong> {prescription.prescription.patient_name || 'N/A'}</p>}
                {prescription.prescription.patient_age && <p><strong>Patient Age:</strong> {prescription.prescription.patient_age || 'N/A'}</p>}
                {prescription.prescription.patient_gender && <p><strong>Patient Gender:</strong> {prescription.prescription.patient_gender || 'N/A'}</p>}
                {prescription.prescription.prescription_date && <p><strong>Prescription Date:</strong> {new Date(prescription.prescription.prescription_date).toLocaleDateString() || 'N/A'}</p>}
              </div>
            </section>
          )}

          {/* Prescription Image */}
          {prescription.prescription.image_url && (
            <section className="border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center">
                <Image className="h-6 w-6 text-teal-500 mr-3" /> Prescription Image
              </h2>
              <div className="flex justify-center bg-gray-100 p-4 rounded-md">
                <img src={`http://localhost:8000${prescription.prescription.image_url}`} alt="Prescription" className="max-w-full h-auto rounded-lg shadow-sm border border-gray-200" />
              </div>
            </section>
          )}

          {/* AI Processing Details */}
          <section className="border-b border-gray-200 pb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center">
                <Bot className="h-6 w-6 text-teal-500 mr-3" /> AI Processing & Verification
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700">
              <p><strong>AI Processed:</strong> {prescription.prescription.ai_processed ? <CheckCircle className="inline h-4 w-4 text-green-500" /> : <XCircle className="inline h-4 w-4 text-red-500" />}</p>
              {prescription.prescription.ai_confidence_score && <p><strong>AI Confidence:</strong> <span className="font-medium">{(prescription.prescription.ai_confidence_score * 100).toFixed(2)}%</span></p>}
              {prescription.prescription.ai_processing_time && <p><strong>AI Processing Time:</strong> <span className="font-medium">{prescription.prescription.ai_processing_time || 'N/A'}s</span></p>}
              <p><strong>Verification Status:</strong> {getStatusBadge(prescription.prescription.verification_status)}</p>
              {prescription.prescription.verified_by_name && <p><strong>Verified By:</strong> {prescription.prescription.verified_by_name || 'N/A'}</p>}
              {prescription.prescription.verification_date && <p><strong>Verification Date:</strong> {new Date(prescription.prescription.verification_date).toLocaleString() || 'N/A'}</p>}
              {prescription.prescription.rejection_reason && <p className="col-span-2 text-red-600"><strong>Rejection Reason:</strong> <span className="font-medium">{prescription.prescription.rejection_reason || 'N/A'}</span></p>}
              {prescription.prescription.pharmacist_notes && <p className="col-span-2"><strong>Pharmacist Notes:</strong> <span className="font-medium">{prescription.prescription.pharmacist_notes || 'N/A'}</span></p>}
              {prescription.prescription.clarification_notes && <p className="col-span-2"><strong>Clarification Notes:</strong> <span className="font-medium">{prescription.prescription.clarification_notes || 'N/A'}</span></p>}
            </div>
          </section>

          {/* Extracted Medicines */}
          {prescription.prescription.prescription_medicines && prescription.prescription.prescription_medicines.length > 0 && (
            <section className="border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center">
                <Pill className="h-6 w-6 text-teal-500 mr-3" /> Extracted Medicines
              </h2>
              <div className="space-y-6">
                {prescription.prescription.prescription_medicines.map((medicine, index) => (
                  <div key={medicine.id} className="bg-gray-50 p-5 rounded-lg shadow-sm border border-gray-100">
                    <p className="font-bold text-lg text-teal-700 mb-3">Medicine {index + 1}: <span className="text-teal-700">{medicine.extracted_medicine_name || 'N/A'}</span></p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm text-gray-700">
                      {medicine.extracted_dosage && <p><strong>Dosage:</strong> {medicine.extracted_dosage || 'N/A'}</p>}
                      {medicine.extracted_quantity && <p><strong>Quantity:</strong> {medicine.extracted_quantity || 'N/A'}</p>}
                      {medicine.extracted_frequency && <p><strong>Frequency:</strong> {medicine.extracted_frequency || 'N/A'}</p>}
                      {medicine.extracted_duration && <p><strong>Duration:</strong> {medicine.extracted_duration || 'N/A'}</p>}
                      {medicine.extracted_instructions && <p className="col-span-2"><strong>Instructions:</strong> {medicine.extracted_instructions || 'N/A'}</p>}
                      <p><strong>Valid for Order:</strong> {medicine.is_valid_for_order ? <CheckCircle className="inline h-4 w-4 text-green-500" /> : <XCircle className="inline h-4 w-4 text-red-500" />}</p>
                      <p><strong>Verification Status:</strong> {getStatusBadge(medicine.verification_status)}</p>
                      {medicine.pharmacist_comment && <p className="col-span-2"><strong>Pharmacist Comment:</strong> {medicine.pharmacist_comment || 'N/A'}</p>}
                    </div>
                    {medicine.mapped_product && (
                      <div
                        className="mt-5 p-4 bg-teal-50 border border-teal-200 rounded-md cursor-pointer hover:bg-teal-100 transition-colors"
                        onClick={() => navigate(`/product/${medicine.mapped_product.id}`)}
                      >
                        <h3 className="font-bold text-teal-700 mb-2">Mapped Product:</h3>
                        <p className="text-sm text-teal-600"><strong>Name:</strong> {medicine.mapped_product.name || 'N/A'} ({medicine.mapped_product.brand_name || 'N/A'})</p>
                        <p className="text-sm text-teal-600"><strong>Price:</strong> ₹{medicine.mapped_product.price || 'N/A'}</p>
                        <p className="text-sm text-teal-600"><strong>Strength:</strong> {medicine.mapped_product.strength || 'N/A'}</p>
                        <p className="text-sm text-teal-600"><strong>Manufacturer:</strong> {medicine.mapped_product.manufacturer || 'N/A'}</p>
                      </div>
                    )}
                    {medicine.suggested_products && medicine.suggested_products.length > 0 && (
                      <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-md">
                        <h3 className="font-bold text-blue-700 mb-2">Suggested Alternatives:</h3>
                        <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                          {medicine.suggested_products.map(sp => (
                            <li key={sp.id}>{sp.name || 'N/A'} (₹{sp.price || 'N/A'}) - {sp.manufacturer || 'N/A'}</li>
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
          {prescription.prescription.ocr_text && (
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-5 flex items-center">
                <FileText className="h-6 w-6 text-teal-500 mr-3" /> Raw OCR Text
              </h2>
              <div className="bg-gray-100 p-5 rounded-md text-sm text-gray-700 whitespace-pre-wrap border border-gray-200">
                {prescription.prescription.ocr_text || 'N/A'}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionDetailScreen;
