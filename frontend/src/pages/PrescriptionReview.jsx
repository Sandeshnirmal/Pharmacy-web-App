/*
================================================================================
  File: src/pages/PrescriptionReview.jsx
  Description: A single, self-contained file for previewing the 
               PrescriptionReview component with all mock data included.
================================================================================
*/

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  ChevronRight,
  Edit,
  Trash2,
  PlusCircle,
  ZoomIn,
} from "lucide-react";
import { prescriptionAPI, productAPI, apiUtils } from "../api/apiService";
import { toast } from 'react-toastify'; // Assuming a toast library is available

// Use environment variable for API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Utility function for prescription status display (moved from prescriptionService)
const prescriptionUtils = {
  getStatusDisplayName: (status) => {
    switch (status) {
      case 'Pending_Review': return 'Pending Review';
      case 'Verified': return 'Verified';
      case 'Rejected': return 'Rejected';
      case 'Uploaded': return 'Uploaded';
      default: return status;
    }
  }
};

const PrescriptionReview = () => {
  const PrescriptionStatusBadge = ({ status }) => {
    let bgColor = 'bg-gray-500'; // Default
    switch (status) {
      case 'Pending_Review':
        bgColor = 'bg-yellow-500';
        break;
      case 'Verified':
        bgColor = 'bg-green-500';
        break;
      case 'Rejected':
        bgColor = 'bg-red-500';
        break;
      default:
        bgColor = 'bg-blue-600';
    }
    return (
      <span className={`px-3 py-1 text-xs font-semibold text-white ${bgColor} rounded-full`}>
        {prescriptionUtils.getStatusDisplayName(status)}
      </span>
    );
  };

  const ConfidenceIndicator = ({ confidence }) => (
    <div className="flex items-center space-x-2">
      <div className="w-20 bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full"
          style={{ width: `${confidence}%` }}
        ></div>
      </div>
      <span
        className={`text-xs font-semibold ${
          confidence > 70 ? "text-green-600" : "text-yellow-600"
        }`}
      >
        {confidence}%
      </span>
    </div>
  );

  const { prescriptionId } = useParams();
  const navigate = useNavigate();

  const [prescription, setPrescription] = useState(null);
  const [prescriptionDetails, setPrescriptionDetails] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDetail, setEditingDetail] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [detailToDelete, setDetailToDelete] = useState(null);
  const [currentDetailId, setCurrentDetailId] = useState(null);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false); // New state for add medicine modal
  const [selectedMedicineToAdd, setSelectedMedicineToAdd] = useState(null); // New state for selected medicine in add modal
  const [medicineQuantity, setMedicineQuantity] = useState(1); // New state for medicine quantity
  const [addMedicineSearchTerm, setAddMedicineSearchTerm] = useState(""); // New state for add medicine search term

  const allItemsMapped =
    prescriptionDetails.length > 0 &&
    prescriptionDetails.every((detail) => detail.mapped_product);

  const fetchPrescriptionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const prescriptionRes = await prescriptionAPI.getPrescription(
        prescriptionId
      );

      if (prescriptionRes.status >= 200 && prescriptionRes.status < 300) { // Check status for success
        setPrescription(prescriptionRes.data);
        setNotes(prescriptionRes.data.pharmacist_notes || "");
        setPrescriptionDetails(prescriptionRes.data.prescription_medicines);
        console.log("Fetched prescription details:", prescriptionRes.data.prescription_medicines);
      } else {
        const errorInfo = apiUtils.handleError(prescriptionRes);
        setError(errorInfo.message);
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      console.error("Error fetching prescription:", err);
      setError(errorInfo.message || "Failed to fetch prescription data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [prescriptionId]);

  useEffect(() => {
    if (prescriptionId) {
      fetchPrescriptionData();
    }
  }, [prescriptionId, fetchPrescriptionData]);

  const fetchProducts = useCallback(async (term) => {
    setIsFetchingProducts(true);
    try {
      // Use productAPI.getProducts for searching
      const result = await productAPI.getProducts(1, 100, { search: term }); // Fetch first 100 results
      if (result.status >= 200 && result.status < 300) {
        setProducts(result.data.results || result.data);
      } else {
        const errorInfo = apiUtils.handleError(result);
        console.error("Error fetching products:", errorInfo.message);
        setProducts([]);
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      console.error("Error fetching products:", errorInfo.message);
    } finally {
      setIsFetchingProducts(false);
    }
  }, []);

  useEffect(() => {
    // Trigger product search when either modal is open and searchTerm or addMedicineSearchTerm is present
    const currentSearchTerm = showProductModal ? searchTerm : addMedicineSearchTerm;
    const currentModalOpen = showProductModal || showAddMedicineModal;

    if (currentModalOpen && currentSearchTerm) {
      const handler = setTimeout(() => {
        fetchProducts(currentSearchTerm); // Pass the specific search term
      }, 300);
      return () => clearTimeout(handler);
    } else if (currentModalOpen && !currentSearchTerm) {
      // Clear products if no search term and a modal is open
      setProducts([]);
    }
  }, [showProductModal, showAddMedicineModal, searchTerm, addMedicineSearchTerm, fetchProducts]);

  const handleMapProduct = async (detailId, product) => {
    console.log("handleMapProduct called with:", { detailId, product });
    if (!product) {
      // toast.error("Please select a product to map.");
      console.error("Please select a product to map.");
      return;
    }
    try {
      // Use prescriptionAPI.remapMedicine
      const result = await prescriptionAPI.remapMedicine(
        detailId,
        { product_id: product.id }
      );
      if (result.status >= 200 && result.status < 300) {
        // Update the specific prescription detail with the mapped product info
        setPrescriptionDetails((prevDetails) =>
          prevDetails.map((d) =>
            d.id === detailId
              ? {
                  ...d,
                  mapped_product: product.id,
                  product_name: product.name,
                  product_price: product.current_selling_price, // Use current_selling_price
                  verified_medicine_name: product.name,
                  verified_dosage: product.strength,
                  verified_form: product.dosage_form, // Use dosage_form for consistency
                  is_valid_for_order: true,
                  suggested_products: d.suggested_products
                    ? [...d.suggested_products.filter(sp => sp.id !== product.id), product]
                    : [product],
                }
              : d
          )
        );
        setShowProductModal(false);
        setSelectedProduct(null);
        // toast.success(result.message); // Use toast for user feedback
        console.log("Medicine mapped successfully."); // Fallback to console log
        // No need to fetchPrescriptionData() if state is updated directly
      } else {
        const errorInfo = apiUtils.handleError(result);
        // toast.error(`Failed to update medicine selection: ${errorInfo.message}`); // Use toast for user feedback
        console.error(`Failed to update medicine selection: ${errorInfo.message}`); // Fallback to console log
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      console.error("Error updating medicine selection:", err);
      // toast.error("An unexpected error occurred during medicine selection update."); // Use toast for user feedback
      console.error("An unexpected error occurred during medicine selection update."); // Fallback to console log
    }
  };

  const handleProceedToApproval = async () => {
    if (!allItemsMapped) {
      alert("All medicines must be mapped before proceeding to approval.");
      return;
    }

    if (!prescription) {
      alert("Prescription data is not loaded.");
      return;
    }

    try {
      const result = await prescriptionAPI.verifyPrescription(
        prescriptionId,
        { verification_status: "Verified", notes: notes }
      );

      if (result.status >= 200 && result.status < 300) {
        // toast.success(result.message);
        console.log("Prescription approved successfully.");
        navigate("/prescription");
      } else {
        const errorInfo = apiUtils.handleError(result);
        // toast.error(`Failed to approve prescription: ${errorInfo.message}`);
        console.error(`Failed to approve prescription: ${errorInfo.message}`);
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      console.error("Error approving prescription:", err);
      // toast.error("An unexpected error occurred during approval.");
      console.error("An unexpected error occurred during approval.");
    }
  };

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleRejectPrescription = async () => {
    if (!prescription) {
      // toast.error("Prescription data is not loaded.");
      console.error("Prescription data is not loaded.");
      return;
    }
    if (!rejectionReason.trim()) {
      // toast.error("Please provide a reason for rejection.");
      console.error("Please provide a reason for rejection.");
      return;
    }

    try {
      const result = await prescriptionAPI.verifyPrescription(
        prescriptionId,
        { verification_status: "Rejected", notes: rejectionReason }
      );

      if (result.status >= 200 && result.status < 300) {
        // toast.success("Prescription rejected successfully.");
        console.log("Prescription rejected successfully.");
        navigate("/prescription");
      } else {
        const errorInfo = apiUtils.handleError(result);
        // toast.error(`Failed to reject prescription: ${errorInfo.message}`);
        console.error(`Failed to reject prescription: ${errorInfo.message}`);
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      console.error("Error rejecting prescription:", err);
      // toast.error("An unexpected error occurred during rejection.");
      console.error("An unexpected error occurred during rejection.");
    } finally {
      setShowRejectModal(false);
      setRejectionReason("");
    }
  };

  const handleAddMedicineToPrescription = async () => {
    if (!selectedMedicineToAdd) {
      // toast.error("Please select a medicine to add.");
      console.error("Please select a medicine to add.");
      return;
    }
    if (medicineQuantity < 1) {
      // toast.error("Quantity must be at least 1.");
      console.error("Quantity must be at least 1.");
      return;
    }

    try {
      const result = await prescriptionAPI.addMedicineToPrescrip({
        prescription: prescriptionId,
        product_id: selectedMedicineToAdd.id,
        quantity: medicineQuantity,
        dosage: selectedMedicineToAdd.strength || "",
        instructions: "As directed by pharmacist",
        form: selectedMedicineToAdd.dosage_form || "",
      });

      if (result.status >= 200 && result.status < 300) {
        // toast.success("Medicine added to prescription successfully.");
        console.log("Medicine added to prescription successfully.");
        // Directly update state with the new medicine detail from the response
        setPrescriptionDetails((prevDetails) => [
          ...prevDetails,
          result.data,
        ]);
        setShowAddMedicineModal(false);
        setSelectedMedicineToAdd(null);
        setMedicineQuantity(1);
      } else {
        const errorInfo = apiUtils.handleError(result);
        // toast.error(`Failed to add medicine: ${errorInfo.message}`);
        console.error(`Failed to add medicine: ${errorInfo.message}`);
      }
    } catch (err) {
      const errorInfo = apiUtils.handleError(err);
      console.error("Error adding medicine to prescription:", err);
      // toast.error("An unexpected error occurred while adding medicine.");
      console.error("An unexpected error occurred while adding medicine.");
    }
  };

  const openImagePopup = () => setIsImagePopupOpen(true);
  const closeImagePopup = () => setIsImagePopupOpen(false);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <header className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate("/Prescription")}>
            <ArrowLeft className="text-gray-600" />
          </button>
            <h1 className="text-xl font-bold text-gray-800">
              Review Prescription
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <PrescriptionStatusBadge
              status={prescription?.verification_status || "Loading..."}
            />
            {prescription?.verification_status === 'Pending_Review' && (
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
              >
                <XCircle size={20} />
                <span>Reject</span>
              </button>
            )}
          </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Prescription Image & Info */}
        <div className="lg:col-span-1 lg:sticky lg:top-8 self-start space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="relative group">
              {prescription && prescription.image_url && (
                <img
                  src={`${API_BASE_URL}${prescription.image_url}`}
                  alt="Prescription"
                  className="w-full rounded-md shadow-sm cursor-pointer"
                  onClick={openImagePopup}
                />
              )}
              <div
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-opacity duration-300"
                onClick={openImagePopup}
              >
                <ZoomIn className="text-white h-12 w-12 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300" />
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Customer:</span>
                <span className="text-gray-800">
                  {prescription?.user_name || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Uploaded:</span>
                <span className="text-gray-800">
                  {new Date(prescription?.upload_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-600">
                  AI Confidence:
                </span>
                <ConfidenceIndicator
                  confidence={prescription?.ai_confidence_score}
                />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              Pharmacist Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded-md h-32 focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Add any relevant notes here..."
            />
          </div>
        </div>

        {/* Right Column: Medicine Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              Extracted Medicines
            </h2>
            <button
              onClick={() => setShowAddMedicineModal(true)} // Open add medicine modal
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              <PlusCircle size={20} />
              <span>Add Medicine</span>
            </button>
          </div>
          {prescriptionDetails.map((detail) => (
            <div
              key={detail.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">
                      AI Extracted Name: "
                      <span className="font-semibold text-gray-800">
                        {detail.extracted_medicine_name || "N/A"}
                      </span>
                      "
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Dosage:{" "}
                      <span className="font-semibold">
                        {detail.extracted_dosage || "N/A"}
                      </span>
                      , Form:{" "}
                      <span className="font-semibold">
                        {detail.extracted_form || "N/A"}
                      </span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Frequency:{" "}
                      <span className="font-semibold">
                        {detail.extracted_frequency || "N/A"}
                      </span>
                      , Quantity:{" "}
                      <span className="font-semibold">
                        {detail.extracted_quantity || "N/A"}
                      </span>
                    </p>
                  </div>
                  <ConfidenceIndicator
                    confidence={detail.ai_confidence_score * 100}
                  />
                </div>
                {detail.extracted_instructions && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-xs font-semibold text-yellow-800">
                      AI Instructions:
                    </p>
                    <p className="text-sm text-yellow-900">
                      {detail.extracted_instructions}
                    </p>
                  </div>
                )}

                {detail.mapped_product ? (
                  <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-semibold text-green-800">
                        Mapped to: {detail.product_name || "N/A"}
                      </p>
                      <button
                        onClick={() => {
                          setCurrentDetailId(detail.id);
                          setSearchTerm(
                            detail.product_name || detail.extracted_medicine_name
                          );
                          setShowProductModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                      >
                        Change
                      </button>
                    </div>
                    {detail.suggested_products && detail.suggested_products.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-green-700 mb-1">
                          Available Options:
                        </p>
                        <ul className="list-disc list-inside text-xs text-green-700 space-y-0.5">
                          {detail.suggested_products.map((s_product) => (
                            <li key={s_product.id}>
                              {s_product.name} ({s_product.strength || "N/A"}) - ₹
                              {s_product.current_selling_price || "0.00"} (Stock: {s_product.total_stock > 0 ? s_product.total_stock : "Out of stock"})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <AlertCircle className="text-red-500 mr-2" size={20} />
                        <p className="text-sm font-semibold text-red-800">
                          Needs Mapping
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setCurrentDetailId(detail.id);
                          setSearchTerm(detail.extracted_medicine_name);
                          setShowProductModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                      >
                        <span>Find Product</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    {detail.suggested_products && detail.suggested_products.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-red-700 mb-1">
                          Suggested Options:
                        </p>
                        <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5">
                          {detail.suggested_products.map((s_product) => (
                            <li key={s_product.id}>
                              {s_product.name} ({s_product.strength || "N/A"}) - ₹
                              {s_product.current_selling_price || "0.00"} (Stock: {s_product.total_stock > 0 ? s_product.total_stock : "Out of stock"})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Sticky Footer for Action Button */}
      <footer className="sticky bottom-0 bg-white bg-opacity-90 backdrop-blur-sm border-t p-4 z-10">
        <div className="max-w-7xl mx-auto flex justify-end">
          <button
            onClick={handleProceedToApproval}
            disabled={!allItemsMapped || prescription?.verification_status !== 'Pending_Review'}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center space-x-2 transform hover:scale-105 disabled:transform-none"
          >
            <span>Proceed to Approval</span>
            <CheckCircle size={20} />
          </button>
        </div>
      </footer>

      {/* Fullscreen Image Popup */}
      {isImagePopupOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 transition-opacity duration-300"
          onClick={closeImagePopup}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={`${API_BASE_URL}${prescription?.image_url}`}
              alt="Prescription Fullscreen"
              className="max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={closeImagePopup}
              className="absolute top-0 right-0 -m-3 bg-white rounded-full p-2 text-gray-800 hover:bg-gray-200 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Close image viewer"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Product Search Modal (existing code) */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Map Medicine</h2>
              <p className="text-sm text-gray-500">
                Search for a product to map to "
                {
                  prescriptionDetails.find((d) => d.id === currentDetailId)
                    ?.product_name
                }
                "
              </p>
            </div>
            <div className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for product name, generic name..."
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg"
                />
              </div>
              <div className="mt-4 h-64 overflow-y-auto space-y-2 pr-2">
                {isFetchingProducts ? (
                  <p>Searching...</p>
                ) : (
                  products.map((product) => (
                    <div
                      key={product.id}
                      className={`p-4 border rounded-lg cursor-pointer ${
                        selectedProduct?.id === product.id
                          ? "bg-blue-100 border-blue-500"
                          : "border-gray-200"
                      }`}
                      onClick={() => {
                        setSelectedProduct(product);
                        console.log("Selected product for remapping:", product);
                        console.log("Selected product details (strength, form):", product.strength, product.dosage_form); // Use dosage_form
                      }}
                    >
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {product.generic_name?.name || "N/A"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setSelectedProduct(null); // Clear selected product on cancel
                  console.log("Product modal cancelled.");
                }}
                className="px-5 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log(
                    "Attempting to map product. currentDetailId:",
                    currentDetailId,
                    "selectedProduct:",
                    selectedProduct
                  );
                  handleMapProduct(currentDetailId, selectedProduct);
                }}
                disabled={!selectedProduct}
                className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg disabled:bg-gray-400"
              >
                Map Selected Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Medicine Modal (New) */}
      {showAddMedicineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Add New Medicine</h2>
              <p className="text-sm text-gray-500">
                Search for a medicine to add to this prescription.
              </p>
            </div>
            <div className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={addMedicineSearchTerm}
                  onChange={(e) => setAddMedicineSearchTerm(e.target.value)}
                  placeholder="Search for product name, generic name..."
                  className="w-full pl-10 pr-4 py-2.5 border rounded-lg"
                />
              </div>
              <div className="mt-4 h-64 overflow-y-auto space-y-2 pr-2">
                {isFetchingProducts ? (
                  <p>Searching...</p>
                ) : (
                  products.map((product) => (
                    <div
                      key={product.id}
                      className={`p-4 border rounded-lg cursor-pointer ${
                        selectedMedicineToAdd?.id === product.id
                          ? "bg-blue-100 border-blue-500"
                          : "border-gray-200"
                      }`}
                      onClick={() => setSelectedMedicineToAdd(product)}
                    >
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {product.generic_name?.name || "N/A"}
                      </p>
                    </div>
                  ))
                )}
              </div>
              {selectedMedicineToAdd && (
                <div className="mt-4 p-4 border rounded-lg bg-blue-50">
                  <h3 className="font-semibold text-lg mb-2">
                    Selected: {selectedMedicineToAdd.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Strength: {selectedMedicineToAdd.strength}, Form:{" "}
                    {selectedMedicineToAdd.dosage_form || "N/A"}
                  </p>
                  <div className="mt-3 flex items-center space-x-2">
                    <label htmlFor="quantity" className="text-sm font-medium">
                      Quantity:
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      value={medicineQuantity}
                      onChange={(e) =>
                        setMedicineQuantity(
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                      min="1"
                      className="w-20 p-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowAddMedicineModal(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddMedicineToPrescription()} // New handler
                disabled={!selectedMedicineToAdd}
                className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg disabled:bg-gray-400"
              >
                Add Medicine to Prescription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Prescription Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Reject Prescription</h2>
            <p className="text-gray-700 mb-4">
              Please provide a reason for rejecting this prescription.
            </p>
            <textarea
              className="w-full p-3 border rounded-md h-32 focus:ring-2 focus:ring-red-500"
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            ></textarea>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRejectPrescription(rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg disabled:bg-gray-400"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionReview;
