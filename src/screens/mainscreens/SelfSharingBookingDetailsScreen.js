import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import RazorpayCheckout from 'react-native-razorpay';
import CurvedHeader from '../../components/CurvedHeader';
import {
  CANCEL_SELF_SHARING_BOOKING,
  PAY_FULL_BALANCE,
} from '../../redux/actions/action-creator';

const { width } = Dimensions.get('window');

const SelfSharingBookingDetailsScreen = ({ route, navigation }) => {
  const { booking: initialBooking, onRefresh } = route.params;
  const [booking, setBooking] = useState(initialBooking);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('ONLINE');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const serviceType = 'selfsharing';

  const getStatusColor = (status) => {
    const colors = {
      CONFIRMED: '#4CAF50',
      UPCOMING: '#2196F3',
      TOKEN_PAID: '#FF9800',
      PENDING: '#FF9800',
      COMPLETED: '#9E9E9E',
      CANCELLED: '#F44336',
      BOARDING: '#2196F3',
      STARTED: '#FF5722',
    };
    return colors[status] || '#757575';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleCallCreator = () => {
    if (booking?.creator_mobile) {
      Alert.alert(
        'Call Captain',
        `Would you like to call ${booking.creator_name || 'Captain'}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => Linking.openURL(`tel:${booking.creator_mobile}`) },
        ]
      );
    } else {
      Alert.alert('Error', 'Contact number not available');
    }
  };

  const handleCancelBooking = () => {
    setCancelReason('');
    setShowCancelModal(true);
  };

  const submitCancelBooking = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Error', 'Please enter reason for cancellation');
      return;
    }

    setIsCancelling(true);
    try {
      const res = await dispatch(
        CANCEL_SELF_SHARING_BOOKING(booking.booking_id, cancelReason.trim(), serviceType)
      );

      if (res?.status) {
        setShowCancelModal(false);
        Alert.alert('Success', 'Booking cancelled successfully');
        
        // Update local booking status
        const updatedBooking = { ...booking, status: 'CANCELLED', trip_status: 'CANCELLED' };
        setBooking(updatedBooking);

        // Notify parent list to refresh
        if (onRefresh) {
          onRefresh();
        }
      } else {
        Alert.alert('Error', res?.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.log('Error cancelling booking:', error);
      Alert.alert('Error', error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsCancelling(false);
    }
  };

  const runOnlinePaymentGateway = (amount) => {
    return new Promise((resolve) => {
      const options = {
        description: 'Self Sharing Balance Payment',
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

  const submitFullPayment = async () => {
    setIsPaymentProcessing(true);
    try {
      const balanceAmount = parseFloat(booking.balance_amount || 0);

      if (selectedPaymentMode === 'ONLINE') {
        const isPaymentDone = await runOnlinePaymentGateway(balanceAmount);
        if (!isPaymentDone) {
          setIsPaymentProcessing(false);
          return;
        }
      }

      const res = await dispatch(
        PAY_FULL_BALANCE(booking.booking_id, selectedPaymentMode, serviceType)
      );

      if (res?.status) {
        Alert.alert('Success', 'Balance payment completed successfully');
        setShowPaymentModal(false);
        
        // Update local booking status
        const updatedBooking = { 
          ...booking, 
          balance_paid: 1, 
          status: 'CONFIRMED' 
        };
        setBooking(updatedBooking);

        if (onRefresh) {
          onRefresh();
        }
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

  const canCancel = !['COMPLETED', 'CANCELLED', 'STARTED'].includes(booking.status) && 
                    !['COMPLETED', 'CANCELLED', 'STARTED'].includes(booking.trip_status);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ff7f50" />
      <CurvedHeader title="Booking Details" navigation={navigation} showBack />

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.cardLabel}>BOOKING STATUS</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                <Text style={styles.statusText}>{booking.status}</Text>
              </View>
            </View>
            <View style={styles.dividerVertical} />
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.cardLabel}>TRIP STATUS</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.trip_status) }]}>
                <Text style={styles.statusText}>{booking.trip_status || 'UPCOMING'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* OTP Prominent Box */}
        {booking.otp && booking.balance_paid === 1 && booking.status === 'CONFIRMED' ? (
          <View style={styles.otpCard}>
            <View style={styles.otpHeader}>
              <Ionicons name="shield-checkmark" size={20} color="#FF1493" />
              <Text style={styles.otpTitle}>Share OTP to Captain</Text>
            </View>
            <Text style={styles.otpSubtext}>Provide this verification code when boarding</Text>
            <Text style={styles.otpValue}>{booking.otp}</Text>
          </View>
        ) : null}

        {/* Ride Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="map-pin" size={18} color="#FF1493" />
            <Text style={styles.cardTitle}>Route Information</Text>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.routeVisual}>
              <View style={styles.greenDot} />
              <View style={styles.routeLine} />
              <View style={styles.redDot} />
            </View>

            <View style={styles.routeAddresses}>
              <View style={styles.addressBlock}>
                <Text style={styles.addressLabel}>Pickup (From City)</Text>
                <Text style={styles.cityName}>{booking.from_city}</Text>
                {booking.pickup_address ? (
                  <Text style={styles.addressText}>{booking.pickup_address}</Text>
                ) : null}
              </View>

              <View style={styles.addressBlock}>
                <Text style={styles.addressLabel}>Drop-off (To City)</Text>
                <Text style={styles.cityName}>{booking.to_city}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Schedule Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="calendar" size={18} color="#FF1493" />
            <Text style={styles.cardTitle}>Departure Schedule</Text>
          </View>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Date</Text>
              <Text style={styles.scheduleValue}>{formatDate(booking.departure_time)}</Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Time</Text>
              <Text style={styles.scheduleValue}>{formatTime(booking.departure_time)}</Text>
            </View>
          </View>
        </View>

        {/* Bill Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="file-text" size={18} color="#FF1493" />
            <Text style={styles.cardTitle}>Fare & Payment Breakdown</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Seats Booked</Text>
            <Text style={styles.billValue}>{booking.seats} seat{booking.seats > 1 ? 's' : ''}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Token Amount Paid</Text>
            <View style={styles.paymentStatusBadgeRow}>
              <Text style={styles.billValue}>₹{booking.token_amount}</Text>
              {booking.token_paid === 1 ? (
                <View style={styles.paidBadge}>
                  <Text style={styles.paidBadgeText}>PAID</Text>
                </View>
              ) : (
                <View style={styles.unpaidBadge}>
                  <Text style={styles.unpaidBadgeText}>PENDING</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Balance Amount</Text>
            <View style={styles.paymentStatusBadgeRow}>
              <Text style={styles.billValue}>₹{booking.balance_amount}</Text>
              {booking.balance_paid === 1 ? (
                <View style={styles.paidBadge}>
                  <Text style={styles.paidBadgeText}>PAID</Text>
                </View>
              ) : (
                <View style={styles.unpaidBadge}>
                  <Text style={styles.unpaidBadgeText}>PENDING</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.dividerHorizontalLine} />

          <View style={[styles.billRow, { marginTop: 10 }]}>
            <Text style={styles.totalLabel}>Total Fare</Text>
            <Text style={styles.totalValue}>₹{booking.total_fare}</Text>
          </View>

          <View style={styles.paymentModeRow}>
            <Icon name="credit-card" size={14} color="#666" />
            <Text style={styles.paymentModeLabelText}>Payment Mode: {booking.payment_mode}</Text>
          </View>
        </View>

        {/* Creator Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="user" size={18} color="#FF1493" />
            <Text style={styles.cardTitle}>Captain Details</Text>
          </View>

          <View style={styles.creatorInfoRow}>
            <View style={styles.avatar}>
              <FontAwesome5 name="user-tie" size={24} color="#FF1493" />
            </View>
            <View style={styles.creatorDetails}>
              <Text style={styles.creatorName}>{booking.creator_name || 'Captain'}</Text>
              <Text style={styles.creatorMobile}>{booking.creator_mobile || 'Contact not listed'}</Text>
            </View>
            {booking.creator_mobile ? (
              <TouchableOpacity style={styles.callBtn} onPress={handleCallCreator}>
                <Icon name="phone" size={18} color="#fff" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Trip ID / Booking ID details */}
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>Booking ID: {booking.booking_id}</Text>
          <Text style={styles.metaText}>Trip ID: {booking.trip_id}</Text>
          <Text style={styles.metaText}>Booked on: {new Date(booking.created_at).toLocaleString('en-IN')}</Text>
        </View>

        {/* Actions */}
        {booking.trip_status === 'BOARDING' && booking.balance_amount && booking.balance_paid !== 1 && (
          <TouchableOpacity
            style={styles.payButton}
            onPress={() => setShowPaymentModal(true)}
            disabled={isPaymentProcessing}
          >
            <FontAwesome5 name="rupee-sign" size={16} color="#fff" />
            <Text style={styles.payButtonText}>
              Pay Balance ₹{booking.balance_amount}
            </Text>
          </TouchableOpacity>
        )}

        {canCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelBooking}
            disabled={isCancelling}
          >
            {isCancelling ? (
              <ActivityIndicator color="#F44336" size="small" />
            ) : (
              <>
                <Icon name="x-circle" size={16} color="#F44336" />
                <Text style={styles.cancelButtonText}>Cancel Booking</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Cancellation Reason Modal */}
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
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pay Full Amount Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pay Balance ₹{booking?.balance_amount}</Text>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  cardLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  dividerVertical: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  otpCard: {
    backgroundColor: '#FFF0F5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FFE0EB',
    alignItems: 'center',
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  otpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF1493',
  },
  otpSubtext: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
    textAlign: 'center',
  },
  otpValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF1493',
    letterSpacing: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0EB',
    elevation: 1,
    overflow: 'hidden',
  },
  routeContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  routeVisual: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginTop: 4,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5252',
    marginBottom: 4,
  },
  routeLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#ddd',
    marginVertical: 4,
  },
  routeAddresses: {
    flex: 1,
    gap: 20,
  },
  addressBlock: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cityName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 2,
  },
  addressText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scheduleItem: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 14,
    color: '#666',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  paymentStatusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paidBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paidBadgeText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '700',
  },
  unpaidBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unpaidBadgeText: {
    color: '#FF9800',
    fontSize: 10,
    fontWeight: '700',
  },
  dividerHorizontalLine: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  paymentModeLabelText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  creatorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  creatorMobile: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaContainer: {
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  metaText: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#F44336',
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F44336',
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
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    height: 100,
    textAlignVertical: 'top',
    color: '#333',
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
    fontSize: 15,
    fontWeight: '600',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  paymentModeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  paymentModeOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FF1493',
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default SelfSharingBookingDetailsScreen;
