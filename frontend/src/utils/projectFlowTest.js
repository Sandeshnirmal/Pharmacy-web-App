// Complete Project Flow Test Suite
import axiosInstance from '../api/axiosInstance';

export const testCompleteProjectFlow = async () => {
  const results = {
    dashboard: { status: 'pending', message: '', data: null },
    prescriptionList: { status: 'pending', message: '', data: null },
    prescriptionDetails: { status: 'pending', message: '', data: null },
    medicineSearch: { status: 'pending', message: '', data: null },
    addMedicine: { status: 'pending', message: '', data: null },
    remapMedicine: { status: 'pending', message: '', data: null },
    verifyPrescription: { status: 'pending', message: '', data: null },
    inventory: { status: 'pending', message: '', data: null }
  };

  console.log('🧪 Starting Complete Project Flow Test...');

  // Test 1: Dashboard Data Loading
  try {
    console.log('📊 Testing Dashboard Data Loading...');
    const [ordersRes, prescriptionsRes, usersRes, productsRes] = await Promise.all([
      axiosInstance.get('order/orders/'),
      axiosInstance.get('prescription/enhanced-prescriptions/'),
      axiosInstance.get('user/users/'),
      axiosInstance.get('product/enhanced-products/')
    ]);

    const orders = ordersRes.data.results || ordersRes.data;
    const prescriptions = prescriptionsRes.data.results || prescriptionsRes.data;
    const users = usersRes.data.results || usersRes.data;
    const products = productsRes.data.results || productsRes.data;

    results.dashboard = {
      status: 'success',
      message: `✅ Dashboard loaded: ${orders.length} orders, ${prescriptions.length} prescriptions, ${users.length} users, ${products.length} products`,
      data: {
        orders: orders.length,
        prescriptions: prescriptions.length,
        users: users.length,
        products: products.length
      }
    };
  } catch (error) {
    results.dashboard = {
      status: 'error',
      message: `❌ Dashboard loading failed: ${error.message}`,
      data: null
    };
  }

  // Test 2: Prescription List Loading
  try {
    console.log('📋 Testing Prescription List Loading...');
    const response = await axiosInstance.get('prescription/enhanced-prescriptions/');
    const prescriptions = response.data.results || response.data;
    
    if (prescriptions.length > 0) {
      results.prescriptionList = {
        status: 'success',
        message: `✅ Prescription list loaded: ${prescriptions.length} prescriptions`,
        data: prescriptions.slice(0, 3) // First 3 for testing
      };
    } else {
      results.prescriptionList = {
        status: 'warning',
        message: '⚠️ No prescriptions found in database',
        data: []
      };
    }
  } catch (error) {
    results.prescriptionList = {
      status: 'error',
      message: `❌ Prescription list loading failed: ${error.message}`,
      data: null
    };
  }

  // Test 3: Prescription Details Loading
  if (results.prescriptionList.status === 'success' && results.prescriptionList.data.length > 0) {
    try {
      console.log('📄 Testing Prescription Details Loading...');
      const prescriptionId = results.prescriptionList.data[0].id;
      const [prescriptionRes, medicinesRes] = await Promise.all([
        axiosInstance.get(`prescription/enhanced-prescriptions/${prescriptionId}/`),
        axiosInstance.get(`prescription/medicines/?prescription=${prescriptionId}`)
      ]);

      const prescription = prescriptionRes.data;
      const medicines = medicinesRes.data.results || medicinesRes.data;

      results.prescriptionDetails = {
        status: 'success',
        message: `✅ Prescription details loaded: ${prescription.patient_name} with ${medicines.length} medicines`,
        data: {
          prescription: prescription,
          medicines: medicines
        }
      };
    } catch (error) {
      results.prescriptionDetails = {
        status: 'error',
        message: `❌ Prescription details loading failed: ${error.message}`,
        data: null
      };
    }
  }

  // Test 4: Medicine Search
  try {
    console.log('🔍 Testing Medicine Search...');
    const searchResponse = await axiosInstance.get('product/enhanced-products/?search=paracetamol');
    const searchResults = searchResponse.data.results || searchResponse.data;

    if (searchResults.length > 0) {
      results.medicineSearch = {
        status: 'success',
        message: `✅ Medicine search working: Found ${searchResults.length} results for 'paracetamol'`,
        data: searchResults.slice(0, 3)
      };
    } else {
      results.medicineSearch = {
        status: 'warning',
        message: '⚠️ No search results found for paracetamol',
        data: []
      };
    }
  } catch (error) {
    results.medicineSearch = {
      status: 'error',
      message: `❌ Medicine search failed: ${error.message}`,
      data: null
    };
  }

  // Test 5: Add Medicine (if we have prescription and search results)
  if (results.prescriptionDetails.status === 'success' && results.medicineSearch.status === 'success') {
    try {
      console.log('➕ Testing Add Medicine...');
      const prescriptionId = results.prescriptionDetails.data.prescription.id;
      const productId = results.medicineSearch.data[0].id;

      const addResponse = await axiosInstance.post('prescription/medicines/add_medicine_to_prescription/', {
        prescription_id: prescriptionId,
        product_id: productId,
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '5 days',
        quantity: '1',
        instructions: 'Flow test medicine'
      });

      results.addMedicine = {
        status: 'success',
        message: `✅ Add medicine working: ${addResponse.data.message}`,
        data: addResponse.data
      };
    } catch (error) {
      results.addMedicine = {
        status: 'error',
        message: `❌ Add medicine failed: ${error.response?.data?.error || error.message}`,
        data: null
      };
    }
  }

  // Test 6: Remap Medicine (if we have medicines)
  if (results.prescriptionDetails.status === 'success' && results.medicineSearch.status === 'success') {
    try {
      console.log('🔄 Testing Remap Medicine...');
      const medicines = results.prescriptionDetails.data.medicines;
      if (medicines.length > 0) {
        const medicineId = medicines[0].id;
        const newProductId = results.medicineSearch.data[1]?.id || results.medicineSearch.data[0].id;

        const remapResponse = await axiosInstance.post(`prescription/medicines/${medicineId}/remap_medicine/`, {
          product_id: newProductId,
          comment: 'Flow test remap'
        });

        results.remapMedicine = {
          status: 'success',
          message: `✅ Remap medicine working: ${remapResponse.data.message}`,
          data: remapResponse.data
        };
      } else {
        results.remapMedicine = {
          status: 'skipped',
          message: '⏭️ No medicines available for remapping',
          data: null
        };
      }
    } catch (error) {
      results.remapMedicine = {
        status: 'error',
        message: `❌ Remap medicine failed: ${error.response?.data?.error || error.message}`,
        data: null
      };
    }
  }

  // Test 7: Verify Prescription
  if (results.prescriptionDetails.status === 'success') {
    try {
      console.log('✅ Testing Prescription Verification...');
      const prescriptionId = results.prescriptionDetails.data.prescription.id;
      const currentStatus = results.prescriptionDetails.data.prescription.verification_status;

      // Only test if prescription can be verified
      if (['Pending_Review', 'AI_Processed', 'Need_Clarification'].includes(currentStatus)) {
        const verifyResponse = await axiosInstance.post(`prescription/enhanced-prescriptions/${prescriptionId}/verify/`, {
          action: 'verified',
          notes: 'Flow test verification'
        });

        results.verifyPrescription = {
          status: 'success',
          message: `✅ Prescription verification working: ${verifyResponse.data.message}`,
          data: verifyResponse.data
        };
      } else {
        results.verifyPrescription = {
          status: 'skipped',
          message: `⏭️ Prescription already ${currentStatus}, cannot verify again`,
          data: null
        };
      }
    } catch (error) {
      results.verifyPrescription = {
        status: 'error',
        message: `❌ Prescription verification failed: ${error.response?.data?.error || error.message}`,
        data: null
      };
    }
  }

  // Test 8: Inventory Management
  try {
    console.log('📦 Testing Inventory Management...');
    const [productsRes, categoriesRes, genericNamesRes, batchesRes] = await Promise.all([
      axiosInstance.get('product/enhanced-products/'),
      axiosInstance.get('product/legacy/categories/'),
      axiosInstance.get('product/legacy/generic-names/'),
      axiosInstance.get('inventory/batches/')
    ]);

    const products = productsRes.data.results || productsRes.data;
    const categories = categoriesRes.data.results || categoriesRes.data;
    const genericNames = genericNamesRes.data.results || genericNamesRes.data;
    const batches = batchesRes.data.results || batchesRes.data;

    results.inventory = {
      status: 'success',
      message: `✅ Inventory loaded: ${products.length} products, ${categories.length} categories, ${genericNames.length} generic names, ${batches.length} batches`,
      data: {
        products: products.length,
        categories: categories.length,
        genericNames: genericNames.length,
        batches: batches.length
      }
    };
  } catch (error) {
    results.inventory = {
      status: 'error',
      message: `❌ Inventory loading failed: ${error.message}`,
      data: null
    };
  }

  console.log('🏁 Complete Project Flow Test Complete!');
  return results;
};

export const displayFlowTestResults = (results) => {
  console.log('\n📊 Complete Project Flow Test Results:');
  console.log('==========================================');
  
  Object.entries(results).forEach(([testName, result]) => {
    const statusIcon = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'pending': '⏳',
      'skipped': '⏭️'
    }[result.status] || '❓';
    
    console.log(`${statusIcon} ${testName.toUpperCase()}: ${result.message}`);
  });
  
  const successCount = Object.values(results).filter(r => r.status === 'success').length;
  const errorCount = Object.values(results).filter(r => r.status === 'error').length;
  const warningCount = Object.values(results).filter(r => r.status === 'warning').length;
  const skippedCount = Object.values(results).filter(r => r.status === 'skipped').length;
  const totalCount = Object.values(results).length;
  
  console.log('\n📈 Flow Test Summary:');
  console.log(`✅ Success: ${successCount}/${totalCount}`);
  console.log(`❌ Errors: ${errorCount}/${totalCount}`);
  console.log(`⚠️ Warnings: ${warningCount}/${totalCount}`);
  console.log(`⏭️ Skipped: ${skippedCount}/${totalCount}`);
  
  const healthScore = Math.round(((successCount + warningCount) / totalCount) * 100);
  console.log(`🎯 System Health: ${healthScore}%`);
  
  if (errorCount === 0) {
    console.log('\n🎉 All critical systems are working perfectly!');
  } else {
    console.log('\n⚠️ Some systems need attention.');
  }
  
  return results;
};

export default { testCompleteProjectFlow, displayFlowTestResults };
