import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch } from 'react-redux';
import { GET_USER_CURRENT_BOOKING, CANCEL_BOOKING } from '../../redux/actions/action-creator';
import CurvedHeader from '../../components/CurvedHeader';

const MAPS_API_KEY = 'AIzaSyDbk7w0pvfAxvMsgGiCs3UMa_GTsAHTmgY';

const STEPS = ['ACCEPTED', 'ARRIVED', 'STARTED', 'WAITING_FOR_PAYMENT', 'COMPLETED'];

const STATUS_LABEL = {
  ACCEPTED: 'Driver Assigned',
  ARRIVED: 'Driver Arrived',
  STARTED: 'Ride Started',
  WAITING_FOR_PAYMENT: 'Payment Due',
  COMPLETED: 'Completed',
};

const STATUS_COLOR = {
  ACCEPTED: '#4CAF50',
  ARRIVED: '#2196F3',
  STARTED: '#FF9800',
  WAITING_FOR_PAYMENT: '#F59E0B',
  COMPLETED: '#9E9E9E',
};

const decodePolyline = (encoded) => {
  const coords = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let result = 0, shift = 0, byte;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    result = 0; shift = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
};

const InCityTrackingScreen = ({ route, navigation }) => {
  const { booking: initialBooking } = route.params;
  const dispatch = useDispatch();

  const mapRef = useRef(null);
  const pollRef = useRef(null);

  const [booking, setBooking] = useState(initialBooking);
  console.log('initialBooking', initialBooking);
  const [routeCoords, setRouteCoords] = useState([]);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [driverLocation, setDriverLocation] = useState(
    initialBooking.driver_current_lat && initialBooking.driver_current_lng
      ? {
        latitude: parseFloat(initialBooking.driver_current_lat),
        longitude: parseFloat(initialBooking.driver_current_lng),
      }
      : null,
  );

  const pickup = {
    latitude: parseFloat(initialBooking.start_lat || initialBooking.pickup_lat || 0),
    longitude: parseFloat(initialBooking.start_lng || initialBooking.pickup_lng || 0),
  };
  const drop = {
    latitude: parseFloat(initialBooking.end_lat || initialBooking.drop_lat || 0),
    longitude: parseFloat(initialBooking.end_lng || initialBooking.drop_lng || 0),
  };
  const hasCoords = pickup.latitude !== 0 && drop.latitude !== 0;

  // fetch route once on mount
  useEffect(() => {
    if (!hasCoords) return;
    const fetchRoute = async () => {
      try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup.latitude},${pickup.longitude}&destination=${drop.latitude},${drop.longitude}&mode=driving&key=${MAPS_API_KEY}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.status === 'OK' && json.routes?.[0]?.overview_polyline?.points) {
          setRouteCoords(decodePolyline(json.routes[0].overview_polyline.points));
        }
      } catch (_) { }
    };
    fetchRoute();
  }, []);

  // fit map to markers after route loads
  useEffect(() => {
    if (!hasCoords) return;
    setTimeout(() => {
      mapRef.current?.fitToCoordinates([pickup, drop], {
        edgePadding: { top: 80, right: 40, bottom: 40, left: 40 },
        animated: true,
      });
    }, 600);
  }, [routeCoords]);

  // poll booking status every 2 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await dispatch(GET_USER_CURRENT_BOOKING());
        if (res?.data) {
          setBooking(res.data[0]);
          console.log('res.data[0]', res.data[0]);

          if (res.data[0].driver_current_lat && res.data[0].driver_current_lng) {
            setDriverLocation({
              latitude: parseFloat(res.data[0].driver_current_lat),
              longitude: parseFloat(res.data[0].driver_current_lng),
            });
          }
          if (res.data[0].status === 'WAITING_FOR_PAYMENT') {
            clearInterval(pollRef.current);
            navigation.replace('InCityUserInvoice', { booking: res.data[0] });
          } else if (['COMPLETED', 'CANCELLED'].includes(res.data[0].status)) {
            clearInterval(pollRef.current);
          }
        }
      } catch (_) { }
    };
    pollRef.current = setInterval(poll, 2000);
    return () => clearInterval(pollRef.current);
  }, [dispatch, navigation]);

  const handleCancel = () => {
    setCancelReason('');
    setShowCancelModal(true);
  };

  const submitCancelRide = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Error', 'Please enter reason');
      return;
    }
    setCancelling(true);
    try {
      const res = await dispatch(
        CANCEL_BOOKING({
          booking_id: booking.booking_id,
          role: "USER",
          cancel_reason: cancelReason.trim(),
        })
      );
      if (res?.status) {
        setShowCancelModal(false);
        navigation.goBack();
      } else {
        Alert.alert('Error', res?.message || 'Failed to cancel ride');
      }
    } catch (_) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setCancelling(false);
    }
  };

  const handleCall = () => {
    if (booking.driver_mobile) {
      Linking.openURL(`tel:${booking.driver_mobile}`);
    }
  };

  const stepIndex = STEPS?.indexOf(booking?.status);
  const statusColor = STATUS_COLOR[booking?.status] || '#757575';
  const statusLabel = STATUS_LABEL[booking?.status] || booking?.status;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#ff7f50" barStyle="light-content" />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={
          hasCoords
            ? { latitude: pickup.latitude, longitude: pickup.longitude, latitudeDelta: 0.06, longitudeDelta: 0.06 }
            : { latitude: 22.9, longitude: 78.6, latitudeDelta: 5, longitudeDelta: 5 }
        }
      >
        {hasCoords && (
          <>
            <Marker coordinate={pickup} title="Pickup" pinColor="#22C55E" />
            <Marker coordinate={drop} title="Drop" pinColor="#EF4444" />
            <Polyline
              coordinates={routeCoords.length ? routeCoords : [pickup, drop]}
              strokeColor="#FF1493"
              strokeWidth={4}
            />
          </>
        )}
        {driverLocation && (
          <Marker
            coordinate={driverLocation}
            title="Driver"
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.driverMarkerWrap}>
              <FontAwesome5 name="car" size={18} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Header */}
      <CurvedHeader title="In City Ride" navigation={navigation} showBack style={styles.header} />

      {/* Bottom card */}
      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>

        {/* Stepper */}
        <View style={styles.stepper}>
          {STEPS.map((step, i) => (
            <View key={step} style={styles.stepRow}>
              <View style={[styles.stepDot, i <= stepIndex && styles.stepDotActive]} />
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, i < stepIndex && styles.stepLineActive]} />
              )}
              <Text style={[styles.stepLabel, i <= stepIndex && styles.stepLabelActive]}>
                {STATUS_LABEL[step]}
              </Text>
            </View>
          ))}
        </View>
          {/* OTP — show when ARRIVED */}
  {booking?.status === 'ARRIVED' && booking.otp ? (
          <View style={styles.otpHorizontalCard}>
            <Text style={styles.otpHorizontalLabel}>Share OTP to captain</Text>
            <Text style={styles.otpHorizontalValue}>{booking.otp}</Text>
          </View>
        ) : null}
          {/* Driver info */}
        {booking.driver_name ? (
          <View style={styles.card}>
            <View style={styles.driverRow}>
              <View style={styles.driverAvatar}>
                <FontAwesome5 name="user-circle" size={36} color="#FF1493" />
              </View>
              <View style={styles.driverMeta}>
                <Text style={styles.driverName}>{booking.driver_name}</Text>
                <TouchableOpacity style={styles.callRow} onPress={handleCall}>
                  <Icon name="phone" size={14} color="#4CAF50" />
                  <Text style={styles.driverPhone}>{booking.driver_mobile}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                <Icon name="phone-call" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        {/* Route */}
        <View style={styles.card}>
          <View style={styles.routeRow}>
            <View style={styles.routeDots}>
              <View style={styles.pickupDot} />
              <View style={styles.routeLine} />
              <View style={styles.dropDot} />
            </View>
            <View style={styles.routeTexts}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeAddr} numberOfLines={2}>
                {booking.pickup_address || booking.pickup_city}
              </Text>
              <View style={styles.routeGap} />
              <Text style={styles.routeLabel}>Drop</Text>
              <Text style={styles.routeAddr} numberOfLines={2}>
                {booking.drop_address || booking.drop_city}
              </Text>
            </View>
          </View>
        </View>

      

      
      

        {/* Fare note */}
        <View style={styles.fareNoteCard}>
          <Icon name="info" size={16} color="#FF9800" />
          <Text style={styles.fareNoteText}>
            {booking.fare_note || 'Fare will be calculated on meter at trip end'}
          </Text>
        </View>

        {/* Booking ID */}
        <Text style={styles.bookingId}>Booking ID: {booking.booking_id}</Text>

        {/* Cancel button — always visible */}
        {console.log('booking?.status', booking?.status)}
        {/* {(booking?.status === 'ARRIVED' || booking?.status === 'ACCEPTED') &&
          ( */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={cancelling}
          >
            {cancelling
              ? <ActivityIndicator color="#fff" />
              : <><Icon name="x-circle" size={18} color="#fff" /><Text style={styles.cancelText}>Cancel Ride</Text></>}
          </TouchableOpacity>
        {/* )} */}

        {booking?.status === 'COMPLETED' && (
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={showCancelModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Ride</Text>
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
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalSubmitBtn]}
                onPress={submitCancelRide}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Submit</Text>
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
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    maxHeight: '55%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
  },
  sheetContent: { padding: 16, paddingBottom: 32, gap: 12 },

  statusBadge: {
    alignSelf: 'center', paddingHorizontal: 18, paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  stepper: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'space-between', marginVertical: 4,
  },
  stepRow: { flex: 1, alignItems: 'center' },
  stepDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#ddd', marginBottom: 4,
  },
  stepDotActive: { backgroundColor: '#FF1493' },
  stepLine: {
    position: 'absolute', top: 5, left: '50%', right: '-50%',
    height: 2, backgroundColor: '#ddd',
  },
  stepLineActive: { backgroundColor: '#FF1493' },
  stepLabel: { fontSize: 10, color: '#aaa', textAlign: 'center' },
  stepLabelActive: { color: '#FF1493', fontWeight: '600' },

  card: {
    backgroundColor: '#F9F9F9', borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: '#F0F0F0',
  },

  routeRow: { flexDirection: 'row', gap: 12 },
  routeDots: { alignItems: 'center', paddingTop: 4 },
  pickupDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' },
  routeLine: { width: 2, flex: 1, backgroundColor: '#ddd', marginVertical: 4 },
  dropDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' },
  routeTexts: { flex: 1 },
  routeLabel: { fontSize: 11, color: '#999', fontWeight: '600', textTransform: 'uppercase' },
  routeAddr: { fontSize: 14, color: '#222', fontWeight: '500', marginTop: 2 },
  routeGap: { height: 12 },

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
  otpCard: {
    backgroundColor: '#FFF8E1', borderRadius: 12,
    padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#FFE082',
  },
  otpLabel: { fontSize: 12, color: '#FF9800', fontWeight: '600', textTransform: 'uppercase' },
  otpValue: { fontSize: 32, fontWeight: '800', color: '#FF9800', letterSpacing: 4, marginVertical: 6 },
  otpHint: { fontSize: 12, color: '#888', textAlign: 'center' },

  fareNoteCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF3E0', borderRadius: 10, padding: 12,
  },
  fareNoteText: { flex: 1, fontSize: 13, color: '#E65100' },

  bookingId: { fontSize: 12, color: '#aaa', textAlign: 'center' },

  cancelBtn: {
    height: 50, borderRadius: 14, backgroundColor: '#EF4444',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 4,
  },
  cancelText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  doneBtn: {
    height: 50, borderRadius: 14, backgroundColor: '#FF1493',
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  driverMarkerWrap: {
    backgroundColor: '#FF9800',
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
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
    width: '90%',
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
  modalCancelBtn: {
    backgroundColor: '#f0f0f0',
  },
  modalSubmitBtn: {
    backgroundColor: '#FF1493',
  },
  modalCancelBtnText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  modalSubmitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default InCityTrackingScreen;
