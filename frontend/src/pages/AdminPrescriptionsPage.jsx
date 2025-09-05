import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminPrescriptionsPage.css'; // Import CSS for styling

const AdminPrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [currentPrescriptionId, setCurrentPrescriptionId] = useState(null);
  const [showRemapModal, setShowRemapModal] = useState(false);
  const [currentMedicine, setCurrentMedicine] = useState(null);
  const [searchProductTerm, setSearchProductTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [remapComment, setRemapComment] = useState('');

  const fetchPrescriptions = async () => {
    try {
      const response = await axios.get('http://localhost:8001/api/prescriptions/enhanced-prescriptions/');
      setPrescriptions(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleApprove = async (id) => {
    try {
      await axios.post(`http://localhost:8001/api/prescriptions/enhanced-prescriptions/${id}/verify/`, {
        action: 'verified',
        notes: 'Approved by admin/pharmacist',
      });
      fetchPrescriptions(); // Refresh the list
    } catch (err) {
      console.error(`Error approving prescription: ${err.message}`);
      // Optionally, display a user-friendly error message on the UI
    }
  };

  const handleRejectClick = (id) => {
    setCurrentPrescriptionId(id);
    setShowRejectionModal(true);
  };

  const handleEditMedicineClick = (medicine) => {
    setCurrentMedicine(medicine);
    setSearchProductTerm('');
    setSearchResults([]);
    setSelectedProduct(null);
    setRemapComment('');
    setShowRemapModal(true);
  };

  const handleProductSearch = async () => {
    if (!searchProductTerm) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.get(`http://localhost:8001/api/products/?search=${searchProductTerm}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Error searching products:', err);
      setSearchResults([]);
    }
  };

  const handleRemapSubmit = async () => {
    if (!selectedProduct) {
      alert('Please select a product to remap.');
      return;
    }
    if (!currentMedicine) {
      alert('No medicine selected for remapping.');
      return;
    }

    try {
      await axios.post(`http://localhost:8001/api/prescriptions/medicines/${currentMedicine.id}/remap_medicine/`, {
        product_id: selectedProduct.id,
        comment: remapComment,
      });
      alert('Medicine remapped successfully!');
      setShowRemapModal(false);
      fetchPrescriptions(); // Refresh the list
    } catch (err) {
      console.error('Error remapping medicine:', err);
      alert(`Error remapping medicine: ${err.message}`);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason) {
      alert('Please provide a rejection reason.'); // Keep alert for mandatory field
      return;
    }
    try {
      await axios.post(`http://localhost:8001/api/prescriptions/enhanced-prescriptions/${currentPrescriptionId}/verify/`, {
        action: 'rejected',
        rejection_reason: rejectionReason,
      });
      setShowRejectionModal(false);
      setRejectionReason('');
      fetchPrescriptions(); // Refresh the list
    } catch (err) {
      console.error(`Error rejecting prescription: ${err.message}`);
      // Optionally, display a user-friendly error message on the UI
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading prescriptions...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error.message}</div>;
  }

  return (
    <div className="admin-prescriptions-page">
      <h1>Prescriptions for Approval</h1>
      {prescriptions.length === 0 ? (
        <p className="no-prescriptions">No prescriptions to display.</p>
      ) : (
        <div className="prescription-list">
          {prescriptions.map((prescription) => (
            <div key={prescription.id} className={`prescription-card status-${prescription.verification_status ? prescription.verification_status.toLowerCase() : 'uploaded'}`}>
              <div className="card-header">
                <h2>Prescription ID: {prescription.id}</h2>
                <span className={`status-badge ${prescription.verification_status ? prescription.verification_status.toLowerCase() : 'uploaded'}`}>
                  {prescription.verification_status || 'Uploaded'}
                </span>
              </div>
              <div className="card-body">
                <p><strong>User:</strong> {prescription.user_id}</p>
                <p><strong>Upload Date:</strong> {new Date(prescription.upload_date).toLocaleDateString()}</p>
                {prescription.ai_confidence_score && (
                  <p><strong>AI Confidence:</strong> {(prescription.ai_confidence_score * 100).toFixed(2)}%</p>
                )}
                {prescription.image_file && (
                  <div className="prescription-image-container">
                    <img src={prescription.image_file} alt={`Prescription ${prescription.id}`} className="prescription-image" />
                  </div>
                )}
                {prescription.ocr_text && (
                  <div className="ocr-text-preview">
                    <strong>OCR Text:</strong>
                    <p>{prescription.ocr_text.substring(0, 150)}...</p>
                  </div>
                )}

                {prescription.details && prescription.details.length > 0 && (
                  <div className="extracted-medicines">
                    <strong>Extracted Medicines:</strong>
                    <ul>
                      {prescription.details.map((medicine) => (
                        <li key={medicine.id} className="medicine-item">
                          <span>{medicine.extracted_medicine_name} {medicine.verified_medicine_name && `(Mapped: ${medicine.verified_medicine_name})`}</span>
                          <button className="edit-medicine-button" onClick={() => handleEditMedicineClick(medicine)}>Edit</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="card-actions">
                {(prescription.verification_status === 'Pending_Review' || prescription.verification_status === 'AI_Processed') && (
                  <>
                    <button className="approve-button" onClick={() => handleApprove(prescription.id)}>Approve</button>
                    <button className="reject-button" onClick={() => handleRejectClick(prescription.id)}>Reject</button>
                  </>
                )}
                {prescription.verification_status === 'Verified' && (
                  <span className="action-status-message">Approved</span>
                )}
                {prescription.verification_status === 'Rejected' && (
                  <span className="action-status-message">Rejected</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showRejectionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Reject Prescription {currentPrescriptionId}</h2>
            <textarea
              placeholder="Reason for rejection"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows="4"
            ></textarea>
            <div className="modal-actions">
              <button onClick={handleRejectSubmit}>Submit Rejection</button>
              <button onClick={() => setShowRejectionModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRemapModal && currentMedicine && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Remap Medicine: {currentMedicine.extracted_medicine_name}</h2>
            <p>Current Mapped Product: {currentMedicine.verified_medicine_name || 'None'}</p>

            <div className="product-search-container">
              <input
                type="text"
                placeholder="Search for product to remap"
                value={searchProductTerm}
                onChange={(e) => setSearchProductTerm(e.target.value)}
              />
              <button onClick={handleProductSearch}>Search</button>
            </div>

            {searchResults.length > 0 && (
              <div className="search-results">
                <h3>Search Results:</h3>
                <ul>
                  {searchResults.map((product) => (
                    <li
                      key={product.id}
                      className={`search-result-item ${selectedProduct && selectedProduct.id === product.id ? 'selected' : ''}`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      {product.name} ({product.strength}) - {product.manufacturer}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedProduct && (
              <div className="selected-product-info">
                <h3>Selected Product:</h3>
                <p><strong>Name:</strong> {selectedProduct.name}</p>
                <p><strong>Strength:</strong> {selectedProduct.strength}</p>
                <p><strong>Manufacturer:</strong> {selectedProduct.manufacturer}</p>
              </div>
            )}

            <textarea
              placeholder="Comment for remapping (optional)"
              value={remapComment}
              onChange={(e) => setRemapComment(e.target.value)}
              rows="2"
            ></textarea>

            <div className="modal-actions">
              <button onClick={handleRemapSubmit}>Remap Medicine</button>
              <button onClick={() => setShowRemapModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPrescriptionsPage;
