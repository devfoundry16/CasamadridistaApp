import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

const VisionSection = () => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <>
      <View className="flex-col items-center justify-center h-[500px]">
        <Image
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/05/ban-3.png",
          }}
          style={{ width: screenWidth, height: 500 }}
          contentFit="cover"
        />
        <View className="absolute items-center">
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/4234324324.webp",
            }}
            style={{ width: screenWidth * 0.8, height: 300 }}
            contentFit="cover"
          />
          <Text className="text-[22px] font-bold text-text-primary text-center mb-2">
            {t("vision.title")}
          </Text>
          <Text className="text-sm text-text-primary text-center mb-5">
            {t("vision.subtitle")}
          </Text>
          <TouchableOpacity
            className="bg-rm-gold px-[30px] py-3 rounded-lg"
            onPress={() => router.push("/contact")}
          >
            <Text className="text-sm font-bold text-text-dark">{t("vision.contactNow")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

export default VisionSection;
