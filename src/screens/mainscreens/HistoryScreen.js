import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch } from 'react-redux';
import { GET_USER_BOOKING_HISTORY } from '../../redux/actions/action-creator';
import CurvedHeader from '../../components/CurvedHeader';

const UserHistoryScreen = ({ navigation }) => {
  const [rideHistory, setRideHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalRides: 0,
    totalSpent: 0,
    avgRating: 0,
  });

  const dispatch = useDispatch();

  const fetchBookingHistory = async () => {
    try {
      setIsLoading(true);
      const res = await dispatch(GET_USER_BOOKING_HISTORY());
      console.log('User booking history response:', res);

      if (res?.status && res?.data) {
        const formattedHistory = res.data.map(booking => formatRideData(booking));
        setRideHistory(formattedHistory);
        calculateStats(formattedHistory);
      } else {
        setRideHistory([]);
      }
    } catch (error) {
      console.log('Error fetching booking history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRideData = (booking) => {
    const isInCity = booking.is_incity === true || booking.is_incity === 1;
console.log('booking--->', booking);
    if (isInCity) {
      const fare = parseFloat(booking.final_fare || booking.actual_fare || booking.total_fare || 0);
      return {
        id: booking.id,
        booking_id: booking.booking_id,
        rating: booking.user_rating || 0,
  review: booking.user_review || '',
        pickup: booking.pickup_address || booking.pickup_city,
        destination: booking.drop_address || booking.drop_city,
        price: fare,
        date: booking.created_at,
        status: booking.status?.toLowerCase() || 'completed',
        driverName: booking.driver_name || '',
        driverMobile: booking.driver_mobile || 'N/A',
        distance: parseFloat(booking.actual_distance || booking.distance || 0),
        duration: null,
        person: booking.person,
        topups: [],
        topupAmount: 0,
        rating: booking.user_rating || 0,
review: booking.user_review || '',
        meter_images: [],
        created_at: booking.created_at,
        isInCity: true,
        platform_fee:booking.platform_fee,
        vehicle_color: booking.vehicle_color,
        vehicle_model: booking.vehicle_model,
        vehicle_number: booking.vehicle_number,
        vehicle_type: booking.vehicle_type,
      };
    }

    // Old booking type
    const totalTopupAmount = booking.topups?.reduce((sum, topup) =>
      sum + parseFloat(topup.topup_amount), 0) || 0;
    const totalFare = parseFloat(booking.plan_price) + totalTopupAmount + parseFloat(booking.
access_fee || 0) + parseFloat(booking.platform_fee || 0);

    return {
      id: booking.id,
      booking_id: booking.booking_id, 
      rating: booking.user_rating || 0,
  review: booking.user_review || '',
      pickup: booking.pickup_address || booking.pickup_city,
      destination: booking.drop_address || booking.drop_city,
      to_city: booking.to_city,
      service_name: booking.service_name,
      vehicle: { name: booking.plan_name, type: 'Standard' },
      price: isNaN(totalFare) ? 0 : totalFare,
      basePrice: parseFloat(booking.plan_price) || 0,
      topupAmount: totalTopupAmount,
      date: booking.schedule_date || booking.created_at,
      status: booking.status?.toLowerCase() || 'completed',
      driverName: booking.driver_name || 'Not assigned',
      driverMobile: booking.driver_mobile || 'N/A',
      rating: booking.user_rating || 0,
review: booking.user_review || '',
      distance: booking.plan_km || 0,
      duration: booking.plan_hour || booking.plan_name || 0,
      person: booking.person,
      topups: booking.topups || [],
      meter_images: booking.meter_images || [],
      created_at: booking.created_at,
      isInCity: false,
       platform_fee: parseFloat(booking.platform_fee || 0),
      access_fee: parseFloat(booking.access_fee || 0),
    };
  };

  const calculateStats = (rides) => {
    const completedRides = rides.filter(r =>
      r.status === 'completed' || r.status === 'payment_done',
    );
    const totalRides = completedRides.length;
    const totalSpent = completedRides.reduce((sum, ride) => sum + (ride.price || 0), 0);
    const avgRating = completedRides.length > 0
      ? (completedRides.reduce((sum, ride) => sum + ride.rating, 0) / completedRides.length).toFixed(1)
      : 0;

    setStats({ totalRides, totalSpent, avgRating });
  };

  useEffect(() => {
    fetchBookingHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookingHistory();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      'completed': '#4CAF50',
      'payment_done': '#4CAF50',
      'cancelled': '#F44336',
      'searching': '#FF9800',
      'accepted': '#2196F3',
      'arrived': '#2196F3',
      'started': '#FF5722',
      'waiting_for_payment': '#F59E0B',
    };
    return colors[status?.toLowerCase()] || '#757575';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'completed': 'checkmark-circle',
      'payment_done': 'checkmark-circle',
      'cancelled': 'close-circle',
      'searching': 'time-outline',
      'accepted': 'car-outline',
      'arrived': 'car-outline',
      'started': 'car-sport-outline',
      'waiting_for_payment': 'wallet-outline',
    };
    return icons[status?.toLowerCase()] || 'help-circle-outline';
  };

  const getStatusText = (status) => {
    const texts = {
      'completed': 'Completed',
      'payment_done': 'Completed',
      'cancelled': 'Cancelled',
      'searching': 'Searching',
      'accepted': 'Accepted',
      'arrived': 'Driver Arrived',
      'started': 'Started',
      'waiting_for_payment': 'Payment Due',
    };
    return texts[status?.toLowerCase()] || status;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleRidePress = (ride) => {
    console.log('Navigating to RideDetails with ride:', ride);
    navigation.navigate('RideDetails', { ride });
  };

  const renderHeader = () => (
    <>
      <CurvedHeader title="Ride History" />

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <FontAwesome5 name="car-side" size={24} color="#FF1493" />
          <Text style={styles.statNumber}>{stats.totalRides}</Text>
          <Text style={styles.statLabel}>Total Rides</Text>
        </View>
        <View style={styles.statCard}>
          <FontAwesome5 name="rupee-sign" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>₹{stats.totalSpent.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        {/* <View style={styles.statCard}>
          <FontAwesome5 name="star" size={24} color="#FFD700" />
          <Text style={styles.statNumber}>{stats.avgRating}</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View> */}
      </View>
      <Text style={styles.sectionTitle}>Recent Rides</Text>
    </>
  );

  const renderRideCard = ({ item }) => (
    <TouchableOpacity
      style={styles.rideCard}
      onPress={() => handleRidePress(item)}
      activeOpacity={0.7}
    >
      {console.log('item====>',item)}
      
      <View style={styles.cardHeader}>
        <View style={styles.dateTimeContainer}>
          <Icon name="calendar-outline" size={14} color="#FF1493" />
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          <Icon name="time-outline" size={14} color="#FF1493" style={styles.timeIcon} />
          <Text style={styles.timeText}>{formatTime(item.date)}</Text>
        </View>
        <View style={styles.badgeRow}>
          {item.isInCity && (
            <View style={styles.inCityBadge}>
              <Text style={styles.inCityBadgeText}>In-City</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Icon name={getStatusIcon(item.status)} size={12} color="#fff" />
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.rideLocation}>
        <View style={styles.locationPoint}>
          <Icon name="location" size={16} color="#FF1493" />
          <View style={styles.locationLine} />
        </View>
        <View style={styles.locationTextWrap}>
          <Text style={styles.locationLabel}>Pickup</Text>
          <Text style={styles.locationText} numberOfLines={2}>{item.pickup}</Text>
        </View>
      </View>

      <View style={styles.rideLocation}>
        <View style={styles.locationPoint}>
          <Icon name="flag" size={16} color="#4CAF50" />
          {item.service_name?.includes('Rental') && item.to_city ? <View style={styles.locationLine} /> : null}
          {item.service_name?.includes('Driver') && item.to_city ? <View style={styles.locationLine} /> : null}
        </View>
        <View style={styles.locationTextWrap}>
          <Text style={styles.locationLabel}>Drop</Text>
          <Text style={styles.locationText} numberOfLines={2}>{item.destination}</Text>
        </View>
      </View>

      {item.service_name?.includes('Rental') && item.to_city ? (
        <View style={styles.rideLocation}>
          <View style={styles.locationPoint}>
            <Icon name="navigate" size={16} color="#810a45" />
          </View>
          <View style={styles.locationTextWrap}>
            <Text style={styles.locationLabel}>To City</Text>
            <Text style={[styles.locationText, styles.toCityText]} numberOfLines={2}>{item.to_city}</Text>
          </View>
        </View>
      ) : null}
      {item.service_name?.includes('Driver') && item.to_city ? (
        <View style={styles.rideLocation}>
          <View style={styles.locationPoint}>
            <Icon name="navigate" size={16} color="#810a45" />
          </View>
          <View style={styles.locationTextWrap}>
            <Text style={styles.locationLabel}>To City</Text>
            <Text style={[styles.locationText, styles.toCityText]} numberOfLines={2}>{item.to_city}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.rideFooter}>
        <View style={styles.rideInfo}>
          <Icon name="person-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item?.driverName}</Text>
          {/* {item.driverMobile !== 'N/A' && (
            <>
              <Icon name="call-outline" size={14} color="#999" style={styles.phoneIcon} />
              <Text style={styles.phoneText}>{item.driverMobile}</Text>
            </>
          )} */}
        </View>
        <Text style={styles.priceText}>
          {item.price > 0 ? `₹${item.price.toFixed(2)}` : '—'}
        </Text>
      </View>

      {!item.isInCity && item.topupAmount > 0 && (
        <View style={styles.topupInfo}>
          <Icon name="trending-up" size={12} color="#FF9800" />
          <Text style={styles.topupText}>
            Extra charges: ₹{item.topupAmount.toFixed(2)} ({item.topups?.length || 0} topups)
          </Text>
        </View>
      )}

      <View style={styles.rideStats}>
        <View style={styles.statItem}>
          <Icon name="speedometer-outline" size={14} color="#999" />
          <Text style={styles.statItemText}>{Math.ceil(item.distance)} km</Text>
        </View>
        {!item.isInCity && item.duration != null && (
          <View style={styles.statItem}>
            <Icon name="time-outline" size={14} color="#999" />
            <Text style={styles.statItemText}>{item.duration} hour{item.duration > 1 ? 's' : ''}</Text>
          </View>
        )}
       {!item.isInCity && <View style={styles.statItem}>
          <Icon name="people-outline" size={14} color="#999" />
          <Text style={styles.statItemText}>{item.person} passenger</Text>
        </View>}
      </View>

      <View style={styles.rideStats}>
        <View style={styles.statItem}>
          <Icon name="receipt-outline" size={14} color="#666" />
          <Text style={styles.statItemText}>ID: {item.booking_id}</Text>
        </View>
      </View>

      {item.rating > 0 && (
        <View style={styles.ratingContainer}>
          <Icon name="star" size={15} color="#00bfff" />
          <Text style={styles.ratingText}>Rating: {item.rating}</Text>
        </View>
      )}
{item.review ? (
  <View style={styles.reviewContainer}>
    <Icon name="chatbubble-ellipses-outline" size={12} color="#666" />
    <Text style={styles.reviewText}>{item.review}</Text>
  </View>
) : null}
      <View style={styles.detailsIndicator}>
        <Text style={styles.detailsText}>View ride details</Text>
        <Icon name="chevron-forward" size={14} color="#FF1493" />
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF1493" />
        <Text style={styles.loadingText}>Loading ride history...</Text>
      </View>
    );
  }

  if (rideHistory.length === 0 && !isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#ff7f50" />
        <CurvedHeader title="Ride History" />
        <View style={styles.emptyContent}>
          <FontAwesome5 name="car-side" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No rides yet</Text>
          <Text style={styles.emptySubtext}>Book your first ride to see it here</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchBookingHistory}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ff7f50" />
      <FlatList
        data={rideHistory}
        renderItem={renderRideCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
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
    backgroundColor: '#f5f5f5',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 15,
    marginBottom: 10,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 15,
  },
  listContainer: {
    paddingBottom: 30,
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  timeIcon: {
    marginLeft: 12,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inCityBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  inCityBadgeText: {
    fontSize: 10,
    color: '#1565C0',
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  rideLocation: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  locationPoint: {
    width: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
    marginTop: 4,
  },
  locationTextWrap: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  toCityText: {
    color: '#810a45',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rideInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  phoneIcon: {
    marginLeft: 12,
  },
  phoneText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  topupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
    gap: 4,
  },
  topupText: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '500',
  },
  rideStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statItemText: {
    fontSize: 12,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  ratingText: {
    fontSize: 15,
    color: '#00bfff',
    fontWeight: '600',
  },
  detailsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    gap: 4,
  },
  detailsText: {
    fontSize: 11,
    color: '#FF1493',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 20,
    backgroundColor: '#FF1493',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  reviewContainer: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  marginTop: 8,
  backgroundColor: '#F5F5F5',
  paddingHorizontal: 10,
  paddingVertical: 8,
  borderRadius: 8,
},

reviewText: {
  flex: 1,
  marginLeft: 6,
  fontSize: 12,
  color: '#555',
},
});

export default UserHistoryScreen;
