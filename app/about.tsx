import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Check,
  FileText,
  Globe,
  Mail,
  Shield,
  Volleyball,
} from "lucide-react-native";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

const { width: screenWidth } = Dimensions.get("window");

export default function AboutScreen() {
  const router = useRouter();
  const { t } = useTranslation();

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
            <Text className="text-4xl font-bold text-white mb-1">{t("nav.aboutUs")}</Text>
            <Text className="text-xl font-semibold text-rm-gold">{t("about.brandArabic")}</Text>
          </View>
        </View>

        <View className="p-4">
          <View className="p-5 mb-4">
            <Text className="text-3xl font-bold text-rm-gold mb-3">{t("about.casaTitle")}</Text>
            <Text className="text-[15px] text-white leading-6 mb-3">
              {t("about.casaParagraph1")}
            </Text>
            <Text className="text-[15px] text-white leading-6 mb-3">
              {t("about.casaParagraph2")}
            </Text>
            <Image
              source={{
                uri: "https://casamadridista.com/wp-content/uploads/2025/09/436456.webp",
              }}
              style={{ width: screenWidth - 32, height: 305, borderRadius: 12 }}
              className="mt-3 mb-3"
              contentFit="cover"
            />
          </View>

          <View className="p-5 mb-4">
            <Text className="text-3xl font-bold text-rm-gold mb-3">{t("about.visionTitle")}</Text>
            <Text className="text-[15px] text-white leading-6 mb-3">
              {t("about.visionParagraph")}
            </Text>
            <Image
              source={{
                uri: "https://casamadridista.com/wp-content/uploads/2025/09/5466456-1.webp",
              }}
              style={{ width: screenWidth - 32, height: 208, borderRadius: 12 }}
              className="mt-3 mb-3"
              contentFit="cover"
            />
          </View>

          <View className="p-5 mb-4">
            <Text className="text-3xl font-bold text-rm-gold mb-3">{t("about.offerTitle")}</Text>
            <View className="flex-row items-center mb-3 gap-3">
              <Check size={20} color="#BC9045" strokeWidth={5} />
              <Text className="flex-1 text-sm text-white leading-[22px]">
                <Text className="font-bold text-white">{t("about.offer1Strong")}</Text>{" "}
                {t("about.offer1Text")}
              </Text>
            </View>
            <View className="flex-row items-center mb-3 gap-3">
              <Check size={20} color="#BC9045" strokeWidth={5} />
              <Text className="flex-1 text-sm text-white leading-[22px]">
                <Text className="font-bold text-white">{t("about.offer2Strong")}</Text>{" "}
                {t("about.offer2Text")}
              </Text>
            </View>
            <View className="flex-row items-center mb-3 gap-3">
              <Check size={20} color="#BC9045" strokeWidth={5} />
              <Text className="flex-1 text-sm text-white leading-[22px]">
                <Text className="font-bold text-white">
                  {t("about.offer3Strong")}
                </Text>{" "}
                {t("about.offer3Text")}
              </Text>
            </View>
            <View className="flex-row items-center mb-3 gap-3">
              <Check size={20} color="#BC9045" strokeWidth={5} />
              <Text className="flex-1 text-sm text-white leading-[22px]">
                <Text className="font-bold text-white">
                  {t("about.offer4Strong")}{" "}
                </Text>{" "}
                {t("about.offer4Text")}
              </Text>
            </View>
            <View className="flex-row items-center mb-3 gap-3">
              <Check size={20} color="#BC9045" strokeWidth={5} />
              <Text className="flex-1 text-sm text-white leading-[22px]">
                <Text className="font-bold text-white">{t("about.offer5Strong")}</Text>{" "}
                {t("about.offer5Text")}
              </Text>
            </View>
          </View>

          <View className="flex-col gap-3 mb-4">
            <View className="flex-1 min-w-[45%] p-4 items-center">
              <View className="w-[60px] h-[60px] justify-center items-center">
                <Volleyball
                  size={50}
                  strokeWidth={1.5}
                  color="#BC9045"
                />
              </View>
              <Text className="text-3xl font-bold text-rm-gold mb-3">{t("about.whyExistTitle")}</Text>
              <Text className="text-[15px] text-text-primary leading-6 text-center">
                {t("about.whyExistText")}
              </Text>
            </View>

            <View className="flex-1 min-w-[45%] p-4 items-center">
              <View className="w-[60px] h-[60px] justify-center items-center">
                <Globe size={50} strokeWidth={1.5} color="#BC9045" />
              </View>
              <Text className="text-3xl font-bold text-rm-gold mb-3">{t("about.globalFamilyTitle")}</Text>
              <Text className="text-[15px] text-text-primary leading-6 text-center">
                {t("about.globalFamilyText")}
              </Text>
            </View>
            <Text className="text-white text-lg text-center mt-2 font-medium italic">
              {t("about.globalFamilyQuote")}
            </Text>
          </View>

          <View className="flex-col items-center justify-center">
            <Image
              source={{
                uri: "https://casamadridista.com/wp-content/uploads/2025/09/4234234234.webp",
              }}
              style={{ width: screenWidth, height: 350 }}
              contentFit="cover"
            />
            <View className="absolute items-center">
              <Text className="text-3xl font-bold text-rm-gold mb-3">{t("about.joinUsTitle")}</Text>
              <View className="flex-col items-center mb-3 gap-3">
                <Text className="text-text-secondary text-center text-[13px] mb-0">
                  {t("about.joinUsText1")}
                </Text>
                <Text className="text-text-secondary text-center italic text-[15px] mb-0">
                  {t("about.joinUsText2")}
                </Text>
                <Mail size={30} color="#BC9045" strokeWidth={3} />
                <Text className="text-[15px] text-white leading-6 mb-3">
                  Contact@casamadridista.com
                </Text>
              </View>
            </View>
          </View>

          <View className="p-5 mb-4">
            <Text className="text-3xl font-bold text-rm-gold mb-3">{t("about.legalTitle")}</Text>
            <TouchableOpacity
              className="flex-row items-center p-4 mb-3"
              onPress={() => router.push("/terms-of-service")}
            >
              <View className="justify-center items-center mr-5">
                <FileText size={35} color="#BC9045" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-white mb-1">{t("nav.termsOfService")}</Text>
                <Text className="text-[13px] text-white">
                  {t("about.termsDescription")}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 mb-3"
              onPress={() => router.push("/privacy-policy")}
            >
              <View className="justify-center items-center mr-5">
                <Shield size={35} color="#BC9045" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-white mb-1">{t("nav.privacyPolicy")}</Text>
                <Text className="text-[13px] text-white">
                  {t("about.privacyDescription")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
