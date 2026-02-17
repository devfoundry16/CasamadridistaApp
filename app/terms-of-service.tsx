import { Text } from "@/components/Text";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Dimensions, ScrollView, View } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

const SECTION_KEYS = [
  "section1",
  "section2",
  "section3",
  "section4",
  "section5",
  "section6",
  "section7",
  "section8",
] as const;

export default function TermsOfServiceScreen() {
  const { t } = useTranslation();

  const terms = SECTION_KEYS.map((key) => {
    const points = t(`termsOfService.${key}.points`, { returnObjects: true });
    return {
      title: t(`termsOfService.${key}.title`),
      points: Array.isArray(points) ? points : [],
    };
  });

  return (
    <>
      <ScrollView className="flex-1 bg-bg-medium" showsVerticalScrollIndicator={false}>
        <View className="flex-col items-center justify-center">
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/324242342.webp",
            }}
            style={{ width: screenWidth, height: 250 }}
            className="mb-3"
            contentFit="cover"
          />
          <View className="absolute items-center">
            <Text className="text-4xl font-bold text-white mb-1">{t("nav.termsOfService")}</Text>
          </View>
        </View>

        <View className="p-4">
          {terms.map((term, index) => (
            <View key={index} className="p-2.5 mb-4">
              <Text className="text-2xl font-bold text-rm-gold mb-3">{term.title}</Text>
              <View className="mt-2">
                {term.points.map((point, idx) => (
                  <View key={idx} className="flex-row items-start mb-2">
                    <View className="w-1.5 h-1.5 rounded-full bg-rm-gold mt-2 mr-3" />
                    <Text className="flex-1 text-base text-white leading-[22px]">{point}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}
