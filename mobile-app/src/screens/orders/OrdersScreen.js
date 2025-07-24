import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card, Title, Paragraph, Chip } from 'react-native-paper';
import { theme } from '../../theme/theme';

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);

  // Mock orders data
  const mockOrders = [
    {
      id: 1,
      orderNumber: 'ORD-001',
      date: '2025-01-20',
      status: 'Delivered',
      total: 157.25,
      items: 3,
    },
    {
      id: 2,
      orderNumber: 'ORD-002',
      date: '2025-01-22',
      status: 'Processing',
      total: 89.50,
      items: 2,
    },
    {
      id: 3,
      orderNumber: 'ORD-003',
      date: '2025-01-23',
      status: 'Pending',
      total: 45.00,
      items: 1,
    },
  ];

  useEffect(() => {
    setOrders(mockOrders);
  }, []);

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

  const renderOrder = ({ item }) => (
    <Card 
      style={styles.orderCard} 
      onPress={() => navigation.navigate('OrderDetail', { order: item })}
    >
      <Card.Content>
        <View style={styles.orderHeader}>
          <Title style={styles.orderNumber}>{item.orderNumber}</Title>
          <Chip 
            mode="outlined"
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status}
          </Chip>
        </View>
        
        <Paragraph style={styles.orderDate}>Ordered on {item.date}</Paragraph>
        
        <View style={styles.orderFooter}>
          <Text style={styles.itemCount}>{item.items} item(s)</Text>
          <Text style={styles.total}>₹{item.total.toFixed(2)}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No orders found</Text>
            <Paragraph style={styles.emptySubtext}>
              Your order history will appear here
            </Paragraph>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: 15,
  },
  orderCard: {
    marginBottom: 15,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusChip: {
    borderWidth: 1,
  },
  orderDate: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 15,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 14,
    color: theme.colors.text,
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default OrdersScreen;
