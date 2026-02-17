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
  "section9",
  "section10",
  "section11",
  "section12",
  "section13",
  "section14",
] as const;

export default function PrivacyPolicyScreen() {
  const { t } = useTranslation();

  const terms = SECTION_KEYS.map((key) => {
    const points = t(`privacyPolicy.${key}.points`, { returnObjects: true });
    return {
      title: t(`privacyPolicy.${key}.title`),
      startDesc: t(`privacyPolicy.${key}.startDesc`),
      endDesc: t(`privacyPolicy.${key}.endDesc`),
      points: Array.isArray(points) ? points : [],
    };
  });

  return (
    <>
      <ScrollView className="flex-1 bg-bg-medium" showsVerticalScrollIndicator={false}>
        <View className="flex-col items-center justify-center">
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/544564646.webp",
            }}
            style={{ width: screenWidth, height: 250 }}
            className="mb-3"
            contentFit="cover"
          />
          <View className="absolute items-center">
            <Text className="text-4xl font-bold text-white mb-1">{t("nav.privacyPolicy")}</Text>
          </View>
        </View>

        <View className="p-4">
          <Text className="text-sm text-text-secondary mb-4">{t("privacyPolicy.lastUpdated")}</Text>
          {terms.map((term, index) => (
            <View key={index} className="p-5 mb-4">
              <Text className="text-2xl font-bold text-rm-gold mb-3">{term.title}</Text>
              {term.startDesc ? (
                <Text className="text-base text-white leading-[22px] mb-3">{term.startDesc}</Text>
              ) : null}
              <View className="mt-2">
                {term.points.map((point, idx) => (
                  <View key={idx} className="flex-row items-start mb-2">
                    <View className="w-1.5 h-1.5 rounded-full bg-rm-gold mt-2 mr-3" />
                    <Text className="flex-1 text-base text-white leading-[22px]">{point}</Text>
                  </View>
                ))}
              </View>
              {term.endDesc ? (
                <Text className="text-base text-white leading-[22px] mb-3">{term.endDesc}</Text>
              ) : null}
            </View>
          ))}
          <Text></Text>
        </View>
      </ScrollView>
    </>
  );
}
