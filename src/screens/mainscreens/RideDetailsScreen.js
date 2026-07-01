import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import CurvedHeader from '../../components/CurvedHeader';

const RideDetailsScreen = ({ route, navigation }) => {
  const { ride } = route.params;
  console.log('ride', ride);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatPrice = (price) => {
    return `₹${parseFloat(price || 0).toFixed(2)}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'completed': '#4CAF50',
      'cancelled': '#F44336',
      'searching': '#FF9800',
      'accepted': '#2196F3',
      'started': '#FF5722'
    };
    return colors[status] || '#757575';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'completed': 'checkmark-circle',
      'cancelled': 'close-circle',
      'searching': 'time-outline',
      'accepted': 'car-outline',
      'started': 'car-sport-outline'
    };
    return icons[status] || 'help-circle-outline';
  };

  const getStatusText = (status) => {
    const texts = {
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'searching': 'Searching',
      'accepted': 'Accepted',
      'started': 'Started'
    };
    return texts[status] || status;
  };

  const handleShare = async () => {
    try {
      const vehicleInfoStr = ride.isInCity
        ? `${ride.vehicle_model || ''} (${ride.vehicle_number || ''})`
        : (ride.vehicle?.name || '');
      await Share.share({
        message: `Ride Details:\nBooking ID: ${ride.booking_id}\nFrom: ${ride.pickup}\nTo: ${ride.destination}\nDate: ${formatDate(ride.date)}\nTime: ${formatTime(ride.date)}\nVehicle: ${vehicleInfoStr}\nBase Fare: ${formatPrice(ride.isInCity ? ride.price : ride.basePrice)}\nTopup Amount: ${formatPrice(ride.topupAmount)}\nTotal: ${formatPrice(ride.price)}\nDriver: ${ride.driverName}\nMobile: ${ride.driverMobile}`,
        title: 'Ride Details',
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share ride details');
    }
  };

  const handleCallDriver = () => {
    if (ride.driverMobile && ride.driverMobile !== 'N/A') {
      Alert.alert(
        'Call Driver',
        `Would you like to call ${ride.driverName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Call', onPress: () => Linking.openURL(`tel:${ride.driverMobile}`) },
        ]
      );
    } else {
      Alert.alert('Error', 'Driver contact information not available');
    }
  };

  const handleCallSupport = () => {
    Alert.alert(
      'Contact Support',
      'Would you like to call support?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL('tel:+1234567890') },
      ]
    );
  };

  const handleRateRide = () => {
    if (ride.status === 'completed' && ride.rating === 0) {
      Alert.alert('Rate Your Ride', 'How was your experience?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Rate Now', onPress: () => {
            Alert.alert('Rate Ride', 'Rating functionality coming soon!');
          } 
        },
      ]);
    } else if (ride.rating > 0) {
      Alert.alert('Already Rated', `You rated this ride ${ride.rating} stars. Thank you!`);
    } else {
      Alert.alert('Cannot Rate', 'This ride was cancelled or not completed');
    }
  };

  const handleViewReceipt = () => {
    Alert.alert('Receipt', 'Download receipt functionality will be implemented soon.');
  };

  const renderTopups = () => {
    if (!ride.topups || ride.topups.length === 0) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="rupee-sign" size={18} color="#FF1493" />
          <Text style={styles.cardTitle}>Topup Details</Text>
        </View>
        {ride.topups.map((topup, index) => (
          <View key={index} style={styles.topupItem}>
            <View style={styles.topupHeader}>
              <Text style={styles.topupAmount}>+₹{topup.topup_amount}</Text>
              <View style={styles.topupStatus}>
                <Icon name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.topupStatusText}>PAID</Text>
              </View>
            </View>
            <Text style={styles.topupDetail}>Extra KM: {topup.extra_km} km</Text>
            <Text style={styles.topupDetail}>Reason: {topup.reason}</Text>
            <Text style={styles.topupDetail}>Rate per KM: ₹{topup.price_per_km}</Text>
            <Text style={styles.topupDate}>
              Added on: {new Date(topup.created_at).toLocaleString()}
            </Text>
            {topup.topup_otp && (
              <View style={styles.otpContainer}>
                <Text style={styles.otpLabel}>Verification OTP</Text>
                <Text style={styles.otpValue}>{topup.topup_otp}</Text>
              </View>
            )}
            {index < ride.topups.length - 1 && <View style={styles.topupDivider} />}
          </View>
        ))}
      </View>
    );
  };

  const renderMeterImages = () => {
    if (!ride.meter_images || ride.meter_images.length === 0) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="camera" size={18} color="#FF1493" />
          <Text style={styles.cardTitle}>Meter Images ({ride.meter_images.length})</Text>
        </View>
        <View style={styles.imageList}>
          {ride.meter_images.map((image, index) => (
            <View key={index} style={styles.imageItem}>
              <FontAwesome5 name="image" size={24} color="#FF1493" />
              <View style={styles.imageInfo}>
                <Text style={styles.imageType}>{image.image_type}</Text>
                <Text style={styles.imageDate}>
                  {new Date(image.created_at).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Status Banner */}
      <CurvedHeader
        title="Ride Details"
        navigation={navigation}
        showBack
        right={(
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Icon name="share-social" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      />

      {/* Status Badge */}
      <View style={[styles.statusBanner, { backgroundColor: getStatusColor(ride.status) }]}>
        <Icon name={getStatusIcon(ride.status)} size={20} color="#fff" />
        <Text style={styles.statusBannerText}>
          {getStatusText(ride.status)}
        </Text>
      </View>

      {/* Booking ID Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome5 name="hashtag" size={18} color="#FF1493" />
          <Text style={styles.cardTitle}>Booking Information</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Booking ID:</Text>
          <Text style={styles.infoValue}>{ride.booking_id}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Booked On:</Text>
          <Text style={styles.infoValue}>{new Date(ride.created_at).toLocaleString()}</Text>
        </View>
      </View>

      {/* Date and Time Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="calendar" size={20} color="#FF1493" />
          <Text style={styles.cardTitle}>Trip Schedule</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="calendar-outline" size={18} color="#666" />
          <Text style={styles.infoText}>{formatDate(ride.date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Icon name="time-outline" size={18} color="#666" />
          <Text style={styles.infoText}>{formatTime(ride.date)}</Text>
        </View>
        {!ride.isInCity && ride.duration != null && (
          <View style={styles.infoRow}>
            <FontAwesome5 name="clock" size={16} color="#666" />
            <Text style={styles.infoText}>Duration: {ride.duration} hour{ride.duration > 1 ? 's' : ''}</Text>
          </View>
        )}
      </View>

      {/* Route Information */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="map" size={20} color="#FF1493" />
          <Text style={styles.cardTitle}>Route</Text>
        </View>
        
        <View style={styles.routeContainer}>
          <View style={styles.routePoint}>
            <View style={styles.pickupDot} />
            <View style={styles.routeLine} />
          </View>
          <View style={styles.routeDetails}>
            <Text style={styles.routeLabel}>Pickup Location</Text>
            <Text style={styles.routeAddress}>{ride.pickup}</Text>
          </View>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.routePoint}>
            <View style={styles.destinationDot} />
            {ride.service_name?.includes('Rental') && ride.to_city ? <View style={styles.routeLine} /> : null}
            {ride.service_name?.includes('Driver') && ride.to_city ? <View style={styles.routeLine} /> : null}
          </View>
          <View style={styles.routeDetails}>
            <Text style={styles.routeLabel}>Drop-off Location</Text>
            <Text style={styles.routeAddress}>{ride.destination}</Text>
          </View>
        </View>

        {ride.service_name?.includes('Rental') && ride.to_city ? (
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={styles.toCityDot} />
            </View>
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>To City</Text>
              <Text style={[styles.routeAddress, styles.toCityAddress]}>{ride.to_city}</Text>
            </View>
          </View>
        ) : null}
        {ride.service_name?.includes('Driver') && ride.to_city ? (
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={styles.toCityDot} />
            </View>
            <View style={styles.routeDetails}>
              <Text style={styles.routeLabel}>To City</Text>
              <Text style={[styles.routeAddress, styles.toCityAddress]}>{ride.to_city}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.distanceInfo}>
          <Icon name="navigate-outline" size={16} color="#999" />
          <Text style={styles.distanceText}>Distance: {ride.distance} km</Text>
          <View style={styles.passengerInfo}>
            <FontAwesome5 name="users" size={12} color="#999" />
            <Text style={styles.passengerText}>{ride.person} Passenger{ride.person > 1 ? 's' : ''}</Text>
          </View>
        </View>
      </View>

      {/* Vehicle Information */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="car" size={20} color="#FF1493" />
          <Text style={styles.cardTitle}>Vehicle Details</Text>
        </View>
        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleIconContainer}>
            <FontAwesome5 name="car-side" size={40} color="#FF1493" />
          </View>
          {ride.isInCity ? (
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleName}>{ride.vehicle_model || 'N/A'}</Text>
              <Text style={styles.vehicleType}>{ride.vehicle_type ? `Type: ${ride.vehicle_type}` : 'N/A'}</Text>
              <Text style={styles.vehicleSpecs}>
                {`Number: ${ride.vehicle_number || 'N/A'}${ride.vehicle_color ? ` • Color: ${ride.vehicle_color}` : ''}`}
              </Text>
            </View>
          ) : (
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleName}>{ride?.vehicle?.name}</Text>
              <Text style={styles.vehicleType}>{ride?.vehicle?.type}</Text>
              <Text style={styles.vehicleSpecs}>Plan: {ride?.duration} hour • {ride?.distance} km</Text>
            </View>
          )}
        </View>
      </View>

      {/* Driver Information */}
      {ride.driverName && <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="person" size={20} color="#FF1493" />
          <Text style={styles.cardTitle}>Driver Details</Text>
        </View>
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <FontAwesome5 name="user-circle" size={50} color="#FF1493" />
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{ride?.driverName}</Text>
            {/* <TouchableOpacity 
              style={styles.callButton}
              onPress={handleCallDriver}
            >
              <FontAwesome5 name="phone-alt" size={14} color="#4CAF50" />
              <Text style={styles.callButtonText}>{ride.driverMobile}</Text>
            </TouchableOpacity> */}
            {ride.rating > 0 && (
              <View style={styles.ratingContainer}>
                <Icon name="star" size={14} color="#FFD700" />
                <Text style={styles.ratingText}>{ride.rating}</Text>
                <Text style={styles.ratingLabel}>Rating</Text>
              </View>
            )}
          </View>
        </View>
      </View>}

      {/* Payment Information */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="card" size={20} color="#FF1493" />
          <Text style={styles.cardTitle}>Payment Details</Text>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>{ride.isInCity ? 'Ride Fare' : 'Base Fare'}</Text>
          <Text style={styles.paymentValue}>{formatPrice(ride.isInCity ? ride.price : ride.basePrice)}</Text>
        </View>
        {ride.topupAmount > 0 && (
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Extra Charges (Topups)</Text>
            <Text style={[styles.paymentValue, { color: '#FF9800' }]}>
              +{formatPrice(ride.topupAmount)}
            </Text>
          </View>
        )}
        <View style={styles.paymentDivider} />
        <View style={styles.paymentTotal}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>{formatPrice(ride.price)}</Text>
        </View>
        <Text style={styles.paymentMethod}>Paid via: Online Payment</Text>
      </View>

      {/* Topups Section */}
      {renderTopups()}

      {/* Meter Images Section */}
      {renderMeterImages()}

      {/* Action Buttons */}
  

      {/* Help Text */}
      <View style={styles.helpContainer}>
        <Icon name="information-circle-outline" size={16} color="#999" />
        <Text style={styles.helpText}>
          For any issues regarding this ride, please contact our support team.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  statusBannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 90,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  routePoint: {
    width: 30,
    alignItems: 'center',
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF1493',
    marginTop: 4,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginTop: 4,
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: '#ddd',
    marginVertical: 4,
  },
  toCityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#810a45',
    marginTop: 4,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  toCityAddress: {
    color: '#810a45',
    fontWeight: '600',
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  distanceText: {
    fontSize: 12,
    color: '#999',
  },
  passengerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  passengerText: {
    fontSize: 12,
    color: '#999',
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  vehicleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vehicleType: {
    fontSize: 14,
    color: '#666',
  },
  vehicleSpecs: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  callButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
  },
  ratingLabel: {
    fontSize: 12,
    color: '#999',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  paymentTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  paymentMethod: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  topupItem: {
    marginBottom: 12,
  },
  topupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topupAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  topupStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topupStatusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  topupDetail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  topupDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  topupDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  otpContainer: {
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  otpLabel: {
    fontSize: 11,
    color: '#FF9800',
    fontWeight: '600',
  },
  otpValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
    letterSpacing: 2,
    marginTop: 4,
  },
  imageList: {
    gap: 10,
  },
  imageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  imageInfo: {
    flex: 1,
  },
  imageType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  imageDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  rateButton: {
    backgroundColor: '#FFF3E0',
  },
  rateButtonText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '600',
  },
  receiptButton: {
    backgroundColor: '#FFF0F5',
  },
  receiptButtonText: {
    color: '#FF1493',
    fontSize: 14,
    fontWeight: '600',
  },
  supportButton: {
    backgroundColor: '#E8F5E9',
  },
  supportButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 20,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    gap: 8,
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});

export default RideDetailsScreen;
