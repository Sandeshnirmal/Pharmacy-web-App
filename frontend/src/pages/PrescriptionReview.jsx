/*
================================================================================
  File: src/pages/PrescriptionReview.jsx
  Description: A single, self-contained file for previewing the 
               PrescriptionReview component with all mock data included.
================================================================================
*/

import React, { useState, useEffect, useCallback } from "react";
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

const PrescriptionReview = () => {
  //==============================================================================
  // MOCK DATA, COMPONENTS & API (All contained within the component)
  //==============================================================================

  const samplePrescription = {
    id: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    image_url:
      "https://placehold.co/600x800/e0e7ff/3f51b5?text=Sample+Prescription",
    upload_date: "2025-08-26T10:00:00Z",
    verification_status: "Pending_Review",
    ai_confidence_score: 88,
    pharmacist_notes:
      "Patient mentioned they prefer generic brands if available.",
    user: {
      first_name: "John",
      last_name: "Doe",
    },
  };

  const samplePrescriptionDetails = [
    {
      id: "detail-001",
      product_name: "Paracetamol 500mg",
      ai_extracted_medicine_name: "Paracetamol 500mg",
      extracted_dosage: "1 tablet twice a day",
      ai_extracted_instructions: "Take after meals for 3 days.",
      ai_confidence_score: 95,
      mapped_product: null,
    },
    {
      id: "detail-002",
      product_name: "Amoxicillin 250mg",
      ai_extracted_medicine_name: "Amoxicillin 250mg",
      extracted_dosage: "1 capsule every 8 hours",
      ai_extracted_instructions: "Complete the full course.",
      ai_confidence_score: 92,
      mapped_product: "prod-xyz-789",
      mapped_product_name: "Moxikind CV 250",
      mapped_product_details: {
        strength: "250mg",
        form: "Capsule",
      },
    },
    {
      id: "detail-003",
      product_name: "Cetirizine Syrup",
      ai_extracted_medicine_name: "CZN Syrup",
      extracted_dosage: "5ml at night",
      ai_extracted_instructions: "May cause drowsiness.",
      ai_confidence_score: 78,
      mapped_product: null,
    },
  ];

  const sampleProducts = [
    {
      id: "prod-abc-123",
      name: "Crocin 500mg Tablet",
      generic_name: { name: "Paracetamol" },
      strength: "500mg",
      manufacturer: "GSK",
      price: "25.50",
    },
    {
      id: "prod-def-456",
      name: "Calpol 500mg Tablet",
      generic_name: { name: "Paracetamol" },
      strength: "500mg",
      manufacturer: "GSK",
      price: "24.00",
    },
    {
      id: "prod-ghi-789",
      name: "Okacet Syrup",
      generic_name: { name: "Cetirizine" },
      strength: "5mg/5ml",
      manufacturer: "Cipla",
      price: "45.00",
    },
    {
      id: "prod-jkl-012",
      name: "Cetzine Syrup",
      generic_name: { name: "Cetirizine" },
      strength: "5mg/5ml",
      manufacturer: "Dr. Reddy",
      price: "48.00",
    },
  ];

  const axiosInstance = {
    get: (url) => {
      console.log(`Mock GET request to: ${url}`);
      return new Promise((resolve) =>
        setTimeout(() => {
          if (url.includes("enhanced-prescriptions")) {
            resolve({ data: samplePrescription });
          } else if (url.includes("medicines")) {
            resolve({ data: { results: samplePrescriptionDetails } });
          } else if (url.includes("enhanced-products")) {
            resolve({ data: { results: sampleProducts } });
          }
        }, 500)
      );
    },
    patch: (url, data) => {
      console.log(`Mock PATCH request to: ${url} with data:`, data);
      return Promise.resolve({ data: { success: true } });
    },
    delete: (url) => {
      console.log(`Mock DELETE request to: ${url}`);
      return Promise.resolve({ status: 204 });
    },
  };

  const PrescriptionStatusBadge = ({ status }) => (
    <span className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-full">
      {status.replace("_", " ")}
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

  //==============================================================================
  // COMPONENT LOGIC & STATE
  //==============================================================================

  // Mocking router hooks for the preview.
  const prescriptionId = "a1b2c3d4";
  const navigate = (path) => console.log(`Navigating to: ${path}`);

  // State management
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

  const allItemsMapped =
    prescriptionDetails.length > 0 &&
    prescriptionDetails.every((detail) => detail.mapped_product);

  const fetchPrescriptionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [prescriptionRes, detailsRes] = await Promise.all([
        axiosInstance.get(
          `prescription/enhanced-prescriptions/${prescriptionId}/`
        ),
        axiosInstance.get(
          `prescription/medicines/?prescription=${prescriptionId}`
        ),
      ]);
      setPrescription(prescriptionRes.data);
      setPrescriptionDetails(detailsRes.data.results || detailsRes.data);
      setNotes(prescriptionRes.data.pharmacist_notes || "");
    } catch (err) {
      console.error("Error fetching prescription:", err);
      setError("Failed to fetch prescription data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [prescriptionId]);

  const fetchProducts = useCallback(async () => {
    setIsFetchingProducts(true);
    try {
      const response = await axiosInstance.get(
        `product/enhanced-products/?search=${encodeURIComponent(searchTerm)}`
      );
      setProducts(response.data.results || response.data);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setIsFetchingProducts(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchPrescriptionData();
  }, [fetchPrescriptionData]);

  useEffect(() => {
    if (showProductModal) {
      const handler = setTimeout(() => {
        fetchProducts();
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [showProductModal, searchTerm, fetchProducts]);

  const handleMapProduct = (detailId, product) => {
    setPrescriptionDetails((prevDetails) =>
      prevDetails.map((d) =>
        d.id === detailId
          ? {
              ...d,
              mapped_product: product.id,
              mapped_product_name: product.name,
              mapped_product_details: {
                strength: product.strength,
                form: product.form,
              },
            }
          : d
      )
    );
    setShowProductModal(false);
    setSelectedProduct(null);
  };

  const handleProceedToApproval = () => {
    if (allItemsMapped) {
      console.log("Proceeding to approval with data:", {
        prescriptionId,
        notes,
        mappedMedicines: prescriptionDetails,
      });
      // Here you would typically make an API call to submit the review
      // and then navigate to the next page.
      navigate(`/approval/${prescriptionId}`);
    }
  };

  const openImagePopup = () => setIsImagePopupOpen(true);
  const closeImagePopup = () => setIsImagePopupOpen(false);

  // ... (other handlers: openEditModal, handleSaveEdit, openDeleteConfirm, etc.)

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <header className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate("/prescriptions")}>
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
              <img
                src={prescription?.image_url}
                alt="Prescription"
                className="w-full rounded-md shadow-sm cursor-pointer"
                onClick={openImagePopup}
              />
              <div
                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-opacity duration-300"
                onClick={openImagePopup}
              >
                <ZoomIn className="text-white h-12 w-12 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300" />
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Patient:</span>
                <span className="text-gray-800">{`${prescription?.user?.first_name} ${prescription?.user?.last_name}`}</span>
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
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
              <PlusCircle size={20} />
              <span>Add Medicine</span>
            </button>
          </div>
          {prescriptionDetails.map((detail) => (
            <div
              key={detail.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              {/* Medicine Card Content... */}
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">
                      AI Extracted: "{detail.ai_extracted_medicine_name}"
                    </p>
                    <p className="text-lg font-bold text-gray-800">
                      {detail.product_name}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {detail.extracted_dosage}
                    </p>
                  </div>
                  <ConfidenceIndicator
                    confidence={detail.ai_confidence_score}
                  />
                </div>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs font-semibold text-yellow-800">
                    AI Instructions:
                  </p>
                  <p className="text-sm text-yellow-900">
                    {detail.ai_extracted_instructions}
                  </p>
                </div>

                {detail.mapped_product ? (
                  <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        Mapped to: {detail.mapped_product_name}
                      </p>
                      <p className="text-xs text-green-700">
                        {detail.mapped_product_details.strength} -{" "}
                        {detail.mapped_product_details.form}
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
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
                        setSearchTerm(detail.ai_extracted_medicine_name);
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
              src={prescription?.image_url}
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
                      onClick={() => setSelectedProduct(product)}
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
                onClick={() => setShowProductModal(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleMapProduct(currentDetailId, selectedProduct)
                }
                disabled={!selectedProduct}
                className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg disabled:bg-gray-400"
              >
                Map Selected Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionReview;
