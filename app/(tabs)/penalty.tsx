import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "expo-router";
import Colors from "@/constants/colors";
import { Spinner } from "@/components/Spinner";
import { development } from "@/config/environment";
export default function WebViewScreen() {
  // const currentUrl = "https://showcase.codethislab.com/games/penalty_kicks/";
  const currentUrl = `${development.DEFAULT_BACKEND_URL}/penalty`;
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

  return (
    <View style={styles.container}>
      <View style={styles.webViewContainer}>
        <WebView
          source={{ uri: currentUrl }}
          style={styles.webView}
          startInLoadingState={true}
          renderLoading={() => <Spinner content="Loading" />}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  headerButtonPlaceholder: {
    width: 40,
  },
  urlBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  urlInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.deepDarkGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
  },
  globeIcon: {
    marginRight: 6,
  },
  urlInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  navigateButton: {
    backgroundColor: Colors.darkGold,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navigateButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.darkBg,
  },
  controlsContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  controlButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.deepDarkGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    gap: 6,
  },
  controlButtonText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
  webViewContainer: {
    flex: 1,
    position: "relative",
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cardBg,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statusText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
