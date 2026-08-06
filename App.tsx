import React,{ useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { PermissionsAndroid, Platform, StatusBar, Alert } from 'react-native';
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';
import { request as requestPermission, PERMISSIONS, RESULTS } from 'react-native-permissions';
import messaging from '@react-native-firebase/messaging';
import { playNotificationSound, stopNotificationSound } from './src/utils/notificationRing';

const App = () => {
const requestLocationPermission = async () => {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

useEffect(() => {
  const init = async () => {
    const granted = await requestLocationPermission();

    if (granted) {
      checkLocation();
    }
  };

  init();

  requestNotificationPermission();

  const handleRemoteMessage = (remoteMessage) => {
    console.log('FCM Notification (foreground/opened):', remoteMessage);
    console.log('FCM data.type:', JSON.stringify(remoteMessage?.data?.type));

    if (remoteMessage?.data?.type === 'BOOKING_ARRIVED') {
      console.log('BOOKING_ARRIVED matched, calling playNotificationSound()');
      playNotificationSound();
    }

    if (remoteMessage?.data?.type === 'BOOKING_CANCELLED') {
      stopNotificationSound();
      Alert.alert(
        remoteMessage.notification?.title || 'Booking Cancelled',
        remoteMessage.notification?.body ||
          'Sorry, your booking has been cancelled. Please create a new booking.',
      );
    }
  };

  const unsubscribeOnMessage = messaging().onMessage(handleRemoteMessage);
  const unsubscribeOnOpened = messaging().onNotificationOpenedApp(handleRemoteMessage);
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) handleRemoteMessage(remoteMessage);
    });

  return () => {
    unsubscribeOnMessage();
    unsubscribeOnOpened();
  };
}, []);

  const checkLocation = async () => {
    try {
      await promptForEnableLocationIfNeeded({
        interval: 10000,
        fastInterval: 5000,
      });

      console.log('Location Enabled');
    } catch (error) {
      console.log('User cancelled or location not enabled', error);
    }
  };
  
  const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Enable Notifications',
            message: 'Allow notifications so you stay updated on KYC and ride updates.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    }

    if (Platform.OS === 'ios') {
      const result = await requestPermission(PERMISSIONS.IOS.NOTIFICATIONS);
      return result === RESULTS.GRANTED;
    }

    return true;
  } catch (err) {
    console.warn(err);
    return false;
  }
};

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <StatusBar
            backgroundColor="#ff7f50"
            barStyle="dark-content"

            translucent
          />
            <SafeAreaView style={{ flex: 1, backgroundColor: "#ff7f50" }}>
          <AppNavigator />
          </SafeAreaView>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;