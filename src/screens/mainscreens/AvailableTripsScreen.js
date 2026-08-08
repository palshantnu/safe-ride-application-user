import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Alert,
  FlatList,
  RefreshControl,
  Dimensions,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GET_AVAILABLE_TRIPS } from '../../redux/actions/action-creator';
import { useDispatch } from 'react-redux';

const { width } = Dimensions.get('window');
const DATE_ITEM_WIDTH = 70;

const AvailableTripsScreen = ({ navigation, route }) => {
  const { trips, fromCity, toCity, date, service_title, serviceType, service_id } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(date));
  const [tripList, setTripList] = useState(trips);
  const [availableDates, setAvailableDates] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const dispatch = useDispatch();

  // Generate next 7 days for date selector
  useEffect(() => {
    const dates = [];
    const today = new Date();
    // Start from today
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    setAvailableDates(dates);
  }, []);

  // Check if selected date is today
  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Check if date is in the next 7 days
  const isInNext7Days = (date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays < 7;
  };

  // Format date for display
  const formatDateDisplay = (date) => {
    const day = date.toLocaleDateString('en-IN', { weekday: 'short' });
    const dayNumber = date.getDate();
    const month = date.toLocaleDateString('en-IN', { month: 'short' });
    return { day, dayNumber, month };
  };

  // Format date for header
  const formatDateHeader = (date) => {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      weekday: 'short',
    });
  };

  // Check if date is selected
  const isDateSelected = (date) => {
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };

  // Load trips for selected date
  const loadTrips = async (selected) => {
    try {
      const formattedDate = selected.toISOString().split('T')[0];
      const res = await dispatch(
        GET_AVAILABLE_TRIPS(
          fromCity,
          toCity,
          formattedDate,
          service_id,
        )
      );

      if (res?.status && res?.data) {
        setTripList(res.data);
        setSelectedDate(selected);
      } else {
        setTripList([]);
        setSelectedDate(selected);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      Alert.alert('Error', 'Failed to load trips for selected date');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips(selectedDate);
    setRefreshing(false);
  };

  const handleTripSelect = (trip) => {
    navigation.navigate('SelfSharingBooking', {
      trip,
      fromCity,
      toCity,
      date: selectedDate.toISOString().split('T')[0],
      service_title,
      serviceType,
    });
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      UPCOMING: '#FF9800',
      BOARDING: '#4CAF50',
      DEPARTED: '#2196F3',
      COMPLETED: '#9E9E9E',
    };
    return colors[status] || '#757575';
  };

  const getTripDuration = (departure) => {
    const depTime = new Date(departure);
    const now = new Date();
    const diffHours = Math.floor((depTime - now) / (1000 * 60 * 60));
    const diffMins = Math.floor(((depTime - now) % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) return `${diffHours}h ${diffMins}m from now`;
    if (diffMins > 0) return `${diffMins}m from now`;
    return 'Departing soon';
  };

  // Handle date picker change
const handleDateChange = (event, date) => {
  if (event.type === 'dismissed') {
    setShowDatePicker(false);
    return;
  }

  setShowDatePicker(false);

  if (date) {
    setTempDate(date);
  }
};

  // Confirm custom date selection
  const confirmCustomDate = () => {
    setShowDatePicker(false);
    setShowCustomDateModal(false);
    loadTrips(tempDate);
  };

  // Render date item
  const renderDateItem = (date) => {
    const { day, dayNumber, month } = formatDateDisplay(date);
    const selected = isDateSelected(date);
    const today = isToday(date);

    return (
      <TouchableOpacity
        key={date.getTime()}
        style={[
          styles.dateItem,
          selected && styles.dateItemSelected,
        ]}
        onPress={() => loadTrips(date)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dateDay,
          selected && styles.dateTextSelected
        ]}>
          {day}
        </Text>
        <Text style={[
          styles.dateNumber,
          selected && styles.dateTextSelected
        ]}>
          {dayNumber}
        </Text>
        <Text style={[
          styles.dateMonth,
          selected && styles.dateTextSelected
        ]}>
          {month}
        </Text>
        {today && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayText}>Today</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render trip card
  const renderTripCard = ({ item }) => {
    console.log('item===>',item)
    const hasSeats = parseInt(item.available_seats) > 0;
    const statusColor = getStatusColor(item.status);
    const tripDuration = getTripDuration(item.departure_time);

    return (
      <TouchableOpacity
        style={[styles.tripCard, !hasSeats && styles.tripCardDisabled]}
        onPress={() => hasSeats && handleTripSelect(item)}
        disabled={!hasSeats}
        activeOpacity={hasSeats ? 0.7 : 1}
      >
        {!hasSeats && (
          <View style={styles.fullBookedOverlay}>
            <Text style={styles.fullBookedText}>Fully Booked</Text>
          </View>
        )}

        <View style={styles.tripCardHeader}>
          <View style={styles.timeSection}>
            <Text style={styles.departureTime}>{formatDateTime(item.departure_time)}</Text>
            <Text style={styles.tripDuration}>{tripDuration}</Text>
          </View>
          <View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
            {Number(item.service_id) === 73 && (
              <Image
                source={require('../../assets/intercity.jpeg')}
                style={styles.serviceBanner}
                resizeMode="cover"
              />
            )}
          </View>
        </View>

        <View style={styles.routeSection}>
          <View style={styles.locationCol}>
            <View style={styles.pickupDot} />
            <Text style={styles.location}>{item.from_city}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.locationCol}>
            <View style={styles.dropDot} />
            <Text style={styles.location}>{item.to_city}</Text>
          </View>
        </View>

        <View style={styles.addressSection}>
          <Icon name="map-pin" size={14} color="#666" />
          <Text style={styles.pickupAddress} numberOfLines={2}>
            Pickup: {item.pickup_address}
          </Text>
        </View>

        <View style={styles.driverInfo}>
          <View style={styles.driverDetail}>
            <FontAwesome5 name="user-circle" size={14} color="#FF1493" />
            <Text style={styles.driverName}>{item.creator_name}</Text>
          </View>
        </View>

        <View style={styles.seatsAndFareSection}>
          <View style={styles.seatsInfo}>
            <FontAwesome5 name="chair" size={14} color="#2196F3" />
            <View style={{ marginLeft: 6 }}>
              <Text style={styles.seatsLabel}>Seats Available</Text>
              <Text style={styles.seatsCount}>{item.available_seats}/{item.total_seats}</Text>
            </View>
          </View>

          <View style={styles.fareInfo}>
            <View>
              <Text style={styles.fareLabel}>Token Fare</Text>
              <Text style={styles.tokenFare}>₹{item.token_fare}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.fullFareLabel}>Full Fare</Text>
              <Text style={styles.fullFare}>₹{item.full_fare}</Text>
              {(parseFloat(item.platform_fee) > 0 || parseFloat(item.access_fee) > 0) && (
                <Text style={styles.feeIncludedNote}>incl. fees</Text>
              )}
            </View>
          </View>
        </View>

        {hasSeats && (
          <LinearGradient
            colors={['#FF1493', '#E91E63']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.selectButton}
          >
            <Text style={styles.selectButtonText}>Select & Book</Text>
            <Icon name="arrow-right" size={16} color="#fff" />
          </LinearGradient>
        )}
      </TouchableOpacity>
    );
  };

  // Empty list component
  const emptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="search" size={48} color="#DDD" />
      <Text style={styles.emptyTitle}>No Trips Available</Text>
      <Text style={styles.emptyText}>
        No trips found for {fromCity} to {toCity} on {formatDateHeader(selectedDate)}
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => loadTrips(selectedDate)}
      >
        <Text style={styles.retryButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ff7f50" />

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
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Available Trips</Text>
          <Text style={styles.headerSubtitle}>
            {fromCity} → {toCity}
          </Text>
        </View>
        <View style={{ width: 28 }} />
      </LinearGradient>

      {/* Date Selector with Calendar Icon */}
      <View style={styles.dateSelectorContainer}>
        <View style={styles.dateSelectorWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScrollContent}
          >
            {availableDates.map((date) => renderDateItem(date))}
          </ScrollView>
          
          {/* Calendar Icon */}
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => {
              setTempDate(selectedDate);
              setShowCustomDateModal(true);
            }}
            activeOpacity={0.7}
          >
            <FontAwesome5 name="calendar-alt" size={20} color="#FF1493" />
          </TouchableOpacity>
        </View>
        
        {/* Show selected date text */}
        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateText}>
            Showing trips for: {formatDateHeader(selectedDate)}
          </Text>
        </View>
      </View>

      {/* Custom Date Modal */}
      <Modal
        visible={showCustomDateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowCustomDateModal(false);
          setShowDatePicker(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Custom Date</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCustomDateModal(false);
                  setShowDatePicker(false);
                }}
              >
                <Icon name="x" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.selectedDateDisplay}>
                <FontAwesome5 name="calendar-day" size={24} color="#FF1493" />
                <Text style={styles.selectedDateDisplayText}>
                  {formatDateHeader(tempDate)}
                </Text>
              </View>

              {showDatePicker ? (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  textColor="#333"
                />
              ) : (
                <TouchableOpacity
                  style={styles.pickDateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <FontAwesome5 name="edit" size={18} color="#FF1493" />
                  <Text style={styles.pickDateButtonText}>Choose Date</Text>
                </TouchableOpacity>
              )}

              {showDatePicker && (
                <View style={styles.modalButtonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={confirmCustomDate}
                  >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!showDatePicker && (
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={confirmCustomDate}
                >
                  <LinearGradient
                    colors={['#FF1493', '#E91E63']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.applyButtonGradient}
                  >
                    <Text style={styles.applyButtonText}>Apply Date</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Trip List */}
      <FlatList
        data={tripList}
        renderItem={renderTripCard}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={emptyListComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF1493']}
            tintColor="#FF1493"
          />
        }
      />
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  // Date Selector Styles
  dateSelectorContainer: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  dateSelectorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  dateScrollContent: {
    paddingHorizontal: 5,
    gap: 10,
    paddingRight: 10,
  },
  dateItem: {
    width: DATE_ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 75,
  },
  dateItemSelected: {
    backgroundColor: '#FFF0F5',
    borderColor: '#FF1493',
  },
  dateDay: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 2,
  },
  dateMonth: {
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
  },
  dateTextSelected: {
    color: '#FF1493',
  },
  todayBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF1493',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  todayText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
  calendarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF1493',
    marginLeft: 5,
    flexShrink: 0,
  },
  selectedDateContainer: {
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 2,
  },
  selectedDateText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  selectedDateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  selectedDateDisplayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pickDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    gap: 8,
  },
  pickDateButtonText: {
    fontSize: 14,
    color: '#FF1493',
    fontWeight: '600',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#FF1493',
  },
  confirmButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  applyButton: {
    marginTop: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  applyButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    flexGrow: 1,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tripCardDisabled: {
    opacity: 0.6,
  },
  fullBookedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  fullBookedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tripCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timeSection: {
    flex: 1,
  },
  departureTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tripDuration: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
    alignSelf: 'flex-end',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  routeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  dropDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF5252',
  },
  routeLine: {
    width: 20,
    height: 2,
    backgroundColor: '#ddd',
    marginHorizontal: 10,
  },
  location: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  pickupAddress: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  driverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  driverDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF1493',
  },
  seatsAndFareSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  seatsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seatsLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  seatsCount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  fareInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  fareLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },
  tokenFare: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  fullFareLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },
  fullFare: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  feeIncludedNote: {
    fontSize: 9,
    color: '#aaa',
    marginTop: 2,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF1493',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  serviceBanner: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});

export default AvailableTripsScreen;