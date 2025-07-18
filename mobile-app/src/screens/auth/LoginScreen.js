// Login Screen for Pharmacy Mobile App
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  HelperText,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

import ApiService from '../../services/api';
import { theme } from '../../theme/theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await ApiService.login(email.trim(), password);

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: 'Welcome to Pharmacy App!',
        });

        // Navigation will be handled by App.js checking auth status
        // Force a re-render by restarting the app or using navigation reset
      } else {
        setErrors({ general: result.error });
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: result.error,
        });
      }
    } catch (error) {
      const errorMessage = 'An unexpected error occurred';
      setErrors({ general: errorMessage });
      Toast.show({
        type: 'error',
        text1: 'Login Error',
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Icon name="local-pharmacy" size={64} color={theme.colors.primary} />
          <Title style={styles.title}>Pharmacy App</Title>
          <Paragraph style={styles.subtitle}>
            Your trusted pharmacy partner
          </Paragraph>
        </View>

        <Card style={styles.loginCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Sign In</Title>

            {errors.general && (
              <View style={styles.errorContainer}>
                <Icon name="error" size={20} color={theme.colors.error} />
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={!!errors.email}
              left={<TextInput.Icon icon="email" />}
            />
            <HelperText type="error" visible={!!errors.email}>
              {errors.email}
            </HelperText>

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry={!showPassword}
              error={!!errors.password}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            <HelperText type="error" visible={!!errors.password}>
              {errors.password}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginButton}
              contentStyle={styles.buttonContent}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <Button
                mode="text"
                onPress={navigateToRegister}
                compact
                style={styles.registerButton}
              >
                Sign Up
              </Button>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.features}>
          <Title style={styles.featuresTitle}>App Features</Title>
          
          <View style={styles.featureItem}>
            <Icon name="camera-alt" size={24} color={theme.colors.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>AI Prescription Scanning</Text>
              <Text style={styles.featureDescription}>
                Upload prescription photos and get instant medicine suggestions
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Icon name="local-shipping" size={24} color={theme.colors.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Fast Delivery</Text>
              <Text style={styles.featureDescription}>
                Get medicines delivered to your doorstep quickly
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Icon name="verified" size={24} color={theme.colors.primary} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Verified Medicines</Text>
              <Text style={styles.featureDescription}>
                All medicines are genuine and quality assured
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  loginCard: {
    marginBottom: 32,
    elevation: 4,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: theme.colors.primary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.error,
    marginLeft: 8,
    flex: 1,
  },
  input: {
    marginBottom: 8,
  },
  loginButton: {
    marginTop: 16,
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: theme.colors.text,
  },
  registerButton: {
    marginLeft: -8,
  },
  features: {
    marginTop: 20,
  },
  featuresTitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: theme.colors.primary,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
  },
  featureText: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: theme.colors.disabled,
  },
});

export default LoginScreen;
