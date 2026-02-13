import { Spinner } from "@/components/Spinner";
import { Image } from "expo-image";
import React from "react";
import {
  Dimensions,
  Text,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

export default function ShopScreen() {
  return (
    <View className="flex-1 bg-bg-medium">
      <View className="flex-col items-center justify-center">
        <Image
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/05/img3.png",
          }}
          style={{ width: screenWidth, height: 250 }}
          className="mb-3"
          contentFit="cover"
        />
        <View className="absolute items-center">
          <Text className="text-4xl font-bold text-white mb-1">Welcome</Text>
          <Text className="text-xl font-semibold text-rm-gold">CasaMadridista Shop</Text>
        </View>
      </View>
      
      <View className="flex-1 justify-center items-center p-8">
        <Text className="text-2xl font-bold text-white mb-4 text-center">
          Shop Coming Soon
        </Text>
        <Text className="text-base text-text-secondary text-center">
          The shop feature has been migrated to a new system.{"\n"}
          Check back soon for updates!
        </Text>
      </View>
    </View>
  );
}
