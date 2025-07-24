import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Button, Title, Paragraph } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../theme/theme';

const HomeScreen = ({ navigation }) => {
  const quickActions = [
    {
      title: 'Upload Prescription',
      description: 'Take a photo of your prescription',
      icon: 'camera-alt',
      action: () => navigation.navigate('Prescription'),
      color: theme.colors.primary,
    },
    {
      title: 'Browse Products',
      description: 'Explore our medicine catalog',
      icon: 'medical-services',
      action: () => navigation.navigate('Products'),
      color: '#4CAF50',
    },
    {
      title: 'My Orders',
      description: 'Track your order status',
      icon: 'shopping-bag',
      action: () => navigation.navigate('Orders'),
      color: '#FF9800',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.welcomeText}>Welcome to Pharmacy App</Title>
        <Paragraph style={styles.subtitle}>
          Your trusted partner for medicine delivery
        </Paragraph>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {quickActions.map((action, index) => (
          <Card key={index} style={styles.actionCard} onPress={action.action}>
            <Card.Content style={styles.cardContent}>
              <View style={[styles.iconContainer, { backgroundColor: action.color }]}>
                <Icon name={action.icon} size={30} color="white" />
              </View>
              <View style={styles.textContainer}>
                <Title style={styles.actionTitle}>{action.title}</Title>
                <Paragraph style={styles.actionDescription}>
                  {action.description}
                </Paragraph>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>

      <Card style={styles.infoCard}>
        <Card.Content>
          <Title>AI-Powered Prescription Processing</Title>
          <Paragraph>
            Upload your prescription and let our AI technology identify medicines
            and suggest alternatives available in our pharmacy.
          </Paragraph>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Prescription')}
            style={styles.ctaButton}
          >
            Try Now
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
  header: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: theme.colors.text,
  },
  actionCard: {
    marginBottom: 15,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionDescription: {
    fontSize: 14,
    color: theme.colors.text,
  },
  infoCard: {
    margin: 20,
    elevation: 3,
  },
  ctaButton: {
    marginTop: 15,
  },
});

export default HomeScreen;
