import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useDispatch } from 'react-redux';
import { GET_INVOICE, PROCESS_PAYMENT, GET_USER_CURRENT_BOOKING } from '../../redux/actions/action-creator';
import CurvedHeader from '../../components/CurvedHeader';

const BRAND  = '#E91E8C';
const AMBER  = '#F59E0B';
const GREEN  = '#16A34A';
const TEXT   = '#111827';
const SUBTLE = '#6B7280';
const BORDER = '#E5E7EB';
const BG     = '#F7F8FA';
const WHITE  = '#FFFFFF';

const Row = ({ icon, label, value }) => (
  <View style={s.row}>
   {icon == 'dollar-sign' ? <MaterialIcon name="currency-inr" size={16} color={SUBTLE} />:<Icon name={icon} size={14} color={SUBTLE} style={{ marginTop: 1 }} />}
    <Text style={s.rowLabel}>{label}</Text>
    <Text style={s.rowValue}>{value ?? '—'}</Text>
  </View>
);

const InCityUserInvoiceScreen = ({ route, navigation }) => {
  const { booking } = route.params;
  const bookingId = booking?.booking_id;

  const dispatch    = useDispatch();
  const intervalRef = useRef(null);
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  const [invoice,    setInvoice]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [paying,     setPaying]     = useState(false);
  const [paid,       setPaid]       = useState(false); // local flag after processPayment

  const fetchInvoice = useCallback(async () => {
    try {
      const res = await dispatch(GET_INVOICE({ booking_id: bookingId }));
      if (res?.status && res?.invoice) {
        setInvoice(res.invoice);
      }
    } catch (_) {}
    finally { setLoading(false); }
  }, [bookingId, dispatch]);

  // Poll invoice every 5s
  useEffect(() => {
    fetchInvoice();
    intervalRef.current = setInterval(fetchInvoice, 5000);
    return () => clearInterval(intervalRef.current);
  }, [fetchInvoice]);

  // Poll current booking to detect COMPLETED
  useEffect(() => {
    if (!paid) return;
    const poll = setInterval(async () => {
      try {
        const res = await dispatch(GET_USER_CURRENT_BOOKING());
        console.log('Current booking status:', res?.data);
        if (!res?.data || ['COMPLETED', 'CANCELLED'].includes(res.data[0].status)) {
          clearInterval(poll);
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        }
      } catch (_) {}
    }, 5000);
    return () => clearInterval(poll);
  }, [paid, dispatch, navigation]);

  // Pulse for waiting badge
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.25, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const handlePay = async (paymentMode) => {
    setPaying(true);
    try {
      const res = await dispatch(PROCESS_PAYMENT({ booking_id: bookingId, payment_mode: paymentMode }));
      if (res?.status) {
        clearInterval(intervalRef.current);
        setPaid(true);
      } else {
        Alert.alert('Error', res?.message || 'Payment failed. Please try again.');
      }
    } catch (_) {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setPaying(false);
    }
  };

  const confirmPay = (mode) => {
    const label = mode === 'CASH' ? 'Cash' : 'Online';
    Alert.alert(
      'Confirm Payment',
      `Pay ₹${inv.i_collect || inv.fare_breakdown?.actual_fare || '?'} via ${label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => handlePay(mode) },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={BRAND} />
        <Text style={{ color: SUBTLE, marginTop: 12, fontSize: 14 }}>Loading invoice...</Text>
      </View>
    );
  }

  const inv = invoice || {};
  const pickup      = inv.pickup_address  || booking?.pickup_address  || booking?.pickup_city  || '—';
  const drop        = inv.drop_address    || booking?.drop_address    || booking?.drop_city    || '—';
  const subService  = inv.sub_service_name || booking?.sub_service_name || 'In City';
  const actualFare  = inv.fare_breakdown?.actual_fare;
  const actualDist  = inv.fare_breakdown?.actual_distance;
  const iCollect    = inv.i_collect;
  const driverName  = booking?.driver_name;
  const driverPhone = booking?.driver_mobile;

  return (
    <View style={s.container}>
      <StatusBar backgroundColor="#ff7f50" barStyle="light-content" />

      <CurvedHeader title="Ride Invoice" />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Status card */}
        {paid ? (
          <View style={[s.statusCard, { borderColor: '#BBF7D0' }]}>
            <View style={[s.iconWrap, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
              <MaterialIcon name="clock-check-outline" size={36} color={GREEN} />
            </View>
            <Text style={s.statusTitle}>Payment Submitted</Text>
            <Text style={s.statusSub}>Waiting for driver to confirm payment collection.</Text>
            <View style={[s.badge, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
              <View style={[s.pulseDot, { backgroundColor: GREEN }]} />
              <Text style={[s.badgeText, { color: GREEN }]}>WAITING FOR CONFIRMATION</Text>
            </View>
            <ActivityIndicator color={AMBER} style={{ marginTop: 16 }} />
          </View>
        ) : (
          <View style={s.statusCard}>
            <View style={s.iconWrap}>
              <MaterialIcon name="cash-clock" size={36} color={AMBER} />
            </View>
            <Text style={s.statusTitle}>Payment Due</Text>
            <Text style={s.statusSub}>Your ride is complete. Please pay the amount below.</Text>
            <View style={s.badge}>
              <Animated.View style={[s.pulseDot, { opacity: pulseAnim }]} />
              <Text style={s.badgeText}>WAITING FOR PAYMENT</Text>
            </View>
          </View>
        )}
 {!paid && (
          <View style={s.payButtons}>
            <TouchableOpacity
              style={[s.payBtn, s.cashBtn]}
              onPress={() => confirmPay('CASH')}
              disabled={paying}
              activeOpacity={0.85}
            >
              {paying ? (
                <ActivityIndicator color={WHITE} size="small" />
              ) : (
                <>
                  <MaterialIcon name="cash" size={22} color={WHITE} />
                  <Text style={s.payBtnText}>I Paid (Cash)  <MaterialIcon name="currency-inr" size={16} color={'#fff'} />{actualFare}</Text>
                </>
              )}
            </TouchableOpacity>
            {/* <TouchableOpacity
              style={[s.payBtn, s.onlineBtn]}
              onPress={() => confirmPay('ONLINE')}
              disabled={paying}
              activeOpacity={0.85}
            >
              {paying ? (
                <ActivityIndicator color={WHITE} size="small" />
              ) : (
                <>
                  <MaterialIcon name="credit-card-outline" size={22} color={WHITE} />
                  <Text style={s.payBtnText}>I Paid (Online)</Text>
                </>
              )}
            </TouchableOpacity> */}
          </View>
        )}
        {/* Booking info */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <MaterialIcon name="receipt" size={16} color={BRAND} />
            <Text style={s.cardTitle}>Booking Details</Text>
          </View>
          <View style={s.divider} />
          <Row icon="hash"       label="Booking ID" value={`#${bookingId}`} />
          <Row icon="tag"        label="Service"    value={subService} />
     
        </View>

        {/* Route */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <MaterialIcon name="map-marker-path" size={16} color={BRAND} />
            <Text style={s.cardTitle}>Trip Route</Text>
          </View>
          <View style={s.divider} />
          <View style={s.routeBlock}>
            <View style={s.routeTrack}>
              <View style={s.dotGreen} />
              <View style={s.trackLine} />
              <View style={s.dotRed} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.routeLabel}>Pickup</Text>
              <Text style={s.routeValue}>{pickup}</Text>
              <View style={{ height: 14 }} />
              <Text style={s.routeLabel}>Drop-off</Text>
              <Text style={s.routeValue}>{drop}</Text>
            </View>
          </View>
          {actualDist ? (
            <View style={s.distChip}>
              <Icon name="map" size={13} color={BRAND} />
              <Text style={s.distText}>
                Distance: <Text style={{ fontWeight: '700', color: TEXT }}>{Math.ceil(actualDist)} km</Text>
              </Text>
            </View>
          ) : null}
        </View>

        {/* Fare */}
        {(actualFare || iCollect) ? (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <MaterialIcon name="currency-inr" size={16} color={BRAND} />
              <Text style={s.cardTitle}>Fare Breakdown</Text>
            </View>
            <View style={s.divider} />
            {actualFare ? <Row icon="dollar-sign" label="
            Fare" value={`₹${actualFare}`} /> : null}
            {iCollect ? (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Amount to Pay</Text>
                <Text style={s.totalValue}>₹{iCollect}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Payment buttons — only before paying */}
       

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
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
  scroll: { paddingHorizontal: 16, paddingTop: 20 },

  statusCard: {
    backgroundColor: WHITE, borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 14,
    borderWidth: 1, borderColor: '#FEF3C7',
    elevation: 2,
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFFBEB', justifyContent: 'center', alignItems: 'center',
    marginBottom: 14, borderWidth: 2, borderColor: '#FDE68A',
  },
  statusTitle: { fontSize: 20, fontWeight: '800', color: TEXT, marginBottom: 6 },
  statusSub:   { fontSize: 13, color: SUBTLE, textAlign: 'center', lineHeight: 19, marginBottom: 16 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFFBEB', paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: '#FDE68A',
  },
  pulseDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: AMBER },
  badgeText: { fontSize: 11, fontWeight: '800', color: AMBER, letterSpacing: 0.8 },

  card: {
    backgroundColor: WHITE, borderRadius: 16, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: BORDER,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle:  { fontSize: 14, fontWeight: '700', color: TEXT },
  divider:    { height: 1, backgroundColor: BORDER, marginBottom: 14 },

  row:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  rowLabel: { flex: 1, fontSize: 13, color: SUBTLE },
  rowValue: { fontSize: 13, fontWeight: '600', color: TEXT, textAlign: 'right', maxWidth: '55%' },
  callRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },

  routeBlock: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  routeTrack: { alignItems: 'center', paddingTop: 4, width: 16 },
  dotGreen:   { width: 12, height: 12, borderRadius: 6, backgroundColor: GREEN, borderWidth: 2, borderColor: '#BBF7D0' },
  trackLine:  { width: 2, flex: 1, backgroundColor: BORDER, marginVertical: 3 },
  dotRed:     { width: 12, height: 12, borderRadius: 6, backgroundColor: '#DC2626', borderWidth: 2, borderColor: '#FECACA' },
  routeLabel: { fontSize: 10, color: SUBTLE, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  routeValue: { fontSize: 13, color: TEXT, fontWeight: '500', lineHeight: 18 },
  distChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FDF2F8', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, borderColor: '#FBCFE8', alignSelf: 'flex-start',
  },
  distText: { fontSize: 12, color: SUBTLE },

  totalRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: BORDER,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: TEXT },
  totalValue: { fontSize: 22, fontWeight: '800', color: BRAND },

  payButtons: { gap: 12 },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 16, paddingVertical: 18, elevation: 3,
  },
  cashBtn:   { backgroundColor: GREEN },
  onlineBtn: { backgroundColor: BRAND },
  payBtnText:{ color: WHITE, fontSize: 16, fontWeight: '800' },
});

export default InCityUserInvoiceScreen;
