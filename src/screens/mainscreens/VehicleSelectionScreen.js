import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  CREATE_BOOKING,
  GET_PLANS,
  GET_SUB_SERVICES,
  CLEAR_BOOKING_DATA,
} from '../../redux/actions/action-creator';
import { IMAGE_URL } from '../../axios/axiosinstance';
import CurvedHeader from '../../components/CurvedHeader';

const { width } = Dimensions.get('window');

const VehicleSelectionScreen = ({ route, navigation }) => {
  const { service_id, service_title } = route.params;
  console.log('service_id',service_title);
  
  const isRental = service_title?.toLowerCase() === 'rental' || service_title === 'Driver';
  const dispatch = useDispatch();

  const {
    subServices,
    subServicesLoading,
    plans,
    plansLoading,
    bookingLoading,
    bookingSuccess,
    bookingError,
  } = useSelector((state) => state.common);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const [pickupCity, setPickupCity] = useState('');
  const [dropCity, setDropCity] = useState('');
  const [toCity, setToCity] = useState('');

  const handlePickupCityChange = (text) => {
    setPickupCity(text);
    if (isRental) {
      // setToCity(text);
      setDropCity(text);
    }
  };
  const [person, setPerson] = useState(1);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    dispatch(GET_SUB_SERVICES(service_id));
    return () => {
      dispatch(CLEAR_BOOKING_DATA());
    };
  }, [dispatch, service_id]);

  useEffect(() => {
    if (bookingSuccess) {
      Alert.alert('Success', 'Booking created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [bookingSuccess, navigation]);

  useEffect(() => {
    if (bookingError) {
      Alert.alert('Booking Failed', bookingError);
    }
  }, [bookingError]);

  const handleVehicleSelect = (vehicle) => {
     console.log('vehicle-->',vehicle);
    setSelectedVehicle(vehicle);
    setSelectedPlan(null);
    dispatch(GET_PLANS(service_id, vehicle.id));
  };

  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(scheduleDate.getHours());
      newDate.setMinutes(scheduleDate.getMinutes());
      setScheduleDate(newDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(scheduleDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setScheduleDate(newDate);
    }
  };

  const validateForm = () => {
    if (!selectedVehicle) {
      Alert.alert('Validation Error', 'Please select a vehicle');
      return false;
    }
    if (!pickupCity.trim()) {
      Alert.alert('Validation Error', 'Please enter pickup city');
      return false;
    }
    if (!dropCity.trim()) {
      Alert.alert('Validation Error', 'Please enter drop city');
      return false;
    }
    if (!selectedPlan) {
      Alert.alert('Validation Error', 'Please select a plan');
      return false;
    }
    if (person < 1) {
      Alert.alert('Validation Error', 'Please enter valid number of persons');
      return false;
    }
    return true;
  };

  const handleSubmitBooking = () => {
    if (!validateForm()) return;

    const bookingData = {
      service_id,
      sub_service_id: selectedVehicle.id,
      pickup_city: pickupCity,
      drop_city: dropCity,
      to_city: toCity,
      person,
      plan_id: selectedPlan.id,
      schedule_date: formatDateTime(scheduleDate),
    };
console.log('bookingData-->',bookingData);
    dispatch(CREATE_BOOKING(bookingData));
  };

  const getVehicleIcon = (title) => {
    const t = title?.toLowerCase() || '';
    if (t.includes('scooter')) return 'bicycle-outline';
    if (t.includes('bike')) return 'bicycle-outline';
    if (t.includes('auto')) return 'car-sport-outline';
    return 'car-outline';
  };

  const renderVehicleCard = ({ item }) => {
    const isSelected = selectedVehicle?.id === item.id;
    const imageUri = item.image
    ? `http://91.108.104.79:3000/uploads/subservice/${item.image}`
      : null;

    return (
      <TouchableOpacity
        style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
        onPress={() => handleVehicleSelect(item)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={isSelected ? ['#FF1493', '#FF69B4'] : ['#fff', '#fff']}
          style={styles.vehicleCardInner}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.vehicleImage}
              resizeMode="contain"
            />
          ) : (
            <Icon
              name={getVehicleIcon(item.title)}
              size={36}
              color={isSelected ? '#fff' : '#FF1493'}
            />
          )}
          <Text style={[styles.vehicleTitle, isSelected && styles.vehicleTitleSelected]}>
            {item.title}
          </Text>
          {isSelected && (
            <View style={styles.vehicleCheckBadge}>
              <Icon name="checkmark-circle" size={16} color="#4CAF50" />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderPlanCard = (plan) => (
    <TouchableOpacity
      key={plan.id}
      style={[styles.planCard, selectedPlan?.id === plan.id && styles.selectedPlanCard]}
      onPress={() => setSelectedPlan(plan)}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={selectedPlan?.id === plan.id ? ['#FF1493', '#FF69B4'] : ['#fff', '#fff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.planCardContent}
      >

        {console.log('mdleml',`http://91.108.104.79:3000/uploads/subservice/${plan.image}`)
        }
        <View style={styles.planImageContainer}>
          <Image
            source={{
              uri: plan.image
                ? `http://91.108.104.79:3000/uploads/plan/${plan.image}`
                : 'https://cdn-icons-png.flaticon.com/128/809/809998.png',
            }}
            style={styles.planImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.planInfo}>
          <View style={styles.planHeader}>
            <Text style={[styles.planName, selectedPlan?.id === plan.id && styles.selectedText]}>
              {plan.plan_name}
            </Text>
            <View style={styles.planDuration}>
              <FontAwesome5
                name="clock"
                size={12}
                color={selectedPlan?.id === plan.id ? '#fff' : '#666'}
              />
              <Text style={[styles.durationText, selectedPlan?.id === plan.id && styles.selectedText]}>
                {plan.plan_hour}h
              </Text>
            </View>
          </View>

          <Text style={[styles.planDescription, selectedPlan?.id === plan.id && styles.selectedTextLight]}>
            {plan.description !== 'NA' ? plan.description : `${plan.plan_hour} hours • ${plan.plan_km} km`}
          </Text>

          <View style={styles.featuresContainer}>
            <View style={[styles.featureBadge2, selectedPlan?.id === plan.id && styles.featureBadge]}>
              <Text style={styles.featureText}>{plan.plan_hour} hours</Text>
            </View>
            <View style={[styles.featureBadge2, selectedPlan?.id === plan.id && styles.featureBadge]}>
              <Text style={styles.featureText}>{plan.plan_km} km</Text>
            </View>
            {plan.driver_amount > 0 && (
              <View style={[styles.featureBadge2, selectedPlan?.id === plan.id && styles.featureBadge]}>
                <Text style={styles.featureText}>Driver included</Text>
              </View>
            )}
          </View>

          <View style={styles.planFooter}>
            <Text style={[styles.priceText, selectedPlan?.id === plan.id && styles.selectedText]}>
              ₹{parseInt(plan.plan_price).toLocaleString()}
            </Text>
            <Text style={[styles.totalLabel, selectedPlan?.id === plan.id && styles.selectedTextLight]}>
              total
            </Text>
          </View>
        </View>

        {selectedPlan?.id === plan.id && (
          <View style={styles.selectedBadge}>
            <Icon name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  if (subServicesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF1493" />
          <Text style={styles.loadingText}>Loading vehicles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ff7f50" />

      <CurvedHeader title="Pick your requirement" navigation={navigation} showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Vehicle Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose your service and plan</Text>
            {/* <Text style={styles.sectionSubtitle}>Choose your preferred vehicle type</Text> */}

            {subServices && subServices.length > 0 ? (
              <FlatList
                data={subServices}
                renderItem={renderVehicleCard}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.vehicleList}
                scrollEnabled={true}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No vehicles available</Text>
              </View>
            )}
          </View>

          {/* Trip Details Form — shown after vehicle selected */}
          {selectedVehicle && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Trip Details</Text>

                <View style={styles.formCard}>
                  <View style={styles.inputGroup}>
                    <Icon name="location-outline" size={20} color="#FF1493" />
                    <TextInput
                      style={styles.input}
                      placeholder="Pickup City"
                      value={pickupCity}
                      onChangeText={handlePickupCityChange}
                      placeholderTextColor="#999"
                    />
                  </View>

                  {isRental && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.inputGroup}>
                        <Icon name="navigate-outline" size={20} color="#FF1493" />
                        <TextInput
                          style={styles.input}
                          placeholder="To City"
                          value={toCity}
                          onChangeText={setToCity}
                          placeholderTextColor="#999"
                        />
                      </View>
                    </>
                  )}

                  <View style={styles.divider} />

                  <View style={styles.inputGroup}>
                    <Icon name="flag-outline" size={20} color={isRental ? '#ccc' : '#FF1493'} />
                    <TextInput
                      style={[styles.input, isRental && styles.inputDisabled]}
                      placeholder="Drop City"
                      value={dropCity}
                      onChangeText={isRental ? undefined : setDropCity}
                      editable={!isRental}
                      placeholderTextColor={isRental ? '#ccc' : '#999'}
                    />
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.inputGroup}>
                    <FontAwesome5 name="users" size={18} color="#FF1493" />
                    <View style={styles.personContainer}>
                      <TouchableOpacity
                        style={styles.personButton}
                        onPress={() => setPerson(Math.max(1, person - 1))}
                      >
                        <Icon name="remove" size={20} color="#FF1493" />
                      </TouchableOpacity>
                      <Text style={styles.personCount}>{person}</Text>
                      <TouchableOpacity
                        style={styles.personButton}
                        onPress={() => setPerson(person + 1)}
                      >
                        <Icon name="add" size={20} color="#FF1493" />
                      </TouchableOpacity>
                      <Text style={styles.personLabel}>Person(s)</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <TouchableOpacity
                    style={styles.inputGroup}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Icon name="calendar-outline" size={20} color="#FF1493" />
                    <Text style={styles.dateTimeText}>{scheduleDate.toDateString()}</Text>
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  <TouchableOpacity
                    style={styles.inputGroup}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Icon name="time-outline" size={20} color="#FF1493" />
                    <Text style={styles.dateTimeText}>
                      {scheduleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={scheduleDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={scheduleDate}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}

              {/* Plans Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Plan</Text>
                <Text style={styles.sectionSubtitle}>
                  Plans for{' '}
                  <Text style={{ color: '#FF1493', fontWeight: 'bold' }}>
                    {selectedVehicle.title}
                  </Text>
                </Text>

                {plansLoading ? (
                  <View style={styles.planLoadingContainer}>
                    <ActivityIndicator size="small" color="#FF1493" />
                    <Text style={styles.loadingText}>Loading plans...</Text>
                  </View>
                ) : plans && plans.length > 0 ? (
                  plans.map(renderPlanCard)
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No plans available for this vehicle</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Submit Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedVehicle || !pickupCity || !dropCity || !selectedPlan || bookingLoading) &&
              styles.disabledButton,
          ]}
          onPress={handleSubmitBooking}
          disabled={!selectedVehicle || !pickupCity || !dropCity || !selectedPlan || bookingLoading}
        >
          <LinearGradient
            colors={['#FF1493', '#FF69B4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {bookingLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Confirm Booking</Text>
                <Icon name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planLoadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A2B4E',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
  },
  vehicleList: {
    paddingVertical: 8,
    // paddingHorizontal: 16,
  },
  vehicleCard: {
    width: width - 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
    marginHorizontal: 0,
  },
  vehicleCardSelected: {
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  vehicleCardInner: {
    alignItems: 'center',
    // paddingVertical: 14,
    // paddingHorizontal: 8,
    // gap: 8,
    flexDirection: 'row',
    // justifyContent: 'space-between',
  },
  vehicleImage: {
    width: 100,
    height: 100,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginLeft: 12,
  },
  vehicleTitleSelected: {
    color: '#fff',
  },
  vehicleCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },

  
  emptyContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    padding: 0,
  },
  inputDisabled: {
    color: '#999',
    backgroundColor: 'transparent',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  personContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  personButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  personLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 'auto',
  },
  dateTimeText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  planCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedPlanCard: {
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  planCardContent: {
    flexDirection: 'row',
    padding: 12,
    position: 'relative',
  },
  planImageContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planImage: {
    width: 60,
    height: 60,
  },
  planInfo: {
    flex: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  planDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#666',
  },
  planDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  featureBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  featureBadge2: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 10,
    color: '#666',
  },
  planFooter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF1493',
  },
  totalLabel: {
    fontSize: 10,
    color: '#999',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  selectedText: {
    color: '#fff',
  },
  selectedTextLight: {
    color: 'rgba(255,255,255,0.9)',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default VehicleSelectionScreen;
