// // Main App Component for Pharmacy Mobile App
// import React, { useEffect, useState } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { Provider as PaperProvider } from 'react-native-paper';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import Toast from 'react-native-toast-message';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import Icon from 'react-native-vector-icons/MaterialIcons';

// // Import screens
// import LoginScreen from './src/screens/auth/LoginScreen';
// import RegisterScreen from './src/screens/auth/RegisterScreen';
// import HomeScreen from './src/screens/home/HomeScreen';
// import PrescriptionCameraScreen from './src/screens/prescription/PrescriptionCameraScreen';
// import PrescriptionResultScreen from './src/screens/prescription/PrescriptionResultScreen';
// import OrderConfirmationScreen from './src/screens/prescription/OrderConfirmationScreen';
// import ProductsScreen from './src/screens/products/ProductsScreen';
// import ProductDetailScreen from './src/screens/products/ProductDetailScreen';
// import OrdersScreen from './src/screens/orders/OrdersScreen';
// import OrderDetailScreen from './src/screens/orders/OrderDetailScreen';
// import ProfileScreen from './src/screens/profile/ProfileScreen';
// import SplashScreen from './src/screens/SplashScreen';

// // Import theme
// import { theme } from './src/theme/theme';

// const Stack = createStackNavigator();
// const Tab = createBottomTabNavigator();

// // Bottom Tab Navigator
// function MainTabNavigator() {
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ focused, color, size }) => {
//           let iconName;

//           if (route.name === 'Home') {
//             iconName = 'home';
//           } else if (route.name === 'Products') {
//             iconName = 'medical-services';
//           } else if (route.name === 'Prescription') {
//             iconName = 'camera-alt';
//           } else if (route.name === 'Orders') {
//             iconName = 'shopping-bag';
//           } else if (route.name === 'Profile') {
//             iconName = 'person';
//           }

//           return <Icon name={iconName} size={size} color={color} />;
//         },
//         tabBarActiveTintColor: theme.colors.primary,
//         tabBarInactiveTintColor: 'gray',
//         headerShown: false,
//       })}
//     >
//       <Tab.Screen name="Home" component={HomeScreen} />
//       <Tab.Screen name="Products" component={ProductsScreen} />
//       <Tab.Screen 
//         name="Prescription" 
//         component={PrescriptionCameraScreen}
//         options={{
//           tabBarLabel: 'Upload Rx',
//         }}
//       />
//       <Tab.Screen name="Orders" component={OrdersScreen} />
//       <Tab.Screen name="Profile" component={ProfileScreen} />
//     </Tab.Navigator>
//   );
// }

// // Auth Stack Navigator
// function AuthStackNavigator() {
//   return (
//     <Stack.Navigator screenOptions={{ headerShown: false }}>
//       <Stack.Screen name="Login" component={LoginScreen} />
//       <Stack.Screen name="Register" component={RegisterScreen} />
//     </Stack.Navigator>
//   );
// }

// // Main Stack Navigator
// function MainStackNavigator() {
//   return (
//     <Stack.Navigator>
//       <Stack.Screen 
//         name="MainTabs" 
//         component={MainTabNavigator}
//         options={{ headerShown: false }}
//       />
//       <Stack.Screen 
//         name="PrescriptionResult" 
//         component={PrescriptionResultScreen}
//         options={{ 
//           title: 'AI Results',
//           headerBackTitleVisible: false,
//         }}
//       />
//       <Stack.Screen 
//         name="OrderConfirmation" 
//         component={OrderConfirmationScreen}
//         options={{ 
//           title: 'Order Confirmation',
//           headerBackTitleVisible: false,
//         }}
//       />
//       <Stack.Screen 
//         name="ProductDetail" 
//         component={ProductDetailScreen}
//         options={{ 
//           title: 'Product Details',
//           headerBackTitleVisible: false,
//         }}
//       />
//       <Stack.Screen 
//         name="OrderDetail" 
//         component={OrderDetailScreen}
//         options={{ 
//           title: 'Order Details',
//           headerBackTitleVisible: false,
//         }}
//       />
//     </Stack.Navigator>
//   );
// }

// // Main App Component
// export default function App() {
//   const [isLoading, setIsLoading] = useState(true);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);

//   useEffect(() => {
//     checkAuthStatus();
//   }, []);

//   const checkAuthStatus = async () => {
//     try {
//       const token = await AsyncStorage.getItem('access_token');
//       setIsAuthenticated(!!token);
//     } catch (error) {
//       console.error('Error checking auth status:', error);
//       setIsAuthenticated(false);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (isLoading) {
//     return <SplashScreen />;
//   }

//   return (
//     <SafeAreaProvider>
//       <PaperProvider theme={theme}>
//         <NavigationContainer>
//           {isAuthenticated ? <MainStackNavigator /> : <AuthStackNavigator />}
//         </NavigationContainer>
//         <Toast />
//       </PaperProvider>
//     </SafeAreaProvider>
//   );
// }
