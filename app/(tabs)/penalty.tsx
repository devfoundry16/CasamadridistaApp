import React from "react";
import { View, ActivityIndicator } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { WebView } from "react-native-webview";
import { useFocusEffect, useRouter } from "expo-router";
import { development } from "@/config/environment";

export default function WebViewScreen() {
  // const currentUrl = "https://showcase.codethislab.com/games/penalty_kicks/";
  const currentUrl = `${development.DEFAULT_BACKEND_URL}/penalty`;
  const router = useRouter();
  useFocusEffect(
    React.useCallback(() => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE
      ).catch((error) => {
        console.error("Failed to lock landscape:", error);
      });
      return () => {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        ).catch((error) => {
          console.error("Failed to lock portrait:", error);
        });
      };
    }, [])
  );
  const handleMessage = React.useCallback((event: any) => {
    router.navigate("/team");
  }, []);

  return (
    <View className="flex-1 bg-bg-medium">
      <View className="flex-1 relative">
        <WebView
          source={{ uri: currentUrl }}
          className="flex-1"
          onMessage={handleMessage}
          startInLoadingState={true}
          renderLoading={() => <></>}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error("WebView Error:", nativeEvent);
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={true}
        />
      </View>
    </View>
  );
}
