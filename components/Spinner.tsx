import Colors from "@/constants/colors";
import { Text } from "@/components/Text";
import { ActivityIndicator, View } from "react-native";

export const Spinner = ({ content }: { content: string }) => {
  return (
    <View className="justify-center items-center">
      <ActivityIndicator size="large" color={Colors.darkGold} />
      <Text className="text-text-primary text-lg">{content}...</Text>
    </View>
  );
};
