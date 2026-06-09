import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { bookRide } from '../../redux/actions/action-creator';
import CurvedHeader from '../../components/CurvedHeader';

const RideScreen = ({ navigation }) => {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const { isLoading } = useSelector((state) => state.ride);

  const vehicleTypes = [
    { id: 'economy', name: 'Economy', price: 5, icon: 'car', time: '5 min' },
    { id: 'premium', name: 'Premium', price: 8, icon: 'car-sport', time: '3 min' },
    { id: 'suv', name: 'SUV', price: 10, icon: 'car-outline', time: '7 min' },
  ];

  const dispatch = useDispatch();

  const calculatePrice = () => {
    if (!pickup || !destination || !selectedVehicle) return 0;
    const distance = 5; // Mock distance in km
    return distance * selectedVehicle.price;
  };

  const handleBookRide = () => {
    if (!pickup || !destination) {
      Alert.alert('Error', 'Please enter pickup and destination');
      return;
    }

    if (!selectedVehicle) {
      Alert.alert('Error', 'Please select a vehicle type');
      return;
    }

    const rideData = {
      pickup,
      destination,
      vehicle: selectedVehicle,
      price: calculatePrice(),
    };

    dispatch(bookRide(rideData));
    Alert.alert('Success', 'Ride booked successfully!', [
      { text: 'OK', onPress: () => navigation.navigate('Home') }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ff7f50" />
      <CurvedHeader title="Ride" navigation={navigation} showBack />

      {/* Location Inputs */}
      <View style={styles.locationSection}>
        <View style={styles.locationInput}>
          <Icon name="location" size={24} color="#007AFF" />
          <TextInput
            style={styles.input}
            placeholder="Pickup Location"
            value={pickup}
            onChangeText={setPickup}
          />
        </View>
        <View style={styles.locationInput}>
          <Icon name="flag" size={24} color="#4CAF50" />
          <TextInput
            style={styles.input}
            placeholder="Destination"
            value={destination}
            onChangeText={setDestination}
          />
        </View>
      </View>

      {/* Vehicle Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Vehicle</Text>
        {vehicleTypes.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            style={[
              styles.vehicleCard,
              selectedVehicle?.id === vehicle.id && styles.selectedVehicle,
            ]}
            onPress={() => setSelectedVehicle(vehicle)}
          >
            <Icon name={vehicle.icon} size={40} color="#007AFF" />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{vehicle.name}</Text>
              <Text style={styles.vehicleTime}>Arrives in {vehicle.time}</Text>
            </View>
            <Text style={styles.vehiclePrice}>${vehicle.price}/km</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Price Estimate */}
      {selectedVehicle && pickup && destination && (
        <View style={styles.priceCard}>
          <Text style={styles.priceTitle}>Estimated Fare</Text>
          <Text style={styles.priceAmount}>${calculatePrice()}</Text>
        </View>
      )}

      {/* Book Button */}
      <TouchableOpacity
        style={styles.bookButton}
        onPress={handleBookRide}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.bookButtonText}>Book Ride</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  locationSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedVehicle: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 15,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  vehicleTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  vehiclePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  priceCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  priceTitle: {
    fontSize: 14,
    color: '#666',
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginVertical: 10,
  },
  bookButton: {
    backgroundColor: '#007AFF',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RideScreen;
