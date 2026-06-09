import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';

// Screens
import LoginScreen from '../screens/authscreens/LoginScreen';
import SignupScreen from '../screens/authscreens/SignupScreen';
import SplashScreen from '../screens/authscreens/SplashScreen';
import HomeScreen from '../screens/mainscreens/HomeScreen';
import WalletScreen from '../screens/mainscreens/WalletScreen';
import HistoryScreen from '../screens/mainscreens/HistoryScreen';
import SettingsScreen from '../screens/mainscreens/SettingsScreen';
import RideDetailsScreen from '../screens/mainscreens/RideDetailsScreen'; // Import RideDetailsScreen
import VehicleSelectionScreen from '../screens/mainscreens/VehicleSelectionScreen';
import ChatSupportScreen from '../screens/mainscreens/ChatSupportScreen';
import ProfileScreen from '../screens/mainscreens/ProfileScreen';
import InCityScreen from '../screens/mainscreens/InCityScreen';
import InCityTrackingScreen from '../screens/mainscreens/InCityTrackingScreen';
import InCityUserInvoiceScreen from '../screens/mainscreens/InCityUserInvoiceScreen';
import InfoPageScreen from '../screens/mainscreens/InfoPageScreen';
import SelfSharingSearchScreen from '../screens/mainscreens/SelfSharingSearchScreen';
import AvailableTripsScreen from '../screens/mainscreens/AvailableTripsScreen';
import SelfSharingBookingScreen from '../screens/mainscreens/SelfSharingBookingScreen';
import MyBookingsScreen from '../screens/mainscreens/MyBookingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator for authenticated users
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Wallet') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF1493',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#FF1493',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        options={{
          headerShown: false,
          title: 'Home'
        }}
        name="Home"
        component={HomeScreen}
      />
      <Tab.Screen
        options={{
          headerShown: false,
          title: 'Wallet'
        }}
        name="Wallet"
        component={WalletScreen}
      />
      <Tab.Screen
        options={{
          headerShown: false,
          title: 'History'
        }}
        name="History"
        component={HistoryScreen}
      />
      <Tab.Screen
        options={{
          headerShown: false,
          title: 'Settings'
        }}
        name="Settings"
        component={SettingsScreen}
      />
    </Tab.Navigator>
  );
};

// Auth Stack Navigator
const AuthStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // User is authenticated - show Main App
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen
              name="RideDetails"
              component={RideDetailsScreen}
              options={{
                headerShown: false,
                headerTitle: 'Ride Details',
                headerTitleAlign: 'center',
                headerStyle: {
                  backgroundColor: '#FF1493',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                  color: '#fff',
                  marginLeft: -30,
                },
                headerBackTitle: 'Back',
                headerBackTitleStyle: {
                  color: '#fff',
                  fontSize: 14,
                },

                headerBackImage: ({ tintColor }) => (
                  <Icon name="chevron-back" size={24} color={tintColor} />
                ),
              }}
            />
            <Stack.Screen
              name="VehicleSelection"
              component={VehicleSelectionScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="InCity"
              component={InCityScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InCityTracking"
              component={InCityTrackingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InCityUserInvoice"
              component={InCityUserInvoiceScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ChatSupport"
              component={ChatSupportScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="InfoPage"
              component={InfoPageScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="SelfSharingSearch"
              component={SelfSharingSearchScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AvailableTrips"
              component={AvailableTripsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SelfSharingBooking"
              component={SelfSharingBookingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MyBookings"
              component={MyBookingsScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // User is not authenticated - show Auth screens
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
