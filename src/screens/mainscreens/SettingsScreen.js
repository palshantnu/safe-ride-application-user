import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/actions/action-creator';
import { fetchPagesByRole } from '../../services/Services';
import CurvedHeader from '../../components/CurvedHeader';

const MenuItem = ({ icon, title, onPress, showArrow = true, isSwitch = false, value, onValueChange }) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={isSwitch}>
    <View style={styles.settingLeft}>
      <Icon name={icon} size={24} color="#FF1493" />
      <Text style={styles.settingTitle}>{title}</Text>
    </View>
    {isSwitch ? (
      <Switch
        trackColor={{ false: '#767577', true: '#FF1493' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
        onValueChange={onValueChange}
        value={value}
      />
    ) : (
      showArrow && <Icon name="chevron-forward-outline" size={24} color="#999" />
    )}
  </TouchableOpacity>
);

const SettingsScreen = ({ navigation }) => {  // Add navigation prop
  const [notifications, setNotifications] = useState(true);
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [pagesError, setPagesError] = useState(null);

  const dispatch = useDispatch();

  const fetchSettingsPages = async () => {
    setLoadingPages(true);
    setPagesError(null);

    try {
      const response = await fetchPagesByRole({ role: 'user' });
      setPages(response.data || []);
    } catch (error) {
      setPagesError('Unable to load pages at the moment');
    } finally {
      setLoadingPages(false);
    }
  };

  useEffect(() => {
    fetchSettingsPages();
  }, []);

  const getPageTitle = (page) => {
    if (page?.page_type === 'privacy') return 'Privacy Policy';
    if (page?.page_type === 'custom') return page?.title?.replace(/_/g, ' ')?.replace(/\b\w/g, (l) => l.toUpperCase());
    return page?.title?.replace(/_/g, ' ')?.replace(/\b\w/g, (l) => l.toUpperCase()) || 'Page';
  };

  const handlePagePress = (page) => {
    navigation.navigate('InfoPage', { page });
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Settings */}
      <CurvedHeader title="Settings" />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Settings</Text>
        <MenuItem
          icon="person-outline"
          title="Profile Settings"
          onPress={() => navigation.navigate('Profile')}
        />
      </View>

      {/* Notification */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification</Text>
        <MenuItem
          icon="notifications-outline"
          title="Notification"
          isSwitch={true}
          value={notifications}
          onValueChange={setNotifications}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pages</Text>
        {loadingPages ? (
          <Text style={styles.pageStatus}>Loading pages...</Text>
        ) : pagesError ? (
          <Text style={styles.pageStatus}>{pagesError}</Text>
        ) : pages.length === 0 ? (
          <Text style={styles.pageStatus}>No pages available</Text>
        ) : (
          pages.map((page) => (
            <MenuItem
              key={page.id}
              icon="document-text-outline"
              title={getPageTitle(page)}
              onPress={() => handlePagePress(page)}
            />
          ))
        )}
      </View>

      {/* SIGI Ride Captain App */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SIGI Ride Captain</Text>
        <MenuItem
          icon="shield-checkmark-outline"
          title="Open SIGI Ride Captain"
          onPress={() => {
            const url = 'https://play.google.com/store/apps/details?id=com.sigiridecaptain';
            Linking.openURL(url).catch(() => {
              Alert.alert('Error', 'Unable to open Play Store.');
            });
          }}
        />
      </View>

      {/* Chat Support - Updated to navigate to chat screen */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chat Support</Text>
        <MenuItem
          icon="chatbubble-outline"
          title="Chat Support"
          onPress={() => navigation.navigate('ChatSupport')}  // Navigate to chat screen
        />
      </View>

      {/* Logout */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 10,
    marginLeft: 5,
  },
  pageStatus: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: '#777',
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  logoutSection: {
    backgroundColor: '#FF1493',
    marginTop: 0,
    marginBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    width: '90%',
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    borderRadius: 10
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  logoutText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
    fontWeight: '600',
  },
});

export default SettingsScreen;
