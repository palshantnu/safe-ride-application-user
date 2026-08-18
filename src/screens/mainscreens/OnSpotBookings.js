import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  SectionList,
  Image,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios, { IMAGE_URL } from '../../axios/axiosinstance';
import { useSelector } from 'react-redux';
import RazorpayCheckout from 'react-native-razorpay';
import { stopNotificationSound } from '../../utils/notificationRing';

const OnSpotBookings = ({ navigation }) => {
  const [currentBookings, setCurrentBookings] = useState([]);
  const [historyBookings, setHistoryBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('current');
  
  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [paymentType, setPaymentType] = useState('token'); // 'token' or 'full'
  const [paymentMode, setPaymentMode] = useState('ONLINE');
  
  // Cancel Modal States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingBooking, setCancellingBooking] = useState(null);

  const { user, loginToken } = useSelector((state) => state.auth);

  // API 1: Fetch Current Bookings from /onspot/current-booking
  const fetchCurrentBookings = async () => {
    try {
      const response = await axios.get('https://sigiride.com/api/onspot/current-booking', {
        headers: { Authorization: `Bearer ${loginToken}` },
      });

      console.log('OnSpot Current Bookings Response:', response?.data);

      if (response?.data?.status && Array.isArray(response?.data?.data)) {
        const current = response.data.data.filter(
          booking => !['COMPLETED', 'CANCELLED'].includes(booking.status)
        );
        setCurrentBookings(current);
        return current;
      } else {
        setCurrentBookings([]);
        return [];
      }
    } catch (error) {
      console.log('Error fetching current bookings:', error);
      setCurrentBookings([]);
      return [];
    }
  };

  // API 2: Fetch All Bookings from /onspot/my-bookings
  const fetchAllBookings = async () => {
    try {
      const response = await axios.get('https://sigiride.com/api/onspot/my-bookings', {
        headers: { Authorization: `Bearer ${loginToken}` },
      });

      console.log('OnSpot MyBookings Response:', response?.data);

      if (response?.data?.status && Array.isArray(response?.data?.data)) {
        const allBookingsData = response.data.data;
        setAllBookings(allBookingsData);
        
        // Separate current/active and completed/cancelled bookings
        const current = allBookingsData.filter(
          booking => !['COMPLETED', 'CANCELLED'].includes(booking.status)
        );
        const history = allBookingsData.filter(
          booking => ['COMPLETED', 'CANCELLED'].includes(booking.status)
        );
        
        setCurrentBookings(current);
        setHistoryBookings(history);
      } else {
        setAllBookings([]);
        setCurrentBookings([]);
        setHistoryBookings([]);
      }
    } catch (error) {
      console.log('Error fetching all bookings:', error);
      console.log('Error details:', error.response?.data);
      console.log('Status:', error.response?.status);
      Alert.alert('Error', 'Failed to load bookings');
      setAllBookings([]);
      setCurrentBookings([]);
      setHistoryBookings([]);
    }
  };

  // Combined fetch function
  const fetchOnSpotBookings = async () => {
    try {
      setIsLoading(true);
      
      // Fetch both APIs in parallel
      const [currentRes, allRes] = await Promise.all([
        axios.get('https://sigiride.com/api/onspot/current-booking', {
          headers: { Authorization: `Bearer ${loginToken}` },
        }).catch(err => ({ data: { status: false, data: [] } })),
        axios.get('https://sigiride.com/api/onspot/my-bookings', {
          headers: { Authorization: `Bearer ${loginToken}` },
        }).catch(err => ({ data: { status: false, data: [] } }))
      ]);

      // Process current bookings
      if (currentRes?.data?.status && Array.isArray(currentRes?.data?.data)) {
        const current = currentRes.data.data.filter(
          booking => !['COMPLETED', 'CANCELLED'].includes(booking.status)
        );
        setCurrentBookings(current);
      } else {
        setCurrentBookings([]);
      }

      // Process all bookings
      if (allRes?.data?.status && Array.isArray(allRes?.data?.data)) {
        const allBookingsData = allRes.data.data;
        setAllBookings(allBookingsData);
        
        // Separate history from all bookings
        const history = allBookingsData.filter(
          booking => ['COMPLETED', 'CANCELLED'].includes(booking.status)
        );
        setHistoryBookings(history);
      } else {
        setAllBookings([]);
        setHistoryBookings([]);
      }

    } catch (error) {
      console.log('Error fetching OnSpot bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOnSpotBookings();
    setInterval(() => {
      fetchOnSpotBookings();
    }, 5000);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOnSpotBookings();
    setRefreshing(false);
  };

  // API 3: Pay Token Amount
  const handlePayToken = async (booking) => {
    setSelectedBooking(booking);
    setPaymentType('token');
    setPaymentMode('ONLINE');
    setShowPaymentModal(true);
  };

  // API 4: Pay Full Amount
  const handlePayFull = async (booking) => {
    setSelectedBooking(booking);
    setPaymentType('full');
    setPaymentMode('ONLINE');
    setShowPaymentModal(true);
  };

  const runRazorpayPayment = (amount) => {
    return new Promise((resolve, reject) => {
      const options = {
        description: 'SIGIRIDE OnSpot Payment',
        currency: 'INR',
        key: 'rzp_test_DUnz7sPsonIW95',
        amount: Math.round(amount * 100),
        name: 'SIGIRIDE',
        prefill: {
          name: user?.name || '',
          contact: user?.mobile || '',
          email: user?.email || '',
        },
        theme: { color: '#810a45' },
      };
      RazorpayCheckout.open(options)
        .then(() => resolve(true))
        .catch((error) => {
          console.log('Razorpay error:', error);
          reject(false);
        });
    });
  };

  const submitPayment = async () => {
    if (!selectedBooking) return;

    setIsLoading(true);
    try {
      const bookingNo = selectedBooking.booking_no;
      let response;

      if (paymentType === 'token') {
        // Pay Token API
        if (paymentMode === 'ONLINE') {
          const paymentSuccess = await runRazorpayPayment(parseFloat(selectedBooking.token_amount));
          if (!paymentSuccess) {
            setIsLoading(false);
            return;
          }
        }

        response = await axios.post('https://sigiride.com/api/onspot/booking/pay-token', {
          booking_no: bookingNo,
        }, {
          headers: { Authorization: `Bearer ${loginToken}` },
        });
      } else {
        // Pay Full API
        if (paymentMode === 'ONLINE') {
          const paymentSuccess = await runRazorpayPayment(parseFloat(selectedBooking.balance_amount));
          if (!paymentSuccess) {
            setIsLoading(false);
            return;
          }
        }

        response = await axios.post('https://sigiride.com/api/onspot/booking/pay-full', {
          booking_no: bookingNo,
          payment_mode: paymentMode,
        }, {
          headers: { Authorization: `Bearer ${loginToken}` },
        });
      }

      console.log('Payment Response:', response?.data);

      if (response?.data?.status) {
        stopNotificationSound();
        Alert.alert('Success', response?.data?.message || 'Payment successful');
        setShowPaymentModal(false);
        setSelectedBooking(null);
        await fetchOnSpotBookings();
      } else {
        Alert.alert('Error', response?.data?.message || 'Payment failed');
      }
    } catch (error) {
      console.log('Payment error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // API 5: Cancel Booking
  const handleCancelBooking = (booking) => {
    setCancellingBooking(booking);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const submitCancelBooking = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Error', 'Please enter a cancellation reason');
      return;
    }

    if (!cancellingBooking) return;

    setIsLoading(true);
    try {
      const response = await axios.post('https://sigiride.com/api/onspot/booking/cancel', {
        booking_no: cancellingBooking.booking_no,
        cancel_reason: cancelReason.trim(),
      }, {
        headers: { Authorization: `Bearer ${loginToken}` },
      });

      console.log('Cancel Response:', response?.data);

      if (response?.data?.status) {
        stopNotificationSound();
        Alert.alert('Success', 'Booking cancelled successfully');
        setShowCancelModal(false);
        setCancelReason('');
        setCancellingBooking(null);
        await fetchOnSpotBookings();
      } else {
        Alert.alert('Error', response?.data?.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.log('Cancel error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': '#FF9800',
      'ASSIGNED': '#4CAF50',
      'TOKEN_PAID': '#2196F3',
      'ARRIVED': '#00BCD4',
      'STARTED': '#FF5722',
      'COMPLETED': '#9E9E9E',
      'CANCELLED': '#F44336',
    };
    return colors[status] || '#757575';
  };

  const getStatusText = (status) => {
    const texts = {
      'PENDING': 'Pending',
      'ASSIGNED': 'Driver Assigned',
      'TOKEN_PAID': 'Token Paid',
      'ARRIVED': 'Driver Arrived',
      'STARTED': 'Service Started',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled',
    };
    return texts[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderBookingCard = (booking) => {
    const status = booking.status;
    const balance_paid = booking.balance_paid;
    const OTP = booking.otp;
    const isCurrent = !['COMPLETED', 'CANCELLED','PENDING'].includes(status);

    console.log('Rendering booking card:', booking);
    
    return (
      <View key={booking.id} style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.statusText}>{getStatusText(status)}</Text>
          </View>
          <Text style={styles.bookingNo}>{booking.booking_no}</Text>
        </View>

        <View style={styles.cardContent}>
          {/* User Info */}
          <View style={styles.infoRow}>
            <Icon name="person-outline" size={18} color="#FF1493" />
            <Text style={styles.infoText}>
              {booking.user_name} • {booking.user_mobile}
            </Text>
          </View>

          {/* Service Info */}
          <View style={styles.infoRow}>
            <Icon name="car-outline" size={18} color="#FF1493" />
            <Text style={styles.infoText}>{booking.service_name} - {booking.plan_name}</Text>
          </View>

          {/* Location */}
          <View style={styles.infoRow}>
            <Icon name="location-outline" size={18} color="#FF9800" />
            <Text style={styles.infoText} numberOfLines={2}>
              {booking.full_address}
            </Text>
          </View>
          
          {booking.landmark && (
            <View style={styles.infoRow}>
              <Icon name="flag-outline" size={18} color="#FF9800" />
              <Text style={styles.infoText}>{booking.landmark}</Text>
            </View>
          )}

          {/* City */}
          <View style={styles.infoRow}>
            <Icon name="business-outline" size={18} color="#666" />
            <Text style={styles.infoText}>City: {booking.city}</Text>
          </View>

          {/* Schedule DateTime */}
          <View style={styles.infoRow}>
            <Icon name="calendar-outline" size={18} color="#666" />
            <Text style={styles.infoText}>
              Schedule: {formatDate(booking.schedule_datetime)}
            </Text>
          </View>

          {/* Created At */}
          <View style={styles.infoRow}>
            <Icon name="time-outline" size={18} color="#666" />
            <Text style={styles.infoText}>
              Booked: {formatDate(booking.created_at)}
            </Text>
          </View>

          {/* Price Breakdown */}
          <View style={styles.priceContainer}>
           <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Balance</Text>
              <Text style={styles.balanceAmount}>₹{parseFloat(booking.balance_amount).toFixed(2)}</Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Token Paid</Text>
              <Text style={styles.tokenPaid}>₹{parseFloat(booking.token_amount).toFixed(2)}</Text>
            </View>
             <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Total</Text>
              <Text style={styles.totalPrice}>₹{parseFloat(booking.total_amount).toFixed(2)}</Text>
            </View>
            
          </View>

          {/* Driver Info (if assigned) */}
         {(isCurrent &&  booking.token_paid) &&  <>
          {booking.driver_id && (
            <View style={styles.driverCard}>
              <View style={styles.driverRow}>
                <View style={styles.driverAvatar}>
                  {booking.driver_profile ? (
                    <Image
                      source={{
                        uri: booking.driver_profile.toString().startsWith('http')
                          ? booking.driver_profile
                          : `${'https://sigiride.com/uploads/driver_profiles/'}${booking.driver_profile.replace(/^\/+/, '')}`
                      }}
                      style={styles.driverProfileImage}
                    />
                  ) : (
                    <Icon name="person" size={24} color="#FF1493" />
                  )}
                </View>
                <View style={styles.driverMeta}>
                  <Text style={styles.driverName}>{booking.driver_name || 'Driver Assigned'}</Text>
                  {booking.driver_phone ? (
                    <TouchableOpacity style={styles.callRow} onPress={() => Linking.openURL(`tel:${booking.driver_phone}`)}>
                      <Icon name="call" size={14} color="#4CAF50" />
                      <Text style={styles.driverPhone}>{booking.driver_phone}</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.driverPhone}>ID: {booking.driver_id}</Text>
                  )}
                </View>
                {booking.driver_phone ? (
                  <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${booking.driver_phone}`)}>
                    <Icon name="call" size={20} color="#fff" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          )}
          </>}
         

          {/* OTP Display (if token paid and not completed) */}
          {OTP && status == 'ARRIVED' && booking.balance_paid == 1 && (
            <View style={styles.otpHorizontalCard}>
              <Text style={styles.otpHorizontalLabel}>Share OTP to captain</Text>
              <Text style={styles.otpHorizontalValue}>{OTP}</Text>
            </View>
          )}

          {/* Remarks */}
       

          {/* Cancel Reason (if cancelled) */}
          {status === 'CANCELLED' && booking.cancel_reason && (
            <View style={styles.cancelReasonContainer}>
              <Icon name="alert-circle-outline" size={18} color="#F44336" />
              <Text style={styles.cancelReasonText}>Reason: {booking.cancel_reason}</Text>
            </View>
          )}

          {/* Started At (once service has begun) */}
          {(status === 'STARTED' || status === 'COMPLETED') && booking.started_at && (
            <View style={styles.completedInfo}>
              <Icon name="play-circle-outline" size={18} color="#FF5722" />
              <Text style={styles.completedText}>Started: {formatDate(booking.started_at)}</Text>
            </View>
          )}

          {/* Completed At (if completed) */}
          {status === 'COMPLETED' && booking.completed_at && (
            <View style={styles.completedInfo}>
              <Icon name="checkmark-circle-outline" size={18} color="#4CAF50" />
              <Text style={styles.completedText}>Completed: {formatDate(booking.completed_at)}</Text>
            </View>
          )}
        </View>
{console.log('status===>',status)}
        {/* Action Buttons for Current Bookings */}
        {isCurrent && (
          <View style={styles.cardFooter}>
            {(status === 'PENDING' || status === 'ASSIGNED') && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.tokenButton]}
                  onPress={() => handlePayToken(booking)}
                  disabled={isLoading}
                >
                  <FontAwesome5 name="rupee-sign" size={14} color="#fff" />
                  <Text style={styles.actionButtonText}>Pay Token</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleCancelBooking(booking)}
                  disabled={isLoading}
                >
                  <Icon name="close-outline" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {( status === 'ARRIVED') && (
              <>
                {balance_paid != 1 ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.fullButton]}
                    onPress={() => handlePayFull(booking)}
                    disabled={isLoading}
                  >
                    <FontAwesome5 name="rupee-sign" size={14} color="#fff" />
                    <Text style={styles.actionButtonText}>Pay Balance</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleCancelBooking(booking)}
                  disabled={isLoading}
                >
                  <Icon name="close-outline" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {status === 'STARTED' && (
              <View style={styles.inProgressContainer}>
                <Icon name="car-sport-outline" size={20} color="#4CAF50" />
                <Text style={styles.inProgressText}>Service in progress...</Text>
              </View>
            )}
            
          </View>
        )}
        {status === 'PENDING' && (
               <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleCancelBooking(booking)}
                  disabled={isLoading}
                >
                  <Icon name="close-outline" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Cancel</Text>
                </TouchableOpacity>
            )}
               {booking.remarks && (
            <View style={styles.infoRow}>
              <Icon name="chatbubble-outline" size={18} color="#666" />
              <Text style={styles.remarksText}>{booking.remarks}</Text>
            </View>
          )}
      </View>
    );
  };

  // Section data for SectionList
  const getSectionData = () => {
    if (activeTab === 'current') {
      return [
        {
          title: `Current Bookings (${currentBookings.length})`,
          data: currentBookings,
        },
      ];
    } else {
      // Group history by date (month/year)
      const groupedHistory = {};
      historyBookings.forEach(booking => {
        const date = new Date(booking.created_at);
        const monthYear = date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
        if (!groupedHistory[monthYear]) {
          groupedHistory[monthYear] = [];
        }
        groupedHistory[monthYear].push(booking);
      });

      return Object.keys(groupedHistory).map(monthYear => ({
        title: monthYear,
        data: groupedHistory[monthYear],
      }));
    }
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  if (isLoading && currentBookings.length === 0 && historyBookings.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF1493" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
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
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My OnSpot Bookings</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'current' && styles.activeTab]}
          onPress={() => setActiveTab('current')}
        >
          <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
            Current ({currentBookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History ({historyBookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={getSectionData()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => renderBookingCard(item)}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sectionListContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF1493']}
            tintColor="#FF1493"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon 
              name={activeTab === 'current' ? "calendar-outline" : "checkmark-done-outline"} 
              size={60} 
              color="#ccc" 
            />
            <Text style={styles.emptyText}>
              {activeTab === 'current' ? 'No current bookings' : 'No booking history'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'current' 
                ? 'Your active OnSpot bookings will appear here' 
                : 'Your completed/cancelled bookings will appear here'}
            </Text>
          </View>
        }
      />

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {paymentType === 'token' ? 'Pay Token Amount' : 'Pay Balance Amount'}
            </Text>
            
            <Text style={styles.modalAmount}>
              Amount: ₹{paymentType === 'token' 
                ? parseFloat(selectedBooking?.token_amount || 0).toFixed(2)
                : parseFloat(selectedBooking?.balance_amount || 0).toFixed(2)}
            </Text>

            <Text style={styles.paymentModeTitle}>Pay Balance</Text>
            
            <View style={styles.paymentModeContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentModeOption,
                  paymentMode === 'ONLINE' && styles.paymentModeSelected,
                  { flexDirection: 'column', paddingVertical: 8 }
                ]}
                onPress={() => setPaymentMode('ONLINE')}
              >
                <Text style={[
                  styles.paymentModeText,
                  paymentMode === 'ONLINE' && styles.paymentModeTextSelected,
                  { fontSize: 13, fontWeight: '700' }
                ]}>
                  Pay to Sigi
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: paymentMode === 'ONLINE' ? '#fff' : '#FF1493',
                    // opacity: 0.8,
                    marginTop: 2,
                    fontWeight: '500'
                  }}
                >
                  only Online
                </Text>
              </TouchableOpacity>

              {paymentType === 'full' && (
                <TouchableOpacity
                  style={[
                    styles.paymentModeOption,
                    paymentMode === 'CASH' && styles.paymentModeSelected,
                    { flexDirection: 'column', paddingVertical: 8 }
                  ]}
                  onPress={() => setPaymentMode('CASH')}
                >
                  <Text style={[
                    styles.paymentModeText,
                    paymentMode === 'CASH' && styles.paymentModeTextSelected,
                    { fontSize: 13, fontWeight: '700' }
                  ]}>
                    Pay to Captain
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      color: paymentMode === 'CASH' ? '#fff' : '#FF1493',
                      opacity: 0.8,
                      marginTop: 2,
                      fontWeight: '500'
                    }}
                  >
                    Cash/Online
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => {
                  setShowPaymentModal(false);
                  setSelectedBooking(null);
                }}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.submitModalBtn,{
                  backgroundColor: paymentMode === 'CASH' ? '#4CAF50' : '#4CAF50'
                }]}
                onPress={submitPayment}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitModalBtnText}>Pay Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        visible={showCancelModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for cancellation
            </Text>

            <TextInput
              style={styles.textAreaInput}
              placeholder="Enter cancellation reason..."
              placeholderTextColor="#999"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setCancellingBooking(null);
                }}
              >
                <Text style={styles.cancelModalBtnText}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.submitModalBtn]}
                onPress={submitCancelBooking}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitModalBtnText}>Yes, Cancel</Text>
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
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0EB',
    marginBottom: 15,
  },
  otpHorizontalLabel: {
    fontSize: 14,
    color: '#FF1493',
    fontWeight: '600',
  },
  otpHorizontalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF1493',
    letterSpacing: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#FF1493',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  sectionListContent: {
    padding: 16,
    paddingBottom: 30,
  },
  sectionHeader: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF1493',
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bookingNo: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  cardContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  remarksText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF0F5',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  tokenPaid: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  driverText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  driverCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginTop: 10,
    marginBottom: 10,
  },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0F6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  driverProfileImage: {
    width: '100%',
    height: '100%',
  },
  driverMeta: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: '700', color: '#222' },
  callRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  driverPhone: { fontSize: 13, color: '#4CAF50', fontWeight: '500' },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
    marginBottom: 4,
  },
  otpValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF9800',
    letterSpacing: 4,
    marginVertical: 4,
  },
  otpHint: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  cancelReasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  cancelReasonText: {
    flex: 1,
    fontSize: 13,
    color: '#F44336',
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  completedText: {
    flex: 1,
    fontSize: 13,
    color: '#4CAF50',
  },
  cardFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  tokenButton: {
    backgroundColor: '#2196F3',
  },
  fullButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inProgressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    gap: 8,
  },
  inProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF1493',
    textAlign: 'center',
    marginBottom: 20,
  },
  paymentModeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
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
  },
  paymentModeSelected: {
    backgroundColor: '#FF1493',
  },
  paymentModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF1493',
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
  cancelModalBtn: {
    backgroundColor: '#f0f0f0',
  },
  submitModalBtn: {
    backgroundColor: '#FF1493',
  },
  cancelModalBtnText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  submitModalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
    minHeight: 100,
  },
});

export default OnSpotBookings;