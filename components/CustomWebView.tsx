import { Text } from "@/components/Text";
import { View } from "react-native";
import WebView from "react-native-webview";

const CustomWebView = ({
  size = 300,
  title,
  statsHtml,
}: {
  size: number;
  /**
   * Optional. Omit it where the screen already names the content — on the match
   * page the navigation header, the identity strip and the widget's own fixture
   * card all say the same thing, and a fourth heading just repeats them.
   */
  title?: string;
  statsHtml: string;
}) => {
  return (
    <View className="bg-bg-medium py-4">
      {title ? (
        <View className="flex-row items-center justify-center mb-2.5">
          <View className="w-[70px] h-0.5 bg-rm-gold mx-[30px]" />
          <Text className="text-2xl font-bold text-text-primary text-center">{title}</Text>
          <View className="w-[70px] h-0.5 bg-rm-gold mx-[30px]" />
        </View>
      ) : null}
      <View className="bg-bg-medium rounded-xl overflow-hidden w-full" style={{ height: size}}>
        <WebView
          source={{
            html: statsHtml,
          }}
          className="flex-1 bg-bg-medium"
          style={{ backgroundColor: "transparent" }}
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
