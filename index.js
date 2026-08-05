/**
 * @format
 */

import './src/helpers/imagePatch';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Required so RNFirebase doesn't warn about a missing handler. The OS already
// shows the system tray notification for background/killed apps on its own;
// in-app handling for opened-via-notification happens in App.tsx.
messaging().setBackgroundMessageHandler(async () => {});

AppRegistry.registerComponent(appName, () => App);
