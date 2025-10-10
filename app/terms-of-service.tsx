import Colors from "@/constants/colors";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function TermsOfServiceScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          ...headerOptions,
          title: "About",          
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContent}>
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/324242342.webp",
            }}
            style={styles.headerImage}
            contentFit="cover"
          />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Terms of Service</Text>
          </View>
        </View>

        <View style={styles.content}>
          {Terms.map((term, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{term.title}</Text>
              <View style={styles.bulletList}>
                {term.points.map((point, idx) => (
                  <View key={idx} style={styles.bulletItem}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>{point}</Text>
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
      "Respect the club’s history and achievements, and do not belittle any championship or former player.",
      "Refrain from personal attacks on players or other fans for any reason.",
      "Contribute to maintaining the reputation of the community and CasaMadridista, and act responsibly during any public communication.",
    ],
  },
  {
    title: "3. Privacy and Confidentiality",
    points: [
      "Any exclusive content or membership information or digital tools may not be shared outside the platform.",
      "Maintain the confidentiality of members’ data and do not use it for commercial or personal purposes without explicit permission.",
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

const headerOptions = {
  headerShown: true,
  headerTitle: "About",
  headerBackButtonDisplayMode: "minimal" as const,
  headerTintColor: Colors.textWhite,
  headerStyle: { backgroundColor: Colors.darkGold},
  headerTitleStyle: { fontWeight: "700" as const },
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
  },
  headerContent: {
    flexDirection: "column" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  header: {
    position: "absolute",
    alignItems: "center",
  },
  headerImage: {
    width: "100%",
    height: 250,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.accent,
  },
  content: {
    padding: 16,
  },
  section: {
    padding: 10,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: Colors.textWhite,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletList: {
    marginTop: 8,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textWhite,
    lineHeight: 22,
  },
});
