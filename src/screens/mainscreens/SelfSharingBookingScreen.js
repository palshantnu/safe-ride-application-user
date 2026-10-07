import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import RazorpayCheckout from 'react-native-razorpay';
import { useDispatch, useSelector } from 'react-redux';
import { CREATE_SELF_SHARING_BOOKING } from '../../redux/actions/action-creator';

const SelfSharingBookingScreen = ({ navigation, route }) => {
  const { trip, fromCity, toCity, date, service_title, serviceType } = route.params;
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [passengers, setPassengers] = useState([{ name: '', age: '', gender: '' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleSelectSeats = (seats) => {
    setSelectedSeats(seats);
    setPassengers((prev) => {
      const next = [...prev];
      if (next.length < seats) {
        while (next.length < seats) {
          next.push({ name: '', age: '', gender: '' });
        }
      } else if (next.length > seats) {
        next.splice(seats);
      }
      return next;
    });
  };

  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const maxSeatsPerBooking = Math.min(4, parseInt(trip.available_seats));

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const runOnlinePaymentGateway = (amount) => {
    return new Promise((resolve) => {
      const options = {
        description: `${service_title} Booking`,
        currency: 'INR',
        key: 'rzp_test_DUnz7sPsonIW95',
        amount: Math.round(amount * 100),
        name: 'SIGIRIDE',
        prefill: {
          name: user?.name || '',
          contact: user?.mobile || '',
          email: user?.email || '',
        },
        theme: { color: '#FF1493' },
      };
      RazorpayCheckout.open(options)
        .then(() => resolve(true))
        .catch((err) => {
          console.log('Razorpay Error:', err);
          resolve(false);
        });
    });
  };

  const handlePayment = async () => {
    if (selectedSeats === 0) {
      Alert.alert('Error', 'Please select at least one seat');
      return;
    }

    setIsLoading(true);
    try {
      // Validate passenger details
      for (let i = 0; i < passengers.length; i++) {
        if (!passengers[i].name.trim()) {
          Alert.alert('Error', `Please enter name for Passenger ${i + 1}`);
          setIsLoading(false);
          return;
        }
        if (!passengers[i].age.trim()) {
          Alert.alert('Error', `Please enter age for Passenger ${i + 1}`);
          setIsLoading(false);
          return;
        }
        if (isNaN(passengers[i].age) || parseInt(passengers[i].age) <= 0) {
          Alert.alert('Error', `Please enter a valid age for Passenger ${i + 1}`);
          setIsLoading(false);
          return;
        }
        if (!passengers[i].gender) {
          Alert.alert('Error', `Please select gender for Passenger ${i + 1}`);
          setIsLoading(false);
          return;
        }
      }

      const totalTokenFare = parseFloat(trip.token_fare) * selectedSeats;

      // Run Razorpay payment
      const isPaymentDone = await runOnlinePaymentGateway(totalTokenFare);
      
      if (!isPaymentDone) {
        setIsLoading(false);
        return;
      }

      // Generate a mock transaction ID (in real app, this would come from Razorpay response)
      const transactionId = `pay_${Date.now()}`;

      // Create booking
      const bookingPayload = {
        trip_id: trip.trip_id,
        seats: selectedSeats,
        transaction_id: transactionId,
        passengers: passengers.map(p => ({
          name: p.name.trim(),
          age: parseInt(p.age.trim(), 10),
          gender: p.gender
        }))
      };

      const res = await dispatch(CREATE_SELF_SHARING_BOOKING(bookingPayload, serviceType));

      if (res?.status) {
        Alert.alert('Success', 'Booking confirmed successfully!', [
          {
            text: 'View My Bookings',
            onPress: () =>
              navigation.navigate('MyBookings', {
                service_title,
                serviceType,
              }),
          },
          {
            text: 'Go Home',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', res?.message || 'Booking failed');
      }
    } catch (error) {
  console.log('Error in payment:', error);

  Alert.alert(
    'Error',
    error?.message || 'Something went wrong'
  );
} finally {
      setIsLoading(false);
    }
  };


  const totalTokenFare = parseFloat(trip.token_fare) * selectedSeats;
  const totalFullFare = parseFloat(trip.full_fare) * selectedSeats;
  const savings = totalFullFare - totalTokenFare;
  const savingsPercentage = ((savings / totalFullFare) * 100).toFixed(0);

  const seatOptions = Array.from({ length: maxSeatsPerBooking }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ff7f50" />

      {/* Header */}
      <LinearGradient
        colors={['#ff7f50', '#ff7f50', '#e20f7a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Seats</Text>
        <View style={{ width: 28 }} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF1493']}
            tintColor="#FF1493"
          />
        }
      >
        {/* Trip Summary */}
        <View style={styles.tripSummary}>
          <View style={styles.routeBox}>
            <View style={styles.routeItem}>
              <FontAwesome5 name="map-marker-alt" size={16} color="#4CAF50" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.label}>From</Text>
                <Text style={styles.cityName}>{fromCity}</Text>
              </View>
            </View>

            <View style={styles.routeDivider} />

            <View style={styles.routeItem}>
              <FontAwesome5 name="map-marker-alt" size={16} color="#FF5252" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.label}>To</Text>
                <Text style={styles.cityName}>{toCity}</Text>
              </View>
            </View>
          </View>

          <View style={styles.tripDetailsGrid}>
            <View style={styles.tripDetailItem}>
              <Icon name="calendar" size={16} color="#666" />
              <Text style={styles.tripDetailLabel}>Date</Text>
              <Text style={styles.tripDetailValue}>{date}</Text>
            </View>

            <View style={styles.tripDetailItem}>
              <Icon name="clock" size={16} color="#666" />
              <Text style={styles.tripDetailLabel}>Departure</Text>
              <Text style={styles.tripDetailValue}>
                {new Date(trip.departure_time).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </Text>
            </View>

            <View style={styles.tripDetailItem}>
              <FontAwesome5 name="chair" size={16} color="#666" />
              <Text style={styles.tripDetailLabel}>Available</Text>
              <Text style={styles.tripDetailValue}>{trip.available_seats} Seats</Text>
            </View>
          </View>

          {/* Driver Info */}
          <View style={styles.driverCard}>
            <View style={styles.driverIconBox}>
              <FontAwesome5 name="user-circle" size={24} color="#FF1493" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{trip.creator_name}</Text>
              <Text style={styles.driverRole}>
                {trip.creator_type === 'DRIVER' ? 'Driver' : 'Agent'}
              </Text>
              {trip.vehicle_number || trip.vehicle_type ? (
                <Text style={[styles.driverRole, { marginTop: 4, color: '#333' }]}>
                  <FontAwesome5 name="car-side" size={12} color="#666" />{'  '}
                  {[[trip?.vehicle_type, trip?.vehicle_model].filter(Boolean).join(' '), trip?.vehicle_color, trip?.vehicle_number].filter(Boolean).join(' • ')}
                </Text>
              ) : null}
            </View>
            {/* <TouchableOpacity style={styles.callButton}>
              <FontAwesome5 name="phone" size={16} color="#FF1493" />
              <Text style={styles.callButtonText}>Call</Text>
            </TouchableOpacity> */}
          </View>

          {/* Pickup Address */}
          <View style={styles.pickupAddressBox}>
            <Icon name="map-pin" size={18} color="#FF1493" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.pickupLabel}>Pickup Location</Text>
              <Text style={styles.pickupAddress} numberOfLines={2}>
                {trip.pickup_address}
              </Text>
            </View>
          </View>
        </View>

        {/* Seat Selection */}
        <View style={styles.seatSelectionCard}>
          <Text style={styles.sectionTitle}>Select Number of Seats</Text>
          <View style={styles.seatsContainer}>
            {seatOptions.map((seat) => (
              <TouchableOpacity
                key={seat}
                style={[
                  styles.seatOption,
                  selectedSeats === seat && styles.seatOptionSelected,
                ]}
                onPress={() => handleSelectSeats(seat)}
              >
                <FontAwesome5
                  name="chair"
                  size={18}
                  color={selectedSeats === seat ? '#fff' : '#FF1493'}
                />
                <Text
                  style={[
                    styles.seatOptionText,
                    selectedSeats === seat && styles.seatOptionTextSelected,
                  ]}
                >
                  {seat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Passenger Details */}
        <View style={styles.passengersCard}>
          <Text style={styles.sectionTitle}>Passenger Details</Text>
          {passengers.map((passenger, idx) => (
            <View key={idx} style={styles.passengerFormGroup}>
              <Text style={styles.passengerLabel}>Passenger {idx + 1}</Text>
              <View style={styles.passengerInputRow}>
                <TextInput
                  style={styles.passengerNameInput}
                  placeholder="Enter Name"
                  placeholderTextColor="#999"
                  value={passenger.name}
                  onChangeText={(val) => {
                    const next = [...passengers];
                    next[idx] = { ...next[idx], name: val };
                    setPassengers(next);
                  }}
                />
                <TextInput
                  style={styles.passengerAgeInput}
                  placeholder="Age"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={3}
                  value={passenger.age}
                  onChangeText={(val) => {
                    const next = [...passengers];
                    next[idx] = { ...next[idx], age: val };
                    setPassengers(next);
                  }}
                />
              </View>
              {/* Gender selector */}
              <View style={styles.genderContainer}>
                <Text style={styles.genderLabel}>Gender:</Text>
                <View style={styles.genderOptions}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderOption,
                        passenger.gender === g && styles.genderOptionSelected,
                      ]}
                      onPress={() => {
                        const next = [...passengers];
                        next[idx] = { ...next[idx], gender: g };
                        setPassengers(next);
                      }}
                    >
                      <Text
                        style={[
                          styles.genderOptionText,
                          passenger.gender === g && styles.genderOptionTextSelected,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing Breakdown */}
        <View style={styles.pricingCard}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Token Fare per Seat</Text>
            <Text style={styles.priceValue}>₹{trip.token_fare}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Full Fare per Seat</Text>
            <Text style={styles.priceValue}>₹{trip.full_fare}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Number of Seats</Text>
            <Text style={styles.priceValue}>{selectedSeats}</Text>
          </View>

          <View style={styles.priceDivider} />

          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Token Fare</Text>
            <Text style={styles.totalValue}>₹{totalTokenFare.toFixed(2)}</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Full Fare</Text>
            <Text style={styles.totalValue}>₹{totalFullFare.toFixed(2)}</Text>
          </View>

          <View style={styles.savingsBox}>
            <FontAwesome5 name="tag" size={14} color="#4CAF50" />
            {/* <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={styles.savingsLabel}>You Save</Text>
              <Text style={styles.savingsValue}>
                ₹{savings.toFixed(2)} ({savingsPercentage}% off full fare)
              </Text>
            </View> */}
          </View>

          <View style={styles.infoBox}>
            <Icon name="info" size={14} color="#2196F3" />
            <Text style={styles.infoText}>
              Pay token amount now. Balance will be collected at pickup.
            </Text>
          </View>
        </View>

        {/* Terms */}
        <View style={styles.termsBox}>
          <View style={styles.termItem}>
            <FontAwesome5 name="check-circle" size={14} color="#4CAF50" />
            <Text style={styles.termText}>Verified Driver & Passengers</Text>
          </View>
          <View style={styles.termItem}>
            <FontAwesome5 name="check-circle" size={14} color="#4CAF50" />
            <Text style={styles.termText}>Cancel Anytime</Text>
          </View>
          <View style={styles.termItem}>
            <FontAwesome5 name="check-circle" size={14} color="#4CAF50" />
            <Text style={styles.termText}>Safe & Secure Payment</Text>
          </View>
        </View>
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.bottomContainer}>
        <LinearGradient
          colors={['#FF1493', '#E91E63']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.paymentButton}
        >
          <TouchableOpacity
            onPress={handlePayment}
            disabled={isLoading}
            style={styles.paymentButtonTouch}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <FontAwesome5 name="rupee-sign" size={18} color="#fff" />
                <Text style={styles.paymentButtonText}>
                  Pay ₹{totalTokenFare.toFixed(2)} to Book
                </Text>
              </>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 100,
  },
  tripSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  routeBox: {
    marginBottom: 15,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDivider: {
    height: 20,
    width: 2,
    backgroundColor: '#ddd',
    marginLeft: 8,
    marginVertical: 4,
  },
  label: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tripDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  tripDetailItem: {
    alignItems: 'center',
    flex: 1,
  },
  tripDetailLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
    marginTop: 4,
  },
  tripDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  driverIconBox: {
    marginRight: 10,
  },
  driverName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  driverRole: {
    fontSize: 11,
    color: '#FF1493',
    marginTop: 2,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF1493',
  },
  pickupAddressBox: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 10,
  },
  pickupLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  pickupAddress: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    marginTop: 2,
  },
  seatSelectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2B4E',
    marginBottom: 12,
  },
  seatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  seatOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#FF1493',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  seatOptionSelected: {
    backgroundColor: '#FF1493',
  },
  seatOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF1493',
    marginTop: 4,
  },
  seatOptionTextSelected: {
    color: '#fff',
  },
  pricingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: '#666',
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  totalRow: {
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2B4E',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  savingsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  savingsLabel: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '600',
  },
  savingsValue: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  bookingButton: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 30,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  bookingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  passengersCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  passengerFormGroup: {
    marginBottom: 12,
  },
  passengerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  passengerInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  passengerNameInput: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FAF9F6',
  },
  passengerAgeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FAF9F6',
  },
  genderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  genderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  genderOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  genderOptionSelected: {
    borderColor: '#FF1493',
    backgroundColor: '#FFF0F5',
  },
  genderOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  genderOptionTextSelected: {
    color: '#FF1493',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1565C0',
    flex: 1,
  },
  termsBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  termText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  paymentButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  paymentButtonTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SelfSharingBookingScreen;
