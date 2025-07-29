// API Integration Test Suite
import axiosInstance from '../api/axiosInstance';
import { prescriptionService } from '../api/prescriptionService';

export const testAllAPIs = async () => {
  const results = {
    prescriptions: { status: 'pending', message: '', data: null },
    products: { status: 'pending', message: '', data: null },
    medicines: { status: 'pending', message: '', data: null },
    addMedicine: { status: 'pending', message: '', data: null },
    remapMedicine: { status: 'pending', message: '', data: null },
    verification: { status: 'pending', message: '', data: null }
  };

  console.log('🧪 Starting API Integration Tests...');

  // Test 1: Prescription List API
  try {
    console.log('📋 Testing Prescription List API...');
    const prescriptionResult = await prescriptionService.getPrescriptions();
    if (prescriptionResult.success) {
      results.prescriptions = {
        status: 'success',
        message: `✅ Found ${prescriptionResult.data.length} prescriptions`,
        data: prescriptionResult.data.slice(0, 2) // First 2 for testing
      };
    } else {
      results.prescriptions = {
        status: 'error',
        message: `❌ ${prescriptionResult.error}`,
        data: null
      };
    }
  } catch (error) {
    results.prescriptions = {
      status: 'error',
      message: `❌ ${error.message}`,
      data: null
    };
  }

  // Test 2: Product Search API
  try {
    console.log('🔍 Testing Product Search API...');
    const productResult = await prescriptionService.searchProducts('paracetamol');
    if (productResult.success) {
      results.products = {
        status: 'success',
        message: `✅ Found ${productResult.data.length} products for 'paracetamol'`,
        data: productResult.data.slice(0, 3) // First 3 for testing
      };
    } else {
      results.products = {
        status: 'error',
        message: `❌ ${productResult.error}`,
        data: null
      };
    }
  } catch (error) {
    results.products = {
      status: 'error',
      message: `❌ ${error.message}`,
      data: null
    };
  }

  // Test 3: Prescription Medicines API
  if (results.prescriptions.status === 'success' && results.prescriptions.data.length > 0) {
    try {
      console.log('💊 Testing Prescription Medicines API...');
      const prescriptionId = results.prescriptions.data[0].id;
      const medicineResult = await prescriptionService.getPrescriptionMedicines(prescriptionId);
      if (medicineResult.success) {
        results.medicines = {
          status: 'success',
          message: `✅ Found ${medicineResult.data.length} medicines for prescription`,
          data: medicineResult.data
        };
      } else {
        results.medicines = {
          status: 'error',
          message: `❌ ${medicineResult.error}`,
          data: null
        };
      }
    } catch (error) {
      results.medicines = {
        status: 'error',
        message: `❌ ${error.message}`,
        data: null
      };
    }
  }

  // Test 4: Add Medicine API
  if (results.prescriptions.status === 'success' && results.products.status === 'success') {
    try {
      console.log('➕ Testing Add Medicine API...');
      const prescriptionId = results.prescriptions.data[0].id;
      const productId = results.products.data[0].id;
      
      const addResult = await prescriptionService.addMedicine(prescriptionId, {
        productId: productId,
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '5 days',
        quantity: '1',
        instructions: 'API Test Medicine'
      });
      
      if (addResult.success) {
        results.addMedicine = {
          status: 'success',
          message: `✅ ${addResult.message}`,
          data: addResult.data
        };
      } else {
        results.addMedicine = {
          status: 'error',
          message: `❌ ${addResult.error}`,
          data: null
        };
      }
    } catch (error) {
      results.addMedicine = {
        status: 'error',
        message: `❌ ${error.message}`,
        data: null
      };
    }
  }

  // Test 5: Remap Medicine API
  if (results.medicines.status === 'success' && results.products.status === 'success' && results.medicines.data.length > 0) {
    try {
      console.log('🔄 Testing Remap Medicine API...');
      const medicineId = results.medicines.data[0].id;
      const newProductId = results.products.data[1]?.id || results.products.data[0].id;
      
      const remapResult = await prescriptionService.remapMedicine(
        medicineId,
        newProductId,
        'API Test Remap'
      );
      
      if (remapResult.success) {
        results.remapMedicine = {
          status: 'success',
          message: `✅ ${remapResult.message}`,
          data: remapResult.data
        };
      } else {
        results.remapMedicine = {
          status: 'error',
          message: `❌ ${remapResult.error}`,
          data: null
        };
      }
    } catch (error) {
      results.remapMedicine = {
        status: 'error',
        message: `❌ ${error.message}`,
        data: null
      };
    }
  }

  // Test 6: Prescription Verification API
  if (results.prescriptions.status === 'success') {
    try {
      console.log('✅ Testing Prescription Verification API...');
      // Find a prescription that can be verified
      const testPrescription = results.prescriptions.data.find(p => 
        p.verification_status === 'Pending_Review' || p.verification_status === 'AI_Processed'
      );
      
      if (testPrescription) {
        const verifyResult = await prescriptionService.verifyPrescription(
          testPrescription.id,
          'verified',
          { notes: 'API Test Verification' }
        );
        
        if (verifyResult.success) {
          results.verification = {
            status: 'success',
            message: `✅ ${verifyResult.message}`,
            data: verifyResult.data
          };
        } else {
          results.verification = {
            status: 'error',
            message: `❌ ${verifyResult.error}`,
            data: null
          };
        }
      } else {
        results.verification = {
          status: 'skipped',
          message: '⏭️ No prescriptions available for verification',
          data: null
        };
      }
    } catch (error) {
      results.verification = {
        status: 'error',
        message: `❌ ${error.message}`,
        data: null
      };
    }
  }

  console.log('🏁 API Integration Tests Complete!');
  return results;
};

export const displayTestResults = (results) => {
  console.log('\n📊 API Integration Test Results:');
  console.log('=====================================');
  
  Object.entries(results).forEach(([testName, result]) => {
    const statusIcon = {
      'success': '✅',
      'error': '❌',
      'pending': '⏳',
      'skipped': '⏭️'
    }[result.status] || '❓';
    
    console.log(`${statusIcon} ${testName.toUpperCase()}: ${result.message}`);
  });
  
  const successCount = Object.values(results).filter(r => r.status === 'success').length;
  const totalCount = Object.values(results).length;
  const skippedCount = Object.values(results).filter(r => r.status === 'skipped').length;
  const actualTotal = totalCount - skippedCount;
  
  console.log('\n📈 Summary:');
  console.log(`✅ Passed: ${successCount}/${actualTotal}`);
  console.log(`❌ Failed: ${actualTotal - successCount}/${actualTotal}`);
  console.log(`⏭️ Skipped: ${skippedCount}`);
  
  if (successCount === actualTotal) {
    console.log('\n🎉 All API integrations are working perfectly!');
  } else {
    console.log('\n⚠️ Some API integrations need attention.');
  }
  
  return results;
};

// Export for use in components
export default { testAllAPIs, displayTestResults };
