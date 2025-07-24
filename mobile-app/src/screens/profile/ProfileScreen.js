import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, List, Avatar } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../theme/theme';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('access_token');
              // Navigation will be handled by the auth state change
            } catch (error) {
              console.error('Error logging out:', error);
            }
          }
        },
      ]
    );
  };

  const menuItems = [
    {
      title: 'My Orders',
      description: 'View your order history',
      icon: 'shopping-bag',
      onPress: () => navigation.navigate('Orders'),
    },
    {
      title: 'Prescription History',
      description: 'View uploaded prescriptions',
      icon: 'receipt',
      onPress: () => {/* TODO: Navigate to prescription history */},
    },
    {
      title: 'Addresses',
      description: 'Manage delivery addresses',
      icon: 'location-on',
      onPress: () => {/* TODO: Navigate to addresses */},
    },
    {
      title: 'Help & Support',
      description: 'Get help and contact support',
      icon: 'help',
      onPress: () => {/* TODO: Navigate to help */},
    },
    {
      title: 'Settings',
      description: 'App preferences and settings',
      icon: 'settings',
      onPress: () => {/* TODO: Navigate to settings */},
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text 
            size={80} 
            label={user.name.split(' ').map(n => n[0]).join('')}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Title style={styles.userName}>{user.name}</Title>
            <Paragraph style={styles.userEmail}>{user.email}</Paragraph>
            <Paragraph style={styles.userPhone}>{user.phone}</Paragraph>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.menuCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Account</Title>
          {menuItems.map((item, index) => (
            <List.Item
              key={index}
              title={item.title}
              description={item.description}
              left={props => <List.Icon {...props} icon={item.icon} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={item.onPress}
              style={styles.menuItem}
            />
          ))}
        </Card.Content>
      </Card>

      <Card style={styles.actionCard}>
        <Card.Content>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            textColor="#F44336"
            icon="logout"
          >
            Logout
          </Button>
        </Card.Content>
      </Card>

      <View style={styles.footer}>
        <Paragraph style={styles.version}>Version 1.0.0</Paragraph>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  profileCard: {
    margin: 15,
    elevation: 3,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginRight: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: theme.colors.text,
  },
  menuCard: {
    margin: 15,
    marginTop: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  menuItem: {
    paddingVertical: 5,
  },
  actionCard: {
    margin: 15,
    marginTop: 10,
    elevation: 3,
  },
  logoutButton: {
    borderColor: '#F44336',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  version: {
    fontSize: 12,
    color: theme.colors.text,
  },
});

export default ProfileScreen;
