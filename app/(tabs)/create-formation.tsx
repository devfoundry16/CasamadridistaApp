import React, { useRef } from "react";
import { View, StyleSheet, Platform, Dimensions } from "react-native";
import { Stack } from "expo-router";
import Colors from "@/constants/colors";
import { WebView } from 'react-native-webview';
const { width, height } = Dimensions.get('window');
export default function CreateFormationScreen() {
  const htmlSource = Platform.select({
    default: { uri: "http://localhost:5000" },
    android: { uri: "http://192.168.110.111:5000" }
  });
  const webViewRef = useRef(null);
  return (
    <>
      <Stack.Screen
        options={{
          title: "Create Formation",
          headerStyle: {
            backgroundColor: Colors.secondary,
          },
          headerTintColor: Colors.textWhite,
          headerTitleStyle: {
            fontWeight: "700" as const,
          },
        }}
      />
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={htmlSource}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          allowFileAccess={true}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.text,
    margin: 0,
    padding: 0,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
    margin: 0,
    padding: 0,
  },
});
