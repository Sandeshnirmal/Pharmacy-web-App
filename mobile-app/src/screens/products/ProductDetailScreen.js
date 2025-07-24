import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Button, Chip } from 'react-native-paper';
import { theme } from '../../theme/theme';

const ProductDetailScreen = ({ route, navigation }) => {
  const { product } = route.params || {};

  if (!product) {
    return (
      <View style={styles.container}>
        <Text>Product not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.productCard}>
        <Card.Content>
          <Title style={styles.productName}>{product.name}</Title>
          <Paragraph style={styles.manufacturer}>By {product.manufacturer}</Paragraph>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>₹{product.price.toFixed(2)}</Text>
            <Chip 
              mode="outlined" 
              style={[styles.stockChip, { backgroundColor: product.inStock ? '#E8F5E8' : '#FFEBEE' }]}
              textStyle={{ color: product.inStock ? 'green' : 'red' }}
            >
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </Chip>
          </View>

          <View style={styles.section}>
            <Title style={styles.sectionTitle}>Description</Title>
            <Paragraph>
              This is a high-quality medicine manufactured by {product.manufacturer}. 
              Please consult your doctor before use and follow the prescribed dosage.
            </Paragraph>
          </View>

          <View style={styles.section}>
            <Title style={styles.sectionTitle}>Usage Instructions</Title>
            <Paragraph>
              • Take as prescribed by your doctor{'\n'}
              • Store in a cool, dry place{'\n'}
              • Keep away from children{'\n'}
              • Check expiry date before use
            </Paragraph>
          </View>

          <Button
            mode="contained"
            onPress={() => {/* TODO: Add to cart */}}
            style={styles.addButton}
            disabled={!product.inStock}
          >
            Add to Cart
          </Button>
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
  productCard: {
    margin: 15,
    elevation: 3,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  manufacturer: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 15,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  stockChip: {
    borderWidth: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  addButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

export default ProductDetailScreen;
