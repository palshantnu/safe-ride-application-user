import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const AvailableTripsScreen = ({ navigation, route }) => {
  const { trips, fromCity, toCity, date, service_title, serviceType } = route.params;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleTripSelect = (trip) => {
    navigation.navigate('SelfSharingBooking', {
      trip,
      fromCity,
      toCity,
      date,
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

  const renderTripCard = ({ item }) => {
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

        {/* Header */}
        <View style={styles.tripCardHeader}>
          <View style={styles.timeSection}>
            <Text style={styles.departureTime}>{formatDateTime(item.departure_time)}</Text>
            <Text style={styles.tripDuration}>{tripDuration}</Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColor }]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        {/* Route */}
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

        {/* Pickup Address */}
        <View style={styles.addressSection}>
          <Icon name="map-pin" size={14} color="#666" />
          <Text style={styles.pickupAddress} numberOfLines={2}>
            Pickup: {item.pickup_address}
          </Text>
        </View>

        {/* Driver Info */}
        <View style={styles.driverInfo}>
          <View style={styles.driverDetail}>
            <FontAwesome5 name="user-circle" size={14} color="#FF1493" />
            <Text style={styles.driverName}>{item.creator_name}</Text>
          </View>
          <View style={styles.driverDetail}>
            <FontAwesome5 name="phone" size={12} color="#FF1493" />
            <Text style={styles.driverPhone}>{item.creator_mobile}</Text>
          </View>
        </View>

        {/* Seats & Fare */}
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
            </View>
          </View>
        </View>

        {/* Select Button */}
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

  const emptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="search" size={48} color="#DDD" />
      <Text style={styles.emptyTitle}>No Trips Available</Text>
      <Text style={styles.emptyText}>
        No trips found for {fromCity} to {toCity} on {date}
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.retryButtonText}>Search Again</Text>
      </TouchableOpacity>
    </View>
  );

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
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Available Trips</Text>
          <Text style={styles.headerSubtitle}>
            {fromCity} → {toCity}
          </Text>
        </View>
        <View style={{ width: 28 }} />
      </LinearGradient>

      {/* Trip List */}
      <FlatList
        data={trips}
        renderItem={renderTripCard}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={emptyListComponent}
        scrollEnabled={true}
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
  driverPhone: {
    fontSize: 12,
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
    // textDecorationLine: 'line-through',
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
});

export default AvailableTripsScreen;
