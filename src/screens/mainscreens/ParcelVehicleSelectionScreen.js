// import React, { useEffect, useMemo, useState } from 'react';
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
// import axios from 'axios';

// import CurvedHeader from '../../components/CurvedHeader';
// import {
//   CREATE_BOOKING,
//   GET_PLANS,
//   GET_SUB_SERVICES,
//   CLEAR_BOOKING_DATA,
//   CREATE_BOOKING_PARCEL,
// } from '../../redux/actions/action-creator';

// const { width } = Dimensions.get('window');
// const API_BASE_URL = 'https://sigiride.com';

// const ParcelVehicleSelectionScreen = ({ route, navigation }) => {
//   const { service_id } = route.params;

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

//   const [selectedSubService, setSelectedSubService] = useState(null);
//   const [selectedPlan, setSelectedPlan] = useState(null);

//   // City data and selection states
//   const [cities, setCities] = useState([]);
//   const [filteredCities, setFilteredCities] = useState([]);
//   const [citiesLoading, setCitiesLoading] = useState(false);
//   const [citiesModalVisible, setCitiesModalVisible] = useState(false);
//   const [citySearchText, setCitySearchText] = useState('');
//   const [activeCityField, setActiveCityField] = useState(null); // 'pickup' or 'drop'

//   // form
//   const [pickupCity, setPickupCity] = useState('');
//   const [pickupCityId, setPickupCityId] = useState(null);
//   const [dropCity, setDropCity] = useState('');
//   const [dropCityId, setDropCityId] = useState(null);
//   const [pickupDate, setPickupDate] = useState(new Date());
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [showTimePicker, setShowTimePicker] = useState(false);
//   const [pickupTime, setPickupTime] = useState(new Date());

//   const [pickupAddress, setPickupAddress] = useState('');
//   const [pickupLandmark, setPickupLandmark] = useState('');
//   const [dropAddress, setDropAddress] = useState('');
//   const [dropLandmark, setDropLandmark] = useState('');

//   const [receiverName, setReceiverName] = useState('');
//   const [receiverMobile, setReceiverMobile] = useState('');
//   const [approxWeight, setApproxWeight] = useState('');

//   const packagingMaterialTypes = useMemo(
//     () => ['Plastic', 'Paper', 'Carton', 'Glass', 'Iron'],
//     [],
//   );
//   const loadingUnloadingTypes = useMemo(
//     () => ['User End', 'Captain End'],
//     [],
//   );

//   const [packagingMaterialType, setPackagingMaterialType] = useState('Carton');
//   const [loadingUnloading, setLoadingUnloading] = useState('Captain End');

//   const [remarks, setRemarks] = useState('');

//   // Fetch cities on component mount
//   useEffect(() => {
//     fetchCities();
//   }, []);

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

//   // Open city selection modal
//   const openCitySelector = (fieldType) => {
//     setActiveCityField(fieldType);
//     setCitySearchText('');
//     setFilteredCities(cities);
//     setCitiesModalVisible(true);
//   };

//   // Handle city selection
//   const handleCitySelect = (city) => {
//     if (activeCityField === 'pickup') {
//       setPickupCity(city.name);
//       setPickupCityId(city.id);
//     } else if (activeCityField === 'drop') {
//       setDropCity(city.name);
//       setDropCityId(city.id);
//     }
//     setCitiesModalVisible(false);
//     setActiveCityField(null);
//   };

//   useEffect(() => {
//     dispatch(GET_SUB_SERVICES(service_id));
//     return () => {
//       dispatch(CLEAR_BOOKING_DATA());
//     };
//   }, [dispatch, service_id]);

//   useEffect(() => {
//     if (bookingSuccess) {
//       Alert.alert('Success', 'Parcel booking created successfully!', [
//         { text: 'OK', onPress: () => navigation.goBack() },
//       ]);
//     }
//   }, [bookingSuccess, navigation]);

//   useEffect(() => {
//     if (bookingError) {
//       Alert.alert('Booking Failed', bookingError);
//     }
//   }, [bookingError]);

//   const myParcelsButton = (
//     <TouchableOpacity
//       style={styles.myParcelsBtn}
//       onPress={() => {
//         navigation.navigate('MyParcels');
//       }}
//       activeOpacity={0.9}
//     >
//       <Icon name="cube-outline" size={18} color="#fff" />
//       <Text style={styles.myParcelsText}>My Parcels</Text>
//     </TouchableOpacity>
//   );

//   const formatDateOnly = (d) => {
//     const yyyy = d.getFullYear();
//     const mm = String(d.getMonth() + 1).padStart(2, '0');
//     const dd = String(d.getDate()).padStart(2, '0');
//     return `${yyyy}-${mm}-${dd}`;
//   };

//   const formatTimeOnly = (d) => {
//     const hh = String(d.getHours()).padStart(2, '0');
//     const mi = String(d.getMinutes()).padStart(2, '0');
//     const ss = '00';
//     return `${hh}:${mi}:${ss}`;
//   };

//   const validateForm = () => {
//     if (!selectedSubService) {
//       Alert.alert('Validation Error', 'Please select a parcel type');
//       return false;
//     }
//     if (!pickupCity.trim()) {
//       Alert.alert('Validation Error', 'Please select pickup city');
//       return false;
//     }
//     if (!pickupAddress.trim()) {
//       Alert.alert('Validation Error', 'Please enter pickup address');
//       return false;
//     }
//     if (!dropCity.trim()) {
//       Alert.alert('Validation Error', 'Please select drop city');
//       return false;
//     }
//     if (!dropAddress.trim()) {
//       Alert.alert('Validation Error', 'Please enter drop address');
//       return false;
//     }
//     if (!receiverName.trim()) {
//       Alert.alert('Validation Error', 'Please enter receiver name');
//       return false;
//     }
//     if (!receiverMobile.trim() || receiverMobile.trim().length < 10) {
//       Alert.alert('Validation Error', 'Please enter valid receiver mobile');
//       return false;
//     }
//     if (!approxWeight.trim() || Number.isNaN(Number(approxWeight))) {
//       Alert.alert('Validation Error', 'Please enter valid approx weight');
//       return false;
//     }
//     if (!selectedPlan) {
//       Alert.alert('Validation Error', 'Please select a plan');
//       return false;
//     }
//     return true;
//   };

//   const handleSubServiceSelect = (item) => {
//     setSelectedSubService(item);
//     setSelectedPlan(null);
//     dispatch(GET_PLANS(service_id, item.id));
//   };

//   const handleSubmitBooking = () => {
//     if (!validateForm()) return;

//     const bookingData = {
//       service_id,
//       sub_service_id: selectedSubService.id,
//       plan_id: selectedPlan.id,

//       pickup_city: pickupCity,
//       pickup_city_id: pickupCityId,
//       pickup_date: formatDateOnly(pickupDate),
//       pickup_time: formatTimeOnly(pickupTime),
//       pickup_address: pickupAddress,
//       pickup_landmark: pickupLandmark,

//       drop_city: dropCity,
//       drop_city_id: dropCityId,
//       drop_address: dropAddress,
//       drop_landmark: dropLandmark,

//       receiver_name: receiverName,
//       receiver_mobile: receiverMobile,

//       approx_weight: Number(approxWeight),

//       packaging_material_type: packagingMaterialType,
//       loading_unloading: loadingUnloading,

//       remarks,
//     };

//     dispatch(CREATE_BOOKING_PARCEL(bookingData));
//   };

//   const getSubServiceIcon = (title) => {
//     const t = (title || '').toLowerCase();
//     if (t.includes('fragile') || t.includes('glass')) return 'cube-outline';
//     if (t.includes('box') || t.includes('carton')) return 'archive-outline';
//     return 'cube-outline';
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

//   const renderSubServiceCard = ({ item }) => {
//     const isSelected = selectedSubService?.id === item.id;

//     const imageUri = item.image
//       ? `https://sigiride.com/uploads/subservice/${item.image}`
//       : null;

//     return (
//       <TouchableOpacity
//         style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
//         onPress={() => handleSubServiceSelect(item)}
//         activeOpacity={0.85}
//       >
//         <LinearGradient
//           colors={isSelected ? ['#FF1493', '#FF69B4'] : ['#fff', '#fff']}
//           style={styles.vehicleCardInner}
//         >
//           {imageUri ? (
//             <Image source={{ uri: imageUri }} style={styles.vehicleImage} resizeMode="contain" />
//           ) : (
//             <Icon name={getSubServiceIcon(item.title)} size={36} color={isSelected ? '#fff' : '#FF1493'} />
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
//               <Text
//                 style={[
//                   styles.durationText,
//                   selectedPlan?.id === plan.id && styles.selectedText,
//                 ]}
//               >
//                 {plan.plan_hour}h
//               </Text>
//             </View>
//           </View>

//           <Text
//             style={[
//               styles.planDescription,
//               selectedPlan?.id === plan.id && styles.selectedTextLight,
//             ]}
//           >
//             {plan.description !== 'NA'
//               ? plan.description
//               : `${plan.plan_hour} hours • ${plan.plan_km} km`}
//           </Text>

//           <View style={styles.featuresContainer}>
//             <View style={[styles.featureBadge2, selectedPlan?.id === plan.id && styles.featureBadge]}>
//               <Text style={styles.featureText}>{plan.plan_hour} hours</Text>
//             </View>
//             <View style={[styles.featureBadge2, selectedPlan?.id === plan.id && styles.featureBadge]}>
//               <Text style={styles.featureText}>{plan.plan_km} km</Text>
//             </View>
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
//           <Text style={styles.loadingText}>Loading parcel options...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#ff7f50" />

//       <CurvedHeader title="Parcel Booking" navigation={navigation} showBack />

//       <View style={styles.topRight}>{myParcelsButton}</View>

//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={{ flex: 1 }}
//       >
//         <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Choose your parcel type</Text>

//             {subServices && subServices.length > 0 ? (
//               <FlatList
//                 data={subServices}
//                 renderItem={renderSubServiceCard}
//                 keyExtractor={(item) => item.id.toString()}
//                 showsHorizontalScrollIndicator={false}
//                 contentContainerStyle={styles.vehicleList}
//                 scrollEnabled={true}
//               />
//             ) : (
//               <View style={styles.emptyContainer}>
//                 <Text style={styles.emptyText}>No parcel types available</Text>
//               </View>
//             )}
//           </View>

//           {selectedSubService && (
//             <>
//               <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>Details</Text>

//                 <View style={styles.formCard}>
//                   {/* pickup city - with selector */}
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
//                   <View style={styles.divider} />

//                   {/* pickup date */}
//                   <TouchableOpacity style={styles.inputGroup} onPress={() => setShowDatePicker(true)}>
//                     <Icon name="calendar-outline" size={20} color="#FF1493" />
//                     <Text style={styles.dateTimeText}>{pickupDate.toDateString()}</Text>
//                   </TouchableOpacity>
//                   <View style={styles.divider} />

//                   {/* pickup time */}
//                   <TouchableOpacity style={styles.inputGroup} onPress={() => setShowTimePicker(true)}>
//                     <Icon name="time-outline" size={20} color="#FF1493" />
//                     <Text style={styles.dateTimeText}>
//                       {pickupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                     </Text>
//                   </TouchableOpacity>
//                   <View style={styles.divider} />

//                   {/* pickup address */}
//                   <View style={styles.inputGroup}>
//                     <Icon name="home-outline" size={20} color="#FF1493" />
//                     <TextInput
//                       style={styles.input}
//                       placeholder="Pickup Address"
//                       value={pickupAddress}
//                       onChangeText={setPickupAddress}
//                       placeholderTextColor="#999"
//                     />
//                   </View>
//                   <View style={styles.divider} />

//                   <View style={styles.inputGroup}>
//                     <Icon name="flag-outline" size={20} color="#FF1493" />
//                     <TextInput
//                       style={styles.input}
//                       placeholder="Pickup Landmark"
//                       value={pickupLandmark}
//                       onChangeText={setPickupLandmark}
//                       placeholderTextColor="#999"
//                     />
//                   </View>
//                   <View style={styles.divider} />

//                   {/* drop city - with selector */}
//                   <TouchableOpacity
//                     style={styles.inputGroup}
//                     onPress={() => openCitySelector('drop')}
//                     activeOpacity={0.7}
//                   >
//                     <Icon name="navigate-outline" size={20} color="#FF1493" />
//                     <Text style={[styles.inputText, dropCity ? styles.inputTextSelected : styles.inputTextPlaceholder]}>
//                       {dropCity || 'Select Drop City'}
//                     </Text>
//                     <Icon name="chevron-down-outline" size={18} color="#999" />
//                   </TouchableOpacity>
//                   <View style={styles.divider} />

//                   {/* drop address */}
//                   <View style={styles.inputGroup}>
//                     <Icon name="home-outline" size={20} color="#FF1493" />
//                     <TextInput
//                       style={styles.input}
//                       placeholder="Drop Address"
//                       value={dropAddress}
//                       onChangeText={setDropAddress}
//                       placeholderTextColor="#999"
//                     />
//                   </View>
//                   <View style={styles.divider} />

//                   <View style={styles.inputGroup}>
//                     <Icon name="flag-outline" size={20} color="#FF1493" />
//                     <TextInput
//                       style={styles.input}
//                       placeholder="Drop Landmark"
//                       value={dropLandmark}
//                       onChangeText={setDropLandmark}
//                       placeholderTextColor="#999"
//                     />
//                   </View>
//                   <View style={styles.divider} />

//                   {/* receiver name */}
//                   <View style={styles.inputGroup}>
//                     <Icon name="person-outline" size={20} color="#FF1493" />
//                     <TextInput
//                       style={styles.input}
//                       placeholder="Receiver Name"
//                       value={receiverName}
//                       onChangeText={setReceiverName}
//                       placeholderTextColor="#999"
//                     />
//                   </View>
//                   <View style={styles.divider} />

//                   {/* receiver mobile */}
//                   <View style={styles.inputGroup}>
//                     <Icon name="call-outline" size={20} color="#FF1493" />
//                     <TextInput
//                       style={styles.input}
//                       placeholder="Receiver Mobile"
//                       value={receiverMobile}
//                       onChangeText={setReceiverMobile}
//                       keyboardType="phone-pad"
//                       placeholderTextColor="#999"
//                       maxLength={10}
//                     />
//                   </View>
//                   <View style={styles.divider} />

//                   {/* weight */}
//                   <View style={styles.inputGroup}>
//                     <Icon name="weight" size={20} color="#FF1493" />
//                     <TextInput
//                       style={styles.input}
//                       placeholder="Approx Weight (kg)"
//                       value={approxWeight}
//                       onChangeText={setApproxWeight}
//                       keyboardType="decimal-pad"
//                       placeholderTextColor="#999"
//                     />
//                   </View>
//                   <View style={styles.divider} />

//                   {/* packaging dropdown */}
//                   <View style={styles.inputGroup}>
//                     <Icon name="cube-outline" size={20} color="#FF1493" />
//                     <Text style={styles.dropdownLabel}>Packaging</Text>
//                   </View>
//                   <View style={styles.dropdownRow}>
//                     {packagingMaterialTypes.map((t) => (
//                       <TouchableOpacity
//                         key={t}
//                         style={[
//                           styles.dropdownChip,
//                           packagingMaterialType === t && styles.dropdownChipSelected,
//                         ]}
//                         onPress={() => setPackagingMaterialType(t)}
//                         activeOpacity={0.85}
//                       >
//                         <Text
//                           style={[
//                             styles.dropdownChipText,
//                             packagingMaterialType === t && styles.dropdownChipTextSelected,
//                           ]}
//                         >
//                           {t}
//                         </Text>
//                       </TouchableOpacity>
//                     ))}
//                   </View>

//                   <View style={styles.divider} />

//                   {/* loading/unloading dropdown */}
//                   <View style={styles.inputGroup}>
//                     <Icon name="swap-horizontal-outline" size={20} color="#FF1493" />
//                     <Text style={styles.dropdownLabel}>Loading/Unloading</Text>
//                   </View>
//                   <View style={styles.dropdownRow}>
//                     {loadingUnloadingTypes.map((t) => (
//                       <TouchableOpacity
//                         key={t}
//                         style={[
//                           styles.dropdownChip,
//                           loadingUnloading === t && styles.dropdownChipSelected,
//                         ]}
//                         onPress={() => setLoadingUnloading(t)}
//                         activeOpacity={0.85}
//                       >
//                         <Text
//                           style={[
//                             styles.dropdownChipText,
//                             loadingUnloading === t && styles.dropdownChipTextSelected,
//                           ]}
//                         >
//                           {t}
//                         </Text>
//                       </TouchableOpacity>
//                     ))}
//                   </View>

//                   <View style={styles.divider} />

//                   {/* remarks */}
//                   <View style={styles.inputGroup}>
//                     <FontAwesome5 name="comment-dots" size={18} color="#FF1493" />
//                     <TextInput
//                       style={styles.input}
//                       placeholder="Remarks"
//                       value={remarks}
//                       onChangeText={setRemarks}
//                       placeholderTextColor="#999"
//                     />
//                   </View>
//                 </View>
//               </View>

//               {showDatePicker && (
//                 <DateTimePicker
//                   value={pickupDate}
//                   mode="date"
//                   display="default"
//                   onChange={(event, selectedDate) => {
//                     setShowDatePicker(false);
//                     if (selectedDate) setPickupDate(new Date(selectedDate));
//                   }}
//                   minimumDate={new Date()}
//                 />
//               )}

//               {showTimePicker && (
//                 <DateTimePicker
//                   value={pickupTime}
//                   mode="time"
//                   display="default"
//                   onChange={(event, selectedTime) => {
//                     setShowTimePicker(false);
//                     if (selectedTime) setPickupTime(new Date(selectedTime));
//                   }}
//                 />
//               )}

//               {/* Plans */}
//               <View style={styles.section}>
//                 <Text style={styles.sectionTitle}>Select Plan</Text>
//                 <Text style={styles.sectionSubtitle}>
//                   Plans for{' '}
//                   <Text style={{ color: '#FF1493', fontWeight: 'bold' }}>{selectedSubService.title}</Text>
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
//                     <Text style={styles.emptyText}>No plans available for this parcel type</Text>
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
//         onRequestClose={() => {
//           setCitiesModalVisible(false);
//           setCitySearchText('');
//         }}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>
//                 Select {activeCityField === 'pickup' ? 'Pickup' : 'Drop'} City
//               </Text>
//               <TouchableOpacity
//                 onPress={() => {
//                   setCitiesModalVisible(false);
//                   setCitySearchText('');
//                 }}
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

//       <View style={styles.bottomContainer}>
//         <TouchableOpacity
//           style={[
//             styles.submitButton,
//             (!selectedSubService || !selectedPlan || bookingLoading) && styles.disabledButton,
//           ]}
//           onPress={handleSubmitBooking}
//           disabled={!selectedSubService || !selectedPlan || bookingLoading}
//         >
//           <LinearGradient colors={['#FF1493', '#FF69B4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
//             {bookingLoading ? (
//               <ActivityIndicator size="small" color="#fff" />
//             ) : (
//               <>
//                 <Text style={styles.submitButtonText}>Confirm Parcel Booking</Text>
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
//   topRight: {
//     zIndex: 10,
//     width: '100%',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     marginTop: 12,
//   },
//   myParcelsBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     paddingHorizontal: 12,
//     paddingVertical: 18,
//     borderRadius: 16,
//     backgroundColor: '#FF1493',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.12,
//     shadowRadius: 6,
//     elevation: 6,
//     width: '100%',
//     justifyContent: 'center',
//     alignSelf: 'center',
//   },
//   myParcelsText: {
//     color: '#fff',
//     fontWeight: '700',
//     fontSize: 12,
//   },
//   scrollContent: {
//     paddingBottom: 120,
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
//     marginBottom: 8,
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
//     flexShrink: 1,
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
//   input: {
//     flex: 1,
//     fontSize: 14,
//     color: '#333',
//     padding: 0,
//   },
//   inputText: {
//     flex: 1,
//     fontSize: 14,
//   },
//   inputTextSelected: {
//     color: '#333',
//   },
//   inputTextPlaceholder: {
//     color: '#999',
//   },
//   divider: {
//     height: 1,
//     backgroundColor: '#f0f0f0',
//   },
//   dateTimeText: {
//     flex: 1,
//     fontSize: 14,
//     color: '#333',
//   },

//   dropdownLabel: {
//     flex: 1,
//     fontSize: 13,
//     color: '#333',
//     fontWeight: '700',
//   },
//   dropdownRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     gap: 8,
//   },
//   dropdownChip: {
//     backgroundColor: 'rgba(0,0,0,0.05)',
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//     borderRadius: 16,
//   },
//   dropdownChipSelected: {
//     backgroundColor: '#FF1493',
//   },
//   dropdownChipText: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#444',
//   },
//   dropdownChipTextSelected: {
//     color: '#fff',
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
// });

// export default ParcelVehicleSelectionScreen;

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import axios from 'axios';
import Geolocation from '@react-native-community/geolocation';

import CurvedHeader from '../../components/CurvedHeader';
import {
  CREATE_BOOKING,
  GET_PLANS,
  GET_SUB_SERVICES,
  CLEAR_BOOKING_DATA,
  CREATE_BOOKING_PARCEL,
} from '../../redux/actions/action-creator';

const { width } = Dimensions.get('window');
const API_BASE_URL = 'https://sigiride.com';

const ParcelVehicleSelectionScreen = ({ route, navigation }) => {
  const { service_id } = route.params;

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
const scrollViewRef = useRef(null);
const detailsSectionY = useRef(0);

  const [selectedSubService, setSelectedSubService] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // City data and selection states
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesModalVisible, setCitiesModalVisible] = useState(false);
  const [citySearchText, setCitySearchText] = useState('');
  const [activeCityField, setActiveCityField] = useState(null); // 'pickup' or 'drop'

  // Dropdown focus states
  const [pickupDropdownFocus, setPickupDropdownFocus] = useState(false);
  const [dropDropdownFocus, setDropDropdownFocus] = useState(false);

  // form
  const [pickupCity, setPickupCity] = useState('');
  const [pickupCityId, setPickupCityId] = useState(null);
  const [dropCity, setDropCity] = useState('');
  const [dropCityId, setDropCityId] = useState(null);
  const [pickupDate, setPickupDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickupTime, setPickupTime] = useState(new Date());

  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLandmark, setPickupLandmark] = useState('');
  const [dropAddress, setDropAddress] = useState('');
  const [dropLandmark, setDropLandmark] = useState('');

  const [receiverName, setReceiverName] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');
  const [approxWeight, setApproxWeight] = useState('');
  const [weightType, setWeightType] = useState('kg');

  const packagingMaterialTypes = useMemo(
    () => ['Plastic', 'Paper', 'Carton', 'Glass', 'Iron'],
    [],
  );
  const weightTypeOptions = useMemo(() => [
    { label: 'Kg', value: 'Kg' },
    { label: 'Gram', value: 'Gram' },
  ], []);
  const loadingUnloadingTypes = useMemo(
    () => ['User End', 'Captain End'],
    [],
  );

  const [packagingMaterialType, setPackagingMaterialType] = useState('Carton');
  const [loadingUnloading, setLoadingUnloading] = useState('Captain End');

  const [remarks, setRemarks] = useState('');

  // Pickup coordinates, captured silently so captains' "Search Area" radius (set per
  // vehicle type in admin) can actually filter parcel pickups by distance — same as In-City.
  const [pickupLat, setPickupLat] = useState(null);
  const [pickupLng, setPickupLng] = useState(null);

  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        setPickupLat(position.coords.latitude);
        setPickupLng(position.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  // Fetch cities on component mount
  useEffect(() => {
    fetchCities();
  }, []);

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

  // Open city selection modal
  const openCitySelector = (fieldType) => {
    setActiveCityField(fieldType);
    setCitySearchText('');
    setFilteredCities(cities);
    setCitiesModalVisible(true);
  };

  // Handle city selection
  const handleCitySelect = (city) => {
    if (activeCityField === 'pickup') {
      setPickupCity(city.name);
      setPickupCityId(city.id);
    } else if (activeCityField === 'drop') {
      setDropCity(city.name);
      setDropCityId(city.id);
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
      Alert.alert('Success', 'Parcel booking created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [bookingSuccess, navigation]);

  useEffect(() => {
    if (bookingError) {
      Alert.alert('Booking Failed', bookingError);
    }
  }, [bookingError]);

  const myParcelsButton = (
    <TouchableOpacity
      style={styles.myParcelsBtn}
      onPress={() => {
        navigation.navigate('MyParcels');
      }}
      activeOpacity={0.9}
    >
      <Icon name="cube-outline" size={18} color="#fff" />
      <Text style={styles.myParcelsText}>My Parcels</Text>
    </TouchableOpacity>
  );

  const formatDateOnly = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const formatTimeOnly = (d) => {
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = '00';
    return `${hh}:${mi}:${ss}`;
  };

  const validateForm = () => {
    if (!selectedSubService) {
      Alert.alert('Validation Error', 'Please select a parcel type');
      return false;
    }
    if (!pickupCity.trim()) {
      Alert.alert('Validation Error', 'Please select pickup city');
      return false;
    }
    if (!pickupAddress.trim()) {
      Alert.alert('Validation Error', 'Please enter pickup address');
      return false;
    }
    if (!dropCity.trim()) {
      Alert.alert('Validation Error', 'Please select drop city');
      return false;
    }
    if (!dropAddress.trim()) {
      Alert.alert('Validation Error', 'Please enter drop address');
      return false;
    }
    if (!receiverName.trim()) {
      Alert.alert('Validation Error', 'Please enter receiver name');
      return false;
    }
    if (!receiverMobile.trim() || receiverMobile.trim().length < 10) {
      Alert.alert('Validation Error', 'Please enter valid receiver mobile');
      return false;
    }
    if (!approxWeight.trim() || Number.isNaN(Number(approxWeight))) {
      Alert.alert('Validation Error', 'Please enter valid approx weight');
      return false;
    }
    if (!selectedPlan) {
      Alert.alert('Validation Error', 'Please select a plan');
      return false;
    }
    return true;
  };

  const handleSubServiceSelect = (item) => {
    setSelectedSubService(item);
    setSelectedPlan(null);
    dispatch(GET_PLANS(service_id, item.id));
    setTimeout(() => {
    scrollViewRef.current?.scrollTo({
      y: detailsSectionY.current,
      animated: true,
    });
  }, 300);
  };
useEffect(() => {
  if (selectedSubService) {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: detailsSectionY.current,
        animated: true,
      });
    });
  }
}, [selectedSubService]);
  const handleSubmitBooking = () => {
    if (!validateForm()) return;

    const bookingData = {
      service_id,
      sub_service_id: selectedSubService.id,
      plan_id: selectedPlan.id,

      pickup_city: pickupCity,
      pickup_city_id: pickupCityId,
      pickup_date: formatDateOnly(pickupDate),
      pickup_time: formatTimeOnly(pickupTime),
      pickup_address: pickupAddress,
      pickup_landmark: pickupLandmark,
      pickup_lat: pickupLat != null ? String(pickupLat) : undefined,
      pickup_lng: pickupLng != null ? String(pickupLng) : undefined,

      drop_city: dropCity,
      drop_city_id: dropCityId,
      drop_address: dropAddress,
      drop_landmark: dropLandmark,

      receiver_name: receiverName,
      receiver_mobile: receiverMobile,

      approx_weight: Number(approxWeight),
      weight_type: weightType,

      packaging_material_type: packagingMaterialType,
      loading_unloading: loadingUnloading,

      remarks,
    };

    dispatch(CREATE_BOOKING_PARCEL(bookingData));
  };

  const getSubServiceIcon = (title) => {
    const t = (title || '').toLowerCase();
    if (t.includes('fragile') || t.includes('glass')) return 'cube-outline';
    if (t.includes('box') || t.includes('carton')) return 'archive-outline';
    return 'cube-outline';
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

  const renderSubServiceCard = ({ item }) => {
    const isSelected = selectedSubService?.id === item.id;

    const imageUri = item.image
      ? `https://sigiride.com/uploads/subservice/${item.image}`
      : null;

    return (
      <TouchableOpacity
        style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
        onPress={() => handleSubServiceSelect(item)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={isSelected ? ['#FF1493', '#FF69B4'] : ['#fff', '#fff']}
          style={styles.vehicleCardInner}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.vehicleImage} resizeMode="contain" />
          ) : (
            <Icon name={getSubServiceIcon(item.title)} size={36} color={isSelected ? '#fff' : '#FF1493'} />
          )}
          <View>
          <Text style={[styles.vehicleTitle, isSelected && styles.vehicleTitleSelected]}>
            {item.title}
          </Text>
 {item.description && <Text style={[styles.vehicleTitle, isSelected && styles.vehicleTitleSelected,{fontSize: 12, fontWeight: '400', color: isSelected ? '#fff' : '#666', textAlign: 'left',marginTop:10}]}>
            {item.description}
          </Text>}
          </View>
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
              <Text
                style={[
                  styles.durationText,
                  selectedPlan?.id === plan.id && styles.selectedText,
                ]}
              >
                {plan.plan_hour}h
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.planDescription,
              selectedPlan?.id === plan.id && styles.selectedTextLight,
            ]}
          >
            {plan.description !== 'NA'
              ? plan.description
              : `${plan.plan_hour} hours • ${plan.plan_km} km`}
          </Text>

          <View style={styles.featuresContainer}>
            <View style={[styles.featureBadge2, selectedPlan?.id === plan.id && styles.featureBadge]}>
              <Text style={styles.featureText}>{plan.plan_hour} hours</Text>
            </View>
            <View style={[styles.featureBadge2, selectedPlan?.id === plan.id && styles.featureBadge]}>
              <Text style={styles.featureText}>{plan.plan_km} km</Text>
            </View>
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
          <Text style={styles.loadingText}>Loading parcel options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ff7f50" />

      <CurvedHeader title="Parcel Booking" navigation={navigation} showBack />

      <View style={styles.topRight}>{myParcelsButton}</View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView  ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose your parcel type</Text>

            {subServices && subServices.length > 0 ? (
              <FlatList
                data={subServices}
                renderItem={renderSubServiceCard}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.vehicleList}
                scrollEnabled={true}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No parcel types available</Text>
              </View>
            )}
          </View>

          {selectedSubService && (
            <>
              <View style={styles.section}
               onLayout={(event) => {
        detailsSectionY.current = event.nativeEvent.layout.y;
      }}>
                <Text style={styles.sectionTitle}>Details</Text>

                <View style={styles.formCard}>
                  {/* pickup city - Input */}
                  <View style={[styles.dropdown, { flexDirection: 'row', alignItems: 'center' }]}>
                    <Icon name="location-outline" size={20} color="#FF1493" style={styles.dropdownIcon} />
                    <TextInput
                      style={{ flex: 1, fontSize: 14, color: '#333', padding: 0 }}
                      placeholder="Enter Pickup City"
                      placeholderTextColor="#999"
                      value={pickupCity}
                      onChangeText={setPickupCity}
                    />
                  </View>

                  <View style={styles.divider} />

                  {/* pickup date */}
                  <TouchableOpacity style={styles.inputGroup} onPress={() => setShowDatePicker(true)}>
                    <Icon name="calendar-outline" size={20} color="#FF1493" />
                    <Text style={styles.dateTimeText}>{pickupDate.toDateString()}</Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />

                  {/* pickup time */}
                  <TouchableOpacity style={styles.inputGroup} onPress={() => setShowTimePicker(true)}>
                    <Icon name="time-outline" size={20} color="#FF1493" />
                    <Text style={styles.dateTimeText}>
                      {pickupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.divider} />

                  {/* pickup address */}
                  <View style={styles.inputGroup}>
                    <Icon name="home-outline" size={20} color="#FF1493" />
                    <TextInput
                      style={styles.input}
                      placeholder="Pickup Address"
                      value={pickupAddress}
                      onChangeText={setPickupAddress}
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.divider} />

                  <View style={styles.inputGroup}>
                    <Icon name="flag-outline" size={20} color="#FF1493" />
                    <TextInput
                      style={styles.input}
                      placeholder="Pickup Landmark"
                      value={pickupLandmark}
                      onChangeText={setPickupLandmark}
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.divider} />

                  {/* drop city - Input */}
                  <View style={[styles.dropdown, { flexDirection: 'row', alignItems: 'center' }]}>
                    <Icon name="navigate-outline" size={20} color="#FF1493" style={styles.dropdownIcon} />
                    <TextInput
                      style={{ flex: 1, fontSize: 14, color: '#333', padding: 0 }}
                      placeholder="Enter Drop City"
                      placeholderTextColor="#999"
                      value={dropCity}
                      onChangeText={setDropCity}
                    />
                  </View>

                  <View style={styles.divider} />

                  {/* drop address */}
                  <View style={styles.inputGroup}>
                    <Icon name="home-outline" size={20} color="#FF1493" />
                    <TextInput
                      style={styles.input}
                      placeholder="Drop Address"
                      value={dropAddress}
                      onChangeText={setDropAddress}
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.divider} />

                  <View style={styles.inputGroup}>
                    <Icon name="flag-outline" size={20} color="#FF1493" />
                    <TextInput
                      style={styles.input}
                      placeholder="Drop Landmark"
                      value={dropLandmark}
                      onChangeText={setDropLandmark}
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.divider} />

                  {/* receiver name */}
                  <View style={styles.inputGroup}>
                    <Icon name="person-outline" size={20} color="#FF1493" />
                    <TextInput
                      style={styles.input}
                      placeholder="Receiver Name"
                      value={receiverName}
                      onChangeText={setReceiverName}
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.divider} />

                  {/* receiver mobile */}
                  <View style={styles.inputGroup}>
                    <Icon name="call-outline" size={20} color="#FF1493" />
                    <TextInput
                      style={styles.input}
                      placeholder="Receiver Mobile"
                      value={receiverMobile}
                      onChangeText={setReceiverMobile}
                      keyboardType="phone-pad"
                      placeholderTextColor="#999"
                      maxLength={10}
                    />
                  </View>
                  <View style={styles.divider} />

                  {/* weight */}
                  <View style={styles.inputGroup}>
                    <Icon name="weight" size={20} color="#FF1493" />
                    <TextInput
                      style={styles.input}
                      placeholder="Approx Weight"
                      value={approxWeight}
                      onChangeText={setApproxWeight}
                      keyboardType="decimal-pad"
                      placeholderTextColor="#999"
                    />
                  </View>
                  <View style={styles.divider} />

                  {/* weight type dropdown */}
                  <View style={styles.inputGroup}>
                    <Icon name="scale-outline" size={20} color="#FF1493" />
                    <Text style={styles.dropdownLabel}>Weight Type</Text>
                  </View>
                  <View style={styles.dropdownRow}>
                    {weightTypeOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.dropdownChip,
                          weightType === option.value && styles.dropdownChipSelected,
                        ]}
                        onPress={() => setWeightType(option.value)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.dropdownChipText,
                            weightType === option.value && styles.dropdownChipTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.divider} />

                  {/* packaging dropdown */}
                  <View style={styles.inputGroup}>
                    <Icon name="cube-outline" size={20} color="#FF1493" />
                    <Text style={styles.dropdownLabel}>Packaging</Text>
                  </View>
                  <View style={styles.dropdownRow}>
                    {packagingMaterialTypes.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.dropdownChip,
                          packagingMaterialType === t && styles.dropdownChipSelected,
                        ]}
                        onPress={() => setPackagingMaterialType(t)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.dropdownChipText,
                            packagingMaterialType === t && styles.dropdownChipTextSelected,
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.divider} />

                  {/* loading/unloading dropdown */}
                  <View style={styles.inputGroup}>
                    <Icon name="swap-horizontal-outline" size={20} color="#FF1493" />
                    <Text style={styles.dropdownLabel}>Loading/Unloading</Text>
                  </View>
                  <View style={styles.dropdownRow}>
                    {loadingUnloadingTypes.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.dropdownChip,
                          loadingUnloading === t && styles.dropdownChipSelected,
                        ]}
                        onPress={() => setLoadingUnloading(t)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.dropdownChipText,
                            loadingUnloading === t && styles.dropdownChipTextSelected,
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.divider} />

                  {/* remarks */}
                  <View style={styles.inputGroup}>
                    <FontAwesome5 name="comment-dots" size={18} color="#FF1493" />
                    <TextInput
                      style={styles.input}
                      placeholder="Remarks"
                      value={remarks}
                      onChangeText={setRemarks}
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={pickupDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setPickupDate(new Date(selectedDate));
                  }}
                  minimumDate={new Date()}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={pickupTime}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) setPickupTime(new Date(selectedTime));
                  }}
                />
              )}

              {/* Plans */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Select Plan</Text>
                <Text style={styles.sectionSubtitle}>
                  Plans for{' '}
                  <Text style={{ color: '#FF1493', fontWeight: 'bold' }}>{selectedSubService.title}</Text>
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
                    <Text style={styles.emptyText}>No plans available for this parcel type</Text>
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
        onRequestClose={() => {
          setCitiesModalVisible(false);
          setCitySearchText('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {activeCityField === 'pickup' ? 'Pickup' : 'Drop'} City
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setCitiesModalVisible(false);
                  setCitySearchText('');
                }}
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

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedSubService || !selectedPlan || bookingLoading) && styles.disabledButton,
          ]}
          onPress={handleSubmitBooking}
          disabled={!selectedSubService || !selectedPlan || bookingLoading}
        >
          <LinearGradient colors={['#FF1493', '#FF69B4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
            {bookingLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Confirm Parcel Booking</Text>
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
  topRight: {
    zIndex: 10,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  myParcelsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#FF1493',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
    width: '100%',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  myParcelsText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  scrollContent: {
    paddingBottom: 120,
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
    marginBottom: 8,
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
    flexShrink: 1,
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
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    padding: 0,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
  },
  inputTextSelected: {
    color: '#333',
  },
  inputTextPlaceholder: {
    color: '#999',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  dateTimeText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },

  dropdownLabel: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    fontWeight: '700',
  },
  dropdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  dropdownChip: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
  },
  dropdownChipSelected: {
    backgroundColor: '#FF1493',
  },
  dropdownChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444',
  },
  dropdownChipTextSelected: {
    color: '#fff',
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
    marginHorizontal: 12,
    marginVertical: 6,
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
});

export default ParcelVehicleSelectionScreen;