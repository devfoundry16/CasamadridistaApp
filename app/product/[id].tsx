import React from "react";
import {
  ScrollView,
  Text,
  View,
} from "react-native";

export default function ProductDetailScreen() {
  return (
    <ScrollView className="flex-1 bg-bg-medium">
      <View className="flex-1 justify-center items-center p-8">
        <Text className="text-2xl font-bold text-white mb-4 text-center">
          Product Details
        </Text>
        <Text className="text-base text-text-secondary text-center">
          The shop feature has been migrated to a new system.{"\n"}
          Product details will be available soon!
        </Text>
      </View>
    </ScrollView>
  );
}
