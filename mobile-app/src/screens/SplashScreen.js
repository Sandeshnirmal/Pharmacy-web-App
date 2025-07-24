import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pharmacy App</Text>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text,
    marginTop: 20,
  },
});

export default SplashScreen;
