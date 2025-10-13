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
import { prescriptionService, prescriptionUtils } from "../api/prescriptionService";

const API_BASE_URL = "http://localhost:8000";

const PrescriptionReview = () => {
  const PrescriptionStatusBadge = ({ status }) => (
    <span className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full">
      {prescriptionUtils.getStatusDisplayName(status)}
    </span>
  );

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
      const prescriptionRes = await prescriptionService.getPrescription(
        prescriptionId
      );

      if (prescriptionRes.success) {
        setPrescription(prescriptionRes.data);
        setNotes(prescriptionRes.data.pharmacist_notes || "");
        setPrescriptionDetails(prescriptionRes.data.prescription_medicines);
        console.log("Fetched prescription details:", prescriptionRes.data.prescription_medicines);
      } else {
        setError(prescriptionRes.error);
      }
    } catch (err) {
      console.error("Error fetching prescription:", err);
      setError("Failed to fetch prescription data. Please try again.");
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
      const result = await prescriptionService.searchProducts(term);
      if (result.success) {
        setProducts(result.data);
      } else {
        console.error("Error fetching products:", result.error);
        setProducts([]);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
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
      alert("Please select a product to map.");
      return;
    }
    try {
      // Use the new updateMedicineSelection API
      const result = await prescriptionService.updateMedicineSelection(
        detailId,
        product.id
      );
      if (result.success) {
        setPrescriptionDetails((prevDetails) =>
          prevDetails.map((d) =>
            d.id === detailId
              ? {
                  ...d,
                  mapped_product: product.id,
                  product_name: product.name,
                  product_price: product.price,
                  verified_medicine_name: product.name,
                  verified_dosage: product.strength,
                  verified_form: product.form,
                  is_valid_for_order: true,
                  // The suggested_products should be updated by the backend, so we don't modify it here.
                  // The full product details will be re-fetched by fetchPrescriptionData.
                }
              : d
          )
        );
        setShowProductModal(false);
        setSelectedProduct(null);
        alert(result.message);
        fetchPrescriptionData(); // Re-fetch data to ensure UI is in sync with backend
      } else {
        alert(`Failed to update medicine selection: ${result.error}`);
      }
    } catch (err) {
      console.error("Error updating medicine selection:", err);
      alert("An unexpected error occurred during medicine selection update.");
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
      const result = await prescriptionService.verifyPrescription(
        prescriptionId,
        "verified",
        { notes: notes }
      );

      if (result.success) {
        alert(result.message);
        navigate("/prescription");
      } else {
        alert(`Failed to approve prescription: ${result.error}`);
      }
    } catch (err) {
      console.error("Error approving prescription:", err);
      alert("An unexpected error occurred during approval.");
    }
  };

  const handleAddMedicineToPrescription = async () => {
    if (!selectedMedicineToAdd) {
      alert("Please select a medicine to add.");
      return;
    }
    if (medicineQuantity < 1) {
      alert("Quantity must be at least 1.");
      return;
    }

    try {
      const result = await prescriptionService.addMedicine(prescriptionId, {
        productId: selectedMedicineToAdd.id,
        quantity: medicineQuantity,
        // You might want to add dosage, frequency, duration, instructions here if available in the modal
        // For now, we'll use default or empty strings as per the API definition
        dosage: selectedMedicineToAdd.strength || "", // Assuming strength can be dosage
        instructions: "As directed by pharmacist", // Default instruction
      });

      if (result.success) {
        alert(result.message);
        // After successfully adding, refetch prescription data to update the list
        fetchPrescriptionData();
        setShowAddMedicineModal(false);
        setSelectedMedicineToAdd(null);
        setMedicineQuantity(1);
      } else {
        alert(`Failed to add medicine: ${result.error}`);
      }
    } catch (err) {
      console.error("Error adding medicine to prescription:", err);
      alert("An unexpected error occurred while adding medicine.");
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
        <div>
          <PrescriptionStatusBadge
            status={prescription?.verification_status || "Loading..."}
          />
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

                {detail.suggested_medicine ? (
                  <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        Mapped to: {detail.suggested_medicine.name}
                      </p>
                      <div className="text-xs text-green-700 mt-1 space-y-0.5">
                        <p>
                          Strength: {detail.suggested_medicine.strength || "N/A"},{" "}
                          Form: {detail.suggested_medicine.form || "N/A"}
                        </p>
                        <p>
                          Manufacturer: {detail.suggested_medicine.manufacturer || "N/A"}
                        </p>
                        <p>
                          Price: ₹{detail.suggested_medicine.current_selling_price || "0.00"}
                        </p>
                        <p>
                          Stock: {detail.suggested_medicine.total_stock > 0 ? `${detail.suggested_medicine.total_stock} in stock` : "Out of stock"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentDetailId(detail.id);
                        setSearchTerm(
                          detail.suggested_medicine.name ||
                            detail.extracted_medicine_name
                        );
                        setShowProductModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 flex justify-between items-center">
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
                )}
              </div>
              {detail.suggested_products &&
                detail.suggested_products.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500">
                    <p className="text-sm font-semibold text-blue-800 mb-2">
                      Suggested Alternatives:
                    </p>
                    <ul className="list-disc list-inside text-sm text-blue-700">
                      {detail.suggested_products.map((s_product) => (
                        <li key={s_product.id}>
                          {s_product.name} ({s_product.strength || "N/A"}) - ₹
                          {s_product.current_selling_price || "0.00"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          ))}
        </div>
      </main>

      {/* Sticky Footer for Action Button */}
      <footer className="sticky bottom-0 bg-white bg-opacity-90 backdrop-blur-sm border-t p-4 z-10">
        <div className="max-w-7xl mx-auto flex justify-end">
          <button
            onClick={handleProceedToApproval}
            disabled={!allItemsMapped}
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
                        console.log("Selected product details (strength, form):", product.strength, product.form);
                      }}
                    >
                      <p className="font-semibold">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {product.generic_name.name}
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
                        {product.generic_name.name}
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
                    {selectedMedicineToAdd.form}
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
    </div>
  );
};

export default PrescriptionReview;
