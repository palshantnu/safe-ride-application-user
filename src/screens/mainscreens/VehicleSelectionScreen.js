// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Image,
//   TextInput,
//   Dimensions,
//   StatusBar,
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   FlatList,
//   Modal,
// } from 'react-native';
// import { useDispatch, useSelector } from 'react-redux';
// import Icon from 'react-native-vector-icons/Ionicons';
// import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
// import LinearGradient from 'react-native-linear-gradient';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import {
//   CREATE_BOOKING,
//   GET_PLANS,
//   GET_SUB_SERVICES,
//   CLEAR_BOOKING_DATA,
//   CREATE_ONSPOT_BOOKING,
// } from '../../redux/actions/action-creator';
// import { IMAGE_URL } from '../../axios/axiosinstance';
// import CurvedHeader from '../../components/CurvedHeader';
// import axios from 'axios';

// const { width } = Dimensions.get('window');

// const API_BASE_URL = 'https://sigiride.com';

// const VehicleSelectionScreen = ({ route, navigation }) => {
//   const { service_id, service_title } = route.params;

//   console.log('service_id', service_title);

//   const isRental = service_title?.toLowerCase() === 'rental' || service_title === 'Driver';
//   const dispatch = useDispatch();

//   const {
//     subServices,
//     subServicesLoading,
//     plans,
//     plansLoading,
//     bookingLoading,
//     bookingSuccess,
//     bookingError,
//   } = useSelector((state) => state.common);

//   const [selectedVehicle, setSelectedVehicle] = useState(null);
//   const [selectedPlan, setSelectedPlan] = useState(null);

//   // City data and selection states
//   const [cities, setCities] = useState([]);
//   const [filteredCities, setFilteredCities] = useState([]);
//   const [citiesLoading, setCitiesLoading] = useState(false);
//   const [citiesModalVisible, setCitiesModalVisible] = useState(false);
//   const [citySearchText, setCitySearchText] = useState('');
//   const [activeCityField, setActiveCityField] = useState(null); // 'pickup', 'drop', 'to'

//   const [pickupCity, setPickupCity] = useState('');
//   const [pickupCityId, setPickupCityId] = useState(null);
//   const [dropCity, setDropCity] = useState('');
//   const [dropCityId, setDropCityId] = useState(null);
//   const [toCity, setToCity] = useState('');
//   const [toCityId, setToCityId] = useState(null);

//   const [person, setPerson] = useState(1);
//   const [scheduleDate, setScheduleDate] = useState(new Date());
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [showTimePicker, setShowTimePicker] = useState(false);



// const isOnSpot = Number(service_id) === 77;

// const [city, setCity] = useState('');
// const [cityId, setCityId] = useState(null);

// const [fullAddress, setFullAddress] = useState('');
// const [landmark, setLandmark] = useState('');
// const [remarks, setRemarks] = useState('');

//   // Fetch cities on component mount
//   useEffect(() => {
//     fetchCities();
//   }, []);

//   // Fetch cities from API
//   const fetchCities = async () => {
//     setCitiesLoading(true);
//     try {
//       const response = await axios.get(`${API_BASE_URL}/api/cities`);
//       if (response.data?.status && response.data?.data) {
//         setCities(response.data.data);
//         setFilteredCities(response.data.data);
//       } else {
//         console.error('Failed to fetch cities:', response.data?.message);
//       }
//     } catch (error) {
//       console.error('Error fetching cities:', error);
//       Alert.alert('Error', 'Failed to load cities. Please check your internet connection.');
//     } finally {
//       setCitiesLoading(false);
//     }
//   };

//   // Filter cities based on search text
//   useEffect(() => {
//     if (citySearchText.trim() === '') {
//       setFilteredCities(cities);
//     } else {
//       const filtered = cities.filter(city =>
//         city.name.toLowerCase().includes(citySearchText.toLowerCase())
//       );
//       setFilteredCities(filtered);
//     }
//   }, [citySearchText, cities]);

//   // Open city selection modal
//   const openCitySelector = (fieldType) => {
//     setActiveCityField(fieldType);
//     setCitySearchText('');
//     setFilteredCities(cities);
//     setCitiesModalVisible(true);
//   };

//   // Handle city selection
//   const handleCitySelect = (city) => {
//     switch (activeCityField) {
//       case 'city':
//   setCity(city.name);
//   setCityId(city.id);
//   break;
//       case 'pickup':
//         setPickupCity(city.name);
//         setPickupCityId(city.id);
//         if (isRental) {
//           // For rental, set drop city same as pickup initially
//           setDropCity(city.name);
//           setDropCityId(city.id);
//         }
//         break;
//       case 'drop':
//         setDropCity(city.name);
//         setDropCityId(city.id);
//         break;
//       case 'to':
//         setToCity(city.name);
//         setToCityId(city.id);
//         break;
        
//       default:
//         break;
//     }
//     setCitiesModalVisible(false);
//     setActiveCityField(null);
//   };

//   const handlePickupCityChange = (text) => {
//     // For manual input, we don't have city ID
//     setPickupCity(text);
//     if (isRental) {
//       setDropCity(text);
//     }
//   };

//   useEffect(() => {
//     dispatch(GET_SUB_SERVICES(service_id));
//     return () => {
//       dispatch(CLEAR_BOOKING_DATA());
//     };
//   }, [dispatch, service_id]);

//   useEffect(() => {
//     if (bookingSuccess) {
//       Alert.alert('Success', 'Booking created successfully!', [
//         { text: 'OK', onPress: () => navigation.goBack() },
//       ]);
//     }
//   }, [bookingSuccess, navigation]);

//   useEffect(() => {
//     if (bookingError) {
//       Alert.alert('Booking Failed', bookingError);
//     }
//   }, [bookingError]);

//   const handleVehicleSelect = (vehicle) => {
//     console.log('vehicle-->', vehicle);
//     setSelectedVehicle(vehicle);
//     setSelectedPlan(null);
//     dispatch(GET_PLANS(service_id, vehicle.id));
//   };

//   const formatDateTime = (date) => {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     const hours = String(date.getHours()).padStart(2, '0');
//     const minutes = String(date.getMinutes()).padStart(2, '0');
//     const seconds = String(date.getSeconds()).padStart(2, '0');
//     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
//   };

//   const handleDateChange = (event, selectedDate) => {
//     setShowDatePicker(false);
//     if (selectedDate) {
//       const newDate = new Date(selectedDate);
//       newDate.setHours(scheduleDate.getHours());
//       newDate.setMinutes(scheduleDate.getMinutes());
//       setScheduleDate(newDate);
//     }
//   };

//   const handleTimeChange = (event, selectedTime) => {
//     setShowTimePicker(false);
//     if (selectedTime) {
//       const newDate = new Date(scheduleDate);
//       newDate.setHours(selectedTime.getHours());
//       newDate.setMinutes(selectedTime.getMinutes());
//       setScheduleDate(newDate);
//     }
//   };

//   const validateForm = () => {
//     if (isOnSpot) {

//   if (!selectedVehicle) {
//     Alert.alert('Validation Error', 'Please select service');
//     return false;
//   }

//   if (!city) {
//     Alert.alert('Validation Error', 'Please select city');
//     return false;
//   }

//   if (!selectedPlan) {
//     Alert.alert('Validation Error', 'Please select plan');
//     return false;
//   }

//   if (!fullAddress.trim()) {
//     Alert.alert('Validation Error', 'Please enter full address');
//     return false;
//   }

//   return true;
// }
//     if (!selectedVehicle) {
//       Alert.alert('Validation Error', 'Please select a vehicle');
//       return false;
//     }
//     if (!pickupCity.trim()) {
//       Alert.alert('Validation Error', 'Please enter pickup city');
//       return false;
//     }
//     if (!dropCity.trim()) {
//       Alert.alert('Validation Error', 'Please enter drop city');
//       return false;
//     }
//     if (!selectedPlan) {
//       Alert.alert('Validation Error', 'Please select a plan');
//       return false;
//     }
//     if (person < 1) {
//       Alert.alert('Validation Error', 'Please enter valid number of persons');
//       return false;
//     }
//     return true;
//   };

//   const handleSubmitBooking = () => {
//     if (!validateForm()) return;

//  if (isOnSpot) {

//     const bookingData = {
//       service_id,
//       sub_service_id: selectedVehicle.id,
//       plan_id: selectedPlan.id,
//       city,
//       schedule_datetime:
//         formatDateTime(scheduleDate),
//       full_address: fullAddress,
//       landmark,
//       remarks,
//     };

//     console.log(
//       'OnSpot Booking',
//       bookingData,
//     );

//     dispatch(
//       CREATE_ONSPOT_BOOKING(
//         bookingData,
//       ),
//     );

//     return;
//   }

//     const bookingData = {
//       service_id,
//       sub_service_id: selectedVehicle.id,
//       pickup_city: pickupCity,
//       drop_city: dropCity,
//       to_city: toCity,
//       person,
//       plan_id: selectedPlan.id,
//       schedule_date: formatDateTime(scheduleDate),
//     };
//     console.log('bookingData-->', bookingData);
//     dispatch(CREATE_BOOKING(bookingData));
//   };

//   const getVehicleIcon = (title) => {
//     const t = title?.toLowerCase() || '';
//     if (t.includes('scooter')) return 'bicycle-outline';
//     if (t.includes('bike')) return 'bicycle-outline';
//     if (t.includes('auto')) return 'car-sport-outline';
//     return 'car-outline';
//   };

//   // Group cities by state for better display
//   const getGroupedCities = () => {
//     const grouped = {};
//     filteredCities.forEach(city => {
//       const stateKey = city.state_name || 'Other';
//       if (!grouped[stateKey]) {
//         grouped[stateKey] = [];
//       }
//       grouped[stateKey].push(city);
//     });
//     return grouped;
//   };

//   const renderCityItem = ({ item }) => (
//     <TouchableOpacity
//       style={styles.cityItem}
//       onPress={() => handleCitySelect(item)}
//       activeOpacity={0.7}
//     >
//       <View style={styles.cityItemContent}>
//         <Icon name="location-outline" size={20} color="#FF1493" />
//         <View style={styles.cityTextContainer}>
//           <Text style={styles.cityName}>{item.name}</Text>
//           <Text style={styles.stateName}>{item.state_name}</Text>
//         </View>
//       </View>
//       <Icon name="chevron-forward-outline" size={18} color="#ccc" />
//     </TouchableOpacity>
//   );

//   const renderGroupedCity = (stateName, stateCities) => (
//     <View key={stateName}>
//       <View style={styles.stateHeader}>
//         <Text style={styles.stateHeaderText}>{stateName}</Text>
//       </View>
//       {stateCities.map(city => (
//         <TouchableOpacity
//           key={city.id}
//           style={styles.cityItem}
//           onPress={() => handleCitySelect(city)}
//           activeOpacity={0.7}
//         >
//           <View style={styles.cityItemContent}>
//             <Icon name="location-outline" size={20} color="#FF1493" />
//             <View style={styles.cityTextContainer}>
//               <Text style={styles.cityName}>{city.name}</Text>
//             </View>
//           </View>
//           <Icon name="chevron-forward-outline" size={18} color="#ccc" />
//         </TouchableOpacity>
//       ))}
//     </View>
//   );

//   const renderVehicleCard = ({ item }) => {
//     const isSelected = selectedVehicle?.id === item.id;
//     const imageUri = item.image
//       ? `https://sigiride.com/uploads/subservice/${item.image}`
//       : null;

//     return (
//       <TouchableOpacity
//         style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
//         onPress={() => handleVehicleSelect(item)}
//         activeOpacity={0.85}
//       >
//         <LinearGradient
//           colors={isSelected ? ['#FF1493', '#FF69B4'] : ['#fff', '#fff']}
//           style={styles.vehicleCardInner}
//         >
//           {imageUri ? (
//             <Image
//               source={{ uri: imageUri }}
//               style={styles.vehicleImage}
//               resizeMode="contain"
//             />
//           ) : (
//             <Icon
//               name={getVehicleIcon(item.title)}
//               size={36}
//               color={isSelected ? '#fff' : '#FF1493'}
//             />
//           )}
//           <Text style={[styles.vehicleTitle, isSelected && styles.vehicleTitleSelected]}>
//             {item.title}
//           </Text>
//           {isSelected && (
//             <View style={styles.vehicleCheckBadge}>
//               <Icon name="checkmark-circle" size={16} color="#4CAF50" />
//             </View>
//           )}
//         </LinearGradient>
//       </TouchableOpacity>
//     );
//   };

//   const renderPlanCard = (plan) => (
//     <TouchableOpacity
//       key={plan.id}
//       style={[styles.planCard, selectedPlan?.id === plan.id && styles.selectedPlanCard]}
//       onPress={() => setSelectedPlan(plan)}
//       activeOpacity={0.9}
//     >
//       <LinearGradient
//         colors={selectedPlan?.id === plan.id ? ['#FF1493', '#FF69B4'] : ['#fff', '#fff']}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 0 }}
//         style={styles.planCardContent}
//       >
//         <View style={styles.planImageContainer}>
//           <Image
//             source={{
//               uri: plan.image
//                 ? `https://sigiride.com/uploads/plan/${plan.image}`
//                 : 'https://cdn-icons-png.flaticon.com/128/809/809998.png',
//             }}
//             style={styles.planImage}
//             resizeMode="contain"
//           />
//         </View>

//         <View style={styles.planInfo}>
//           <View style={styles.planHeader}>
//             <Text style={[styles.planName, selectedPlan?.id === plan.id && styles.selectedText]}>
//               {plan.plan_name}
//             </Text>
//             <View style={styles.planDuration}>
//               <FontAwesome5
//                 name="clock"
//                 size={12}
//                 color={selectedPlan?.id === plan.id ? '#fff' : '#666'}
//               />
//               <Text style={[styles.durationText, selectedPlan?.id === plan.id && styles.selectedText]}>
//                 {plan.plan_hour}h
//               </Text>
//             </View>
//           </View>

//           <Text style={[styles.planDescription, selectedPlan?.id === plan.id && styles.selectedTextLight]}>
//             {plan.description !== 'NA' ? plan.description : `${plan.plan_hour} hours • ${plan.plan_km} km`}
//           </Text>

//           <View style={styles.featuresContainer}>
//             <View style={[styles.featureBadge2, selectedPlan?.id === plan.id && styles.featureBadge]}>
//               <Text style={styles.featureText}>{plan.plan_hour} hours</Text>
//             </View>
//             <View style={[styles.featureBadge2, selectedPlan?.id === plan.id && styles.featureBadge]}>
//               <Text style={styles.featureText}>{plan.plan_km} km</Text>
//             </View>
//             {plan.driver_amount > 0 && (
//               <View style={[styles.featureBadge2, selectedPlan?.id === plan.id && styles.featureBadge]}>
//                 <Text style={styles.featureText}>Driver included</Text>
//               </View>
//             )}
//           </View>

//           <View style={styles.planFooter}>
//             <Text style={[styles.priceText, selectedPlan?.id === plan.id && styles.selectedText]}>
//               ₹{parseInt(plan.plan_price).toLocaleString()}
//             </Text>
//             <Text style={[styles.totalLabel, selectedPlan?.id === plan.id && styles.selectedTextLight]}>
//               total
//             </Text>
//           </View>
//         </View>

//         {selectedPlan?.id === plan.id && (
//           <View style={styles.selectedBadge}>
//             <Icon name="checkmark-circle" size={24} color="#4CAF50" />
//           </View>
//         )}
//       </LinearGradient>
//     </TouchableOpacity>
//   );

//   if (subServicesLoading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <StatusBar barStyle="dark-content" backgroundColor="#fff" />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#FF1493" />
//           <Text style={styles.loadingText}>Loading vehicles...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#ff7f50" />

//       <CurvedHeader title="Pick your requirement" navigation={navigation} showBack />
// {isOnSpot && (
//         <TouchableOpacity
//           style={styles.onspotBookingsButton}
//           onPress={() => navigation.navigate('OnSpotBookings')}
//           activeOpacity={0.9}
//         >
//           <LinearGradient
//             colors={['#810a45', '#e20f7a']}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//             style={styles.onspotButtonGradient}
//           >
//             <Icon name="list-outline" size={22} color="#fff" />
//             <Text style={styles.onspotButtonText}>My OnSpot Bookings</Text>
//             <Icon name="arrow-forward-outline" size={20} color="#fff" />
//           </LinearGradient>
//         </TouchableOpacity>
//       )}
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={{ flex: 1 }}
//       >
//         <ScrollView
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.scrollContent}
//         >
//           {/* Vehicle Selection */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Choose your service and plan</Text>

//             {subServices && subServices.length > 0 ? (
//               <FlatList
//                 data={subServices}
//                 renderItem={renderVehicleCard}
//                 keyExtractor={(item) => item.id.toString()}
//                 showsHorizontalScrollIndicator={false}
//                 contentContainerStyle={styles.vehicleList}
//                 scrollEnabled={true}
//               />
//             ) : (
//               <View style={styles.emptyContainer}>
//                 <Text style={styles.emptyText}>No vehicles available</Text>
//               </View>
//             )}
//           </View>

//           {/* Trip Details Form — shown after vehicle selected */}
//           {selectedVehicle && (
//             <>
//               <View style={styles.section}>
//                 <Text style={styles.sectionTitle}> {isOnSpot?'Details':'Trip Details'}</Text>
// {isOnSpot ? (

// <View style={styles.formCard}>

//   {/* City */}

//   <TouchableOpacity
//     style={styles.inputGroup}
//     onPress={() => openCitySelector('city')}
//   >
//     <Icon
//       name="location-outline"
//       size={20}
//       color="#FF1493"
//     />

//     <Text
//       style={[
//         styles.inputText,
//         city
//           ? styles.inputTextSelected
//           : styles.inputTextPlaceholder,
//       ]}
//     >
//       {city || 'Select City'}
//     </Text>

//     <Icon
//       name="chevron-down-outline"
//       size={18}
//       color="#999"
//     />
//   </TouchableOpacity>

//   <View style={styles.divider} />

//   {/* Date */}

//   <TouchableOpacity
//     style={styles.inputGroup}
//     onPress={() => setShowDatePicker(true)}
//   >
//     <Icon
//       name="calendar-outline"
//       size={20}
//       color="#FF1493"
//     />

//     <Text style={styles.dateTimeText}>
//       {scheduleDate.toDateString()}
//     </Text>
//   </TouchableOpacity>

//   <View style={styles.divider} />

//   {/* Time */}

//   <TouchableOpacity
//     style={styles.inputGroup}
//     onPress={() => setShowTimePicker(true)}
//   >
//     <Icon
//       name="time-outline"
//       size={20}
//       color="#FF1493"
//     />

//     <Text style={styles.dateTimeText}>
//       {scheduleDate.toLocaleTimeString([], {
//         hour: '2-digit',
//         minute: '2-digit',
//       })}
//     </Text>
//   </TouchableOpacity>

//   <View style={styles.divider} />

//   {/* Full Address */}

//   <View style={{ padding: 14 }}>
//     <Text style={styles.label}>
//       Full Address
//     </Text>

//     <TextInput
//       value={fullAddress}
//       onChangeText={setFullAddress}
//       placeholder="Enter Full Address"
//       multiline
//       style={styles.textArea}
//     />
//   </View>

//   <View style={styles.divider} />

//   {/* Landmark */}

//   <View style={{ padding: 14 }}>
//     <Text style={styles.label}>
//       Landmark
//     </Text>

//     <TextInput
//       value={landmark}
//       onChangeText={setLandmark}
//       placeholder="Enter Landmark"
//       style={styles.inputBox}
//     />
//   </View>

//   <View style={styles.divider} />

//   {/* Remarks */}

//   <View style={{ padding: 14 }}>
//     <Text style={styles.label}>
//       Remarks
//     </Text>

//     <TextInput
//       value={remarks}
//       onChangeText={setRemarks}
//       placeholder="Enter Remarks"
//       multiline
//       style={styles.textArea}
//     />
//   </View>

// </View>

// ) : (
//                 <View style={styles.formCard}>
//                   {/* Pickup City - with selector */}
//                   <TouchableOpacity
//                     style={styles.inputGroup}
//                     onPress={() => openCitySelector('pickup')}
//                     activeOpacity={0.7}
//                   >
//                     <Icon name="location-outline" size={20} color="#FF1493" />
//                     <Text style={[styles.inputText, pickupCity ? styles.inputTextSelected : styles.inputTextPlaceholder]}>
//                       {pickupCity || 'Select Pickup City'}
//                     </Text>
//                     <Icon name="chevron-down-outline" size={18} color="#999" />
//                   </TouchableOpacity>

//                   {isRental && (
//                     <>
//                       <View style={styles.divider} />
//                       {/* To City - for rental */}
//                       <TouchableOpacity
//                         style={styles.inputGroup}
//                         onPress={() => openCitySelector('to')}
//                         activeOpacity={0.7}
//                       >
//                         <Icon name="navigate-outline" size={20} color="#FF1493" />
//                         <Text style={[styles.inputText, toCity ? styles.inputTextSelected : styles.inputTextPlaceholder]}>
//                           {toCity || 'Select To City'}
//                         </Text>
//                         <Icon name="chevron-down-outline" size={18} color="#999" />
//                       </TouchableOpacity>
//                     </>
//                   )}

//                   <View style={styles.divider} />

//                   {/* Drop City */}
//                   <TouchableOpacity
//                     style={styles.inputGroup}
//                     onPress={() => !isRental && openCitySelector('drop')}
//                     activeOpacity={isRental ? 1 : 0.7}
//                   >
//                     <Icon name="flag-outline" size={20} color={isRental ? '#ccc' : '#FF1493'} />
//                     <Text style={[
//                       styles.inputText,
//                       isRental && styles.inputDisabled,
//                       dropCity && !isRental ? styles.inputTextSelected : styles.inputTextPlaceholder
//                     ]}>
//                       {dropCity || (isRental ? 'Drop City' : 'Select Drop City')}
//                     </Text>
//                     {!isRental && <Icon name="chevron-down-outline" size={18} color="#999" />}
//                   </TouchableOpacity>

//                   <View style={styles.divider} />

//                   <View style={styles.inputGroup}>
//                     <FontAwesome5 name="users" size={18} color="#FF1493" />
//                     <View style={styles.personContainer}>
//                       <TouchableOpacity
//                         style={styles.personButton}
//                         onPress={() => setPerson(Math.max(1, person - 1))}
//                       >
//                         <Icon name="remove" size={20} color="#FF1493" />
//                       </TouchableOpacity>
//                       <Text style={styles.personCount}>{person}</Text>
//                       <TouchableOpacity
//                         style={styles.personButton}
//                         onPress={() => setPerson(person + 1)}
//                       >
//                         <Icon name="add" size={20} color="#FF1493" />
//                       </TouchableOpacity>
//                       <Text style={styles.personLabel}>Person(s)</Text>
//                     </View>
//                   </View>

//                   <View style={styles.divider} />

//                   <TouchableOpacity
//                     style={styles.inputGroup}
//                     onPress={() => setShowDatePicker(true)}
//                   >
//                     <Icon name="calendar-outline" size={20} color="#FF1493" />
//                     <Text style={styles.dateTimeText}>{scheduleDate.toDateString()}</Text>
//                   </TouchableOpacity>

//                   <View style={styles.divider} />

//                   <TouchableOpacity
//                     style={styles.inputGroup}
//                     onPress={() => setShowTimePicker(true)}
//                   >
//                     <Icon name="time-outline" size={20} color="#FF1493" />
//                     <Text style={styles.dateTimeText}>
//                       {scheduleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                     </Text>
//                   </TouchableOpacity>
//                 </View>)}
//               </View>

//               {showDatePicker && (
//                 <DateTimePicker
//                   value={scheduleDate}
//                   mode="date"
//                   display="default"
//                   onChange={handleDateChange}
//                   minimumDate={new Date()}
//                 />
//               )}

//               {showTimePicker && (
//                 <DateTimePicker
//                   value={scheduleDate}
//                   mode="time"
//                   display="default"
//                   onChange={handleTimeChange}
//                 />
//               )}

//               {/* Plans Section */}
//               <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>Select Plan</Text>
//                 <Text style={styles.sectionSubtitle}>
//                   Plans for{' '}
//                   <Text style={{ color: '#FF1493', fontWeight: 'bold' }}>
//                     {selectedVehicle.title}
//                   </Text>
//                 </Text>

//                 {plansLoading ? (
//                   <View style={styles.planLoadingContainer}>
//                     <ActivityIndicator size="small" color="#FF1493" />
//                     <Text style={styles.loadingText}>Loading plans...</Text>
//                   </View>
//                 ) : plans && plans.length > 0 ? (
//                   plans.map(renderPlanCard)
//                 ) : (
//                   <View style={styles.emptyContainer}>
//                     <Text style={styles.emptyText}>No plans available for this vehicle</Text>
//                   </View>
//                 )}
//               </View>
//             </>
//           )}
//         </ScrollView>
//       </KeyboardAvoidingView>

//       {/* City Selection Modal */}
//       <Modal
//         visible={citiesModalVisible}
//         animationType="slide"
//         transparent={true}
//         onRequestClose={() => setCitiesModalVisible(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>
//                Select {
//   activeCityField === 'city'
//     ? 'City'
//     : activeCityField === 'pickup'
//     ? 'Pickup'
//     : activeCityField === 'drop'
//     ? 'Drop'
//     : 'To'
// } City
//               </Text>
//               <TouchableOpacity
//                 onPress={() => setCitiesModalVisible(false)}
//                 style={styles.modalCloseButton}
//               >
//                 <Icon name="close" size={24} color="#333" />
//               </TouchableOpacity>
//             </View>

//             <View style={styles.searchContainer}>
//               <Icon name="search-outline" size={20} color="#999" style={styles.searchIcon} />
//               <TextInput
//                 style={styles.searchInput}
//                 placeholder="Search city..."
//                 value={citySearchText}
//                 onChangeText={setCitySearchText}
//                 placeholderTextColor="#999"
//                 autoFocus={true}
//               />
//               {citySearchText !== '' && (
//                 <TouchableOpacity onPress={() => setCitySearchText('')}>
//                   <Icon name="close-circle" size={20} color="#999" />
//                 </TouchableOpacity>
//               )}
//             </View>

//             {citiesLoading ? (
//               <View style={styles.modalLoadingContainer}>
//                 <ActivityIndicator size="large" color="#FF1493" />
//                 <Text style={styles.loadingText}>Loading cities...</Text>
//               </View>
//             ) : filteredCities.length > 0 ? (
//               <FlatList
//                 data={filteredCities}
//                 renderItem={renderCityItem}
//                 keyExtractor={(item) => item.id.toString()}
//                 showsVerticalScrollIndicator={true}
//                 contentContainerStyle={styles.cityList}
//                 ListHeaderComponent={() => citySearchText !== '' && filteredCities.length > 0 ? (
//                   <Text style={styles.searchResultCount}>{filteredCities.length} cities found</Text>
//                 ) : null}
//               />
//             ) : (
//               <View style={styles.noResultsContainer}>
//                 <Icon name="search-outline" size={48} color="#ccc" />
//                 <Text style={styles.noResultsText}>No cities found</Text>
//                 <Text style={styles.noResultsSubtext}>Try searching with a different name</Text>
//               </View>
//             )}
//           </View>
//         </View>
//       </Modal>

//       {/* Bottom Submit Button */}
//       <View style={styles.bottomContainer}>
//         <TouchableOpacity
//   style={[
//     styles.submitButton,
//     (
//       isOnSpot
//         ? (
//             !selectedVehicle ||
//             !city ||
//             !selectedPlan ||
//             !fullAddress ||
//             bookingLoading
//           )
//         : (
//             !selectedVehicle ||
//             !pickupCity ||
//             !dropCity ||
//             !selectedPlan ||
//             bookingLoading
//           )
//     ) && styles.disabledButton,
//   ]}
//   onPress={handleSubmitBooking}
//   disabled={
//     isOnSpot
//       ? (
//           !selectedVehicle ||
//           !city ||
//           !selectedPlan ||
//           !fullAddress ||
//           bookingLoading
//         )
//       : (
//           !selectedVehicle ||
//           !pickupCity ||
//           !dropCity ||
//           !selectedPlan ||
//           bookingLoading
//         )
//   }
// >
//           <LinearGradient
//             colors={['#FF1493', '#FF69B4']}
//             start={{ x: 0, y: 0 }}
//             end={{ x: 1, y: 0 }}
//             style={styles.submitGradient}
//           >
//             {bookingLoading ? (
//               <ActivityIndicator size="small" color="#fff" />
//             ) : (
//               <>
//                 <Text style={styles.submitButtonText}>Confirm Booking</Text>
//                 <Icon name="arrow-forward" size={20} color="#fff" />
//               </>
//             )}
//           </LinearGradient>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8F9FA',
//   },
//   scrollContent: {
//     paddingBottom: 100,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   planLoadingContainer: {
//     paddingVertical: 30,
//     alignItems: 'center',
//     gap: 8,
//   },
//   loadingText: {
//     marginTop: 16,
//     fontSize: 16,
//     color: '#666',
//   },
//   section: {
//     padding: 16,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#1A2B4E',
//     marginBottom: 4,
//   },
//   sectionSubtitle: {
//     fontSize: 13,
//     color: '#999',
//     marginBottom: 16,
//   },
//   vehicleList: {
//     paddingVertical: 8,
//   },
//   vehicleCard: {
//     width: width - 32,
//     borderRadius: 16,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 4,
//     elevation: 3,
//     marginBottom: 12,
//     marginHorizontal: 0,
//   },
//   vehicleCardSelected: {
//     shadowColor: '#FF1493',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.2,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   vehicleCardInner: {
//     alignItems: 'center',
//     flexDirection: 'row',
//   },
//   vehicleImage: {
//     width: 100,
//     height: 100,
//   },
//   vehicleTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     textAlign: 'center',
//     textTransform: 'capitalize',
//     marginLeft: 12,
//   },
//   vehicleTitleSelected: {
//     color: '#fff',
//   },
//   vehicleCheckBadge: {
//     position: 'absolute',
//     top: 6,
//     right: 6,
//   },
//   emptyContainer: {
//     paddingVertical: 30,
//     alignItems: 'center',
//   },
//   emptyText: {
//     fontSize: 14,
//     color: '#999',
//   },
//   formCard: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   inputGroup: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 14,
//     gap: 12,
//   },
//   inputText: {
//     flex: 1,
//     fontSize: 14,
//     padding: 0,
//   },
//   inputTextSelected: {
//     color: '#333',
//   },
//   inputTextPlaceholder: {
//     color: '#999',
//   },
//   inputDisabled: {
//     color: '#999',
//     backgroundColor: 'transparent',
//   },
//   divider: {
//     height: 1,
//     backgroundColor: '#f0f0f0',
//   },
//   personContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 16,
//   },
//   personButton: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#FFF0F5',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   personCount: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//     minWidth: 30,
//     textAlign: 'center',
//   },
//   personLabel: {
//     fontSize: 14,
//     color: '#666',
//     marginLeft: 'auto',
//   },
//   dateTimeText: {
//     flex: 1,
//     fontSize: 14,
//     color: '#333',
//   },
//   planCard: {
//     marginBottom: 12,
//     borderRadius: 16,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   selectedPlanCard: {
//     shadowColor: '#FF1493',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   planCardContent: {
//     flexDirection: 'row',
//     padding: 12,
//     position: 'relative',
//   },
//   planImageContainer: {
//     width: 80,
//     height: 80,
//     backgroundColor: '#F8F9FA',
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   planImage: {
//     width: 60,
//     height: 60,
//   },
//   planInfo: {
//     flex: 1,
//   },
//   planHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 4,
//   },
//   planName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   planDuration: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   durationText: {
//     fontSize: 12,
//     color: '#666',
//   },
//   planDescription: {
//     fontSize: 12,
//     color: '#999',
//     marginBottom: 8,
//   },
//   featuresContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 6,
//     marginBottom: 8,
//   },
//   featureBadge: {
//     backgroundColor: '#fff',
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 12,
//   },
//   featureBadge2: {
//     backgroundColor: 'rgba(0,0,0,0.05)',
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 12,
//   },
//   featureText: {
//     fontSize: 10,
//     color: '#666',
//   },
//   planFooter: {
//     flexDirection: 'row',
//     alignItems: 'baseline',
//     gap: 4,
//   },
//   priceText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#FF1493',
//   },
//   totalLabel: {
//     fontSize: 10,
//     color: '#999',
//   },
//   selectedBadge: {
//     position: 'absolute',
//     top: 8,
//     right: 8,
//   },
//   selectedText: {
//     color: '#fff',
//   },
//   selectedTextLight: {
//     color: 'rgba(255,255,255,0.9)',
//   },
//   bottomContainer: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: '#fff',
//     padding: 16,
//     borderTopWidth: 1,
//     borderTopColor: '#f0f0f0',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 4,
//     elevation: 8,
//   },
//   submitButton: {
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   submitGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 14,
//     gap: 8,
//   },
//   submitButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   disabledButton: {
//     opacity: 0.6,
//   },
//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'flex-end',
//   },
//   modalContainer: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     maxHeight: '90%',
//     minHeight: '50%',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   modalCloseButton: {
//     padding: 4,
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     margin: 16,
//     paddingHorizontal: 12,
//     backgroundColor: '#F5F5F5',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#eee',
//   },
//   searchIcon: {
//     marginRight: 8,
//   },
//   searchInput: {
//     flex: 1,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: '#333',
//   },
//   cityList: {
//     paddingBottom: 20,
//   },
//   cityItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingVertical: 14,
//     paddingHorizontal: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   cityItemContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//     gap: 12,
//   },
//   cityTextContainer: {
//     flex: 1,
//   },
//   cityName: {
//     fontSize: 16,
//     color: '#333',
//     fontWeight: '500',
//   },
//   stateName: {
//     fontSize: 12,
//     color: '#999',
//     marginTop: 2,
//   },
//   stateHeader: {
//     backgroundColor: '#F8F9FA',
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   stateHeaderText: {
//     fontSize: 14,
//     fontWeight: 'bold',
//     color: '#FF1493',
//   },
//   modalLoadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   noResultsContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 60,
//   },
//   noResultsText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#666',
//     marginTop: 16,
//   },
//   noResultsSubtext: {
//     fontSize: 14,
//     color: '#999',
//     marginTop: 8,
//   },
//   searchResultCount: {
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     fontSize: 12,
//     color: '#999',
//     backgroundColor: '#F8F9FA',
//   },
//   label: {
//   fontSize: 13,
//   fontWeight: '600',
//   marginBottom: 8,
//   color: '#333',
// },

// inputBox: {
//   borderWidth: 1,
//   borderColor: '#ddd',
//   borderRadius: 10,
//   paddingHorizontal: 12,
//   height: 48,
// },

// textArea: {
//   borderWidth: 1,
//   borderColor: '#ddd',
//   borderRadius: 10,
//   minHeight: 100,
//   padding: 12,
//   textAlignVertical: 'top',
// },
// onspotBookingsButton: {
//     marginHorizontal: 16,
//     marginTop: 10,
//     marginBottom: 5,
//     borderRadius: 12,
//     overflow: 'hidden',
//     shadowColor: '#810a45',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   onspotButtonGradient: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//   },
//   onspotButtonText: {
//     color: '#fff',
//     fontSize: 15,
//     fontWeight: '600',
//     flex: 1,
//     marginLeft: 10,
//   },
// });

// export default VehicleSelectionScreen;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import {
  CREATE_BOOKING,
  GET_PLANS,
  GET_SUB_SERVICES,
  CLEAR_BOOKING_DATA,
  CREATE_ONSPOT_BOOKING,
} from '../../redux/actions/action-creator';
import { IMAGE_URL } from '../../axios/axiosinstance';
import CurvedHeader from '../../components/CurvedHeader';
import axios from 'axios';

const { width } = Dimensions.get('window');

const API_BASE_URL = 'https://sigiride.com';

const VehicleSelectionScreen = ({ route, navigation }) => {
  const { service_id, service_title } = route.params;

  console.log('service_id', service_title);

  const isRental = service_title?.toLowerCase() === 'rental' || service_title === 'Driver';
  const dispatch = useDispatch();

  const {
    subServices,
    subServicesLoading,
    plans,
    plansLoading,
    bookingLoading,
    bookingSuccess,
    bookingError,
  } = useSelector((state) => state.common);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // City data and selection states
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesModalVisible, setCitiesModalVisible] = useState(false);
  const [citySearchText, setCitySearchText] = useState('');
  const [activeCityField, setActiveCityField] = useState(null); // 'pickup', 'drop', 'to'

  // Dropdown focus states
  const [pickupDropdownFocus, setPickupDropdownFocus] = useState(false);
  const [dropDropdownFocus, setDropDropdownFocus] = useState(false);
  const [toDropdownFocus, setToDropdownFocus] = useState(false);
  const [cityDropdownFocus, setCityDropdownFocus] = useState(false);

  const [pickupCity, setPickupCity] = useState('');
  const [pickupCityId, setPickupCityId] = useState(null);
  const [dropCity, setDropCity] = useState('');
  const [dropCityId, setDropCityId] = useState(null);
  const [toCity, setToCity] = useState('');
  const [toCityId, setToCityId] = useState(null);

  const [person, setPerson] = useState(1);
  const [scheduleDate, setScheduleDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const isOnSpot = Number(service_id) === 77;

  const [city, setCity] = useState('');
  const [cityId, setCityId] = useState(null);

  const [fullAddress, setFullAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [remarks, setRemarks] = useState('');

  // Fetch cities on component mount
  useEffect(() => {
    fetchCities();
  }, []);

  // Fetch cities from API
  const fetchCities = async () => {
    setCitiesLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/cities`);
      if (response.data?.status && response.data?.data) {
        setCities(response.data.data);
        setFilteredCities(response.data.data);
      } else {
        console.error('Failed to fetch cities:', response.data?.message);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      Alert.alert('Error', 'Failed to load cities. Please check your internet connection.');
    } finally {
      setCitiesLoading(false);
    }
  };

  // Filter cities based on search text
  useEffect(() => {
    if (citySearchText.trim() === '') {
      setFilteredCities(cities);
    } else {
      const filtered = cities.filter(city =>
        city.name.toLowerCase().includes(citySearchText.toLowerCase())
      );
      setFilteredCities(filtered);
    }
  }, [citySearchText, cities]);

  const handleCitySelect = (city) => {
    switch (activeCityField) {
      case 'city':
        setCity(city.name);
        setCityId(city.id);
        break;
      case 'pickup':
        setPickupCity(city.name);
        setPickupCityId(city.id);
        if (isRental) {
          // For rental, set drop city same as pickup initially
          setDropCity(city.name);
          setDropCityId(city.id);
        }
        break;
      case 'drop':
        setDropCity(city.name);
        setDropCityId(city.id);
        break;
      case 'to':
        setToCity(city.name);
        setToCityId(city.id);
        break;
      default:
        break;
    }
    setCitiesModalVisible(false);
    setActiveCityField(null);
  };

  useEffect(() => {
    dispatch(GET_SUB_SERVICES(service_id));
    return () => {
      dispatch(CLEAR_BOOKING_DATA());
    };
  }, [dispatch, service_id]);

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

  const handleVehicleSelect = (vehicle) => {
    console.log('vehicle-->', vehicle);
    setSelectedVehicle(vehicle);
    setSelectedPlan(null);
    dispatch(GET_PLANS(service_id, vehicle.id));
  };

  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(scheduleDate.getHours());
      newDate.setMinutes(scheduleDate.getMinutes());
      setScheduleDate(newDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(scheduleDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setScheduleDate(newDate);
    }
  };

  const validateForm = () => {
    if (isOnSpot) {
      if (!selectedVehicle) {
        Alert.alert('Validation Error', 'Please select service');
        return false;
      }
      if (!city) {
        Alert.alert('Validation Error', 'Please select city');
        return false;
      }
      if (!selectedPlan) {
        Alert.alert('Validation Error', 'Please select plan');
        return false;
      }
      if (!fullAddress.trim()) {
        Alert.alert('Validation Error', 'Please enter full address');
        return false;
      }
      return true;
    }
    if (!selectedVehicle) {
      Alert.alert('Validation Error', 'Please select a vehicle');
      return false;
    }
    if (!pickupCity.trim()) {
      Alert.alert('Validation Error', 'Please select pickup city');
      return false;
    }
    if (!dropCity.trim()) {
      Alert.alert('Validation Error', 'Please select drop city');
      return false;
    }
    if (!selectedPlan) {
      Alert.alert('Validation Error', 'Please select a plan');
      return false;
    }
    if (person < 1) {
      Alert.alert('Validation Error', 'Please enter valid number of persons');
      return false;
    }
    return true;
  };

  const handleSubmitBooking = () => {
    if (!validateForm()) return;

    if (isOnSpot) {
      const bookingData = {
        service_id,
        sub_service_id: selectedVehicle.id,
        plan_id: selectedPlan.id,
        city,
        schedule_datetime: formatDateTime(scheduleDate),
        full_address: fullAddress,
        landmark,
        remarks,
      };

      console.log('OnSpot Booking', bookingData);

      dispatch(CREATE_ONSPOT_BOOKING(bookingData));
      return;
    }

    const bookingData = {
      service_id,
      sub_service_id: selectedVehicle.id,
      pickup_city: pickupCity,
      drop_city: dropCity,
      to_city: toCity,
      person,
      plan_id: selectedPlan.id,
      schedule_date: formatDateTime(scheduleDate),
    };
    console.log('bookingData-->', bookingData);
    dispatch(CREATE_BOOKING(bookingData));
  };

  const getVehicleIcon = (title) => {
    const t = title?.toLowerCase() || '';
    if (t.includes('scooter')) return 'bicycle-outline';
    if (t.includes('bike')) return 'bicycle-outline';
    if (t.includes('auto')) return 'car-sport-outline';
    return 'car-outline';
  };

  // Get dropdown formatted cities
  const getDropdownCities = () => {
    return cities.map(city => ({
      label: city.name,
      value: city.id,
      state: city.state_name,
    }));
  };

  // Render dropdown item
  const renderDropdownItem = (item) => {
    return (
      <View style={styles.dropdownItemContainer}>
        <Icon name="location-outline" size={18} color="#FF1493" style={styles.dropdownItemIcon} />
        <View style={styles.dropdownItemTextContainer}>
          <Text style={styles.dropdownItemLabel}>{item.label}</Text>
          {item.state && (
            <Text style={styles.dropdownItemState}>{item.state}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderCityItem = ({ item }) => (
    <TouchableOpacity
      style={styles.cityItem}
      onPress={() => handleCitySelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cityItemContent}>
        <Icon name="location-outline" size={20} color="#FF1493" />
        <View style={styles.cityTextContainer}>
          <Text style={styles.cityName}>{item.name}</Text>
          <Text style={styles.stateName}>{item.state_name}</Text>
        </View>
      </View>
      <Icon name="chevron-forward-outline" size={18} color="#ccc" />
    </TouchableOpacity>
  );

  const renderVehicleCard = ({ item }) => {
    const isSelected = selectedVehicle?.id === item.id;
    const imageUri = item.image
      ? `https://sigiride.com/uploads/subservice/${item.image}`
      : null;

    return (
      <TouchableOpacity
        style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
        onPress={() => handleVehicleSelect(item)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={isSelected ? ['#FF1493', '#FF69B4'] : ['#fff', '#fff']}
          style={styles.vehicleCardInner}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.vehicleImage}
              resizeMode="contain"
            />
          ) : (
            <Icon
              name={getVehicleIcon(item.title)}
              size={36}
              color={isSelected ? '#fff' : '#FF1493'}
            />
          )}
          <Text style={[styles.vehicleTitle, isSelected && styles.vehicleTitleSelected]}>
            {item.title}
          </Text>
          {isSelected && (
            <View style={styles.vehicleCheckBadge}>
              <Icon name="checkmark-circle" size={16} color="#4CAF50" />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderPlanCard = (plan) => (
    <TouchableOpacity
      key={plan.id}
      style={[styles.planCard, selectedPlan?.id === plan.id && styles.selectedPlanCard]}
      onPress={() => setSelectedPlan(plan)}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={selectedPlan?.id === plan.id ? ['#FF1493', '#FF69B4'] : ['#fff', '#fff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.planCardContent}
      >
        <View style={styles.planImageContainer}>
          <Image
            source={{
              uri: plan.image
                ? `https://sigiride.com/uploads/plan/${plan.image}`
                : 'https://cdn-icons-png.flaticon.com/128/809/809998.png',
            }}
            style={styles.planImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.planInfo}>
          <View style={styles.planHeader}>
            <Text style={[styles.planName, selectedPlan?.id === plan.id && styles.selectedText]}>
              {plan.plan_name}
            </Text>
            <View style={styles.planDuration}>
              <FontAwesome5
                name="clock"
                size={12}
                color={selectedPlan?.id === plan.id ? '#fff' : '#666'}
              />
              <Text style={[styles.durationText, selectedPlan?.id === plan.id && styles.selectedText]}>
                {plan.plan_hour}h
              </Text>
            </View>
          </View>

          <Text style={[styles.planDescription, selectedPlan?.id === plan.id && styles.selectedTextLight]}>
            {plan.description !== 'NA' ? plan.description : `${plan.plan_hour} hours • ${plan.plan_km} km`}
          </Text>

          <View style={styles.featuresContainer}>
            <View style={[styles.featureBadge2, selectedPlan?.id === plan.id && styles.featureBadge]}>
              <Text style={styles.featureText}>{plan.plan_hour} hours</Text>
            </View>
            <View style={[styles.featureBadge2, selectedPlan?.id === plan.id && styles.featureBadge]}>
              <Text style={styles.featureText}>{plan.plan_km} km</Text>
            </View>
            {plan.driver_amount > 0 && (
              <View style={[styles.featureBadge2, selectedPlan?.id === plan.id && styles.featureBadge]}>
                <Text style={styles.featureText}>Driver included</Text>
              </View>
            )}
          </View>

          <View style={styles.planFooter}>
            <Text style={[styles.priceText, selectedPlan?.id === plan.id && styles.selectedText]}>
              ₹{parseInt(plan.plan_price).toLocaleString()}
            </Text>
            <Text style={[styles.totalLabel, selectedPlan?.id === plan.id && styles.selectedTextLight]}>
              total
            </Text>
          </View>
        </View>

        {selectedPlan?.id === plan.id && (
          <View style={styles.selectedBadge}>
            <Icon name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  if (subServicesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF1493" />
          <Text style={styles.loadingText}>Loading vehicles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ff7f50" />

      <CurvedHeader title="Pick your requirement" navigation={navigation} showBack />
      
      {isOnSpot && (
        <TouchableOpacity
          style={styles.onspotBookingsButton}
          onPress={() => navigation.navigate('OnSpotBookings')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#810a45', '#e20f7a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.onspotButtonGradient}
          >
            <Icon name="list-outline" size={22} color="#fff" />
            <Text style={styles.onspotButtonText}>My OnSpot Bookings</Text>
            <Icon name="arrow-forward-outline" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Vehicle Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose your service and plan</Text>

            {subServices && subServices.length > 0 ? (
              <FlatList
                data={subServices}
                renderItem={renderVehicleCard}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.vehicleList}
                scrollEnabled={true}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No vehicles available</Text>
              </View>
            )}
          </View>

          {/* Trip Details Form — shown after vehicle selected */}
          {selectedVehicle && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}> {isOnSpot ? 'Details' : 'Trip Details'}</Text>

                {isOnSpot ? (
                  <View style={styles.formCard}>
                    {/* City Dropdown */}
                    <Dropdown
                      style={[styles.dropdown, cityDropdownFocus && styles.dropdownFocused]}
                      placeholderStyle={styles.placeholderStyle}
                      selectedTextStyle={styles.selectedTextStyle}
                      inputSearchStyle={styles.inputSearchStyle}
                      iconStyle={styles.iconStyle}
                      data={getDropdownCities()}
                      search
                      maxHeight={300}
                      labelField="label"
                      valueField="value"
                      placeholder="Select City"
                      searchPlaceholder="Search cities..."
                      value={cityId}
                      onFocus={() => setCityDropdownFocus(true)}
                      onBlur={() => setCityDropdownFocus(false)}
                      onChange={item => {
                        const selectedCity = cities.find(c => c.id === item.value);
                        if (selectedCity) {
                          setCity(selectedCity.name);
                          setCityId(selectedCity.id);
                        }
                        setCityDropdownFocus(false);
                      }}
                      renderLeftIcon={() => (
                        <Icon name="location-outline" size={20} color="#FF1493" style={styles.dropdownIcon} />
                      )}
                      renderItem={renderDropdownItem}
                      activeColor="#FFF0F5"
                      selectedTextProps={{ numberOfLines: 1 }}
                      showsVerticalScrollIndicator={true}
                      keyboardAvoiding={true}
                      statusBarIsTranslucent={true}
                    />

                    <View style={styles.divider} />

                    {/* Date */}
                    <TouchableOpacity
                      style={styles.inputGroup}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Icon name="calendar-outline" size={20} color="#FF1493" />
                      <Text style={styles.dateTimeText}>
                        {scheduleDate.toDateString()}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    {/* Time */}
                    <TouchableOpacity
                      style={styles.inputGroup}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Icon name="time-outline" size={20} color="#FF1493" />
                      <Text style={styles.dateTimeText}>
                        {scheduleDate.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    {/* Full Address */}
                    <View style={{ padding: 14 }}>
                      <Text style={styles.label}>Full Address</Text>
                      <TextInput
                        value={fullAddress}
                        onChangeText={setFullAddress}
                        placeholder="Enter Full Address"
                        multiline
                        style={styles.textArea}
                      />
                    </View>

                    <View style={styles.divider} />

                    {/* Landmark */}
                    <View style={{ padding: 14 }}>
                      <Text style={styles.label}>Landmark</Text>
                      <TextInput
                        value={landmark}
                        onChangeText={setLandmark}
                        placeholder="Enter Landmark"
                        style={styles.inputBox}
                      />
                    </View>

                    <View style={styles.divider} />

                    {/* Remarks */}
                    <View style={{ padding: 14 }}>
                      <Text style={styles.label}>Remarks</Text>
                      <TextInput
                        value={remarks}
                        onChangeText={setRemarks}
                        placeholder="Enter Remarks"
                        multiline
                        style={styles.textArea}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.formCard}>
                    {/* Pickup City Dropdown */}
                    <Dropdown
                      style={[styles.dropdown, pickupDropdownFocus && styles.dropdownFocused]}
                      placeholderStyle={styles.placeholderStyle}
                      selectedTextStyle={styles.selectedTextStyle}
                      inputSearchStyle={styles.inputSearchStyle}
                      iconStyle={styles.iconStyle}
                      data={getDropdownCities()}
                      search
                      maxHeight={300}
                      labelField="label"
                      valueField="value"
                      placeholder="Select Pickup City"
                      searchPlaceholder="Search cities..."
                      value={pickupCityId}
                      onFocus={() => setPickupDropdownFocus(true)}
                      onBlur={() => setPickupDropdownFocus(false)}
                      onChange={item => {
                        const selectedCity = cities.find(c => c.id === item.value);
                        if (selectedCity) {
                          setPickupCity(selectedCity.name);
                          setPickupCityId(selectedCity.id);
                          if (isRental) {
                            setDropCity(selectedCity.name);
                            setDropCityId(selectedCity.id);
                          }
                        }
                        setPickupDropdownFocus(false);
                      }}
                      renderLeftIcon={() => (
                        <Icon name="location-outline" size={20} color="#FF1493" style={styles.dropdownIcon} />
                      )}
                      renderItem={renderDropdownItem}
                      activeColor="#FFF0F5"
                      selectedTextProps={{ numberOfLines: 1 }}
                      showsVerticalScrollIndicator={true}
                      keyboardAvoiding={true}
                      statusBarIsTranslucent={true}
                    />

                    {isRental && (
                      <>
                        <View style={styles.divider} />
                        {/* To City Dropdown - for rental */}
                        <Dropdown
                          style={[styles.dropdown, toDropdownFocus && styles.dropdownFocused]}
                          placeholderStyle={styles.placeholderStyle}
                          selectedTextStyle={styles.selectedTextStyle}
                          inputSearchStyle={styles.inputSearchStyle}
                          iconStyle={styles.iconStyle}
                          data={getDropdownCities()}
                          search
                          maxHeight={300}
                          labelField="label"
                          valueField="value"
                          placeholder="Select To City"
                          searchPlaceholder="Search cities..."
                          value={toCityId}
                          onFocus={() => setToDropdownFocus(true)}
                          onBlur={() => setToDropdownFocus(false)}
                          onChange={item => {
                            const selectedCity = cities.find(c => c.id === item.value);
                            if (selectedCity) {
                              setToCity(selectedCity.name);
                              setToCityId(selectedCity.id);
                            }
                            setToDropdownFocus(false);
                          }}
                          renderLeftIcon={() => (
                            <Icon name="navigate-outline" size={20} color="#FF1493" style={styles.dropdownIcon} />
                          )}
                          renderItem={renderDropdownItem}
                          activeColor="#FFF0F5"
                          selectedTextProps={{ numberOfLines: 1 }}
                          showsVerticalScrollIndicator={true}
                          keyboardAvoiding={true}
                          statusBarIsTranslucent={true}
                        />
                      </>
                    )}

                    <View style={styles.divider} />

                    {/* Drop City Dropdown */}
                    {!isRental && (
                      <>
                        <Dropdown
                          style={[styles.dropdown, dropDropdownFocus && styles.dropdownFocused]}
                          placeholderStyle={styles.placeholderStyle}
                          selectedTextStyle={styles.selectedTextStyle}
                          inputSearchStyle={styles.inputSearchStyle}
                          iconStyle={styles.iconStyle}
                          data={getDropdownCities()}
                          search
                          maxHeight={300}
                          labelField="label"
                          valueField="value"
                          placeholder="Select Drop City"
                          searchPlaceholder="Search cities..."
                          value={dropCityId}
                          onFocus={() => setDropDropdownFocus(true)}
                          onBlur={() => setDropDropdownFocus(false)}
                          onChange={item => {
                            const selectedCity = cities.find(c => c.id === item.value);
                            if (selectedCity) {
                              setDropCity(selectedCity.name);
                              setDropCityId(selectedCity.id);
                            }
                            setDropDropdownFocus(false);
                          }}
                          renderLeftIcon={() => (
                            <Icon name="flag-outline" size={20} color="#FF1493" style={styles.dropdownIcon} />
                          )}
                          renderItem={renderDropdownItem}
                          activeColor="#FFF0F5"
                          selectedTextProps={{ numberOfLines: 1 }}
                          showsVerticalScrollIndicator={true}
                          keyboardAvoiding={true}
                          statusBarIsTranslucent={true}
                        />
                        <View style={styles.divider} />
                      </>
                    )}

                    {/* Person */}
                    <View style={styles.inputGroup}>
                      <FontAwesome5 name="users" size={18} color="#FF1493" />
                      <View style={styles.personContainer}>
                        <TouchableOpacity
                          style={styles.personButton}
                          onPress={() => setPerson(Math.max(1, person - 1))}
                        >
                          <Icon name="remove" size={20} color="#FF1493" />
                        </TouchableOpacity>
                        <Text style={styles.personCount}>{person}</Text>
                        <TouchableOpacity
                          style={styles.personButton}
                          onPress={() => setPerson(person + 1)}
                        >
                          <Icon name="add" size={20} color="#FF1493" />
                        </TouchableOpacity>
                        <Text style={styles.personLabel}>Person(s)</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Date */}
                    <TouchableOpacity
                      style={styles.inputGroup}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Icon name="calendar-outline" size={20} color="#FF1493" />
                      <Text style={styles.dateTimeText}>{scheduleDate.toDateString()}</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    {/* Time */}
                    <TouchableOpacity
                      style={styles.inputGroup}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Icon name="time-outline" size={20} color="#FF1493" />
                      <Text style={styles.dateTimeText}>
                        {scheduleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={scheduleDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={scheduleDate}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}

              {/* Plans Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Plan</Text>
                <Text style={styles.sectionSubtitle}>
                  Plans for{' '}
                  <Text style={{ color: '#FF1493', fontWeight: 'bold' }}>
                    {selectedVehicle.title}
                  </Text>
                </Text>

                {plansLoading ? (
                  <View style={styles.planLoadingContainer}>
                    <ActivityIndicator size="small" color="#FF1493" />
                    <Text style={styles.loadingText}>Loading plans...</Text>
                  </View>
                ) : plans && plans.length > 0 ? (
                  plans.map(renderPlanCard)
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No plans available for this vehicle</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* City Selection Modal - Kept for compatibility but not used with Dropdown */}
      <Modal
        visible={citiesModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCitiesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {
                  activeCityField === 'city'
                    ? 'City'
                    : activeCityField === 'pickup'
                    ? 'Pickup'
                    : activeCityField === 'drop'
                    ? 'Drop'
                    : 'To'
                } City
              </Text>
              <TouchableOpacity
                onPress={() => setCitiesModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Icon name="search-outline" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search city..."
                value={citySearchText}
                onChangeText={setCitySearchText}
                placeholderTextColor="#999"
                autoFocus={true}
              />
              {citySearchText !== '' && (
                <TouchableOpacity onPress={() => setCitySearchText('')}>
                  <Icon name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {citiesLoading ? (
              <View style={styles.modalLoadingContainer}>
                <ActivityIndicator size="large" color="#FF1493" />
                <Text style={styles.loadingText}>Loading cities...</Text>
              </View>
            ) : filteredCities.length > 0 ? (
              <FlatList
                data={filteredCities}
                renderItem={renderCityItem}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.cityList}
                ListHeaderComponent={() => citySearchText !== '' && filteredCities.length > 0 ? (
                  <Text style={styles.searchResultCount}>{filteredCities.length} cities found</Text>
                ) : null}
              />
            ) : (
              <View style={styles.noResultsContainer}>
                <Icon name="search-outline" size={48} color="#ccc" />
                <Text style={styles.noResultsText}>No cities found</Text>
                <Text style={styles.noResultsSubtext}>Try searching with a different name</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Bottom Submit Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (
              isOnSpot
                ? (
                    !selectedVehicle ||
                    !city ||
                    !selectedPlan ||
                    !fullAddress ||
                    bookingLoading
                  )
                : (
                    !selectedVehicle ||
                    !pickupCity ||
                    !dropCity ||
                    !selectedPlan ||
                    bookingLoading
                  )
            ) && styles.disabledButton,
          ]}
          onPress={handleSubmitBooking}
          disabled={
            isOnSpot
              ? (
                  !selectedVehicle ||
                  !city ||
                  !selectedPlan ||
                  !fullAddress ||
                  bookingLoading
                )
              : (
                  !selectedVehicle ||
                  !pickupCity ||
                  !dropCity ||
                  !selectedPlan ||
                  bookingLoading
                )
          }
        >
          <LinearGradient
            colors={['#FF1493', '#FF69B4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {bookingLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Confirm Booking</Text>
                <Icon name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planLoadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A2B4E',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#999',
    marginBottom: 16,
  },
  vehicleList: {
    paddingVertical: 8,
  },
  vehicleCard: {
    width: width - 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
    marginHorizontal: 0,
  },
  vehicleCardSelected: {
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  vehicleCardInner: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  vehicleImage: {
    width: 100,
    height: 100,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginLeft: 12,
  },
  vehicleTitleSelected: {
    color: '#fff',
  },
  vehicleCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  emptyContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  inputTextSelected: {
    color: '#333',
  },
  inputTextPlaceholder: {
    color: '#999',
  },
  inputDisabled: {
    color: '#999',
    backgroundColor: 'transparent',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  personContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  personButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  personLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 'auto',
  },
  dateTimeText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  planCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedPlanCard: {
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  planCardContent: {
    flexDirection: 'row',
    padding: 12,
    position: 'relative',
  },
  planImageContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planImage: {
    width: 60,
    height: 60,
  },
  planInfo: {
    flex: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  planDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: '#666',
  },
  planDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  featureBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  featureBadge2: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 10,
    color: '#666',
  },
  planFooter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF1493',
  },
  totalLabel: {
    fontSize: 10,
    color: '#999',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  selectedText: {
    color: '#fff',
  },
  selectedTextLight: {
    color: 'rgba(255,255,255,0.9)',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Dropdown Styles
  dropdown: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 48,
    marginHorizontal: 0,
  },
  dropdownFocused: {
    borderColor: '#FF1493',
    borderWidth: 2,
  },
  dropdownIcon: {
    marginRight: 8,
  },
  placeholderStyle: {
    fontSize: 14,
    color: '#999',
  },
  selectedTextStyle: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderColor: '#E5E7EB',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  dropdownItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  dropdownItemIcon: {
    marginRight: 10,
  },
  dropdownItemTextContainer: {
    flex: 1,
  },
  dropdownItemLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dropdownItemState: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  cityList: {
    paddingBottom: 20,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cityItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  cityTextContainer: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  stateName: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  stateHeader: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stateHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF1493',
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  searchResultCount: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 12,
    color: '#999',
    backgroundColor: '#F8F9FA',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    minHeight: 100,
    padding: 12,
    textAlignVertical: 'top',
  },
  onspotBookingsButton: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#810a45',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  onspotButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  onspotButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginLeft: 10,
  },
});

export default VehicleSelectionScreen;