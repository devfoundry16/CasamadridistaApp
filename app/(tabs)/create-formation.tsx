import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import Colors from '@/constants/colors';

export default function CreateFormationScreen() {
  const htmlSource = Platform.select({
    web: { uri: '@/assets/html/index.html' },
    default: require('@/assets/html/index.html'),
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Create Formation',
          headerStyle: {
            backgroundColor: Colors.secondary,
          },
          headerTintColor: Colors.textWhite,
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }}
      />
      <View style={styles.container}>
        <WebView
          source={htmlSource}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  webview: {
    flex: 1,
  },
});
