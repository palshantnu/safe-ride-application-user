import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Modal,
  Dimensions,
  Linking,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import RazorpayCheckout from 'react-native-razorpay';
import { useDispatch, useSelector } from 'react-redux';
import {
  GET_SELF_SHARING_BOOKINGS,
  CANCEL_SELF_SHARING_BOOKING,
  PAY_FULL_BALANCE,
} from '../../redux/actions/action-creator';

const { width } = Dimensions.get('window');

const MyBookingsScreen = ({ navigation, route }) => {
  const { service_title, serviceType } = route.params;
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('ONLINE');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchBookings(1, false);
  }, []);

  const fetchBookings = async (page = 1, loadMore = false) => {
    try {
      if (!loadMore) {
        setIsLoading(true);
        setCurrentPage(1);
      } else {
        setIsLoadingMore(true);
      }

const res = await dispatch(GET_SELF_SHARING_BOOKINGS(serviceType, page, 10));
console.log('GET_SELF_SHARING_BOOKINGS Response:', res);

if (res?.status && Array.isArray(res.data)) {
  if (loadMore) {
    setBookings((prevBookings) => [
      ...prevBookings,
      ...res.data,
    ]);
  } else {
    setBookings(res.data);
  }

        // Set hasMore based on whether we got less than the limit
        setHasMore(res.data.length === 10);
        setCurrentPage(page);
      } else {
        if (!loadMore) {
          setBookings([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.log('Error fetching bookings:', error);
      if (!loadMore) {
        setBookings([]);
      }
      setHasMore(false);
    } finally {
      if (!loadMore) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setHasMore(true);
    await fetchBookings(1, false);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchBookings(currentPage + 1, true);
    }
  };

  const handleCancelBooking = (booking) => {
    setSelectedBookingForCancel(booking);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const submitCancelBooking = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Error', 'Please enter reason');
      return;
    }

    setCancellingId(selectedBookingForCancel?.id);
    try {
      const res = await dispatch(
        CANCEL_SELF_SHARING_BOOKING(selectedBookingForCancel?.booking_id, cancelReason.trim(), serviceType)
      );

      if (res?.status) {
        setShowCancelModal(false);
        Alert.alert('Success', 'Booking cancelled successfully');
        await fetchBookings(1, false);
      } else {
        Alert.alert('Error', res?.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.log('Error cancelling booking:',  error.response?.data?.message);
      Alert.alert('Error', error.response?.data?.message || 'Something went wrong');
    } finally {
      setCancellingId(null);
    }
  };

  const runOnlinePaymentGateway = (amount) => {
    return new Promise((resolve) => {
      const options = {
        description: `${service_title} Balance Payment`,
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

  const handlePayFullBalance = (booking) => {
    setSelectedBooking(booking);
    setSelectedPaymentMode('ONLINE');
    setShowPaymentModal(true);
  };

  const submitFullPayment = async () => {
    if (!selectedBooking) return;

    setIsPaymentProcessing(true);
    try {
      const balanceAmount = parseFloat(selectedBooking.balance_amount || 0);

      if (selectedPaymentMode === 'ONLINE') {
        const isPaymentDone = await runOnlinePaymentGateway(balanceAmount);
        if (!isPaymentDone) {
          setIsPaymentProcessing(false);
          return;
        }
      }

      const res = await dispatch(
        PAY_FULL_BALANCE(selectedBooking.booking_id, selectedPaymentMode, serviceType)
      );

      if (res?.status) {
        Alert.alert('Success', 'Balance payment completed successfully');
        setShowPaymentModal(false);
        setSelectedBooking(null);
        await fetchBookings(1, false);
      } else {
        Alert.alert('Error', res?.message || 'Payment failed');
      }
    } catch (error) {
      console.log('Error in payment:', error);
      Alert.alert('Error', error?.message || 'Something went wrong');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      CONFIRMED: '#4CAF50',
      PENDING: '#FF9800',
      COMPLETED: '#9E9E9E',
      CANCELLED: '#F44336',
      BOARDING: '#2196F3',
      STARTED: '#FF5722',
    };
    return colors[status] || '#757575';
  };

  const renderBookingCard = ({ item }) => {
    const status = item.trip_status || 'CONFIRMED';
    const statusColor = getStatusColor(status);
    const bookingDate = new Date(item.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    console.log('Booking Item:', item.departure_time);
   const departureDateTime = new Date(
  item.departure_time || item.created_at
).toLocaleString('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

    const canCancel = !['COMPLETED', 'CANCELLED','STARTED'].includes(status);

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => navigation.navigate('SelfSharingBookingDetails', {
          booking: item,
          onRefresh: () => fetchBookings(1, false),
        })}
        activeOpacity={0.85}
      >
        {/* Header */}
        <View style={styles.bookingCardHeader}>
          <View>
            <Text style={styles.tripId}>ID: {item.trip_id}</Text>
            <Text style={styles.bookingDate}>{bookingDate}</Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusColor }]}
          >
            <Text style={styles.statusText}>{status}</Text>
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

        {/* Booking Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <FontAwesome5 name="chair" size={14} color="#2196F3" />
            <Text style={styles.detailLabel}>Seats Booked</Text>
            <Text style={styles.detailValue}>{item.seats}</Text>
          </View>

          <View style={styles.detailItem}>
            <Icon name="clock" size={14} color="#666" />
            <Text style={styles.detailLabel}>Departure</Text>
            <Text style={styles.detailValue}>{departureDateTime}</Text>
          </View>

          <View style={styles.detailItem}>
            <FontAwesome5 name="rupee-sign" size={14} color="#4CAF50" />
            <Text style={styles.detailLabel}>Token Paid</Text>
            <Text style={styles.detailValue}>₹{item.token_amount}</Text>
          </View>
        </View>

        {/* Driver Info */}
        {item.driver_name ? (
          <View style={styles.driverCard}>
            <View style={styles.driverRow}>
              <View style={styles.driverAvatar}>
                <FontAwesome5 name="user-circle" size={36} color="#FF1493" />
              </View>
              <View style={styles.driverMeta}>
                <Text style={styles.driverName}>{item.driver_name}</Text>
                {item.driver_mobile ? (
                  <TouchableOpacity style={styles.callRow} onPress={() => Linking.openURL(`tel:${item.driver_mobile}`)}>
                    <Icon name="phone" size={14} color="#4CAF50" />
                    <Text style={styles.driverPhone}>{item.driver_mobile}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {item.driver_mobile ? (
                <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${item.driver_mobile}`)}>
                  <Icon name="phone-call" size={20} color="#fff" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Pickup Address */}
        {item.pickup_address && (
          <View style={styles.pickupSection}>
            <Icon name="map-pin" size={14} color="#666" />
            <Text style={styles.pickupText} numberOfLines={2}>
              {item.pickup_address}
            </Text>
          </View>
        )}
        {item.otp   && item.balance_paid === 1  && item.status =='CONFIRMED' ? (
          <View style={styles.otpHorizontalCard}>
            <Text style={styles.otpHorizontalLabel}>Share OTP to captain</Text>
            <Text style={styles.otpHorizontalValue}>{item.otp}</Text>
          </View>
        ) : null}

        {/* Pay Full Amount Button - Only for BOARDING status */}
        {status === 'BOARDING' && item.balance_amount && item.balance_paid !=1 && (
          <TouchableOpacity
            style={styles.payButton}
            onPress={() => handlePayFullBalance(item)}
            disabled={isPaymentProcessing}
          >
            <FontAwesome5 name="rupee-sign" size={16} color="#fff" />
            <Text style={styles.payButtonText}>
              Pay Balance ₹{item.balance_amount}
            </Text>
          </TouchableOpacity>
        )}

        {/* Actions */}
        {canCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelBooking(item)}
            disabled={cancellingId === item.id}
          >
            {cancellingId === item.id ? (
              <ActivityIndicator color="#F44336" size="small" />
            ) : (
              <>
                <Icon name="x-circle" size={16} color="#F44336" />
                <Text style={styles.cancelButtonText}>Cancel Booking</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* View Details Indicator */}
        <View style={styles.detailsIndicator}>
          <Text style={styles.detailsIndicatorText}>View Booking Details</Text>
          <Icon name="chevron-right" size={14} color="#FF1493" />
        </View>
      </TouchableOpacity>
    );
  };

  const emptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome5 name="inbox" size={48} color="#DDD" />
      <Text style={styles.emptyTitle}>
        {activeTab === 'active' ? 'No Active Bookings' : 'No Booking History'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'active'
          ? "You don't have any active bookings yet. Start booking now!"
          : "You don't have any past bookings yet."}
      </Text>
      {activeTab === 'active' && (
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.searchButtonText}>Find Trips</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
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
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={{ width: 28 }} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF1493" />
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Icon name="refresh-cw" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'active' && styles.activeTabButton]}
          onPress={() => setActiveTab('active')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active Bookings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.activeTabButton]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Booking History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <FlatList
        data={bookings.filter((booking) => {
          const isPast = ['COMPLETED', 'CANCELLED'].includes(booking.status) || 
                         ['COMPLETED', 'CANCELLED'].includes(booking.trip_status);
          return activeTab === 'active' ? !isPast : isPast;
        })}
        renderItem={renderBookingCard}
        keyExtractor={(item, index) => index.toString()}
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#FF1493" />
              <Text style={styles.loadMoreText}>Loading more bookings...</Text>
            </View>
          ) : null
        }
      />

      {/* Full Balance Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pay Balance ₹{selectedBooking?.balance_amount}</Text>
            {/* {selectedBooking && (
              <Text style={styles.modalSubtitle}>
                Amount: ₹{selectedBooking.balance_amount}
              </Text>
            )} */}

            {/* <Text style={styles.paymentModeTitle}>Pay Balance</Text> */}
            <View style={styles.paymentModeContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentModeOption,
                  selectedPaymentMode === 'ONLINE' && styles.paymentModeSelected,
                  { flexDirection: 'column', paddingVertical: 8 }
                ]}
                onPress={() => setSelectedPaymentMode('ONLINE')}
              >
                <Text
                  style={[
                    styles.paymentModeText,
                    selectedPaymentMode === 'ONLINE' && styles.paymentModeTextSelected,
                    { fontSize: 13, fontWeight: '700' }
                  ]}
                >
                  Pay to Sigi
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: selectedPaymentMode === 'ONLINE' ? '#fff' : '#FF1493',
                    opacity: 0.8,
                    marginTop: 2,
                    fontWeight: '500'
                  }}
                >
                  only Online
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentModeOption,
                  selectedPaymentMode === 'CASH' && styles.paymentModeSelected,
                  { flexDirection: 'column', paddingVertical: 8 }
                ]}
                onPress={() => setSelectedPaymentMode('CASH')}
              >
                <Text
                  style={[
                    styles.paymentModeText,
                    selectedPaymentMode === 'CASH' && styles.paymentModeTextSelected,
                    { fontSize: 13, fontWeight: '700' }
                  ]}
                >
                  Pay to Captain
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: selectedPaymentMode === 'CASH' ? '#fff' : '#FF1493',
                    opacity: 0.8,
                    marginTop: 2,
                    fontWeight: '500'
                  }}
                >
                  Cash/Online
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.submitBtn]}
                onPress={submitFullPayment}
                disabled={isPaymentProcessing}
              >
                {isPaymentProcessing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    Pay {selectedPaymentMode}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showCancelModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalSubtitle}>Please enter the reason for cancellation</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter reason"
              placeholderTextColor="#999"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.cancelBtnText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.submitBtn]}
                onPress={submitCancelBooking}
                disabled={cancellingId !== null}
              >
                {cancellingId !== null ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  otpHorizontalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFE0EB',
  },
  otpHorizontalLabel: {
    fontSize: 13,
    color: '#FF1493',
    fontWeight: '600',
  },
  otpHorizontalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF1493',
    letterSpacing: 1,
  },
  driverCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginTop: 10,
  },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FFF0F7', alignItems: 'center', justifyContent: 'center',
  },
  driverMeta: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: '700', color: '#222' },
  callRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  driverPhone: { fontSize: 13, color: '#4CAF50', fontWeight: '500' },
  callBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center',
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
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    flexGrow: 1,
  },
  bookingCard: {
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
  bookingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tripId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  bookingDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  dropDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5252',
  },
  routeLine: {
    width: 16,
    height: 2,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
  },
  location: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
    textAlign: 'center',
  },
  driverInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },
  driverInfoName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF1493',
    marginTop: 2,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 6,
  },
  contactButtonText: {
    fontSize: 11,
    color: '#FF1493',
    fontWeight: '600',
  },
  pickupSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  pickupText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F44336',
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
  searchButton: {
    backgroundColor: '#FF1493',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 18,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  paymentModeTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginBottom: 10,
  },
  paymentModeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  paymentModeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF1493',
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  paymentModeSelected: {
    backgroundColor: '#FF1493',
  },
  paymentModeText: {
    color: '#FF1493',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentModeTextSelected: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f0f0f0',
  },
  submitBtn: {
    backgroundColor: '#FF1493',
  },
  cancelBtnText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#FF1493',
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    height: 100,
    textAlignVertical: 'top',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  activeTabButton: {
    backgroundColor: '#FF1493',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  detailsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 4,
  },
  detailsIndicatorText: {
    fontSize: 12,
    color: '#FF1493',
    fontWeight: '600',
  },
});

export default MyBookingsScreen;
