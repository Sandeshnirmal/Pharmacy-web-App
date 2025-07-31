// PrescriptionReview.jsx
import { useState, useEffect } from "react";
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
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import PrescriptionStatusBadge from "../components/prescription/PrescriptionStatusBadge";
import { CircularConfidenceIndicator } from "../components/prescription/ConfidenceIndicator";
import ConfidenceIndicator from "../components/prescription/ConfidenceIndicator";

const PrescriptionReview = () => {
  const { prescriptionId } = useParams();
  const navigate = useNavigate();

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
  const [reviewCompleted, setReviewCompleted] = useState(false);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);

  // Derived state
  const allItemsMapped =
    prescriptionDetails.length > 0 &&
    prescriptionDetails.every((detail) => detail.mapped_product);

  // Data fetching
  useEffect(() => {
    if (prescriptionId) {
      fetchPrescriptionData();
    }
  }, [prescriptionId]);

  useEffect(() => {
    if (showProductModal) {
      setIsFetchingProducts(true);
      const handler = setTimeout(() => {
        fetchProducts();
      }, 300); // Debounce API calls
      return () => clearTimeout(handler);
    }
  }, [showProductModal, searchTerm]);

  const fetchPrescriptionData = async () => {
    try {
      setLoading(true);
      const [prescriptionRes, detailsRes] = await Promise.all([
        axiosInstance.get(`prescription/prescriptions/${prescriptionId}/`),
        axiosInstance.get(
          `prescription/prescription-details/?prescription=${prescriptionId}`
        ),
      ]);
      setPrescription(prescriptionRes.data);
      setPrescriptionDetails(detailsRes.data.results || detailsRes.data);
      setNotes(prescriptionRes.data.pharmacist_notes || "");
    } catch (err) {
      setError("Failed to fetch prescription data. Please try again.");
      console.error("Error fetching prescription:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axiosInstance.get(
        `product/products/?search=${encodeURIComponent(searchTerm)}&limit=50`
      );
      setProducts(response.data.results || response.data);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setIsFetchingProducts(false);
    }
  };

  // Handlers
  const handleMapProduct = async (detailId, product) => {
    const originalDetails = [...prescriptionDetails];
    setPrescriptionDetails((details) =>
      details.map((d) =>
        d.id === detailId
          ? {
              ...d,
              mapped_product: product.id,
              mapping_status: "Mapped",
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
    setSearchTerm("");

    try {
      await axiosInstance.patch(
        `prescription/prescription-details/${detailId}/`,
        { mapped_product: product.id, mapping_status: "Mapped" }
      );
    } catch (err) {
      console.error("Error mapping product:", err);
      setError("Failed to map product. Reverting changes.");
      setPrescriptionDetails(originalDetails);
    }
  };

  const handleRemoveDetail = async () => {
    if (!detailToDelete) return;

    const originalDetails = [...prescriptionDetails];
    setPrescriptionDetails((details) =>
      details.filter((d) => d.id !== detailToDelete)
    );
    setShowConfirmModal(false);

    try {
      await axiosInstance.delete(
        `prescription/prescription-details/${detailToDelete}/`
      );
    } catch (err) {
      console.error("Error removing detail:", err);
      setError("Failed to remove item.");
      setPrescriptionDetails(originalDetails);
    } finally {
      setDetailToDelete(null);
    }
  };

  const openConfirmModal = (detailId) => {
    setDetailToDelete(detailId);
    setShowConfirmModal(true);
  };

  const handleUpdateDetail = async () => {
    if (!editingDetail) return;
    const originalDetails = [...prescriptionDetails];
    setPrescriptionDetails((details) =>
      details.map((d) => (d.id === editingDetail.id ? editingDetail : d))
    );
    setShowEditModal(false);

    try {
      const {
        id,
        product_name,
        extracted_dosage,
        ai_extracted_instructions,
      } = editingDetail;
      const payload = {
        product_name,
        extracted_dosage,
        ai_extracted_instructions,
      };
      await axiosInstance.patch(
        `prescription/prescription-details/${id}/`,
        payload
      );
    } catch (err) {
      console.error("Error updating detail:", err);
      setError("Failed to update item.");
      setPrescriptionDetails(originalDetails);
    }
  };

  const handleAddMissingItem = async () => {
    try {
      const res = await axiosInstance.post(
        `prescription/prescription-details/${id}/`,
        {
          prescription: prescriptionId,
          line_number: prescriptionDetails.length + 1,
          recognized_text_raw: "Manually Added",
          mapping_status: "Pending",
        }
      );
      const newItem = res.data;
      setPrescriptionDetails((prev) => [...prev, newItem]);
      openEditModal(newItem); // Open edit modal for the new item
    } catch (err) {
      console.error("Error adding item:", err);
      setError("Failed to add new item.");
    }
  };

  const openProductModal = (detailId, medicineName) => {
    setCurrentDetailId(detailId);
    setSearchTerm(medicineName || "");
    setShowProductModal(true);
  };

  const openEditModal = (detail) => {
    setEditingDetail({ ...detail });
    setShowEditModal(true);
  };

  const handleAction = async (status, notesPayload = {}) => {
    try {
      await axiosInstance.patch(
        `prescription/prescriptions/${prescriptionId}/`,
        { verification_status: status, ...notesPayload }
      );
      navigate("/Prescription");
    } catch (err) {
      console.error(`Error updating prescription to ${status}:`, err);
      setError(`Failed to update prescription.`);
    }
  };

  const handleApproveForDelivery = async () => {
    try {
      await axiosInstance.patch(
        `prescription/prescriptions/${prescriptionId}/`,
        {
          verification_status: "Verified",
          pharmacist_notes: notes,
          verification_date: new Date().toISOString(),
        }
      );
      navigate("/Prescription");
    } catch (err) {
      console.error("Error approving for delivery:", err);
      setError("Failed to approve for delivery.");
    }
  };

  // Render logic
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  const needsReview =
    !reviewCompleted && prescription?.verification_status !== "Verified";
  const isReadyForDelivery =
    reviewCompleted && prescription?.verification_status !== "Verified";
  const isDelivered = prescription?.verification_status === "Verified";

  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/Prescription")}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Prescriptions</span>
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-900">
                Prescription #{prescription?.id}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">
                  AI Confidence:
                </span>
                <CircularConfidenceIndicator
                  confidence={prescription?.ai_confidence_score || 0}
                  size={32}
                />
              </div>
              <PrescriptionStatusBadge
                status={prescription?.verification_status}
              />
              <span className="text-sm text-gray-500">
                Uploaded on{" "}
                {new Date(prescription.upload_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Prescription Image */}
          <aside className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Prescription Image
            </h2>
            <div className="flex justify-center items-center bg-gray-50 rounded-lg p-4 min-h-[60vh]">
              <img
                src={
                  prescription?.image_url ||
                  "https://placehold.co/600x800/e0e7ff/3f51b5?text=Prescription"
                }
                alt="Prescription"
                className="max-w-full max-h-[75vh] h-auto rounded-md shadow-md object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src =
                    "https://placehold.co/600x400/cccccc/333333?text=Image+Not+Found";
                }}
              />
            </div>
          </aside>

          {/* Right Column: Review / Delivery Details */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            {needsReview && (
              <div id="review-state">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                      Action Required: Review & Map
                    </h2>
                    <p className="text-sm text-gray-500">
                      Please map the AI-detected medicines to the correct
                      products.
                    </p>
                  </div>
                  <button
                    onClick={handleAddMissingItem}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium"
                  >
                    <PlusCircle size={16} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {prescriptionDetails.map((detail) => (
                    <div
                      key={detail.id}
                      className="p-4 rounded-lg border-2 transition-all bg-white hover:border-blue-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-1.5">
                          <p className="text-sm font-semibold text-gray-800">
                            {detail.product_name ||
                              "Unknown Medicine"}
                          </p>
                          <p className="text-xs text-gray-600">
                            Dosage: {detail.extracted_dosage || "N/A"}
                          </p>
                          {detail.ai_extracted_instructions && (
                            <p className="text-xs text-blue-700 bg-blue-50 p-1.5 rounded-md">
                              <span className="font-semibold">Instr:</span>{" "}
                              {detail.ai_extracted_instructions}
                            </p>
                          )}
                          <ConfidenceIndicator
                            confidence={detail.ai_confidence_score || 0}
                            size="sm"
                          />
                        </div>
                        <div className="ml-4 flex-shrink-0 text-right">
                          {detail.mapped_product ? (
                            <div>
                              <div className="flex items-center justify-end space-x-2 text-green-600">
                                <CheckCircle size={18} />
                                <span className="text-sm font-medium">
                                  Mapped
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 mt-1 font-semibold">
                                {detail.mapped_product_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {detail.mapped_product_details?.strength}{" "}
                                {detail.mapped_product_details?.form}
                              </p>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                openProductModal(
                                  detail.id,
                                  detail.product_name
                                )
                              }
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-all text-sm"
                            >
                              <span>Map Product</span>
                              <ChevronRight size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-end space-x-3 mt-3 border-t pt-2">
                        <button
                          onClick={() => openEditModal(detail)}
                          title="Edit"
                          className="p-1 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => openConfirmModal(detail.id)}
                          title="Remove"
                          className="p-1 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 border-t pt-6">
                  <h3 className="text-base font-semibold text-gray-700 mb-2">
                    Pharmacist Notes
                  </h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] text-sm"
                    placeholder="Add notes for clarification or rejection..."
                  />
                  <div className="mt-4 flex items-center justify-between">
                    {allItemsMapped ? (
                      <button
                        onClick={() => setReviewCompleted(true)}
                        className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105"
                      >
                        <span>Proceed to Final Review</span>
                        <ArrowLeft className="transform rotate-180" size={20} />
                      </button>
                    ) : (
                      <div className="flex items-center justify-end space-x-3 w-full">
                        <button
                          onClick={() =>
                            handleAction("Rejected", {
                              rejection_reason:
                                notes || "Prescription rejected during review",
                            })
                          }
                          className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
                        >
                          <XCircle size={18} />
                          <span>Reject</span>
                        </button>
                        <button
                          onClick={() =>
                            handleAction("Pending_Review", {
                              pharmacist_notes: notes,
                            })
                          }
                          className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg"
                        >
                          <AlertCircle size={18} />
                          <span>Request Clarification</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isReadyForDelivery && (
              <div id="delivery-state">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <CheckCircle size={24} className="text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        Ready for Delivery
                      </h2>
                      <p className="text-sm text-gray-500">
                        All items mapped for{" "}
                        <span className="font-semibold">
                          {prescription.user.first_name}{" "}
                          {prescription.user.last_name}
                        </span>
                        .
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setReviewCompleted(false)}
                    className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-gray-900"
                  >
                    <Edit size={16} />
                    <span>Back to Edit</span>
                  </button>
                </div>
                <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg border">
                  {prescriptionDetails.map((detail) => (
                    <div
                      key={detail.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="font-medium text-gray-700">
                        {detail.mapped_product_name ||
                          detail.product_name}
                      </span>
                      <span className="text-gray-500">
                        Qty:{" "}
                        {detail.verified_quantity ||
                          detail.quantity_prescribed ||
                          1}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-700 mb-2">
                    Final Notes (Optional)
                  </h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] text-sm"
                    placeholder="Add any final notes for the order..."
                  />
                </div>
                <div className="mt-6">
                  <button
                    onClick={handleApproveForDelivery}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105"
                  >
                    <CheckCircle size={20} />
                    <span>Approve for Delivery</span>
                  </button>
                </div>
              </div>
            )}

            {isDelivered && (
              <div className="text-center py-16">
                <div className="bg-green-100 p-4 rounded-full inline-block mb-4">
                  <CheckCircle size={48} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Prescription Verified
                </h2>
                <p className="text-gray-600 mt-2">
                  This prescription for{" "}
                  <span className="font-semibold">
                    {prescription.user.first_name} {prescription.user.last_name}
                  </span>{" "}
                  has been processed.
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Order ID: {prescription.order || "N/A"}
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Modals */}
      {showProductModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Map Product
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Search for and select the correct product from the inventory.
              </p>
            </div>
            <div className="p-6 flex-grow overflow-y-auto">
              <div className="relative mb-4">
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search by product name, generic name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                {isFetchingProducts ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : products.length > 0 ? (
                  products.map((product) => (
                    <div
                      key={product.id}
                      className={`p-4 border rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all ${
                        selectedProduct?.id === product.id
                          ? "bg-blue-100 border-blue-500 ring-2 ring-blue-300"
                          : "border-gray-200"
                      }`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <p className="font-semibold text-gray-800">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.generic_name?.name} - {product.strength}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Mfr: {product.manufacturer} | Price: ₹{product.price}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    No products found. Try a different search term.
                  </p>
                )}
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setSelectedProduct(null);
                  setSearchTerm("");
                }}
                className="px-5 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedProduct && currentDetailId) {
                    handleMapProduct(currentDetailId, selectedProduct);
                  }
                }}
                disabled={!selectedProduct}
                className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Map Selected Product
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingDetail && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Edit Medicine Details
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medicine Name
                </label>
                <input
                  type="text"
                  value={editingDetail.product_name || ""}
                  onChange={(e) =>
                    setEditingDetail({
                      ...editingDetail,
                      product_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosage
                </label>
                <input
                  type="text"
                  value={editingDetail.extracted_dosage || ""}
                  onChange={(e) =>
                    setEditingDetail({
                      ...editingDetail,
                      ai_extracted_dosage: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions
                </label>
                <textarea
                  value={editingDetail.ai_extracted_instructions || ""}
                  onChange={(e) =>
                    setEditingDetail({
                      ...editingDetail,
                      ai_extracted_instructions: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateDetail}
                className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="mt-5 text-lg font-medium text-gray-900">
                  Remove Item
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to remove this item? This action
                    cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 flex justify-center space-x-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 w-full"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveDetail}
                className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 w-full"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionReview;
