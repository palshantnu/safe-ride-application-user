import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Feather';
import { useDispatch, useSelector } from 'react-redux';
import { CREATE_BOOKING, CLEAR_BOOKING_DATA, GET_SUB_SERVICES } from '../../redux/actions/action-creator';
import { IMAGE_URL } from '../../axios/axiosinstance';
import CurvedHeader from '../../components/CurvedHeader';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDbk7w0pvfAxvMsgGiCs3UMa_GTsAHTmgY';

const DEFAULT_REGION = {
  latitude: 28.6139,
  longitude: 77.2090,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const getVehicleIcon = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('scooter')) return 'wind';
  if (t.includes('bike')) return 'zap';
  if (t.includes('auto')) return 'navigation';
  if (t.includes('sedan')) return 'navigation';
  return 'truck';
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
};

const InCityScreen = ({ route, navigation }) => {
  const { service_id } = route.params;
  const dispatch = useDispatch();
  const { bookingLoading, bookingSuccess, bookingError, subServices, subServicesLoading } = useSelector((state) => state.common);

  const mapRef = useRef(null);
  const debounceRef = useRef(null);
  const [pickupText, setPickupText] = useState('');
  const [dropText, setDropText] = useState('');
  const [pickup, setPickup] = useState(null);
  const [drop, setDrop] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  useEffect(() => {
    dispatch(GET_SUB_SERVICES(service_id));
    return () => { dispatch(CLEAR_BOOKING_DATA()); };
  }, [dispatch, service_id]);

  useEffect(() => {
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
          const response = await fetch(url);
          const json = await response.json();
          if (json.status === 'OK' && json.results?.length) {
            const result = json.results[0];
            const components = result.address_components || [];
            const cityComp =
              components.find(c => c.types.includes('locality')) ||
              components.find(c => c.types.includes('administrative_area_level_2')) ||
              components.find(c => c.types.includes('administrative_area_level_1'));
            setPickup({
              latitude,
              longitude,
              address: result.formatted_address,
              name: result.formatted_address,
              city: cityComp?.long_name || '',
            });
            setPickupText(result.formatted_address);
          }
        } catch (_) {}
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    if (bookingSuccess) {
      Alert.alert('Success', 'Booking created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [bookingSuccess, navigation]);

  useEffect(() => {
    if (bookingError) {
      Alert.alert('Booking Failed', bookingError);
    }
  }, [bookingError]);

  const currentSearchText = activeField === 'pickup' ? pickupText : dropText;
  const canContinue = Boolean(pickup && drop);

  const markers = useMemo(() => [pickup, drop].filter(Boolean), [pickup, drop]);

  const searchPlaces = useCallback(async (text) => {
    if (!activeField) return;

    try {
      setSearching(true);
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_MAPS_API_KEY}&components=country:in`;
      const response = await fetch(url);
      const json = await response.json();
      setSuggestions(json.status === 'OK' ? json.predictions || [] : []);
    } catch (error) {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, [activeField]);

  useEffect(() => {
    if (!currentSearchText || currentSearchText.trim().length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchPlaces(currentSearchText), 450);
    return () => clearTimeout(debounceRef.current);
  }, [currentSearchText, searchPlaces]);

  useEffect(() => {
    if (markers.length === 1) {
      mapRef.current?.animateToRegion({
        latitude: markers[0].latitude,
        longitude: markers[0].longitude,
        latitudeDelta: 0.035,
        longitudeDelta: 0.035,
      });
    }

    if (markers.length === 2) {
      mapRef.current?.fitToCoordinates(markers, {
        edgePadding: { top: 170, right: 60, bottom: 270, left: 60 },
        animated: true,
      });
    }
  }, [markers]);

  const fetchPlaceDetails = async (placeId) => {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name,address_components&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const json = await response.json();

    if (json.status !== 'OK' || !json.result?.geometry?.location) {
      throw new Error('Place details not found');
    }

    return json.result;
  };

  const decodePolyline = (encoded) => {
    const points = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let result = 0;
      let shift = 0;
      let byte;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      result = 0;
      shift = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return points;
  };

  const fetchRoute = async (origin, destination) => {
    const originParam = `${origin.latitude},${origin.longitude}`;
    const destinationParam = `${destination.latitude},${destination.longitude}`;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originParam}&destination=${destinationParam}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const json = await response.json();

    if (json.status !== 'OK' || !json.routes?.length) {
      return [];
    }

    const overviewPolyline = json.routes[0].overview_polyline?.points;
    return overviewPolyline ? decodePolyline(overviewPolyline) : [];
  };

  useEffect(() => {
    let isMounted = true;
    const updateRoute = async () => {
      if (!pickup || !drop) {
        setRouteCoordinates([]);
        return;
      }

      try {
        const route = await fetchRoute(pickup, drop);
        if (isMounted) {
          setRouteCoordinates(route.length ? route : [pickup, drop]);
        }
      } catch (_) {
        if (isMounted) {
          setRouteCoordinates([pickup, drop]);
        }
      }
    };

    updateRoute();
    return () => {
      isMounted = false;
    };
  }, [pickup, drop]);

  const handleSelectPlace = async (item) => {
    try {
      const field = activeField;
      Keyboard.dismiss();
      setSearching(true);
      const details = await fetchPlaceDetails(item.place_id);
      const components = details.address_components || [];
      const cityComp =
        components.find(c => c.types.includes('locality')) ||
        components.find(c => c.types.includes('administrative_area_level_2')) ||
        components.find(c => c.types.includes('administrative_area_level_1'));
      const selectedPlace = {
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        address: details.formatted_address || item.description,
        name: details.name || item.structured_formatting?.main_text,
        city: cityComp?.long_name || details.name,
      };

      if (field === 'pickup') {
        setPickup(selectedPlace);
        setPickupText(item.description);
      } else {
        setDrop(selectedPlace);
        setDropText(item.description);
      }

      setActiveField(null);
      setSuggestions([]);
    } catch (error) {
      Alert.alert('Location Error', 'Please select the location again.');
    } finally {
      setSearching(false);
    }
  };

  const clearField = (field) => {
    if (field === 'pickup') {
      setPickupText('');
      setPickup(null);
    } else {
      setDropText('');
      setDrop(null);
    }

    setActiveField(field);
    setSuggestions([]);
  };

  const handleContinue = () => {
    if (!pickup || !drop || !selectedVehicle) return;
    const distance = haversineDistance(pickup.latitude, pickup.longitude, drop.latitude, drop.longitude);
    dispatch(CREATE_BOOKING({
      service_id,
      sub_service_id: selectedVehicle,
      pickup_city: pickup.city,
      drop_city: drop.city,
      pickup_address: pickup.address,
      drop_address: drop.address,
      pickup_lat: String(pickup.latitude),
      pickup_lng: String(pickup.longitude),
      drop_lat: String(drop.latitude),
      drop_lng: String(drop.longitude),
      distance,
      person: 2,
    }));
  };

  const renderInput = (field, label, value, setValue, icon) => (
    <View style={styles.inputBlock}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputRow, activeField === field && styles.inputRowActive]}>
        <Icon name={icon} size={18} color="#FF1493" />
        <TextInput
          value={value}
          onChangeText={(text) => {
            setValue(text);
            setActiveField(field);
            if (field === 'pickup') {
              setPickup(null);
            } else {
              setDrop(null);
            }
          }}
          onFocus={() => setActiveField(field)}
          placeholder={`Search ${label.toLowerCase()}`}
          placeholderTextColor="#999"
          style={styles.input}
          returnKeyType="search"
        />
        {!!value && (
          <TouchableOpacity onPress={() => clearField(field)} style={styles.clearBtn}>
            <Icon name="x" size={16} color="#777" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelectPlace(item)}>
      <Icon name="map-pin" size={18} color="#FF1493" />
      <View style={styles.suggestionTextWrap}>
        <Text style={styles.suggestionTitle} numberOfLines={1}>
          {item.structured_formatting?.main_text || item.description}
        </Text>
        <Text style={styles.suggestionSubtitle} numberOfLines={2}>
          {item.structured_formatting?.secondary_text || item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const tripDistance = useMemo(() => {
    if (!pickup || !drop) return 0;
    return haversineDistance(pickup.latitude, pickup.longitude, drop.latitude, drop.longitude);
  }, [pickup, drop]);

  const calculateFare = (vehicle) => {
    const fixed    = parseFloat(vehicle.fixed_charge || 0);
    const minKm    = parseFloat(vehicle.fixed_charge_km || 1);
    const perKm    = parseFloat(vehicle.charge_after_fixed_per_km || 0);
    if (!tripDistance || tripDistance <= minKm) return fixed;
    return fixed + (tripDistance - minKm) * perKm;
  };

  const renderVehicle = (vehicle) => {
    const isSelected = selectedVehicle === vehicle.id;
    const imageUri = vehicle.image
      ? `https://sigiride.com/uploads/subservice/${vehicle.image}`
      : null;
    const fare     = calculateFare(vehicle);
    const minKm    = parseFloat(vehicle.fixed_charge_km || 1);
    const fixed    = parseFloat(vehicle.fixed_charge || 0);

    return (
      <TouchableOpacity
        key={vehicle.id}
        style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
        onPress={() => setSelectedVehicle(vehicle.id)}
        activeOpacity={0.85}
      >
        {/* Left — icon/image */}
        <View style={[styles.vehicleIconWrap, isSelected && styles.vehicleIconWrapSelected]}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.vehicleImage} resizeMode="contain" />
          ) : (
            <Icon name={getVehicleIcon(vehicle.title)} size={24} color={isSelected ? '#fff' : '#FF1493'} />
          )}
        </View>


        <View style={styles.vehicleInfo}>
          <Text style={[styles.vehicleName, isSelected && styles.vehicleNameSelected]}>
            {vehicle.title.charAt(0).toUpperCase() + vehicle.title.slice(1)}
          </Text>
          {/* <Text style={styles.vehiclePriceNote}>
            ₹{fixed.toFixed(0)} upto {minKm} km • ₹{parseFloat(vehicle.charge_after_fixed_per_km || 0).toFixed(0)}/km after
          </Text> */}
          <Text style={styles.vehiclePriceNote}>
            {vehicle.description}
          </Text>
          
        </View>

        {/* Right — estimated fare */}
        <View style={styles.vehicleFareWrap}>
          <Text style={[styles.vehicleFare, isSelected && styles.vehicleFareSelected]}>
            ₹{fare.toFixed(0)}
          </Text>
          {tripDistance > 0 && (
            <Text style={styles.vehicleEst}>est.</Text>
          )}
        </View>

        {/* Selected check */}
        {isSelected && (
          <View style={styles.vehicleCheck}>
            <Icon name="check-circle" size={16} color="#FF1493" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ff7f50" barStyle="light-content" />
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        showsMyLocationButton
      >
        {pickup && <Marker coordinate={pickup} title="Pickup" description={pickup.address} pinColor="#22C55E" />}
        {drop && <Marker coordinate={drop} title="Drop" description={drop.address} pinColor="#EF4444" />}
        {pickup && drop && (
          <Polyline coordinates={routeCoordinates.length ? routeCoordinates : [pickup, drop]} strokeColor="#FF1493" strokeWidth={4} />
        )}
      </MapView>

      <View style={styles.topPanel}>
        <CurvedHeader title="In City" navigation={navigation} showBack />

        <View style={styles.searchCard}>
          {renderInput('pickup', 'Pickup Location', pickupText, setPickupText, 'radio')}
          <View style={styles.inputDivider} />
          {renderInput('drop', 'Drop Location', dropText, setDropText, 'map-pin')}
        </View>

        {(searching || suggestions.length > 0) && activeField && (
          <View style={styles.suggestionsCard}>
            {searching ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color="#FF1493" />
                <Text style={styles.loadingText}>Searching location...</Text>
              </View>
            ) : (
              <FlatList
                keyboardShouldPersistTaps="handled"
                data={suggestions}
                keyExtractor={item => item.place_id}
                renderItem={renderSuggestion}
                style={styles.suggestionsList}
              />
            )}
          </View>
        )}
      </View>

      {sheetOpen ? (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <TouchableOpacity
            style={styles.sheetHeader}
            onPress={() => setSheetOpen(false)}
            activeOpacity={0.85}
          >
            <View>
              <Text style={styles.sheetTitle}>Select Vehicle</Text>
              <Text style={styles.sheetSubtitle}>
                {canContinue
                  ? `${tripDistance} km · Estimated fare below`
                  : 'Add pickup and drop first'}
              </Text>
            </View>
            <Icon name="chevron-down" size={24} color="#FF1493" />
            {console.log('subServices',subServices)
            }
          </TouchableOpacity>
          {subServicesLoading ? (
            <ActivityIndicator color="#FF1493" style={{ marginVertical: 16 }} />
          ) : (
            <View style={styles.vehicleList}>{subServices.map(renderVehicle)}</View>
          )}
          <TouchableOpacity
            style={[styles.continueBtn, (!canContinue || !selectedVehicle || bookingLoading) && styles.continueBtnDisabled]}
            onPress={handleContinue}
            disabled={!canContinue || !selectedVehicle || bookingLoading}
            activeOpacity={0.85}
          >
            {bookingLoading
              ? <ActivityIndicator color="#fff" />
              : <><Text style={styles.continueText}>Continue</Text><Icon name="arrow-right" size={20} color="#fff" /></>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.collapsedSheet}>
          <TouchableOpacity
            style={styles.collapsedButton}
            onPress={() => setSheetOpen(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.collapsedButtonText}>Select Vehicle</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  topPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  searchCard: {
    marginHorizontal: 14,
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  inputBlock: {
    gap: 7,
  },
  inputLabel: {
    color: '#777',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  inputRow: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  inputRowActive: {
    borderColor: '#FF1493',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    fontWeight: '600',
    marginLeft: 10,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputDivider: {
    height: 10,
  },
  suggestionsCard: {
    marginHorizontal: 14,
    marginTop: 8,
    maxHeight: 230,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  suggestionsList: {
    maxHeight: 230,
  },
  suggestionItem: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  suggestionTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  suggestionTitle: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionSubtitle: {
    color: '#777',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 10,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 20,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    color: '#222',
    fontWeight: '800',
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  vehicleList: {
    gap: 10,
  },
  vehicleCard: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  vehicleCardSelected: {
    borderColor: '#FF1493',
    backgroundColor: '#FFF4FA',
    elevation: 3,
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  vehicleIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    // backgroundColor: '#FFF0F7',
    alignItems: 'center',
    justifyContent: 'center',
    // borderWidth: 1.5,
    // borderColor: '#FFD6EC',
  },
  vehicleIconWrapSelected: {
    // backgroundColor: '#FF1493',
    borderColor: '#FF1493',
  },
  vehicleImage: {
    width: 50,
    height: 50,
    borderRadius: 14,
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vehicleName: {
    fontSize: 15,
    color: '#222',
    fontWeight: '700',
  },
  vehicleNameSelected: {
    color: '#FF1493',
  },
  vehiclePriceNote: {
    fontSize: 11,
    color: '#999',
    marginTop: 3,
  },
  vehicleFareWrap: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  vehicleFare: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222',
  },
  vehicleFareSelected: {
    color: '#FF1493',
  },
  vehicleEst: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 1,
  },
  vehicleCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  continueBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FF1493',
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  continueBtnDisabled: {
    backgroundColor: '#CFCFCF',
  },
  collapsedSheet: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 18,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 20,
  },
  collapsedButton: {
    width: '100%',
  },
  collapsedButtonText: {
    color: '#FF1493',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default InCityScreen;
