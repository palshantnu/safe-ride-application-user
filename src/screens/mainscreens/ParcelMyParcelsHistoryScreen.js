import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import RazorpayCheckout from 'react-native-razorpay';
import { useDispatch, useSelector } from 'react-redux';

import CurvedHeader from '../../components/CurvedHeader';
import {
  GET_MY_PARCELS,
  PAY_PARCEL_TOKEN,
  PAY_PARCEL_BALANCE,
  CANCEL_PARCEL_BOOKING,
} from '../../redux/actions/action-creator';


const EmptyState = ({ navigation }) => (
  <View style={styles.emptyContainer}>
    <FontAwesome5 name="inbox" size={52} color="#DDD" />
    <Text style={styles.emptyTitle}>No Parcels Found</Text>
    <Text style={styles.emptyText}>Your parcel history will appear here.</Text>
    <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
      <Text style={styles.goBackText}>Go Back</Text>
    </TouchableOpacity>
  </View>
);

const ParcelMyParcelsHistoryScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [parcels, setParcels] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const openImage = (image) => {
    setSelectedImage(image);
    setImageModalVisible(true);
  };

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentType, setPaymentType] = useState(null); // 'token' or 'balance'
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedParcelIdForCancel, setSelectedParcelIdForCancel] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(true);

  const fetchMyParcels = async ({ loadMore = false } = {}) => {
    try {
      if (!loadMore) {
        setIsLoading(true);
        setPage(1);
        setHasMore(true);
      } else {
        setIsLoadingMore(true);
      }

      const nextPage = loadMore ? page : 1;
      const res = await dispatch(GET_MY_PARCELS(nextPage, limit));
console.log('GET_MY_PARCELS response', res);
      const list = Array.isArray(res?.data) ? res.data : [];
      const pagination = res?.pagination || {};
      const totalPages = pagination?.total_pages;

      setParcels((prev) => (loadMore ? [...prev, ...list] : list));

      if (typeof totalPages === 'number') {
        setHasMore(nextPage < totalPages && list.length > 0);
      } else {
        setHasMore(list.length === limit);
      }

      if (!loadMore) {
        setPage(1);
      } else {
        setPage(nextPage + 1);
      }
    } catch (e) {
      console.log('GET_MY_PARCELS error', e);
      setParcels([]);
      Alert.alert('Error', 'Failed to fetch parcel history');
      setHasMore(false);
    } finally {
      if (!loadMore) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    fetchMyParcels();
    setInterval(() => {
      fetchMyParcels();
    }, 5000);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyParcels();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore && !isLoading) {
      fetchMyParcels({ loadMore: true });
    }
  };

  const getStatusText = (status) => {
    const s = (status || '').toString().toLowerCase();
    if (!s) return 'Processing';
    if (s.includes('cancel')) return 'Cancelled';
    if (s.includes('complete') || s.includes('delivered')) return 'Delivered';
    if (s.includes('pending') || s.includes('search')) return 'Pending';
    if (s === 'accepted') return 'Accepted';
    if (s === 'arrived') return 'Arrived';
    if (s === 'picked_up') return 'Picked Up';
    return status;
  };

  const getStatusColor = (status) => {
    const s = (status || '').toString().toLowerCase();
    if (s.includes('cancel')) return '#F44336';
    if (s.includes('complete') || s.includes('delivered')) return '#4CAF50';
    if (s.includes('pending') || s.includes('search')) return '#FF9800';
    if (s === 'accepted') return '#2196F3';
    if (s === 'arrived') return '#00BCD4';
    if (s === 'picked_up') return '#9C27B0';
    return '#757575';
  };

  const formatDateTime = (date, time) => {
    if (!date) return '-';

    const d = new Date(date);
    const formattedDate = d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    let formattedTime = '';

    if (time) {
      const [hours, minutes] = time.split(':');
      const t = new Date();
      t.setHours(parseInt(hours, 10));
      t.setMinutes(parseInt(minutes, 10));
      formattedTime = t.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }

    return `${formattedDate}${formattedTime ? ` • ${formattedTime}` : ''}`;
  };

  // Open Razorpay payment gateway
  const openRazorpay = (amount, orderId, onSuccess, onFailure) => {
    const options = {
      description: 'Parcel Payment',
      currency: 'INR',
      key: 'rzp_test_DUnz7sPsonIW95', // Replace with your actual Razorpay key
      amount: Math.round(amount * 100),
      name: 'SIGIRIDE',
      prefill: {
        name: user?.name || '',
        contact: user?.mobile || '',
        email: user?.email || '',
      },
      theme: { color: '#FF1493' },
    };

    // If order_id is provided, add it to options
    if (orderId) {
      options.order_id = orderId;
    }

    RazorpayCheckout.open(options)
      .then((data) => {
        console.log('Payment success:', data);
        onSuccess(data);
      })
      .catch((error) => {
        console.log('Payment error:', error);
        if (error.code === 'PAYMENT_CANCELLED') {
          onFailure('Payment was cancelled');
        } else {
          onFailure(error.description || 'Payment failed');
        }
      });
  };

  const runOnlinePaymentGateway = (amount) => {
  return new Promise((resolve, reject) => {
    const options = {
      description: 'Parcel Payment',
      currency: 'INR',
      key: 'rzp_test_DUnz7sPsonIW95', // Your Razorpay Key
      amount: Math.round(Number(amount) * 100), // paise
      name: 'SIGIRIDE',

      prefill: {
        name: user?.name || '',
        contact: user?.mobile || '',
        email: user?.email || '',
      },

      theme: {
        color: '#FF1493',
      },
    };

    RazorpayCheckout.open(options)
      .then((data) => {
        console.log('Razorpay Success =>', data);

        resolve({
          success: true,
          data: {
            razorpay_payment_id: data?.razorpay_payment_id,
            razorpay_order_id: data?.razorpay_order_id,
            razorpay_signature: data?.razorpay_signature,
          },
        });
      })
      .catch((error) => {
        console.log('Razorpay Error =>', error);

        reject({
          cancelled:
            error?.code === 'PAYMENT_CANCELLED' ||
            error?.description === 'Payment Cancelled',
          message: error?.description || 'Payment Failed',
        });
      });
  });
};

  // Handle Token Payment - Payment Gateway first, then API
// Add paymentType set karne ka logic missing hai - yeh add karein:

// Handle Token Payment mein setPaymentType add karein
const handlePayToken = async (parcel) => {
  if (processingPayment) {
    Alert.alert('Please wait', 'Payment is already in progress');
    return;
  }
  
  console.log('Initiating token payment for parcel:', parcel);
  setProcessingPayment(true);
  setPaymentType('token'); // <-- YEH ADD KAREIN

  try {
    const amount = parseFloat(parcel?.token_amount || parcel?.amount || 0);

    const paymentResult = await runOnlinePaymentGateway(amount);

    if (paymentResult?.success) {
      const res = await dispatch(
        PAY_PARCEL_TOKEN({
          parcel_booking_id: parcel?.parcel_booking_id,
          razorpay_payment_id: paymentResult?.data?.razorpay_payment_id || '',
          razorpay_order_id: paymentResult?.data?.razorpay_order_id || '',
          razorpay_signature: paymentResult?.data?.razorpay_signature || '',
        }),
      );

      if (res?.status) {
        Alert.alert('Success', 'Token payment successful!');
        await fetchMyParcels();
      } else {
        Alert.alert('Error', res?.message || 'Failed to update payment status');
      }
    }
  } catch (e) {
    if (e?.cancelled) {
      Alert.alert('Payment Cancelled', e.message);
    } else {
      Alert.alert('Payment Error', e?.message || 'Something went wrong');
    }
  } finally {
    setProcessingPayment(false);
    setPaymentType(null); // <-- YEH ADD KAREIN
  }
};

// Handle Balance Payment mein bhi setPaymentType add karein
  const handlePayBalance = async ({ parcel, paymentMode }) => {
  if (processingPayment) {
    Alert.alert('Please wait', 'Payment is already in progress');
    return;
  }

  setProcessingPayment(true);
  setPaymentType('balance'); // <-- YEH ADD KAREIN

  try {
    if (paymentMode === 'ONLINE') {
      const amount = parseFloat(parcel?.balance_amount || parcel?.amount || 0);

      const paymentResult = await runOnlinePaymentGateway(amount);

      if (paymentResult?.success) {
        const res = await dispatch(
          PAY_PARCEL_BALANCE({
            parcel_booking_id: parcel?.parcel_booking_id,
            payment_mode: 'ONLINE',
            razorpay_payment_id: paymentResult?.data?.razorpay_payment_id || '',
            razorpay_order_id: paymentResult?.data?.razorpay_order_id || '',
            razorpay_signature: paymentResult?.data?.razorpay_signature || '',
          }),
        );

        if (res?.status) {
          Alert.alert('Success', 'Balance payment successful!');
          await fetchMyParcels();
        } else {
          Alert.alert('Error', res?.message || 'Failed to update payment status');
        }
      }
    } else {
      // CASH PAYMENT
      const res = await dispatch(
        PAY_PARCEL_BALANCE({
          parcel_booking_id: parcel?.parcel_booking_id,
          payment_mode: 'CASH',
        }),
      );

      if (res?.status) {
        Alert.alert('Success', 'Cash payment recorded successfully');
        await fetchMyParcels();
      } else {
        Alert.alert('Error', res?.message || 'Failed to record cash payment');
      }
    }
  } catch (e) {
    if (e?.cancelled) {
      Alert.alert('Payment Cancelled', e.message);
    } else {
      Alert.alert('Payment Error', e?.message || 'Something went wrong');
    }
  } finally {
    setProcessingPayment(false);
    setPaymentType(null); // <-- YEH ADD KAREIN
  }
};

const handleCancelParcel = (parcel) => {
  const parcelBookingId = parcel?.parcel_booking_id || parcel?.id;
  setSelectedParcelIdForCancel(parcelBookingId);
  setCancelReason('');
  setShowCancelModal(true);
};

const submitCancelParcel = async () => {
  if (!cancelReason.trim()) {
    Alert.alert('Error', 'Please enter reason');
    return;
  }
  try {
    setProcessingPayment(true);
    const res = await dispatch(
      CANCEL_PARCEL_BOOKING({
        parcel_booking_id: selectedParcelIdForCancel,
        cancel_reason: cancelReason.trim(),
      }),
    );

    if (res?.status) {
      setShowCancelModal(false);
      Alert.alert(
        'Success',
        'Parcel booking cancelled',
      );
      await fetchMyParcels();
    } else {
      Alert.alert(
        'Error',
        res?.message || 'Cancel failed',
      );
    }
  } catch (e) {
    Alert.alert(
      'Error',
      e?.message || 'Cancel failed',
    );
  } finally {
    setProcessingPayment(false);
  }
};

  const renderParcelCard = ({ item }) => {

    const status = item?.status || item?.parcel_status || item?.driver_status;

    const statusLower = (status || '').toString().toLowerCase();
    console.log('statusLower',statusLower);
    
    const isCancelled = statusLower.includes('cancelled') || statusLower.includes('cancel');
    const isDelivered = statusLower.includes('delivered') || statusLower.includes('complete');
console.log('isDelivered', isDelivered,'isCancelled',isCancelled);
    const user_status = item?.user_status || item?.user_status || item?.user_status;
    const pickup = item?.pickup_address || item?.pickup_city;
    const drop = item?.drop_address || item?.drop_city;
    const weight = item?.approx_weight ?? item?.weight;
    const balance_paid = item?.balance_paid;
console.log('parcel_booking_id', item?.parcel_booking_id,'user_status', user_status,'balance_paid', balance_paid);
    const showPayToken = user_status != 'TOKEN_PAID' && statusLower != 'pending';
    const showPayBalance =  balance_paid == 0  && user_status == 'TOKEN_PAID' && statusLower != 'pending';
    const pickup_otp_verified = pickup_otp_verified == 0;

    const tokenAmount = parseFloat(item?.token_amount || item?.amount || 0);
    const balanceAmount = parseFloat(item?.balance_amount || item?.amount || 0);
    const totalAmount = parseFloat(item?.amount || 0);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.idContainer}>
            <Text style={styles.idText}>ID: {item?.parcel_booking_id || item?.id || '-'}</Text>
            <Text style={styles.subText}>{formatDateTime(item?.pickup_date, item?.pickup_time)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.statusText}>{getStatusText(status)}</Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <View style={styles.routeCol}>
            <View style={styles.pickupDot} />
            <Text style={styles.routeLabel}>Pickup</Text>
            <Text style={styles.routeValue} numberOfLines={2}>
              {pickup || '-'}
            </Text>
            {item?.pickup_landmark ? (
              <Text style={styles.landmarkText}>📍 {item.pickup_landmark}</Text>
            ) : null}
          </View>

          <View style={styles.routeLine} />

          <View style={styles.routeCol}>
            <View style={styles.dropDot} />
            <Text style={styles.routeLabel}>Drop</Text>
            <Text style={styles.routeValue} numberOfLines={2}>
              {drop || '-'}
            </Text>
            {item?.drop_landmark ? (
              <Text style={styles.landmarkText}>📍 {item.drop_landmark}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <FontAwesome5 name="user" size={12} color="#666" />
            <Text style={styles.detailText}>Receiver: {item?.receiver_name || '-'}</Text>
          </View>
          {/* <View style={styles.detailItem}>
            <Icon name="call-outline" size={12} color="#666" />
            <Text style={styles.detailText}>{item?.receiver_mobile || '-'}</Text>
          </View> */}
        </View>

        <View style={styles.footerRow}>
          <View style={styles.footerItem}>
            <FontAwesome5 name="weight-hanging" size={14} color="#666" />
            <Text style={styles.footerText}>{weight ? `${weight} ${item?.weight_type || 'kg'}` : '—'}</Text>
          </View>

          <View style={styles.footerItem}>
            <Icon name="cube-outline" size={14} color="#666" />
            <Text style={styles.footerText}>{item?.packaging_material_type || '—'}</Text>
          </View>

          <View style={styles.footerItem}>
            <Icon name="people-outline" size={14} color="#666" />
            <Text style={styles.footerText}>{item?.loading_unloading || '—'}</Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>₹{totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Token Amount</Text>
            <Text style={styles.tokenAmount}>₹{tokenAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Balance</Text>
            <Text style={styles.balanceAmount}>₹{balanceAmount.toFixed(2)}</Text>
          </View>
        </View>
{(!isDelivered && !isCancelled) &&  <>
        {(showPayToken || showPayBalance) && (
          <View style={styles.actionBlock}>
            {showPayToken && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handlePayToken(item)}
                activeOpacity={0.9}
                disabled={processingPayment}
              >
                <LinearGradient 
                  colors={processingPayment && paymentType === 'token' ? ['#cccccc', '#cccccc'] : ['#FF1493', '#FF69B4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionGradient}
                >
                  {processingPayment && paymentType === 'token' ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <FontAwesome5 name="rupee-sign" size={16} color="#fff" />
                      <Text style={styles.actionText}>Pay Token Amount (₹{tokenAmount.toFixed(2)})</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {showPayBalance && status =='pickup_reached' && (
              <View>
                <Text style={styles.payBalanceTitle}>Pay Balance (₹{balanceAmount.toFixed(2)})</Text>
                <View style={styles.payOptionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.payOption,
                      styles.payOptionOnline,
                      { flexDirection: 'column', paddingVertical: 8 }
                    ]}
                    onPress={() => handlePayBalance({ parcel: item, paymentMode: 'ONLINE' })}
                    activeOpacity={0.9}
                    disabled={processingPayment}
                  >
                    {processingPayment && paymentType === 'balance' ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.payOptionText}>Pay to Sigi</Text>
                        <Text style={{ fontSize: 10, color: '#fff', opacity: 0.8, marginTop: 2, fontWeight: '500' }}>only Online</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.payOption,
                      styles.payOptionCash,
                      { flexDirection: 'column', paddingVertical: 8 }
                    ]}
                    onPress={() => handlePayBalance({ parcel: item, paymentMode: 'CASH' })}
                    activeOpacity={0.9}
                    disabled={processingPayment}
                  >
                    <Text style={styles.payOptionText}>Pay to Captain</Text>
                    <Text style={{ fontSize: 10, color: '#fff', opacity: 0.8, marginTop: 2, fontWeight: '500' }}>Cash/Online</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
           
          </View>
        )}
 </>}
        {(!isDelivered && !isCancelled) && (
          <View style={styles.actionBlock}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelParcel(item)}
              activeOpacity={0.9}
              disabled={processingPayment}
            >
              <LinearGradient
                colors={['#F44336', '#FF7961']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cancelGradient}
              >
                {processingPayment && paymentType === 'cancel' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="close-circle-outline" size={18} color="#fff" />
                    <Text style={styles.cancelText}>Cancel Parcel</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

{(!isDelivered && !isCancelled) && (status =='pickup_reached' || status == 'picked_up') && item.balance_paid == 1 && 
<>
{item?.pickup_otp_verified == 0 ? (
          <View style={styles.remarksContainer}>
            
            <Text style={{...styles.remarksText,fontSize:22}}>Pickup OTP : {item.pickup_otp}</Text>
          </View>
        ) :  <View style={styles.remarksContainer}>
            
            <Text style={{...styles.remarksText,fontSize:22}}>Delivery OTP : {item.delivery_otp}</Text>
          </View>}
</>}
        

        {item?.remarks ? (
          <View style={styles.remarksContainer}>
            <Icon name="chatbubble-outline" size={12} color="#FF9800" />
            <Text style={styles.remarksText}>{item.remarks}</Text>
          </View>
        ) : null}

        {(item?.pickup_image || item?.delivery_image) ? (
          <View style={styles.imagesRowContainer}>
            {item?.pickup_image ? (
              <View style={styles.imageCol}>
                <Text style={styles.imageColLabel}>Pickup Image</Text>
                <TouchableOpacity onPress={() => openImage(`https://sigiride.com/uploads/parcel_images/${item.pickup_image}`)}>
                  <Image
                    source={{ uri: `https://sigiride.com/uploads/parcel_images/${item.pickup_image}` }}
                    style={styles.parcelThumbnail}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </View>
            ) : null}
            {item?.delivery_image ? (
              <View style={styles.imageCol}>
                <Text style={styles.imageColLabel}>Delivery Image</Text>
                <TouchableOpacity onPress={() => openImage(`https://sigiride.com/uploads/parcel_images/${item.delivery_image}`)}>
                  <Image
                    source={{ uri: `https://sigiride.com/uploads/parcel_images/${item.delivery_image}` }}
                    style={styles.parcelThumbnail}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    );
  };

  if (isLoading && parcels.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#ff7f50" />
        <CurvedHeader title="My Parcels" navigation={navigation} showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF1493" />
          <Text style={styles.loadingText}>Loading parcels...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ff7f50" />
      <CurvedHeader title="My Parcels" navigation={navigation} showBack />

      <FlatList
        data={parcels}
        keyExtractor={(item, idx) => (item?.id ?? idx).toString()}
        renderItem={renderParcelCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<EmptyState navigation={navigation} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF1493']}
            tintColor="#FF1493"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={isLoadingMore ? (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator size="small" color="#FF1493" />
          </View>
        ) : null}
      />

      <Modal visible={showCancelModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Parcel</Text>
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
                onPress={submitCancelParcel}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity
            style={styles.imageViewerCloseBtn}
            onPress={() => setImageModalVisible(false)}
          >
            <Icon name="close" size={30} color="#fff" />
          </TouchableOpacity>

          <Image
            source={{ uri: selectedImage }}
            style={styles.imageViewerFullImage}
            resizeMode="contain"
          />
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
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    paddingTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  idContainer: {
    flex: 1,
  },
  idText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  subText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeCol: {
    flex: 1,
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
    marginHorizontal: 10,
    marginTop: 4,
  },
  routeLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
  },
  routeValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    lineHeight: 18,
  },
  landmarkText: {
    fontSize: 11,
    color: '#FF9800',
    marginTop: 2,
  },

  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 11,
    color: '#666',
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },

  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  amountItem: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 10,
    color: '#999',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  tokenAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9800',
    marginTop: 2,
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 2,
  },

  actionBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    marginTop: 4,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  cancelButton: {
    marginTop: 4,
  },
  cancelGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  cancelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  payBalanceTitle: {

    fontSize: 13,
    fontWeight: '700',
    color: '#FF1493',
    marginBottom: 10,
  },
  payOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  payOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payOptionOnline: {
    backgroundColor: '#2196F3',
  },
  payOptionCash: {
    backgroundColor: '#4CAF50',
  },
  payOptionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },

  remarksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  remarksText: {
    flex: 1,
    fontSize: 11,
    color: '#FF9800',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  goBackBtn: {
    marginTop: 18,
    backgroundColor: '#FF1493',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  goBackText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
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
  imagesRowContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  imageCol: {
    flex: 1,
  },
  imageColLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  parcelThumbnail: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerFullImage: {
    width: '100%',
    height: '85%',
  },
  imageViewerCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
});

export default ParcelMyParcelsHistoryScreen;