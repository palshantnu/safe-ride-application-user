import React,{ useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { PermissionsAndroid, StatusBar } from 'react-native';
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';


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