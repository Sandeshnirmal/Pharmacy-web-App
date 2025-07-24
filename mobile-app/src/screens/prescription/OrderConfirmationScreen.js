import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../theme/theme';

const OrderConfirmationScreen = ({ route, navigation }) => {
  const { orderData } = route.params || {};

  const handleContinueShopping = () => {
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  const handleViewOrders = () => {
    navigation.navigate('MainTabs', { screen: 'Orders' });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.successContainer}>
        <Icon name="check-circle" size={80} color="#4CAF50" />
        <Title style={styles.successTitle}>Order Confirmed!</Title>
        <Paragraph style={styles.successMessage}>
          Your order has been successfully placed and is being processed.
        </Paragraph>
      </View>

      {orderData && (
        <Card style={styles.orderCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Order Details</Title>
            <View style={styles.orderRow}>
              <Text style={styles.label}>Order Number:</Text>
              <Text style={styles.value}>{orderData.orderNumber || 'ORD-' + Date.now()}</Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={styles.label}>Total Amount:</Text>
              <Text style={styles.totalValue}>₹{orderData.total?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.orderRow}>
              <Text style={styles.label}>Status:</Text>
              <Chip mode="outlined" style={styles.statusChip}>
                Processing
              </Chip>
            </View>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.infoCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>What's Next?</Title>
          <View style={styles.stepContainer}>
            <Icon name="inventory" size={24} color={theme.colors.primary} />
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>Order Processing</Text>
              <Text style={styles.stepDescription}>
                We're preparing your medicines for delivery
              </Text>
            </View>
          </View>
          
          <View style={styles.stepContainer}>
            <Icon name="local-shipping" size={24} color={theme.colors.primary} />
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>Delivery</Text>
              <Text style={styles.stepDescription}>
                Your order will be delivered within 2-3 business days
              </Text>
            </View>
          </View>
          
          <View style={styles.stepContainer}>
            <Icon name="notifications" size={24} color={theme.colors.primary} />
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>Updates</Text>
              <Text style={styles.stepDescription}>
                You'll receive notifications about your order status
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.actionContainer}>
        <Button
          mode="contained"
          onPress={handleViewOrders}
          style={styles.primaryButton}
        >
          View My Orders
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleContinueShopping}
          style={styles.secondaryButton}
        >
          Continue Shopping
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  successContainer: {
    alignItems: 'center',
    padding: 30,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 15,
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: theme.colors.text,
  },
  orderCard: {
    margin: 15,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: theme.colors.text,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statusChip: {
    borderColor: '#FF9800',
  },
  infoCard: {
    margin: 15,
    elevation: 3,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepText: {
    marginLeft: 15,
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 14,
    color: theme.colors.text,
  },
  actionContainer: {
    padding: 15,
  },
  primaryButton: {
    marginBottom: 10,
    paddingVertical: 8,
  },
  secondaryButton: {
    paddingVertical: 8,
  },
});

export default OrderConfirmationScreen;
