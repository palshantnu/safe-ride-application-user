import React from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import RenderHTML from 'react-native-render-html';
import CurvedHeader from '../../components/CurvedHeader';

const InfoPageScreen = ({ route, navigation }) => {
  const { page } = route.params || {};
  const { width } = useWindowDimensions();
  const pageTitle = page?.title?.replace(/_/g, ' ')?.replace(/\b\w/g, (l) => l.toUpperCase()) || 'Page';
  const content = page?.content || '<p>No content available</p>';

  return (
    <View style={styles.container}>
      <CurvedHeader title={pageTitle} navigation={navigation} showBack />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <RenderHTML
          contentWidth={width - 32}
          source={{ html: content }}
          tagsStyles={htmlStyles}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingVertical: 16,
  },
});

const htmlStyles = {
  body: {
    color: '#333',
    fontSize: 16,
    lineHeight: 24,
  },
  p: {
    marginBottom: 12,
  },
  a: {
    color: '#FF1493',
  },
};

export default InfoPageScreen;
