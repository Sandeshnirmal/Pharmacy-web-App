// Prescription AI Results Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Checkbox,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

import PrescriptionService from '../../services/prescriptionService';
import { theme } from '../../theme/theme';

const PrescriptionResultScreen = ({ route, navigation }) => {
  const { prescriptionId, suggestions: initialSuggestions } = route.params;
  
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (suggestions?.medicines) {
      // Pre-select available medicines
      const availableMedicines = suggestions.medicines.filter(medicine => 
        medicine.isAvailable && medicine.product
      );
      setSelectedMedicines(availableMedicines.map(medicine => ({
        ...medicine,
        selectedQuantity: 1,
      })));
    }
  }, [suggestions]);

  useEffect(() => {
    calculateTotal();
  }, [selectedMedicines]);

  const calculateTotal = () => {
    const subtotal = selectedMedicines.reduce((total, medicine) => {
      return total + (medicine.product?.price || 0) * medicine.selectedQuantity;
    }, 0);

    const shipping = subtotal >= 500 ? 0 : 50;
    const discount = subtotal >= 1000 ? subtotal * 0.1 : 0;
    const total = subtotal + shipping - discount;

    setTotalAmount(total);
  };

  const toggleMedicineSelection = (medicineId) => {
    const medicine = suggestions.medicines.find(m => m.id === medicineId);
    
    if (!medicine.isAvailable || !medicine.product) {
      Alert.alert('Not Available', 'This medicine is not available for order');
      return;
    }

    setSelectedMedicines(prev => {
      const isSelected = prev.some(m => m.id === medicineId);
      
      if (isSelected) {
        return prev.filter(m => m.id !== medicineId);
      } else {
        return [...prev, { ...medicine, selectedQuantity: 1 }];
      }
    });
  };

  const updateQuantity = (medicineId, quantity) => {
    if (quantity < 1) return;
    
    setSelectedMedicines(prev =>
      prev.map(medicine =>
        medicine.id === medicineId
          ? { ...medicine, selectedQuantity: quantity }
          : medicine
      )
    );
  };

  const getConfidenceColor = (confidence) => {
    return PrescriptionService.getConfidenceColor(confidence);
  };

  const getConfidenceDescription = (confidence) => {
    return PrescriptionService.getConfidenceDescription(confidence);
  };

  const proceedToOrder = () => {
    if (selectedMedicines.length === 0) {
      Alert.alert('No Medicines Selected', 'Please select at least one medicine to proceed');
      return;
    }

    navigation.navigate('OrderConfirmation', {
      prescriptionId,
      selectedMedicines,
      totalAmount,
      suggestions,
    });
  };

  const refreshSuggestions = async () => {
    setIsLoading(true);
    try {
      const result = await PrescriptionService.getMedicineSuggestions(prescriptionId);
      if (result.success) {
        setSuggestions(result);
        Toast.show({
          type: 'success',
          text1: 'Refreshed',
          text2: 'Medicine suggestions updated',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Refresh Failed',
        text2: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!suggestions) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading AI results...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* AI Summary Card */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.summaryHeader}>
            <Title>AI Analysis Results</Title>
            <TouchableOpacity onPress={refreshSuggestions} disabled={isLoading}>
              <Icon 
                name="refresh" 
                size={24} 
                color={isLoading ? theme.colors.disabled : theme.colors.primary} 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>AI Confidence:</Text>
            <Chip
              style={[styles.confidenceChip, { backgroundColor: getConfidenceColor(suggestions.aiConfidence) }]}
              textStyle={{ color: 'white' }}
            >
              {Math.round(suggestions.aiConfidence * 100)}% - {getConfidenceDescription(suggestions.aiConfidence)}
            </Chip>
          </View>

          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{suggestions.summary.totalMedicines}</Text>
              <Text style={styles.statLabel}>Total Medicines</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{suggestions.summary.availableMedicines}</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{suggestions.summary.unavailableMedicines}</Text>
              <Text style={styles.statLabel}>Unavailable</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Medicines List */}
      <Card style={styles.medicinesCard}>
        <Card.Content>
          <Title>Extracted Medicines</Title>
          
          {suggestions.medicines.map((medicine, index) => (
            <View key={medicine.id} style={styles.medicineItem}>
              <View style={styles.medicineHeader}>
                <View style={styles.medicineInfo}>
                  <Text style={styles.medicineName}>{medicine.name}</Text>
                  <Text style={styles.medicineDetails}>
                    {medicine.dosage} • {medicine.quantity}
                  </Text>
                  {medicine.instructions && (
                    <Text style={styles.medicineInstructions}>
                      {medicine.instructions}
                    </Text>
                  )}
                </View>
                
                <View style={styles.medicineActions}>
                  <Chip
                    style={[styles.confidenceChip, { backgroundColor: getConfidenceColor(medicine.confidence) }]}
                    textStyle={{ color: 'white', fontSize: 12 }}
                  >
                    {Math.round(medicine.confidence * 100)}%
                  </Chip>
                  
                  {medicine.isAvailable && medicine.product && (
                    <Checkbox
                      status={selectedMedicines.some(m => m.id === medicine.id) ? 'checked' : 'unchecked'}
                      onPress={() => toggleMedicineSelection(medicine.id)}
                    />
                  )}
                </View>
              </View>

              {/* Product Information */}
              {medicine.product ? (
                <View style={styles.productInfo}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>{medicine.product.name}</Text>
                    <Chip
                      style={[styles.statusChip, { 
                        backgroundColor: medicine.product.inStock ? '#4CAF50' : '#F44336' 
                      }]}
                      textStyle={{ color: 'white', fontSize: 12 }}
                    >
                      {medicine.product.inStock ? 'In Stock' : 'Out of Stock'}
                    </Chip>
                  </View>
                  
                  <View style={styles.productDetails}>
                    <Text style={styles.productPrice}>₹{medicine.product.price}</Text>
                    {medicine.product.mrp > medicine.product.price && (
                      <Text style={styles.productMrp}>MRP: ₹{medicine.product.mrp}</Text>
                    )}
                    <Text style={styles.productManufacturer}>{medicine.product.manufacturer}</Text>
                  </View>

                  {/* Quantity Selector */}
                  {selectedMedicines.some(m => m.id === medicine.id) && (
                    <View style={styles.quantitySelector}>
                      <Text style={styles.quantityLabel}>Quantity:</Text>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => {
                            const selected = selectedMedicines.find(m => m.id === medicine.id);
                            updateQuantity(medicine.id, selected.selectedQuantity - 1);
                          }}
                        >
                          <Icon name="remove" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                        
                        <Text style={styles.quantityText}>
                          {selectedMedicines.find(m => m.id === medicine.id)?.selectedQuantity || 1}
                        </Text>
                        
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => {
                            const selected = selectedMedicines.find(m => m.id === medicine.id);
                            updateQuantity(medicine.id, selected.selectedQuantity + 1);
                          }}
                        >
                          <Icon name="add" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.unavailableInfo}>
                  <Icon name="info" size={16} color={theme.colors.disabled} />
                  <Text style={styles.unavailableText}>
                    This medicine is not available in our inventory
                  </Text>
                </View>
              )}

              {index < suggestions.medicines.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Order Summary */}
      {selectedMedicines.length > 0 && (
        <Card style={styles.orderSummaryCard}>
          <Card.Content>
            <Title>Order Summary</Title>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Selected Items:</Text>
              <Text style={styles.summaryValue}>{selectedMedicines.length}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>
                ₹{selectedMedicines.reduce((total, medicine) => 
                  total + (medicine.product?.price || 0) * medicine.selectedQuantity, 0
                ).toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping:</Text>
              <Text style={styles.summaryValue}>
                ₹{totalAmount >= 500 ? '0.00' : '50.00'}
              </Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
            </View>

            <Button
              mode="contained"
              onPress={proceedToOrder}
              style={styles.proceedButton}
              icon="shopping-cart"
            >
              Proceed to Order
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  confidenceLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  confidenceChip: {
    borderRadius: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text,
  },
  medicinesCard: {
    marginBottom: 16,
  },
  medicineItem: {
    marginVertical: 8,
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medicineInfo: {
    flex: 1,
    marginRight: 16,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  medicineDetails: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 4,
  },
  medicineInstructions: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginTop: 4,
    fontStyle: 'italic',
  },
  medicineActions: {
    alignItems: 'center',
  },
  productInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  statusChip: {
    borderRadius: 12,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginRight: 8,
  },
  productMrp: {
    fontSize: 12,
    color: theme.colors.disabled,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  productManufacturer: {
    fontSize: 12,
    color: theme.colors.text,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  unavailableInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 4,
  },
  unavailableText: {
    fontSize: 12,
    color: theme.colors.disabled,
    marginLeft: 4,
  },
  divider: {
    marginVertical: 12,
  },
  orderSummaryCard: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  proceedButton: {
    marginTop: 16,
  },
});

export default PrescriptionResultScreen;
