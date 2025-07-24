import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card, Title, Paragraph, Button, Searchbar } from 'react-native-paper';
import { theme } from '../../theme/theme';

const ProductsScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock products data
  const mockProducts = [
    {
      id: 1,
      name: 'Paracetamol 650mg',
      price: 12.0,
      manufacturer: 'MedCorp',
      inStock: true,
    },
    {
      id: 2,
      name: 'Azithromycin 500mg',
      price: 125.0,
      manufacturer: 'Alembic',
      inStock: true,
    },
    {
      id: 3,
      name: 'Omeprazole 20mg',
      price: 35.25,
      manufacturer: 'MedCorp',
      inStock: true,
    },
  ];

  useEffect(() => {
    setProducts(mockProducts);
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProduct = ({ item }) => (
    <Card style={styles.productCard} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
      <Card.Content>
        <Title style={styles.productName}>{item.name}</Title>
        <Paragraph style={styles.manufacturer}>By {item.manufacturer}</Paragraph>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
          <Text style={[styles.stock, { color: item.inStock ? 'green' : 'red' }]}>
            {item.inStock ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>
        <Button
          mode="contained"
          onPress={() => {/* TODO: Add to cart */}}
          style={styles.addButton}
          disabled={!item.inStock}
        >
          Add to Cart
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search medicines..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />
      
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchbar: {
    margin: 15,
  },
  list: {
    padding: 15,
  },
  productCard: {
    marginBottom: 15,
    elevation: 3,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  manufacturer: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  stock: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButton: {
    marginTop: 10,
  },
});

export default ProductsScreen;
