import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import CurvedHeader from '../../components/CurvedHeader';
import SimpleToast from 'react-native-simple-toast';

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Ride Completed Successfully',
    message: 'Your ride to Airport Terminal 2 is completed. Thank you for riding with SafeRide!',
    time: '2 hours ago',
    type: 'ride',
    read: false,
  },
  {
    id: '2',
    title: 'Wallet Recharge Successful',
    message: 'We received your payment of ₹500. Your new wallet balance has been updated.',
    time: '5 hours ago',
    type: 'payment',
    read: false,
  },
  {
    id: '3',
    title: '50% Off On Your Next Ride!',
    message: 'Use promo code SAFERIDE50 to get up to 50% discount on your next city ride. Valid till Sunday.',
    time: '1 day ago',
    type: 'promo',
    read: true,
  },
  {
    id: '4',
    title: 'Account Verification Complete',
    message: 'Your profile details and identity verification have been approved successfully.',
    time: '3 days ago',
    type: 'system',
    read: true,
  },
];

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      // Keep state as is, just simulate refresh
      setRefreshing(false);
      SimpleToast.show('Notifications updated');
    }, 1000);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
    SimpleToast.show('All marked as read');
  };

  const handleClearAll = () => {
    setNotifications([]);
    SimpleToast.show('All notifications cleared');
  };

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleDeleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    SimpleToast.show('Notification deleted');
  };

  const getNotificationConfig = (type) => {
    switch (type) {
      case 'ride':
        return { icon: 'map-pin', color: '#FF1493', bgColor: '#FFF0F5' };
      case 'payment':
        return { icon: 'dollar-sign', color: '#4CD964', bgColor: '#E8F9ED' };
      case 'promo':
        return { icon: 'gift', color: '#FF9500', bgColor: '#FFF9E6' };
      case 'system':
      default:
        return { icon: 'info', color: '#007AFF', bgColor: '#E6F2FF' };
    }
  };

  const renderItem = ({ item }) => {
    const config = getNotificationConfig(item.type);

    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.unreadCard]}
        onPress={() => handleMarkAsRead(item.id)}
        activeOpacity={0.9}
      >
        <View style={[styles.iconWrapper, { backgroundColor: config.bgColor }]}>
          <Icon name={config.icon} size={20} color={config.color} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.cardHeader}>
            <Text style={[styles.title, !item.read && styles.unreadTitle]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item.id)}
          activeOpacity={0.7}
        >
          <Icon name="trash-2" size={16} color="#8E8E93" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ff7f50" />
      <CurvedHeader
        title="Notifications"
        showBack={true}
        navigation={navigation}
        right={
          notifications.length > 0 ? (
            <TouchableOpacity style={styles.headerRight} onPress={handleClearAll}>
              <Icon name="trash" size={20} color="#fff" />
            </TouchableOpacity>
          ) : null
        }
      />

      {notifications.length > 0 && (
        <View style={styles.actionRow}>
          <Text style={styles.countText}>{notifications.filter(n => !n.read).length} Unread</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleMarkAllRead}>
            <Icon name="check-square" size={14} color="#FF1493" />
            <Text style={styles.actionText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF1493']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
              <Icon name="bell-off" size={60} color="#FF1493" />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any notifications right now.
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerRight: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF1493',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  unreadCard: {
    backgroundColor: '#FFF9FB',
    borderColor: '#FFE0EB',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF1493',
  },
  message: {
    fontSize: 13,
    color: '#3A3A3C',
    marginTop: 4,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 6,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
    marginBottom: 28,
  },
  backButton: {
    backgroundColor: '#FF1493',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default NotificationScreen;
