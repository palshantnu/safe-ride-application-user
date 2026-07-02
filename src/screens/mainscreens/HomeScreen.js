import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  FlatList,
  Dimensions,
  Animated,
  ActivityIndicator,
  Image,
  StatusBar,
  TextInput,
  Modal,
  RefreshControl,
  Linking
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch, useSelector } from 'react-redux';
import {
  GET_ALL_SERVICES,
  GET_USER_CURRENT_BOOKING,
  PAY_TOKEN_AMOUNT,
  PAY_REMAINING_BALANCE,
  CANCEL_BOOKING,
  PAY_TOPUP_AMOUNT,
  GET_USER_BOOKING_HISTORY,
  GET_USER_PROFILE,
  GET_CURRENT_PARCEL_BOOKINGS,
  GET_SELF_SHARING_BOOKINGS,
  GET_ONSPOT_BOOKINGS,
  GET_USER_POPUPS
} from '../../redux/actions/action-creator';
import { IMAGE_URL } from '../../axios/axiosinstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const BOOKING_TYPE = {
  RIDE: 'ride',
  PARCEL: 'parcel',
  SELF_SHARING: 'selfSharing',
  ON_SPOT: 'onSpot',
};

const toStatusKey = (status) => (status || '').toString().toUpperCase();

const formatStatusLabel = (status) => {
  const value = (status || '').toString();
  if (!value) return 'Processing';
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const isTerminalStatus = (status) => {
  const value = toStatusKey(status);
  return (
    value.includes('CANCEL') ||
    value.includes('COMPLETE') ||
    value.includes('DELIVERED')
  );
};

const asArray = (data) => {
  if (Array.isArray(data)) return data;
  return data ? [data] : [];
};



const HomeScreen = ({ navigation }) => {
  const [activeBookings, setActiveBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [landmark, setLandmark] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [greetingIcon, setGreetingIcon] = useState('');
  const [services, setServices] = useState([]);
  const [showTopupPayModal, setShowTopupPayModal] = useState(false);
  const [selectedTopup, setSelectedTopup] = useState(null);
  const [showRemainingPayModal, setShowRemainingPayModal] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('ONLINE');
  const [recentBookings, setRecentBookings] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [profileData, setProfileData] = useState(null);
  const [profileImageError, setProfileImageError] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();


  const [popupVisible, setPopupVisible] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;
  const bannerRef = useRef(null);

  const bannerSlides = [
    { id: 1, title: 'Ride Safe, Ride Smart', subtitle: 'Book a verified driver anytime, anywhere', colors: ['#810a45', '#e20f7a'], icon: 'car' },
    { id: 2, title: 'First Ride Offer!', subtitle: 'Get 50% off on your first ride with us', colors: ['#FF1493', '#FF69B4'], icon: 'gift' },
    { id: 3, title: 'Multiple Services', subtitle: 'In-City, Rental, One-Way & more options', colors: ['#4A00E0', '#8E2DE2'], icon: 'map-pin' },
  ];

  useEffect(() => {
    getGreeting();
    fetchCurrentRide();
    fetchServices();
    fetchRecentBookings();
    fetchProfile();

     fetchPopup();

    const interval = setInterval(() => {
      fetchCurrentRide();
    }, 5000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Good Morning!');
      setGreetingIcon('sun');
    } else if (hour >= 12 && hour < 17) {
      setGreeting('Good Afternoon!');
      setGreetingIcon('sun');
    } else if (hour >= 17 && hour < 20) {
      setGreeting('Good Evening!');
      setGreetingIcon('cloud');
    } else {
      setGreeting('Good Night!');
      setGreetingIcon('moon');
    }
  };


  const fetchPopup = async () => {
  try {
    const res = await dispatch(GET_USER_POPUPS());

    if (!res?.status) return;

    if (!res?.data?.length) return;

    const popup = res.data[0];

    const lastClosedPopup = await AsyncStorage.getItem("LAST_POPUP_ID");

    // Already closed
    if (lastClosedPopup == popup.id.toString()) {
      return;
    }

    setPopupData(popup);
    setPopupVisible(true);

  } catch (e) {
    console.log(e);
  }
};

const closePopup = async () => {

  await AsyncStorage.setItem(
    "LAST_POPUP_ID",
    popupData.id.toString(),
  );

  setPopupVisible(false);
};

  const getSettledValue = (result) => {
    if (result?.status === 'fulfilled') return result.value;
    return null;
  };

  const isActiveBooking = (booking) => {
    const statuses = [
      booking?.status,
      booking?.trip_status,
      booking?.user_status,
      booking?.driver_status,
    ];
    return !statuses.some(isTerminalStatus);
  };

  const mapCurrentBookings = (response, bookingType) => {
    return asArray(response?.data)
      .filter(isActiveBooking)
      .map((booking) => ({
        ...booking,
        __bookingType: bookingType,
      }));
  };

  const fetchCurrentRide = async () => {
    try {
      const [rideResult, parcelResult, selfSharingResult, onSpotResult] = await Promise.allSettled([
        dispatch(GET_USER_CURRENT_BOOKING()),
        dispatch(GET_CURRENT_PARCEL_BOOKINGS()),
        dispatch(GET_SELF_SHARING_BOOKINGS('selfsharing', 1, 50)),
        dispatch(GET_ONSPOT_BOOKINGS()),
      ]);

      const rideResponse = getSettledValue(rideResult);
      const parcelResponse = getSettledValue(parcelResult);
      const selfSharingResponse = getSettledValue(selfSharingResult);
      const onSpotResponse = getSettledValue(onSpotResult);

      console.log('Current ride response:', rideResponse);
      console.log('Current parcel response:', parcelResponse);
      console.log('Current self sharing response:', selfSharingResponse);
      console.log('Current on spot response:', onSpotResponse);

      const active = [
        ...mapCurrentBookings(rideResponse, BOOKING_TYPE.RIDE),
        ...mapCurrentBookings(parcelResponse, BOOKING_TYPE.PARCEL),
        ...mapCurrentBookings(selfSharingResponse, BOOKING_TYPE.SELF_SHARING),
        ...mapCurrentBookings(onSpotResponse, BOOKING_TYPE.ON_SPOT),
      ];

      setActiveBookings(active);
      if (active.length > 0) animateRequest();
    } catch (error) {
      console.log('Error fetching current ride:', error);
      setActiveBookings([]);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await dispatch(GET_ALL_SERVICES());
      if (res) {
        setServices(res);
      }
    } catch (error) {
      console.log('Error fetching services:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await dispatch(GET_USER_PROFILE());
      if (res?.status && res?.data) {
        setProfileData(res.data);
        setProfileImageError(false);
      }
    } catch (error) {
      console.log('Error fetching user profile:', error);
    }
  };

  const fetchRecentBookings = async () => {
    try {
      const res = await dispatch(GET_USER_BOOKING_HISTORY());
      if (res?.status && res?.data) {
        setRecentBookings(res.data.slice(0, 5));
      }
    } catch (error) {
      console.log('Error fetching recent bookings:', error);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex(prev => {
        const nextIndex = (prev + 1) % bannerSlides.length;
        bannerRef.current?.scrollToOffset({
          offset: nextIndex * (width - 30),
          animated: true,
        });
        return nextIndex;
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animateRequest = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCurrentRide();
    await fetchProfile();
    setRefreshing(false);
  };

  const getProfileImageUri = () => {
    const profile = user?.profile || profileData?.profile || '';
    if (!profile) return '';
    if (/^(https?:|file:|content:|data:)/.test(profile)) return profile;
    return `${IMAGE_URL}${profile.replace(/^\/+/, '')}`;
  };

  const getDriverProfileImageUri = (profileUrl) => {
    if (!profileUrl) return '';
    const normalizedProfile = profileUrl.toString();
    if (/^(https?:|file:|content:|data:)/.test(normalizedProfile)) {
      return normalizedProfile.replace('http://', 'https://');
    }
    return `${IMAGE_URL}${normalizedProfile.replace(/^\/+/, '')}`;
  };

  const profileImageUri = profileImageError ? '' : getProfileImageUri();
  const displayName = user?.name || profileData?.name || 'Guest User';

  console.log('profileImageUri',profileImageUri)
const secureProfileImage = profileImageUri.replace('http://', 'https://');
  const getServiceName = (booking) => {
    if (booking?.service_name) return booking.service_name;
    if (booking?.service_title) return booking.service_title;
    if (booking?.__bookingType === BOOKING_TYPE.PARCEL) return 'Parcel';
    if (booking?.__bookingType === BOOKING_TYPE.SELF_SHARING) return 'Self Sharing';
    if (booking?.__bookingType === BOOKING_TYPE.ON_SPOT) return 'On Spot';
    return 'Ride';
  };

  const getDisplayStatus = (booking) => {
    if (booking?.__bookingType === BOOKING_TYPE.SELF_SHARING) {
      return booking?.trip_status || booking?.status;
    }
    return booking?.status || booking?.driver_status || booking?.user_status;
  };

  const formatDateTimeValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatPickupDateTime = (dateValue, timeValue) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '';

    const formattedDate = date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    if (!timeValue) return formattedDate;

    const [hours, minutes] = timeValue.toString().split(':');
    const time = new Date();
    time.setHours(parseInt(hours, 10));
    time.setMinutes(parseInt(minutes, 10));
    if (Number.isNaN(time.getTime())) return formattedDate;

    return `${formattedDate} • ${time.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;
  };

  const joinLocationParts = (...parts) => {
    return parts.filter(Boolean).join(', ');
  };

  const handleTokenPayment = (booking) => {
    setSelectedBooking(booking);
    setShowPickupModal(true);
  };

  const submitTokenPayment = async () => {
    if (!pickupAddress) {
      Alert.alert('Error', 'Please enter pickup address');
      return;
    }
    if (!landmark.trim()) {
      Alert.alert('Error', 'Please enter landmark');
      return;
    }

    setIsLoading(true);
    try {
      const isPaymentDone = await runOnlinePaymentGateway(selectedBooking?.token_price);
      if (!isPaymentDone) {
        setIsLoading(false);
        return;
      }

      const payload = {
        booking_id: selectedBooking?.booking_id,
        pickup_address: pickupAddress,
        pickup_location: pickupLocation || '23.2599,77.4126',
        landmark: landmark,
      };
      console.log('payload---=>', payload);

      const res = await dispatch(PAY_TOKEN_AMOUNT(payload));
      console.log('Token payment response:', res);

      if (res?.status) {
        Alert.alert('Success', 'Token amount paid successfully');
        setShowPickupModal(false);
        setPickupAddress('');
        setPickupLocation('');
        setLandmark('');
        setSelectedBooking(null);
        await fetchCurrentRide();
      } else {
        Alert.alert('Error', res?.message || 'Failed to pay token amount');
      }
    } catch (error) {
      console.log('Error in token payment:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const runOnlinePaymentGateway = (amount) => {
    return new Promise((resolve) => {
      const options = {
        description: 'SIGIRIDE Payment',
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
        .catch(() => resolve(false));
    });
  };

  const handleRemainingPayment = (booking) => {
    setSelectedBooking(booking);
    setSelectedPaymentMode('ONLINE');
    setShowRemainingPayModal(true);
  };

  const submitRemainingPayment = async () => {
    const remainingAmount = selectedBooking?.balance_amount || selectedBooking?.total_fare;
    const token_amount = selectedBooking?.token_amount;
    setIsLoading(true);
    try {
      if (selectedPaymentMode === 'ONLINE') {
        const isPaymentDone = await runOnlinePaymentGateway(parseInt(remainingAmount, 10) - parseInt(token_amount, 10));
        if (!isPaymentDone) {
          return;
        }
      }

      const res = await dispatch(PAY_REMAINING_BALANCE({
        booking_id: selectedBooking?.booking_id,
        payment_mode: selectedPaymentMode,
      }));
      console.log('Remaining payment response:', res);

      if (res?.status) {
        Alert.alert('Success', 'Payment completed successfully');
        setShowRemainingPayModal(false);
        setSelectedBooking(null);
        await fetchCurrentRide();
      } else {
        Alert.alert('Error', res?.message || 'Failed to complete payment');
      }
    } catch (error) {
      console.log('Error in remaining payment:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayTopup = (topup, booking) => {
    setSelectedBooking(booking);
    setSelectedTopup(topup);
    setSelectedPaymentMode('ONLINE');
    setShowTopupPayModal(true);
  };

  const submitTopupPayment = async () => {
    setIsLoading(true);
    try {
      if (selectedPaymentMode === 'ONLINE') {
        const isPaymentDone = await runOnlinePaymentGateway(selectedTopup?.topup_amount);
        if (!isPaymentDone) {
          return;
        }
      }

      const res = await dispatch(PAY_TOPUP_AMOUNT({
        booking_id: selectedBooking?.booking_id,
        topup_id: selectedTopup?.id,
        payment_mode: selectedPaymentMode,
      }));
      console.log('Topup payment response:', res);

      if (res?.status) {
        Alert.alert('Success', 'Topup paid successfully');
        setShowTopupPayModal(false);
        setSelectedTopup(null);
        setSelectedBooking(null);
        await fetchCurrentRide();
      } else {
        Alert.alert('Error', res?.message || 'Failed to pay topup');
      }
    } catch (error) {
      console.log('Error in topup payment:', error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRide = (booking) => {
    setSelectedBookingForCancel(booking);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const submitCancelRide = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Error', 'Please enter reason');
      return;
    }
    setIsLoading(true);
    try {
      const res = await dispatch(CANCEL_BOOKING({
        role: "USER",
        booking_id: selectedBookingForCancel?.booking_id,
        cancel_reason: cancelReason.trim()
      }));

      if (res?.status) {
        setShowCancelModal(false);
        Alert.alert('Success', 'Ride cancelled successfully');
        await fetchCurrentRide();
      } else {
        Alert.alert('Error', res?.message || 'Failed to cancel ride');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const key = toStatusKey(status);
    const colors = {
      'SEARCHING': '#FF9800',
      'ACCEPTED': '#4CAF50',
      'TOKEN_PAID': '#2196F3',
      'ARRIVED': '#00BCD4',
      'STARTED': '#FF5722',
      'TOPUP_PENDING': '#FF9800',
      'WAITING_FOR_PAYMENT': '#F59E0B',
      'PAYMENT_DONE': '#8B5CF6',
      'PENDING': '#FF9800',
      'BOARDING': '#2196F3',
      'UPCOMING': '#8B5CF6',
      'ASSIGNED': '#4CAF50',
      'CONFIRMED': '#4CAF50',
      'COMPLETED': '#9E9E9E',
      'CANCELLED': '#F44336',
      'DELIVERED': '#4CAF50',
    };
    if (key.includes('CANCEL')) return '#F44336';
    if (key.includes('COMPLETE') || key.includes('DELIVERED')) return '#4CAF50';
    return colors[key] || '#757575';
  };

  const getStatusText = (status) => {
    const key = toStatusKey(status);
    const texts = {
      'SEARCHING': 'Searching for driver...',
      'ACCEPTED': 'Driver Assigned',
      'TOKEN_PAID': 'Token Paid',
      'ARRIVED': 'Driver Arrived',
      'STARTED': 'Ride Started',
      'TOPUP_PENDING': 'Topup Required',
      'WAITING_FOR_PAYMENT': 'Payment Due',
      'PAYMENT_DONE': 'Waiting for Confirmation',
      'PENDING': 'Pending',
      'BOARDING': 'Boarding',
      'UPCOMING': 'Upcoming',
      'ASSIGNED': 'Assigned',
      'CONFIRMED': 'Confirmed',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled',
      'DELIVERED': 'Delivered',
    };
    return texts[key] || formatStatusLabel(status);
  };

  const getActionButton = (booking) => {
    const status = booking?.status;
    const isInCity = booking?.is_incity;

    switch (status) {
      case 'ACCEPTED':
        if (isInCity) {
          return (
            <View style={styles.actionButtonsColumn}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('InCityTracking', { booking })}
              >
                <Icon name="map" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Continue on Map</Text>
              </TouchableOpacity>
            </View>
          );
        }
        return (
          <View style={styles.actionButtonsColumn}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleTokenPayment(booking)}
              disabled={isLoading}
            >
              {isLoading && selectedBooking?.booking_id === booking?.booking_id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <FontAwesome5 name="rupee-sign" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Pay Token Amount</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelRide(booking)}
              disabled={isLoading}
            >
              <Icon name="x-circle" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Cancel Ride</Text>
            </TouchableOpacity>
          </View>
        );

      case 'ARRIVED':
        if (isInCity) {
          return (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('InCityTracking', { booking })}
            >
              <Icon name="map" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Track on Map</Text>
            </TouchableOpacity>
          );
        }
        return (
          <View style={styles.actionButtonsColumn}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleRemainingPayment(booking)}
              disabled={isLoading}
            >
              {isLoading && selectedBooking?.booking_id === booking?.booking_id ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <FontAwesome5 name="rupee-sign" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>
                    Pay Remaining ₹{parseInt(booking?.total_fare, 10) - parseInt(booking?.token_amount, 10)}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelRide(booking)}
              disabled={isLoading}
            >
              <Icon name="x-circle" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Cancel Ride</Text>
            </TouchableOpacity>
          </View>
        );

      case 'SEARCHING':
      case 'TOKEN_PAID':
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelRide(booking)}
            disabled={isLoading}
          >
            <Icon name="x-circle" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Cancel Ride</Text>
          </TouchableOpacity>
        );

      case 'STARTED':
        if (isInCity) {
          return (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('InCityTracking', { booking })}
            >
              <Icon name="map" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Track on Map</Text>
            </TouchableOpacity>
          );
        }
        return (
          <View style={styles.rideInfoContainer}>
            <FontAwesome5 name="car-side" size={20} color="#4CAF50" />
            <Text style={styles.rideInfoText}>Your ride is in progress</Text>
          </View>
        );

      case 'TOPUP_PENDING': {
        const lastTopup = booking?.topups?.[booking?.topups?.length - 1];
        return (
          <View style={styles.topupContainer}>
            <Text style={styles.topupTitle}>Topup Requests</Text>
            {lastTopup?.status === 'PENDING' ? (
              <TouchableOpacity
                style={styles.topupPayButton}
                onPress={() => handlePayTopup(lastTopup, booking)}
                disabled={isLoading}
              >
                <View style={styles.topupInfo}>
                  <Text style={styles.topupAmount}>+₹{lastTopup?.topup_amount}</Text>
                  <Text style={styles.topupDetail}>{lastTopup?.extra_km} km extra</Text>
                  <Text style={styles.topupReason}>Reason: {lastTopup?.reason}</Text>
                </View>
                <View style={styles.payButton}>
                  <Text style={styles.payButtonText}>Pay Now</Text>
                  <Icon name="arrow-right" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.topupPaidCard}>
                <View style={styles.topupInfo}>
                  <Text style={styles.topupAmount}>+₹{lastTopup?.topup_amount}</Text>
                  <Text style={styles.topupDetail}>{lastTopup?.extra_km} km extra</Text>
                  <Text style={styles.topupReason}>Reason: {lastTopup?.reason}</Text>
                </View>
                <View style={styles.otpHorizontalContainer}>
                  <Text style={styles.otpHorizontalLabel}>Share OTP to captain</Text>
                  <Text style={styles.otpHorizontalValue}>{lastTopup?.topup_otp}</Text>
                </View>
              </View>
            )}
          </View>
        );
      }

      case 'WAITING_FOR_PAYMENT':
        return (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('InCityUserInvoice', { booking })}
          >
            <FontAwesome5 name="rupee-sign" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>View Invoice & Pay</Text>
          </TouchableOpacity>
        );

      case 'PAYMENT_DONE':
        return (
          <View style={styles.rideInfoContainer}>
            <FontAwesome5 name="clock" size={20} color="#8B5CF6" />
            <Text style={styles.rideInfoText}>Waiting for driver to confirm payment...</Text>
          </View>
        );

      case 'COMPLETED':
        return (
          <View style={styles.rideInfoContainer}>
            <FontAwesome5 name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.rideInfoText}>Ride completed successfully!</Text>
          </View>
        );

      case 'CANCELLED':
        return (
          <View style={styles.rideInfoContainer}>
            <FontAwesome5 name="times-circle" size={20} color="#F44336" />
            <Text style={styles.rideInfoText}>Ride has been cancelled</Text>
          </View>
        );

      default:
        return null;
    }
  };

  const renderActiveRide = (booking, index) => {
    console.log('booking===>',booking);
    
    const ridePickupLocation = booking?.pickup_address || booking?.pickup_city;
    const rideDropLocation = booking?.drop_address || booking?.drop_city;
    const status = getDisplayStatus(booking);
    const statusKey = toStatusKey(status);
    const isInCityBooking = booking?.is_incity;
    const showDriverInfo = isInCityBooking
      ? booking?.driver_name
      : ['TOKEN_PAID', 'ARRIVED', 'STARTED'].includes(statusKey);
      
    const showOtp =  statusKey === 'BALANCE_PAID';
    // const vehicleTitle = booking?.vehicle_type;
    const vehicleTitle = joinLocationParts(booking?.vehicle_type, booking?.vehicle_model);
    const vehicleMeta = joinLocationParts(booking?.vehicle_color, booking?.vehicle_number);
    const driverProfileImageUri = getDriverProfileImageUri(booking?.driver_profile_url);
console.log('vehicleTitle',vehicleTitle)
    const totalTopupAmount = booking?.topups?.reduce((sum, t) => sum + parseFloat(t.topup_amount), 0) || 0;
    const totalFare = parseFloat(booking?.total_fare) + totalTopupAmount;
    const token_price = parseFloat(booking?.token_price);

    return (
      <Animated.View
        key={booking?.booking_id || index}
        style={[
          styles.activeRideCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {activeBookings.length > 1 && (
          <Text style={styles.bookingIndexLabel}>Booking {index + 1} of {activeBookings.length}</Text>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.currentServiceName}> <Icon name="bell" size={16} color="#fff" />{'  '}{getServiceName(booking)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
              <Text style={styles.statusBadgeText}>{getStatusText(status)}</Text>
            </View>
          </View>
          {booking?.is_incity ? (
            <View style={{marginBottom:10}}>
           
              <Text style={{...styles.fareAmount,marginBottom:10}}>₹{booking.total_fare}</Text>
             
            
                      {/* <View style={{...styles.requestBadge,backgroundColor:'#2196F3',}}>
      <Icon name="bell" size={16} color="#fff" />
      <Text style={styles.requestBadgeText}>In City Ride</Text>
      </View> */}
      </View>
              
          ) : (
            <View>
              <Text style={styles.fareLabel}>Total Fare</Text>
              <Text style={styles.fareAmount}>₹{totalFare}</Text>
              <Text style={styles.fareLabel}>Token Price</Text>
              <Text style={styles.fareAmount}>₹{token_price}</Text>
              {totalTopupAmount > 0 && (
                <Text style={styles.baseFare}>Base: ₹{booking?.plan_price}</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationEntryRow}>
            <View style={styles.dotCol}>
              <View style={styles.pickupDot} />
              <View style={styles.locationLine} />
            </View>
            <View style={styles.locationTextCol}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.pickupText}>{ridePickupLocation || 'Pickup location'}</Text>
            </View>
          </View>
          <View style={styles.locationEntryRow}>
            <View style={styles.dotCol}>
              <View style={styles.dropDot} />
              {booking?.service_name?.includes('Rental') && booking?.to_city ? <View style={styles.locationLine} /> : null}
              {booking?.service_name?.includes('Driver') && booking?.to_city ? <View style={styles.locationLine} /> : null}
            </View>
            <View style={styles.locationTextCol}>
              <Text style={styles.locationLabel}>Drop</Text>
              <Text style={styles.dropText}>{rideDropLocation || 'Drop location'}</Text>
            </View>
          </View>
          {booking?.service_name?.includes('Rental') && booking?.to_city ? (
            <View style={styles.locationEntryRow}>
              <View style={styles.dotCol}>
                <View style={styles.toCityDot} />
              </View>
              <View style={styles.locationTextCol}>
                <Text style={styles.locationLabel}>To City</Text>
                <Text style={styles.toCityText}>{booking.to_city}</Text>
              </View>
            </View>
          ) : null}
          {booking?.service_name?.includes('Driver') && booking?.to_city ? (
            <View style={styles.locationEntryRow}>
              <View style={styles.dotCol}>
                <View style={styles.toCityDot} />
              </View>
              <View style={styles.locationTextCol}>
                <Text style={styles.locationLabel}>To City</Text>
                <Text style={styles.toCityText}>{booking.to_city}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {booking?.schedule_date && (
          <View style={styles.scheduleDateRow}>
            <Icon name="calendar" size={14} color="#FF1493" />
            <Text style={styles.scheduleDateText}>
              {new Date(booking.schedule_date).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: true,
              })}
            </Text>
          </View>
        )}

        {booking?.is_incity ? (
          <View style={styles.rideInfo}>
            <View style={styles.infoItem}>
              <Icon name="info" size={16} color="#FF9800" />
              <Text style={[styles.infoText, styles.inCityFareNoteText]}>
                {booking?.fare_note || 'Fare will be calculated on meter at trip end'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.rideInfo}>
            <View style={styles.infoItem}>
              <Icon name="user" size={16} color="#666" />
              <Text style={styles.infoText}>{booking?.person} Passenger</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="clock" size={16} color="#666" />
              <Text style={styles.infoText}>{booking?.plan_hour} Hour</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="map-pin" size={16} color="#666" />
              <Text style={styles.infoText}>{booking?.plan_km} km</Text>
            </View>
          </View>
        )}

        {showDriverInfo && booking?.driver_name && (
          <View style={styles.driverCard}>
            <View style={styles.driverRow}>
              <View style={styles.driverAvatar}>
                {driverProfileImageUri ? (
                  <Image
                    source={{ uri: driverProfileImageUri }}
                    style={styles.driverProfileImage}
                  />
                ) : (
                  <FontAwesome5 name="user-circle" size={36} color="#FF1493" />
                )}
              </View>
              <View style={styles.driverMeta}>
                <Text style={styles.driverName}>{booking.driver_name}</Text>
                {booking?.driver_mobile ? (
                  <TouchableOpacity style={styles.callRow} onPress={() => Linking.openURL(`tel:${booking.driver_mobile}`)}>
                    <Icon name="phone" size={14} color="#4CAF50" />
                    <Text style={styles.driverPhone}>{booking.driver_mobile}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {booking?.driver_mobile ? (
                <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${booking.driver_mobile}`)}>
                  <Icon name="phone-call" size={20} color="#fff" />
                </TouchableOpacity>
              ) : null}
            </View>

            {(vehicleTitle || vehicleMeta) ? (
              <View style={styles.vehicleInfo}>
                {vehicleTitle ? (
                  <View style={styles.vehicleInfoRow}>
                    <FontAwesome5 name="car-side" size={14} color="#666" />
                    <Text style={styles.vehicleInfoText}>{vehicleTitle}</Text>
                  </View>
                ) : null}
                {vehicleMeta ? (
                  <View style={styles.vehicleInfoRow}>
                    <Icon name="info" size={14} color="#666" />
                    <Text style={styles.vehicleInfoText}>{vehicleMeta}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        )}

        {showOtp && booking?.otp && (
          <View style={styles.otpHorizontalContainer}>
            <Text style={styles.otpHorizontalLabel}>Share OTP to captain</Text>
            <Text style={styles.otpHorizontalValue}>{booking?.otp}</Text>
          </View>
        )}

        {getActionButton(booking)}
      </Animated.View>
    );
  };

  const renderActiveParcelBooking = (booking, index) => {
    const status = getDisplayStatus(booking);
    const parcelPickupLocation = joinLocationParts(
      booking?.pickup_address,
      booking?.pickup_landmark,
      booking?.pickup_city,
    );
    const parcelDropLocation = joinLocationParts(
      booking?.drop_address,
      booking?.drop_landmark,
      booking?.drop_city,
    );
    const amount = parseFloat(booking?.amount || 0);
    const pickupDateTime = formatPickupDateTime(booking?.pickup_date, booking?.pickup_time);
    const showPickupOtp = Number(booking?.pickup_otp_verified) === 0;
    const otp = showPickupOtp ? booking?.pickup_otp : booking?.delivery_otp;
    const otpLabel = showPickupOtp ? 'Pickup OTP' : 'Delivery OTP';

    return (
      <Animated.View
        key={booking?.parcel_booking_id || booking?.id || index}
        style={[
          styles.activeRideCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {activeBookings.length > 1 && (
          <Text style={styles.bookingIndexLabel}>Booking {index + 1} of {activeBookings.length}</Text>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.currentServiceName}>{getServiceName(booking)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
              <Text style={styles.statusBadgeText}>{getStatusText(status)}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.fareLabel}>Total Amount</Text>
            <Text style={styles.fareAmount}>₹{amount.toFixed(0)}</Text>
          </View>
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationEntryRow}>
            <View style={styles.dotCol}>
              <View style={styles.pickupDot} />
              <View style={styles.locationLine} />
            </View>
            <View style={styles.locationTextCol}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.pickupText}>{parcelPickupLocation || 'Pickup location'}</Text>
            </View>
          </View>
          <View style={styles.locationEntryRow}>
            <View style={styles.dotCol}>
              <View style={styles.dropDot} />
            </View>
            <View style={styles.locationTextCol}>
              <Text style={styles.locationLabel}>Drop</Text>
              <Text style={styles.dropText}>{parcelDropLocation || 'Drop location'}</Text>
            </View>
          </View>
        </View>

        {pickupDateTime ? (
          <View style={styles.scheduleDateRow}>
            <Icon name="calendar" size={14} color="#FF1493" />
            <Text style={styles.scheduleDateText}>{pickupDateTime}</Text>
          </View>
        ) : null}

        <View style={styles.currentDetailsGrid}>
          <View style={styles.currentDetailItem}>
            <Icon name="info" size={15} color="#666" />
            <View style={styles.currentDetailTextWrap}>
              <Text style={styles.currentDetailLabel}>Booking Status</Text>
              <Text style={styles.currentDetailValue}>{getStatusText(status)}</Text>
            </View>
          </View>
          <View style={styles.currentDetailItem}>
            <FontAwesome5 name="people-carry" size={13} color="#666" />
            <View style={styles.currentDetailTextWrap}>
              <Text style={styles.currentDetailLabel}>Loading/Unloading</Text>
              <Text style={styles.currentDetailValue}>{booking?.loading_unloading || '-'}</Text>
            </View>
          </View>
          <View style={styles.currentDetailItem}>
            <Icon name="message-square" size={15} color="#666" />
            <View style={styles.currentDetailTextWrap}>
              <Text numberOfLines={1} style={styles.currentDetailLabel}>Remarks</Text>
              <Text style={styles.currentDetailValue}>{booking?.remarks || '-'}</Text>
            </View>
          </View>
          <View style={styles.currentDetailItem}>
            <FontAwesome5 name="weight-hanging" size={13} color="#666" />
            <View style={styles.currentDetailTextWrap}>
              <Text style={styles.currentDetailLabel}>Weight</Text>
              <Text style={styles.currentDetailValue}>
                {booking?.approx_weight ? `${booking.approx_weight} kg` : '-'}
              </Text>
            </View>
          </View>
        </View>

        {otp ? (
          <View style={styles.otpHorizontalContainer}>
            <Text style={styles.otpHorizontalLabel}>Share OTP to captain</Text>
            <Text style={styles.otpHorizontalValue}>{otp}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('MyParcels')}
        >
          <Icon name="arrow-right-circle" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Continue Booking</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderActiveSelfSharingBooking = (booking, index) => {
    const status = getDisplayStatus(booking);
    const sharingPickupLocation = joinLocationParts(booking?.from_city, booking?.pickup_address);
    const sharingDropLocation = booking?.to_city;
    const departureDateTime = formatDateTimeValue(booking?.departure_time);
    const fare = parseFloat(booking?.total_fare || 0);

    return (
      <Animated.View
        key={booking?.booking_id || booking?.id || index}
        style={[
          styles.activeRideCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {activeBookings.length > 1 && (
          <Text style={styles.bookingIndexLabel}>Booking {index + 1} of {activeBookings.length}</Text>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.currentServiceName}>{getServiceName(booking)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
              <Text style={styles.statusBadgeText}>{getStatusText(status)}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.fareLabel}>Total Fare</Text>
            <Text style={styles.fareAmount}>₹{fare.toFixed(0)}</Text>
          </View>
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationEntryRow}>
            <View style={styles.dotCol}>
              <View style={styles.pickupDot} />
              <View style={styles.locationLine} />
            </View>
            <View style={styles.locationTextCol}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.pickupText}>{sharingPickupLocation || 'Pickup location'}</Text>
            </View>
          </View>
          <View style={styles.locationEntryRow}>
            <View style={styles.dotCol}>
              <View style={styles.dropDot} />
            </View>
            <View style={styles.locationTextCol}>
              <Text style={styles.locationLabel}>Drop</Text>
              <Text style={styles.dropText}>{sharingDropLocation || 'Drop location'}</Text>
            </View>
          </View>
        </View>

        {departureDateTime ? (
          <View style={styles.scheduleDateRow}>
            <Icon name="calendar" size={14} color="#FF1493" />
            <Text style={styles.scheduleDateText}>{departureDateTime}</Text>
          </View>
        ) : null}

        <View style={styles.currentDetailsGrid}>
          <View style={styles.currentDetailItem}>
            <Icon name="info" size={15} color="#666" />
            <View style={styles.currentDetailTextWrap}>
              <Text style={styles.currentDetailLabel}>Booking Status</Text>
              <Text style={styles.currentDetailValue}>{formatStatusLabel(booking?.status)}</Text>
            </View>
          </View>
          <View style={styles.currentDetailItem}>
            <Icon name="navigation" size={15} color="#666" />
            <View style={styles.currentDetailTextWrap}>
              <Text style={styles.currentDetailLabel}>Trip Status</Text>
              <Text style={styles.currentDetailValue}>{formatStatusLabel(booking?.trip_status)}</Text>
            </View>
          </View>
          <View style={styles.currentDetailItem}>
            <FontAwesome5 name="chair" size={13} color="#666" />
            <View style={styles.currentDetailTextWrap}>
              <Text style={styles.currentDetailLabel}>Seats</Text>
              <Text style={styles.currentDetailValue}>{booking?.seats || '-'}</Text>
            </View>
          </View>
          <View style={styles.currentDetailItem}>
            <FontAwesome5 name="rupee-sign" size={13} color="#666" />
            <View style={styles.currentDetailTextWrap}>
              <Text style={styles.currentDetailLabel}>Balance</Text>
              <Text style={styles.currentDetailValue}>₹{booking?.balance_amount || '0.00'}</Text>
            </View>
          </View>
        </View>

        {booking?.otp ? (
          <View style={styles.otpHorizontalContainer}>
            <Text style={styles.otpHorizontalLabel}>Share OTP to captain</Text>
            <Text style={styles.otpHorizontalValue}>{booking.otp}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('MyBookings', {
            service_title: 'Self Sharing',
            serviceType: 'selfsharing',
          })}
        >
          <Icon name="arrow-right-circle" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Continue Booking</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderActiveOnSpotBooking = (booking, index) => {
    const status = getDisplayStatus(booking);
    const statusKey = toStatusKey(status);
    const address = joinLocationParts(booking?.full_address, booking?.landmark);
    const scheduleDateTime = formatDateTimeValue(booking?.schedule_datetime);
    const totalAmount = parseFloat(booking?.total_amount || 0);
    const showOtp = booking?.otp && !['PENDING', 'COMPLETED', 'CANCELLED'].includes(statusKey);

    return (
      <Animated.View
        key={booking?.booking_no || booking?.id || index}
        style={[
          styles.activeRideCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {activeBookings.length > 1 && (
          <Text style={styles.bookingIndexLabel}>Booking {index + 1} of {activeBookings.length}</Text>
        )}

        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.currentServiceName}>{getServiceName(booking)}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
              <Text style={styles.statusBadgeText}>{getStatusText(status)}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.fareLabel}>Total Amount</Text>
            <Text style={styles.fareAmount}>₹{totalAmount.toFixed(0)}</Text>
          </View>
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationEntryRow}>
            <View style={styles.dotCol}>
              <View style={styles.pickupDot} />
              <View style={styles.locationLine} />
            </View>
            <View style={styles.locationTextCol}>
              <Text style={styles.locationLabel}>Address</Text>
              <Text style={styles.pickupText}>{address || 'On Spot location'}</Text>
            </View>
          </View>
          <View style={styles.locationEntryRow}>
            <View style={styles.dotCol}>
              <View style={styles.toCityDot} />
            </View>
            <View style={styles.locationTextCol}>
              <Text style={styles.locationLabel}>City</Text>
              <Text style={styles.toCityText}>{booking?.city || '-'}</Text>
            </View>
          </View>
        </View>

        {scheduleDateTime ? (
          <View style={styles.scheduleDateRow}>
            <Icon name="calendar" size={14} color="#FF1493" />
            <Text style={styles.scheduleDateText}>{scheduleDateTime}</Text>
          </View>
        ) : null}

        <View style={styles.currentDetailsGrid}>
          <View style={styles.currentDetailItem}>
            <Icon name="hash" size={15} color="#666" />
            <View style={styles.currentDetailTextWrap}>
              <Text style={styles.currentDetailLabel}>Booking No</Text>
              <Text style={styles.currentDetailValue}>{booking?.booking_no || '-'}</Text>
            </View>
          </View>
          <View style={styles.currentDetailItem}>
            <Icon name="briefcase" size={15} color="#666" />
            <View style={styles.currentDetailTextWrap}>
              <Text style={styles.currentDetailLabel}>Plan</Text>
              <Text style={styles.currentDetailValue}>{booking?.plan_name || '-'}</Text>
            </View>
          </View>
          <View style={styles.currentDetailItem}>
            <FontAwesome5 name="rupee-sign" size={13} color="#666" />
            <View style={styles.currentDetailTextWrap}>
              <Text style={styles.currentDetailLabel}>Token</Text>
              <Text style={styles.currentDetailValue}>₹{booking?.token_amount || '0.00'}</Text>
            </View>
          </View>
          <View style={styles.currentDetailItem}>
            <FontAwesome5 name="rupee-sign" size={13} color="#666" />
            <View style={styles.currentDetailTextWrap}>
              <Text style={styles.currentDetailLabel}>Balance</Text>
              <Text style={styles.currentDetailValue}>₹{booking?.balance_amount || '0.00'}</Text>
            </View>
          </View>
        </View>

        {booking?.driver_id ? (
          <View style={styles.driverInfo}>
            <View style={styles.driverDetail}>
              <FontAwesome5 name="user-circle" size={16} color="#FF1493" />
              <Text style={styles.driverText}>Driver Assigned</Text>
            </View>
            <Text style={styles.driverText}>ID: {booking.driver_id}</Text>
          </View>
        ) : null}

        {showOtp ? (
          <View style={styles.otpHorizontalContainer}>
            <Text style={styles.otpHorizontalLabel}>Share OTP to captain</Text>
            <Text style={styles.otpHorizontalValue}>{booking.otp}</Text>
          </View>
        ) : null}

        {booking?.remarks ? (
          <View style={styles.scheduleDateRow}>
            <Icon name="message-square" size={14} color="#FF1493" />
            <Text style={styles.scheduleDateText}>{booking.remarks}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('OnSpotBookings')}
        >
          <Icon name="arrow-right-circle" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Continue Booking</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderActiveBooking = (booking, index) => {
    if (booking?.__bookingType === BOOKING_TYPE.PARCEL) {
      return renderActiveParcelBooking(booking, index);
    }
    if (booking?.__bookingType === BOOKING_TYPE.SELF_SHARING) {
      return renderActiveSelfSharingBooking(booking, index);
    }
    if (booking?.__bookingType === BOOKING_TYPE.ON_SPOT) {
      return renderActiveOnSpotBooking(booking, index);
    }
    return renderActiveRide(booking, index);
  };

  const renderActiveRides = () => activeBookings.map((booking, index) => renderActiveBooking(booking, index));

  const handleServicePress = (service) => {
    if (service?.title === 'In City') {
      const activeInCity = activeBookings.find(b => b.is_incity);
      if (activeInCity) {
        Alert.alert('Active Ride', 'You already have an active In City ride. Please complete it first.');
        return;
      }
      navigation.navigate('InCity', { service_id: service.id });
      return;
    }

    // Handle Self Sharing and Inter city services
    const selfSharingServices = ['Self Sharing', 'Inter city'];
    if (selfSharingServices.includes(service?.title)) {
      navigation.navigate('SelfSharingSearch', {
        service_id: service.id,
        service_title: service.title,
      });
      return;
    }

    // Parcel services
    if (service?.title?.toLowerCase()?.includes('parcel')) {
      navigation.navigate('ParcelVehicleSelection', {
        service_id: service.id,
        service_title: service.title,
      });
      return;
    }

    // All other services allow multiple bookings
    navigation.navigate('VehicleSelection', { service_id: service.id, service_title: service.title });
  };

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
        <View style={styles.headerContent}>
          {/* <Text style={styles.headerTitle}>Home</Text> */}
          <View style={styles.headerTop}>
            <View>
              <View style={styles.greetingContainer}>
                <Icon name={greetingIcon} size={20} color="rgba(255,255,255,0.9)" />
                <Text style={styles.greeting}>{greeting}</Text>
              </View>
              <Text style={styles.userName}>{displayName}</Text>
            </View>
            <View style={styles.headerRightActions}>
                  <TouchableOpacity
                style={styles.profileButton}
                onPress={() => navigation.navigate('Profile')}
              >
                <LinearGradient
                  colors={['#fff', '#fff5f5']}
                  style={styles.profileGradient}
                >
                  {profileImageUri ? (
                    <Image
                      source={{ uri: secureProfileImage }}
                      style={styles.headerProfileImage}
                      onError={() => setProfileImageError(true)}
                    />
                  ) : (
                    <Icon name="user" size={28} color="#FF1493" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate('Notification')}
                activeOpacity={0.8}
              >
                <Icon name="bell" size={24} color="#fff" />
                <View style={styles.badge} />
              </TouchableOpacity>
          
            </View>
          </View>
        </View>
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
        {/* Active Bookings */}
 {activeBookings.length >0 && <View style={[styles.section, styles.activeBookingsHeaderSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Bookings</Text>
          </View>
        </View>}
        {renderActiveRides()}

        {/* Our Services Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Our Services</Text>
          </View>

          <View style={styles.servicesGrid}>
            {services.map((service, index) => (
              <TouchableOpacity
                key={index}
                style={styles.serviceCard}
                onPress={() => handleServicePress(service)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#fff', '#fff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.serviceImageContainer}
                >
                  {console.log('service', service)
                  }
                  <Image
                    source={{ uri: `https://sigiride.com/uploads/services/${service.image}` }}
                    style={styles.serviceImage}
                    resizeMode="contain"
                  />
                </LinearGradient>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceSubtitle}>{service.description || ''}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
       
        {/* Sliding Banner */}
        <View style={styles.bannerWrapper}>
          <FlatList
            ref={bannerRef}
            data={bannerSlides}
            horizontal
            snapToInterval={width - 30}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (width - 30));
              setBannerIndex(index);
            }}
            renderItem={({ item }) => (
              <LinearGradient
                colors={item.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bannerSlide}
              >
                <View style={styles.bannerContent}>
                  <View style={styles.bannerTextContainer}>
                    <Text style={styles.bannerTitle}>{item.title}</Text>
                    <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                  </View>
                  <FontAwesome5 name={item.icon} size={50} color="rgba(255,255,255,0.3)" />
                </View>
              </LinearGradient>
            )}
          />
          <View style={styles.bannerDots}>
            {bannerSlides.map((_, i) => (
              <View
                key={i}
                style={[styles.bannerDot, i === bannerIndex && styles.bannerDotActive]}
              />
            ))}
          </View>
        </View>

        {/* Last 5 Bookings */}
        {recentBookings.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Bookings</Text>
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={styles.seeAllText}>View All →</Text>
              </TouchableOpacity>
            </View>
            {recentBookings.map((booking, index) => {
              const status = booking.status?.toLowerCase();
              const statusColorMap = {
                completed: '#4CAF50',
                payment_done: '#4CAF50',
                cancelled: '#F44336',
                searching: '#FF9800',
                accepted: '#2196F3',
                arrived: '#2196F3',
                started: '#FF5722',
                waiting_for_payment: '#F59E0B',
              };
              const statusColor = statusColorMap[status] || '#757575';
              const pickup = booking.pickup_address || booking.pickup_city || 'N/A';
              const drop = booking.drop_address || booking.drop_city || 'N/A';
              const toCity = booking.service_name?.includes('Rental') || booking.service_name?.includes('Driver') ? booking.to_city : null;
              const totalTopup = booking.topups?.reduce((sum, t) => sum + parseFloat(t.topup_amount || 0), 0) || 0;
              const fare = booking.is_incity
                ? parseFloat(booking.final_fare || booking.actual_fare || 0)
                : parseFloat(booking.total_fare || 0) + totalTopup;
              const formattedDate = new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
              const statusDisplay = status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';

              return (
                <View key={booking.id || index} style={styles.recentBookingCard}>
                  <View style={styles.recentCardHeader}>
                    <Text style={styles.recentDate}>{formattedDate}</Text>
                    <View style={[styles.recentStatusBadge, { backgroundColor: statusColor }]}>
                      <Text style={styles.recentStatusText}>{statusDisplay}</Text>
                    </View>
                  </View>
                  <View style={styles.recentLocations}>
                    <View style={styles.recentLocationRow}>
                      <View style={styles.greenDot} />
                      <View style={styles.recentTextWrap}>
                        <Text style={styles.recentLocationLabel}>Pickup</Text>
                        <Text style={styles.recentLocationText} numberOfLines={1}>{pickup}</Text>
                      </View>
                    </View>
                    <View style={styles.recentDotLine} />
                    <View style={styles.recentLocationRow}>
                      <View style={styles.redDot} />
                      <View style={styles.recentTextWrap}>
                        <Text style={styles.recentLocationLabel}>Drop</Text>
                        <Text style={styles.recentLocationText} numberOfLines={1}>{drop}</Text>
                      </View>
                    </View>
                    {toCity ? (
                      <>
                        <View style={styles.recentDotLine} />
                        <View style={styles.recentLocationRow}>
                          <View style={styles.recentToCityDot} />
                          <View style={styles.recentTextWrap}>
                            <Text style={styles.recentLocationLabel}>To City</Text>
                            <Text style={[styles.recentLocationText, styles.recentToCityText]} numberOfLines={1}>{toCity}</Text>
                          </View>
                        </View>
                      </>
                    ) : null}
                  </View>
                  <View style={styles.recentCardFooter}>
                    <Text style={styles.recentBookingId}>ID: {booking.booking_id}</Text>
                    {fare > 0 && <Text style={styles.recentFare}>₹{fare.toFixed(0)}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Promo Banner - Only show when no active ride */}
        {/* {!currentRide && (
          <LinearGradient
            colors={['#FF1493', '#FF69B4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.promoBanner}
          >
            <View style={styles.promoContent}>
              <View>
                <Text style={styles.promoTitle}>First Ride Offer!</Text>
                <Text style={styles.promoText}>Get 50% off on your first ride</Text>
                <TouchableOpacity style={styles.promoButton}>
                  <Text style={styles.promoButtonText}>Claim Now</Text>
                </TouchableOpacity>
              </View>
              <FontAwesome5 name="gift" size={60} color="rgba(255,255,255,0.3)" />
            </View>
          </LinearGradient>
        )} */}

        {/* Recent Activity - Only show when no active ride */}
        {/* {!currentRide && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => navigation.navigate('RideHistory')}>
                <Text style={styles.seeAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.activityCard}>
              <View style={styles.activityIcon}>
                <FontAwesome5 name="check-circle" size={24} color="#4CAF50" />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>Ride Completed</Text>
                <Text style={styles.activitySubtitle}>In City • 15 mins ago</Text>
              </View>
              <Text style={styles.activityPrice}>₹250</Text>
            </View>

            <View style={styles.activityCard}>
              <View style={styles.activityIcon}>
                <FontAwesome5 name="clock" size={24} color="#FF9800" />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>Upcoming Ride</Text>
                <Text style={styles.activitySubtitle}>Airport • Tomorrow 10:00 AM</Text>
              </View>
              <Text style={styles.activityPrice}>₹450</Text>
            </View>
          </View>
        )} */}
      </ScrollView>

      {/* Pickup Address Modal for Token Payment */}
      <Modal
        visible={showPickupModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPickupModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Pickup Details</Text>
            <Text style={styles.modalSubtitle}>
              Please enter your pickup address to confirm the ride
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter Full Pickup address"
              placeholderTextColor={'#000'}
              value={pickupAddress}
              onChangeText={setPickupAddress}
              multiline
            />

            <TextInput
              style={styles.input}
              placeholder="Enter Landmark"
              placeholderTextColor={'#000'}
              value={landmark}
              onChangeText={setLandmark}
            />

            <TextInput
              style={styles.input}
              placeholder="Pickup location - Optional"
              placeholderTextColor={'#000'}
              value={pickupLocation}
              onChangeText={setPickupLocation}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setShowPickupModal(false);
                  setPickupAddress('');
                  setPickupLocation('');
                  setLandmark('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.submitBtn]}
                onPress={submitTokenPayment}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Confirm & Pay</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Remaining Balance Payment Modal */}
      <Modal
        visible={showRemainingPayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRemainingPayModal(false)}
      >{
        console.log('selectedBooking', selectedBooking)
      }
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* <Text style={styles.modalTitle}>Pay Remaining Balance</Text>
            <Text style={styles.modalSubtitle}>
              Amount: ₹{parseInt(selectedBooking?.total_fare, 10) - parseInt(selectedBooking?.token_amount, 10)}
            </Text> */}

            <Text style={{...styles.modalTitle,marginBottom:10}}>Pay Balance ₹{parseInt(selectedBooking?.total_fare, 10) - parseInt(selectedBooking?.token_amount, 10)}</Text>
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
                onPress={() => setShowRemainingPayModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.submitBtn]}
                onPress={submitRemainingPayment}
                disabled={isLoading}
              >
                {isLoading ? (
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

      {/* Topup Payment Modal */}
      <Modal
        visible={showTopupPayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowTopupPayModal(false);
          setSelectedTopup(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pay Topup Amount</Text>
            <Text style={styles.modalSubtitle}>
              Extra Kilometers: {selectedTopup?.extra_km} km
            </Text>
            <Text style={styles.modalSubtitle}>
              Topup Amount: ₹{selectedTopup?.topup_amount}
            </Text>
            <Text style={styles.modalSubtitle}>
              Reason: {selectedTopup?.reason}
            </Text>

            <Text style={styles.paymentModeTitle}>Pay Balance</Text>
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
                onPress={() => {
                  setShowTopupPayModal(false);
                  setSelectedTopup(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.submitBtn]}
                onPress={submitTopupPayment}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{...styles.submitBtnText,textAlign:'center'}}>
                    Pay ₹{selectedTopup?.topup_amount} {selectedPaymentMode}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
    visible={popupVisible}
    transparent
    animationType="fade">

    <View style={styles.popupOverlay}>

        <View style={styles.popupContainer}>

            {!!popupData?.image_url && (
                <Image
                    source={{ uri: popupData.image_url }}
                    style={styles.popupImage}
                    resizeMode="cover"
                />
            )}

            <Text style={styles.popupTitle}>
                {popupData?.title}
            </Text>

            <Text style={styles.popupMessage}>
                {popupData?.message}
            </Text>

            <TouchableOpacity
                style={styles.popupButton}
                onPress={closePopup}>

                <Text style={styles.popupButtonText}>
                    Got It
                </Text>

            </TouchableOpacity>

        </View>

    </View>

</Modal>

      <Modal visible={showCancelModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Ride</Text>
            <Text style={styles.modalSubtitle}>Please enter the reason for cancellation</Text>

            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
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
                onPress={submitCancelRide}
                disabled={isLoading}
              >
                {isLoading ? (
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
  header: {
    paddingTop: 10,
    paddingBottom: 0,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF2D55',
    borderWidth: 1,
    borderColor: '#ff7f50',
  },
  profileButton: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    resizeMode: 'cover',
  },
  scrollView: {
    flex: 1,
  },
  activeRideCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    margin: 15,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  cardHeaderLeft: {
    flex: 1,
    paddingRight: 12,
  },
  currentServiceName: {
       color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    backgroundColor: '#ff4d6d',
alignSelf: 'flex-start',
  paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  fareLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'right',
  },
  baseFare: {
    fontSize: 10,
    color: '#999',
    textAlign: 'right',
  },
  locationContainer: {
    marginBottom: 15,
  },
  locationEntryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dotCol: {
    alignItems: 'center',
    width: 12,
    marginRight: 12,
  },
  locationTextCol: {
    flex: 1,
    paddingBottom: 10,
  },
  locationLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  toCityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#810a45',
    marginTop: 2,
  },
  toCityText: {
    fontSize: 14,
    color: '#810a45',
    fontWeight: '600',
  },
  locationIcon: {
    alignItems: 'center',
    marginRight: 15,
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
  locationLine: {
    width: 2,
    height: 30,
    backgroundColor: '#ddd',
    marginVertical: 4,
  },
  locationTextContainer: {
    flex: 1,
  },
  pickupText: {
    fontSize: 14,
    color: '#333',
  },
  dropText: {
    fontSize: 14,
    color: '#333',
  },
  rideInfo: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 15,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  inCityFareNoteText: {
    color: '#FF9800',
    flex: 1,
  },
  currentDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  currentDetailItem: {
    width: (width - 90) / 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 10,
  },
  currentDetailTextWrap: {
    flex: 1,
  },
  currentDetailLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  currentDetailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  driverInfo: {
    backgroundColor: '#FFF0F5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  driverInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  driverDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  driverProfileImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#F8C8DC',
  },
  driverText: {
    fontSize: 14,
    color: '#FF1493',
    fontWeight: '500',
  },
  vehicleInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8C8DC',
    gap: 8,
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehicleInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  actionButtonsColumn: {
    gap: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rideInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    borderRadius: 12,
  },
  rideInfoText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  topupContainer: {
    marginTop: 10,
  },
  topupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 12,
  },
  topupPayButton: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  topupPaidCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  topupInfo: {
    marginBottom: 10,
  },
  topupAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  topupDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  topupReason: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FFE0B2',
  },
  payButtonText: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },
  otpInfoContainer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#C8E6C9',
    alignItems: 'center',
  },
  otpInfoLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 5,
  },
  otpInfoValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    letterSpacing: 4,
    marginBottom: 5,
  },
  otpInfoHint: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  activeBookingsHeaderSection: {
    marginBottom: -20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A2B4E',
  },
  seeAllText: {
    fontSize: 13,
    color: '#FF1493',
    fontWeight: '500',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - 45) / 3,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceImage: {
    width: 40,
    height: 40,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2B4E',
    marginTop: 4,
  },
  serviceSubtitle: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    textAlign: 'center',
  },
  promoBanner: {
    margin: 15,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  promoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  promoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  promoButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    color: '#FF1493',
    fontSize: 12,
    fontWeight: '600',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2B4E',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  activityPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF1493',
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
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
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
  bannerWrapper: {
    marginHorizontal: 15,
    marginTop: 5,
    marginBottom: 5,
  },
  bannerSlide: {
    width: width - 30,
    borderRadius: 16,
    padding: 20,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 18,
  },
  bannerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  bannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ddd',
  },
  bannerDotActive: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#810a45',
  },
  recentSection: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  recentBookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  recentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentDate: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  recentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recentStatusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  recentLocations: {
    marginBottom: 10,
  },
  recentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F44336',
  },
  recentDotLine: {
    width: 2,
    height: 14,
    backgroundColor: '#ddd',
    marginLeft: 4,
    marginVertical: 2,
  },
  recentTextWrap: {
    flex: 1,
  },
  recentLocationLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  recentLocationText: {
    fontSize: 13,
    color: '#444',
  },
  recentToCityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#810a45',
  },
  recentToCityText: {
    color: '#810a45',
    fontWeight: '600',
  },
  recentCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  recentBookingId: {
    fontSize: 11,
    color: '#999',
  },
  recentFare: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  scheduleDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  scheduleDateText: {
    fontSize: 13,
    color: '#FF1493',
    fontWeight: '600',
  },
  bookingIndexLabel: {
    fontSize: 11,
    color: '#FF1493',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'right',
  },
  otpHorizontalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#FFE0EB',
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
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FFF0F7', alignItems: 'center', justifyContent: 'center',marginRight:10
  },
  driverMeta: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: '700', color: '#222' },
  callRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  driverPhone: { fontSize: 13, color: '#4CAF50', fontWeight: '500' },
  callBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center',
  },
  otpContainer: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  otpLabel: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  otpValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    letterSpacing: 4,
    marginVertical: 5,
  },
  otpHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
    requestBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF1493', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  requestBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 6 },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
},

popupContainer: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 10,
},

popupImage: {
    width: '100%',
    height: 220,
},

popupTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginTop: 18,
    textAlign: 'center',
},

popupMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    lineHeight: 22,
},

popupButton: {
    margin: 20,
    backgroundColor: '#ff4d6d',
    borderRadius: 30,
    paddingVertical: 14,
},

popupButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
},
});

export default HomeScreen;
