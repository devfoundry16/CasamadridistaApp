import { View, Text, StyleSheet } from "react-native";
import WebView from "react-native-webview";
import Colors from "@/constants/colors";
const CustomWebView = ({title, statsHtml}: {title: string, statsHtml: string}) => {
  return (
    <View style={styles.infoSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.widgetContainer}>
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.darkGold,
    marginBottom: 12,
    paddingLeft: 4,
  },
  widgetContainer: {
    backgroundColor: Colors.darkGray,
    borderRadius: 12,
    overflow: "hidden",
    height: 400,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  webview: {
    backgroundColor: 'transparent',
  },
});
