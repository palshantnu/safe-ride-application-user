import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { subscribeRingState, stopNotificationSound } from '../utils/notificationRing';

// Floating button shown app-wide only while the arrival/notification ring is
// playing, so the user can silence it without needing to open the booking.
const RingMuteButton = () => {
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeRingState(setIsRinging);
    return unsubscribe;
  }, []);

  if (!isRinging) return null;

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={stopNotificationSound}
      activeOpacity={0.8}
    >
      <Icon name="bell-off" size={16} color="#fff" />
      <Text style={styles.text}>Mute Ring</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 55,
    right: 16,
    zIndex: 999,
    elevation: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#37474F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  text: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

export default RingMuteButton;
