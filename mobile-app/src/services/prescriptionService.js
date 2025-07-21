// Prescription Service for AI Integration
import ApiService from './api';
import { Alert } from 'react-native';

class PrescriptionService {
  constructor() {
    this.processingQueue = new Map();
    this.retryAttempts = 3;
    this.retryDelay = 2000;
  }

  // Upload prescription image and start AI processing
  async uploadPrescription(imageUri, options = {}) {
    try {
      console.log('Uploading prescription:', imageUri);
      
      const result = await ApiService.uploadPrescription(imageUri);
      
      if (result.success) {
        const { prescription_id, ai_confidence, status } = result.data;
        
        // Store processing info
        this.processingQueue.set(prescription_id, {
          status: 'processing',
          uploadTime: new Date(),
          confidence: ai_confidence,
        });

        return {
          success: true,
          prescriptionId: prescription_id,
          confidence: ai_confidence,
          status: status,
          message: 'Prescription uploaded successfully. AI processing started.',
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Prescription upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload prescription',
      };
    }
  }

  // Check AI processing status
  async checkProcessingStatus(prescriptionId) {
    try {
      const result = await ApiService.getPrescriptionStatus(prescriptionId);
      
      if (result.success) {
        const { status, ai_processed, confidence_score } = result.data;
        
        // Update processing queue
        if (this.processingQueue.has(prescriptionId)) {
          this.processingQueue.set(prescriptionId, {
            ...this.processingQueue.get(prescriptionId),
            status: status,
            aiProcessed: ai_processed,
            confidence: confidence_score,
          });
        }

        return {
          success: true,
          status: status,
          aiProcessed: ai_processed,
          confidence: confidence_score,
          isReady: status === 'AI_Processed' || status === 'Verified',
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Status check error:', error);
      return {
        success: false,
        error: error.message || 'Failed to check status',
      };
    }
  }

  // Get AI medicine suggestions
  async getMedicineSuggestions(prescriptionId) {
    try {
      const result = await ApiService.getMedicineSuggestions(prescriptionId);
      
      if (result.success) {
        const suggestions = this.processSuggestions(result.data);
        
        // Update processing queue
        if (this.processingQueue.has(prescriptionId)) {
          this.processingQueue.set(prescriptionId, {
            ...this.processingQueue.get(prescriptionId),
            status: 'completed',
            suggestions: suggestions,
          });
        }

        return {
          success: true,
          ...suggestions,
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Get suggestions error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get medicine suggestions',
      };
    }
  }

  // Process and format AI suggestions
  processSuggestions(rawData) {
    const {
      prescription_id,
      status,
      ai_confidence,
      summary,
      medicines,
      pricing,
      can_order
    } = rawData;

    // Format medicines for mobile display
    const formattedMedicines = medicines.map(medicine => ({
      id: medicine.id,
      name: medicine.medicine_name,
      dosage: medicine.dosage,
      quantity: medicine.quantity,
      instructions: medicine.instructions,
      confidence: medicine.confidence_score,
      isAvailable: medicine.is_available,
      product: medicine.product_info ? {
        id: medicine.product_info.product_id,
        name: medicine.product_info.name,
        price: medicine.product_info.price,
        mrp: medicine.product_info.mrp,
        discount: medicine.product_info.discount_percentage,
        inStock: medicine.product_info.in_stock,
        manufacturer: medicine.product_info.manufacturer,
      } : null,
    }));

    // Calculate totals
    const totals = {
      subtotal: pricing?.subtotal || 0,
      shipping: pricing?.shipping || 0,
      discount: pricing?.discount || 0,
      total: pricing?.total || 0,
    };

    return {
      prescriptionId: prescription_id,
      status: status,
      aiConfidence: ai_confidence,
      summary: {
        totalMedicines: summary?.total_medicines || 0,
        availableMedicines: summary?.available_medicines || 0,
        unavailableMedicines: summary?.unavailable_medicines || 0,
      },
      medicines: formattedMedicines,
      pricing: totals,
      canOrder: can_order,
    };
  }

  // Wait for AI processing to complete
  async waitForProcessing(prescriptionId, maxWaitTime = 30000) {
    const startTime = Date.now();
    const checkInterval = 2000; // Check every 2 seconds

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const statusResult = await this.checkProcessingStatus(prescriptionId);
          
          if (statusResult.success && statusResult.isReady) {
            // Processing complete, get suggestions
            const suggestions = await this.getMedicineSuggestions(prescriptionId);
            resolve(suggestions);
            return;
          }

          // Check if we've exceeded max wait time
          if (Date.now() - startTime > maxWaitTime) {
            reject(new Error('AI processing timeout'));
            return;
          }

          // Continue checking
          setTimeout(checkStatus, checkInterval);
        } catch (error) {
          reject(error);
        }
      };

      checkStatus();
    });
  }

  // Create order from prescription suggestions
  async createOrderFromPrescription(prescriptionId, selectedMedicines, deliveryInfo) {
    try {
      const orderData = {
        prescription_id: prescriptionId,
        medicines: selectedMedicines.map(medicine => ({
          detail_id: medicine.id,
          quantity: medicine.selectedQuantity || 1,
        })),
        address_id: deliveryInfo.addressId,
        payment_method: deliveryInfo.paymentMethod,
        special_instructions: deliveryInfo.instructions || '',
      };

      const result = await ApiService.createPrescriptionOrder(orderData);
      
      if (result.success) {
        return {
          success: true,
          orderId: result.data.order_id,
          orderNumber: result.data.order_number,
          totalAmount: result.data.total_amount,
          status: result.data.order_status,
          estimatedDelivery: result.data.estimated_delivery,
          message: 'Order created successfully!',
        };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Create order error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create order',
      };
    }
  }

  // Get processing queue status
  getProcessingStatus(prescriptionId) {
    return this.processingQueue.get(prescriptionId) || null;
  }

  // Clear processing queue
  clearProcessingQueue() {
    this.processingQueue.clear();
  }

  // Validate prescription image before upload
  validatePrescriptionImage(imageUri) {
    if (!imageUri) {
      return {
        valid: false,
        error: 'No image selected',
      };
    }

    // Check file extension
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const extension = imageUri.toLowerCase().substring(imageUri.lastIndexOf('.'));
    
    if (!validExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'Invalid image format. Please use JPG or PNG.',
      };
    }

    return {
      valid: true,
    };
  }

  // Get confidence level description
  getConfidenceDescription(confidence) {
    if (confidence >= 0.9) return 'Excellent';
    if (confidence >= 0.8) return 'Very Good';
    if (confidence >= 0.7) return 'Good';
    if (confidence >= 0.6) return 'Fair';
    return 'Poor';
  }

  // Get confidence color for UI
  getConfidenceColor(confidence) {
    if (confidence >= 0.8) return '#4CAF50'; // Green
    if (confidence >= 0.6) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }
}

// Export singleton instance
export default new PrescriptionService();
