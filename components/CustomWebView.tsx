import Colors from "@/constants/colors";
import { StyleSheet, Text, View } from "react-native";
import WebView from "react-native-webview";
const CustomWebView = ({
  size = 300,
  title,
  statsHtml,
}: {
  size: number;
  title: string;
  statsHtml: string;
}) => {
  return (
    <View style={styles.infoSection}>
      <View style={styles.adSectionHeader}>
      <View style={styles.adHeaderLine} />
      <Text style={styles.adSectionTitle}>{title}</Text>
      <View style={styles.adHeaderLine} />
      </View>
      <View style={[styles.widgetContainer, {height: size}]}>
        <WebView
          source={{
            html: statsHtml,
          }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
        />
      </View>
    </View>
  );
};
export default CustomWebView;
const styles = StyleSheet.create({
  infoSection: {
    backgroundColor: "#2a2a2a",
    paddingVertical: 16,
  },
  adSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  adHeaderLine: {
    width: 70,
    height: 2,
    backgroundColor: Colors.accent,
    marginHorizontal: 30,
  },
  adSectionTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    textAlign: "center",
  },
  widgetContainer: {
    backgroundColor: Colors.darkGray,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  webview: {
    backgroundColor: Colors.deepDarkGray,
  },
});
