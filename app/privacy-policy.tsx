import { Image } from "expo-image";
import { Dimensions, ScrollView, Text, View } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

export default function PrivacyPolicyScreen() {
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
            <Text className="text-4xl font-bold text-white mb-1">Privacy Policy</Text>
          </View>
        </View>

        <View className="p-4">
          {Terms.map((term, index) => (
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

const Terms = [
  {
    title: "1. Information We Collect",
    startDesc: "We may collect the following types of information:",
    endDesc: "",
    points: [
      "Personal Information: Name, email address, phone number, billing address, and payment details (processed securely via Stripe or PayPal).",
      "Membership Data: Subscription tier, membership status, preferences, and engagement history.",
      "Device Information: Device identifiers, app version, and device type (collected by third-party services for app functionality).",
      "Photos/Media: User profile pictures and avatars (with your permission when you upload them).",
      "Authentication Data: Login credentials and authentication tokens stored securely on your device.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    startDesc: "We use your information to:",
    endDesc: "",
    points: [
      "Provide and manage your membership and account.",
      "Process payments, upgrades, and renewals.",
      "Send news, updates, and exclusive member content.",
      "Improve the functionality and user experience of our app.",
      "Ensure the security of your data and prevent unauthorized access or fraud.",
      "Manage subscriptions and in-app purchases.",
      "Provide app updates and technical support.",
    ],
  },
  {
    title: "3. Sharing Your Information",
    startDesc:
      "We do not sell, rent, or trade your personal information. We only share it:",
    endDesc: "",
    points: [
      "With trusted payment processors (Stripe, PayPal) to process your transactions.",
      "With RevenueCat to manage subscriptions and in-app purchases. RevenueCat may collect device identifiers and purchase history. See their privacy policy: https://www.revenuecat.com/privacy",
      "With API-Sports.io to display sports data and widgets. They may collect interaction data and IP addresses.",
      "With Expo to provide app updates and development services. Expo may collect device identifiers and app version information. See their privacy policy: https://expo.dev/privacy",
      "When required by law or in response to legal requests.",
      "With third-party service providers who assist in operating our app, under strict confidentiality agreements.",
    ],
  },
  {
    title: "4. Data Security",
    startDesc:
      "We use industry-standard security measures to safeguard your personal data. All payment transactions are encrypted via Stripe and PayPal. Sensitive information stored locally on your device is protected using secure storage mechanisms. All data transmitted between the app and our servers uses HTTPS encryption.",
    endDesc: "",
    points: [],
  },
  {
    title: "5. Data Storage",
    startDesc:
      "We store certain user data locally on your device using secure storage to improve app performance and provide offline functionality. This includes:",
    endDesc:
      "You can clear this data by uninstalling the app or using your device's app data clearing features.",
    points: [
      "Authentication tokens for secure login.",
      "User preferences and settings.",
      "Cached app data for faster loading.",
    ],
  },
  {
    title: "6. Device Permissions",
    startDesc: "Our app may request the following permissions:",
    endDesc:
      "You can revoke these permissions at any time through your device settings. Some app features may not function properly without these permissions.",
    points: [
      "Camera: Used to take photos for your profile picture (optional).",
      "Media Library: Used to select existing photos for your profile picture (optional).",
    ],
  },
  {
    title: "7. Your Rights",
    startDesc: "Depending on your location, you may have the right to:",
    endDesc:
      "To exercise these rights, please email us at: Contact@casamadridista.com. We will respond to your request within 30 days.",
    points: [
      "Access, update, or delete your personal data.",
      "Object to or restrict how your data is processed.",
      "Withdraw consent for communications at any time.",
      "Request a copy of your personal data.",
      "Request deletion of your account and associated data.",
    ],
  },
  {
    title: "8. Data Retention",
    startDesc:
      "We retain your personal data for as long as your account is active or as needed to provide services. If you request account deletion, we will delete your personal data within 30 days, except where we are required to retain it for legal or regulatory purposes.",
    endDesc: "",
    points: [],
  },
  {
    title: "9. Third-Party Links",
    startDesc:
      "Our app may contain links to third-party websites or services. We are not responsible for the privacy practices or content of those sites. Please review their privacy policies separately.",
    endDesc: "",
    points: [],
  },
  {
    title: "10. Changes to This Policy",
    startDesc:
      "We may update this Privacy Policy periodically. Any changes will be posted on this page with an updated effective date. We encourage you to review it regularly. Continued use of the app after changes constitutes acceptance of the updated policy.",
    endDesc: "",
    points: [],
  },
  {
    title: "Contact Us",
    startDesc:
      "If you have any questions about this Privacy Policy, how we handle your data, or wish to exercise your rights, please contact us at:",
    endDesc: "",
    points: ["Contact@casamadridista.com", "Casa Madridista"],
  },
];
