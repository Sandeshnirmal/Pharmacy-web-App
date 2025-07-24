import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Chip, Divider } from 'react-native-paper';
import { theme } from '../../theme/theme';

const OrderDetailScreen = ({ route }) => {
  const { order } = route.params || {};

  if (!order) {
    return (
      <View style={styles.container}>
        <Text>Order not found</Text>
      </View>
    );
  }

  // Mock order items
  const orderItems = [
    { id: 1, name: 'Paracetamol 650mg', quantity: 2, price: 12.0 },
    { id: 2, name: 'Azithromycin 500mg', quantity: 1, price: 125.0 },
  ];

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#4CAF50';
      case 'processing':
        return '#FF9800';
      case 'pending':
        return '#2196F3';
      default:
        return '#757575';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title style={styles.orderNumber}>{order.orderNumber}</Title>
            <Chip 
              mode="outlined"
              style={[styles.statusChip, { borderColor: getStatusColor(order.status) }]}
              textStyle={{ color: getStatusColor(order.status) }}
            >
              {order.status}
            </Chip>
          </View>
          
          <Paragraph style={styles.orderDate}>Ordered on {order.date}</Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Order Items</Title>
          {orderItems.map((item, index) => (
            <View key={item.id}>
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
              </View>
              {index < orderItems.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Order Summary</Title>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>₹{(order.total - 10).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee:</Text>
            <Text style={styles.summaryValue}>₹10.00</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>₹{order.total.toFixed(2)}</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Delivery Information</Title>
          <Paragraph>
            <Text style={styles.label}>Address:{'\n'}</Text>
            123 Main Street, City, State 12345
          </Paragraph>
          <Paragraph style={styles.deliveryInfo}>
            <Text style={styles.label}>Estimated Delivery:{'\n'}</Text>
            {order.status === 'Delivered' ? 'Delivered' : '2-3 business days'}
          </Paragraph>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  card: {
    margin: 15,
    marginBottom: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusChip: {
    borderWidth: 1,
  },
  orderDate: {
    fontSize: 14,
    color: theme.colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemQuantity: {
    fontSize: 14,
    color: theme.colors.text,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  divider: {
    marginVertical: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 16,
  },
  summaryValue: {
    fontSize: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  label: {
    fontWeight: 'bold',
  },
  deliveryInfo: {
    marginTop: 10,
  },
});

export default OrderDetailScreen;
