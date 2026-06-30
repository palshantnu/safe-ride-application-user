import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

const CurvedHeader = ({
  title,
  navigation,
  showBack = false,
  onBackPress,
  right,
  left,
  style,
  titleStyle,
}) => {
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    navigation?.goBack?.();
  };

  return (
    <LinearGradient
      colors={['#ff7f50', '#ff7f50', '#e20f7a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, style]}
    >
      <View style={styles.headerRow}>
        <View style={styles.side}>
          {left || (showBack ? (
            <TouchableOpacity style={styles.iconButton} onPress={handleBack} activeOpacity={0.8}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ) : null)}
        </View>

        <Text style={[styles.title, titleStyle]} numberOfLines={1}>
          {title}
        </Text>

        <View style={[styles.side, styles.rightSide]}>
          {right || null}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 10,
    paddingBottom: 0,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: {
    width: 54,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightSide: {
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CurvedHeader;
