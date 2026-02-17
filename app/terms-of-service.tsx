import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { Dimensions, ScrollView, Text, View } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

export default function TermsOfServiceScreen() {
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
            <Text className="text-4xl font-bold text-white mb-1">{t("nav.termsOfService")}</Text>
          </View>
        </View>

        <View className="p-4">
          {Terms.map((term, index) => (
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

const Terms = [
  {
    title: "1. Commitment to Core Community Values",
    points: [
      "Respect all members and refrain from any discrimination or abuse.",
      "Do not post offensive, racist, political, or religious content on the platform or any official community activity.",
      "Maintain the spirit of being a Madridista and a passion for the club, contributing to a positive and encouraging environment.",
    ],
  },
  {
    title: "2. Respect for the Club and Players",
    points: [
      "Defend the image of Real Madrid and speak positively about it when representing the membership.",
      "Do not spread false news or rumors about the club or its current or former players.",
      "Respect the club's history and achievements, and do not belittle any championship or former player.",
      "Refrain from personal attacks on players or other fans for any reason.",
      "Contribute to maintaining the reputation of the community and CasaMadridista, and act responsibly during any public communication.",
    ],
  },
  {
    title: "3. Privacy and Confidentiality",
    points: [
      "Any exclusive content or membership information or digital tools may not be shared outside the platform.",
      "Maintain the confidentiality of members' data and do not use it for commercial or personal purposes without explicit permission.",
      "Do not register other members or claim to have membership or privileges without official authorization.",
    ],
  },
  {
    title: "4. Participation and Engagement",
    points: [
      "Actively participate in activities, polls, contests, and games according to ability.",
      "Passive membership is not sufficient; engagement is a core responsibility of being a community member.",
      "Support official community initiatives and contribute to making the experience inclusive and enjoyable for all members.",
    ],
  },
  {
    title: "5. Content Use and Compliance",
    points: [
      "Do not exploit any exclusive content or community tools for commercial or unauthorized purposes.",
      "Respect intellectual property rights for all content published on the website and app.",
      "Do not use the membership or content to promote personal interests that conflict with the image of the community, CasaMadridista, or the club.",
    ],
  },
  {
    title: "6. Financial Commitment",
    points: [
      "Pay the monthly or annual subscription on time for each membership tier.",
      "Any refund or cancellation is subject to the official financial terms of the community.",
      "Do not attempt to bypass subscription requirements or use illegal methods to access benefits.",
    ],
  },
  {
    title: "7. Penalties",
    points: [
      "Any violation of the above terms may result in suspension or termination of membership without compensation.",
      "Penalties may include revoking exclusive or community benefits, or removing access to channels or apps.",
      "Management reserves the right to take any legal or administrative action to protect the reputation of the community, CasaMadridista, and the club, including seeking compensation for any material or moral damages.",
    ],
  },
  {
    title: "8. Acceptance of Terms",
    points: [
      "By subscribing to a CasaMadridista membership, the member acknowledges having read these terms in full and agrees to comply with them.",
      "These terms are legally binding, and any violation constitutes sufficient grounds for membership cancellation or enforcement of penalties.",
    ],
  },
];
