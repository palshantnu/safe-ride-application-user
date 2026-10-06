/**
 * @format
 */

import './src/helpers/imagePatch';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import { playNotificationSound, stopNotificationSound } from './src/utils/notificationRing';

// The OS already shows the system tray notification for background/killed
// apps on its own; in-app handling for opened-via-notification happens in
// App.tsx. This handler additionally starts/stops the BOOKING_ARRIVED ring
// so it plays even while the app is backgrounded or fully killed.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('FCM Notification (background/quit):', remoteMessage);

  if (['BOOKING_ARRIVED', 'SIGI_TRIP_ARRIVED', 'PARCEL_ARRIVED', 'ONSPOT_ARRIVED'].includes(remoteMessage?.data?.type)) {
    playNotificationSound();
  }

  if (remoteMessage?.data?.type === 'BOOKING_CANCELLED') {
    stopNotificationSound();
  }
});

AppRegistry.registerComponent(appName, () => App);
