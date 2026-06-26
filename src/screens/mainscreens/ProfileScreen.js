import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import ImagePicker from 'react-native-image-crop-picker';
import {
  GET_USER_PROFILE,
  UPDATE_USER_PROFILE,
  logout,
} from '../../redux/actions/action-creator';
import CurvedHeader from '../../components/CurvedHeader';

const ProfileScreen = ({ navigation }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [profileData, setProfileData] = useState(user || null);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || user?.phone || '');
  const [profileImage, setProfileImage] = useState(user?.profile || '');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fillProfile = useCallback((data) => {
    if (!data) return;

    setProfileData(data);
    setName(data.name || '');
    setEmail(data.email || '');
    setMobile(data.mobile || data.phone || '');
    setProfileImage(data.profile || '');
    setSelectedImage(null);
  }, []);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await dispatch(GET_USER_PROFILE());
      console.log('res?.data',res?.data);
      
      if (res?.status && res?.data) {
        fillProfile(res.data);
      } else {
        Alert.alert('Error', res?.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.log('Fetch profile error:', error);
      Alert.alert('Error', 'Something went wrong while fetching profile');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, fillProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  };

  const pickProfileImage = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 600,
        height: 600,
        cropping: true,
        mediaType: 'photo',
        compressImageQuality: 0.8,
      });

      setSelectedImage(image);
      setProfileImage(image.path);
    } catch (error) {
      if (error?.code !== 'E_PICKER_CANCELLED') {
        console.log('Image picker error:', error);
        Alert.alert('Error', 'Unable to select profile image');
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    if (email.trim()) {
      formData.append('email', email.trim());
    }

    if (selectedImage?.path) {
      const fileName = selectedImage.filename || selectedImage.path.split('/').pop() || `profile_${Date.now()}.jpg`;
      formData.append('profile', {
        uri: selectedImage.path,
        type: selectedImage.mime || 'image/jpeg',
        name: fileName,
      });
    }

    setIsSaving(true);
    try {
      const res = await dispatch(UPDATE_USER_PROFILE(formData));
      if (res?.status) {
        Alert.alert('Success', res?.message || 'Profile updated successfully');
        fillProfile(res.data);
      } else {
        Alert.alert('Error', res?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.log('Update profile error:', error);
      Alert.alert('Error', 'Something went wrong while updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => dispatch(logout()) },
      ],
      { cancelable: true }
    );
  };

  const hasProfileImage = Boolean(profileImage);
  console.log('profileImage===>',profileImage);
const secureProfileImage = profileImage.replace('http://', 'https://');

  return (
    <View style={styles.container}>
      <CurvedHeader title="Profile" navigation={navigation} showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF1493']}
            tintColor="#FF1493"
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {isLoading && !profileData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF1493" />
          </View>
        ) : (
          <>
            <View style={styles.profileHeader}>
              <TouchableOpacity
                style={styles.imageWrapper}
                onPress={pickProfileImage}
                activeOpacity={0.85}
              >
                {hasProfileImage ? (
                  <Image source={{ uri: secureProfileImage }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Icon name="person" size={54} color="#FF1493" />
                  </View>
                )}
                <View style={styles.cameraButton}>
                  <Icon name="camera" size={18} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.nameText}>{profileData?.name || 'User'}</Text>
              <Text style={styles.mobileText}>{mobile || 'Mobile not available'}</Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter email (optional)"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={mobile}
                  editable={false}
                  placeholder="Mobile"
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.disabledButton]}
                onPress={handleUpdateProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Update Profile</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Icon name="log-out-outline" size={22} color="#FF3B30" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  loadingContainer: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeader: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrapper: {
    width: 116,
    height: 116,
    borderRadius: 58,
    marginBottom: 14,
  },
  profileImage: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#f0f0f0',
  },
  profilePlaceholder: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#FFF0F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF1493',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A2B4E',
  },
  mobileText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2B4E',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E4EA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#222',
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#777',
  },
  saveButton: {
    backgroundColor: '#FF1493',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '700',
  },
});

export default ProfileScreen;
