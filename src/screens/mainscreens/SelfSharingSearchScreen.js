import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDispatch } from 'react-redux';
import { GET_AVAILABLE_TRIPS } from '../../redux/actions/action-creator';

const SelfSharingSearchScreen = ({ navigation, route }) => {
  const { service_title, service_id } = route.params;
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [cityType, setCityType] = useState(''); // 'from' or 'to'
  const [citySearch, setCitySearch] = useState('');
  
  const dispatch = useDispatch();

  const popularCities = [
    'Jaipur',
    'Delhi',
    'Mumbai',
    'Bangalore',
    'Hyderabad',
    'Pune',
    'Chennai',
    'Kolkata',
    'Ahmedabad',
    'Lucknow',
    'Chandigarh',
    'Indore',
    'Gwalior',
  ];

  const filteredCities = popularCities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleDateChange = (event, date) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (date) {
      setSelectedDate(date);
      setShowDatePicker(false);
    }
  };

  const handleCitySelect = (city) => {
    if (cityType === 'from') {
      setFromCity(city);
    } else {
      setToCity(city);
    }
    setShowCityModal(false);
    setCitySearch('');
  };

  const handleSearchTrips = async () => {
    if (!fromCity.trim()) {
      Alert.alert('Error', 'Please select from city');
      return;
    }
    if (!toCity.trim()) {
      Alert.alert('Error', 'Please select to city');
      return;
    }
    if (fromCity === toCity) {
      Alert.alert('Error', 'From city and to city cannot be same');
      return;
    }

    setIsLoading(true);
    try {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const serviceType = service_title.toLowerCase().replace(/\s+/g, '');
      
      const res = await dispatch(GET_AVAILABLE_TRIPS(
        fromCity,
        toCity,
        formattedDate,
        service_id,
      ));

      if (res?.status && res?.data) {
        navigation.navigate('AvailableTrips', {
          trips: res.data,
          fromCity,
          toCity,
          date: formattedDate,
          service_title,
          service_id,
          serviceType,
        });
      } else {
        Alert.alert('No Trips', res?.message || 'No trips available for this route');
      }
    } catch (error) {
      console.log('Error searching trips:', error);
      Alert.alert('Error', error?.message || 'Failed to search trips');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      weekday: 'short',
    });
  };

  const isMinDate = selectedDate.toDateString() === new Date().toDateString();

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
        <Text style={styles.headerTitle}>{service_title}</Text>
        <TouchableOpacity
          style={styles.myBookingsButton}
          onPress={() => navigation.navigate('MyBookings', { service_title, serviceType: service_title.toLowerCase().replace(/\s+/g, '') })}
        >
          <FontAwesome5 name="list" size={20} color="#fff" />
          <Text style={styles.myBookingsText}>My Bookings</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search Card */}
        <View style={styles.searchCard}>
          <Text style={styles.cardTitle}>Find Trips</Text>
          <Text style={styles.cardSubtitle}>Enter your travel details</Text>

          {/* From City */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>From City</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => {
                setCityType('from');
                setShowCityModal(true);
              }}
            >
              <Icon name="map-pin" size={18} color="#FF1493" />
              <TextInput
                style={styles.inputText}
                placeholder="Select from city"
                placeholderTextColor="#999"
                value={fromCity}
                editable={false}
              />
              {fromCity ? (
                <TouchableOpacity onPress={() => setFromCity('')}>
                  <Icon name="x" size={18} color="#666" />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          </View>

          {/* Swap Button */}
          <TouchableOpacity
            style={styles.swapButton}
            onPress={handleSwapCities}
          >
            <FontAwesome5 name="exchange-alt" size={18} color="#FF1493" />
          </TouchableOpacity>

          {/* To City */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>To City</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => {
                setCityType('to');
                setShowCityModal(true);
              }}
            >
              <Icon name="map-pin" size={18} color="#FF1493" />
              <TextInput
                style={styles.inputText}
                placeholder="Select to city"
                placeholderTextColor="#999"
                value={toCity}
                editable={false}
              />
              {toCity ? (
                <TouchableOpacity onPress={() => setToCity('')}>
                  <Icon name="x" size={18} color="#666" />
                </TouchableOpacity>
              ) : null}
            </TouchableOpacity>
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Travel Date</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar" size={18} color="#FF1493" />
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              minimumDate={new Date()}
              textColor="#333"
            />
          )}

          {/* Search Button */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchTrips}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <FontAwesome5 name="search" size={16} color="#fff" />
                <Text style={styles.searchButtonText}>Find Trips</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <FontAwesome5 name="users" size={24} color="#FF1493" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.infoTitle}>Shared Rides</Text>
              <Text style={styles.infoText}>Travel with other passengers and save money</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <FontAwesome5 name="shield-alt" size={24} color="#4CAF50" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.infoTitle}>Safe & Secure</Text>
              <Text style={styles.infoText}>Verified drivers and passengers for your safety</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <FontAwesome5 name="wallet" size={24} color="#2196F3" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.infoTitle}>Affordable</Text>
              <Text style={styles.infoText}>Pay token amount upfront, save 50% on full fare</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* City Selection Modal */}
      <Modal
        visible={showCityModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setShowCityModal(false);
          setCitySearch('');
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowCityModal(false);
                setCitySearch('');
              }}
            >
              <Icon name="chevron-left" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Select {cityType === 'from' ? 'From' : 'To'} City
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search cities..."
            placeholderTextColor="#999"
            value={citySearch}
            onChangeText={setCitySearch}
          />

          <ScrollView style={styles.citiesList} showsVerticalScrollIndicator={false}>
            {filteredCities.map((city, index) => (
              <TouchableOpacity
                key={index}
                style={styles.cityItem}
                onPress={() => handleCitySelect(city)}
              >
                <Icon name="map-pin" size={18} color="#FF1493" />
                <Text style={styles.cityName}>{city}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
  myBookingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  myBookingsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  searchCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A2B4E',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    gap: 10,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#FF1493',
  },
  searchButton: {
    backgroundColor: '#FF1493',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
    gap: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2B4E',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginHorizontal: 15,
    marginVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  citiesList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  cityName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});

export default SelfSharingSearchScreen;
