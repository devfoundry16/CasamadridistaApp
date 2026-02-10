import { Image } from "expo-image";
import * as MailComposer from "expo-mail-composer";
import {
  Check,
  ChevronDown,
  Crown,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

const incomeRanges = [
  "Under $50,000",
  "$50,000 - $100,000",
  "$100,000 - $250,000",
  "$250,000 - $500,000",
  "$500,000 - $1,000,000",
  "Over $1,000,000",
];

export default function RoyalInvestorScreen() {
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    phoneNumber: "",
    email: "",
    nationality: "",
    placeOfResidence: "",
    annualIncome: "",
  });
  const [showIncomeDropdown, setShowIncomeDropdown] = useState(false);

  const sendEmail = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert(
        "Email Not Available",
        "Email service is not available on this device."
      );
      return;
    }

    const subject = "Contact Form Submission";
    const body =
      `Name: ${formData.fullName}\n` +
      `Age: ${formData.age}\n` +
      `Phone: ${formData.phoneNumber}\n\n` +
      `Email:\n${formData.email}` +
      `Nationality: ${formData.nationality}\n\n` +
      `Place of Residence:\n${formData.placeOfResidence}` +
      `Annual Income: ${formData.annualIncome}\n\n`;

    const result = MailComposer.composeAsync({
      recipients: ["alifayad03@gmail.com"],
      subject: subject,
      body: body,
    });

    return result;
  };
  const handleSubmit = () => {
    if (
      !formData.fullName ||
      !formData.age ||
      !formData.phoneNumber ||
      !formData.email ||
      !formData.nationality ||
      !formData.placeOfResidence ||
      !formData.annualIncome
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    sendEmail().then((res) => {
      if (res?.status === "sent") {
        Alert.alert(
          "Success",
          "Your application has been submitted. Our team will contact you shortly."
        );
        setFormData({
          fullName: "",
          age: "",
          phoneNumber: "",
          email: "",
          nationality: "",
          placeOfResidence: "",
          annualIncome: "",
        });
      }
    });
  };

  return (
    <ScrollView className="flex-1 bg-bg-medium">
      <View className="flex-col items-center justify-center">
        <Image
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/09/4234234234.webp",
          }}
          style={{ width: screenWidth, height: 300 }}
          className="mb-0"
          contentFit="cover"
        />
        <View className="absolute items-center mb-8">
          <Crown size={48} color="#BC9045" />
          <Text className="text-2xl font-bold text-white mt-4 mb-4 text-center">
            Royal Investor Program
          </Text>
          <Text className="text-base text-white text-center px-5">
            Join an elite group of investors supporting Real Madrid&apos;s legacy
          </Text>
        </View>
      </View>
      <View className="p-9">
        <View className="mb-4">
          <Text className="text-3xl font-bold text-rm-gold mb-3">
            Rare Opportunity!
          </Text>
          <Text className="text-[15px] text-white leading-6 mb-3">
            The rarest opportunity to join the heart of the association and its
            senior management through an exceptional contribution.
          </Text>
          <Text className="text-[15px] text-white leading-6 mb-3">
            We offer this unique membership to visionary individuals who believe
            in the future of CasaMadridista as a global Real Madrid community
            and wish to support its mission from a truly influential leadership
            position.
          </Text>
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/34534535.webp",
            }}
            style={{ width: screenWidth, height: 208, borderRadius: 12 }}
            className="mt-3 mb-3"
            contentFit="cover"
          />
        </View>

        {Benefits.map((benefit, index) => (
          <View key={index} className="mb-4">
            <Text className="text-3xl font-bold text-rm-gold mb-3">
              {benefit.title}
            </Text>
            {benefit.description ? (
              <Text className="text-[15px] text-white leading-6 mb-3">
                {benefit.description}
              </Text>
            ) : null}
            {benefit.items.map((item, idx) => (
              <View key={idx} className="flex-row items-center mb-3 gap-3">
                <Check size={20} strokeWidth={4} color="#BC9045" />
                <Text key={idx} className="flex-1 text-sm text-white leading-[22px]">
                  {item}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <View>
          <Text className="text-xl font-bold text-white mb-2">
            Join Application Form
          </Text>
          <Text className="text-sm text-white italic mb-6">
            To join the Royal Investor Membership, please fill out the form
            Below. All applications are subject to official review, and you will
            be contacted as soon as possible.
          </Text>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">
              Full Name *
            </Text>
            <TextInput
              className="bg-bg-light rounded-lg px-4 py-3 text-sm text-white border border-border-default"
              value={formData.fullName}
              onChangeText={(text) =>
                setFormData({ ...formData, fullName: text })
              }
              placeholder="Enter your full name"
              placeholderTextColor="#666666"
            />
          </View>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">
              Age *
            </Text>
            <TextInput
              className="bg-bg-light rounded-lg px-4 py-3 text-sm text-white border border-border-default"
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              placeholder="Enter your age"
              placeholderTextColor="#666666"
              keyboardType="numeric"
            />
          </View>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">
              Phone Number *
            </Text>
            <TextInput
              className="bg-bg-light rounded-lg px-4 py-3 text-sm text-white border border-border-default"
              value={formData.phoneNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, phoneNumber: text })
              }
              placeholder="Enter your phone number"
              placeholderTextColor="#666666"
              keyboardType="phone-pad"
            />
          </View>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">
              Email Address *
            </Text>
            <TextInput
              className="bg-bg-light rounded-lg px-4 py-3 text-sm text-white border border-border-default"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter your email address"
              placeholderTextColor="#666666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">
              Nationality *
            </Text>
            <TextInput
              className="bg-bg-light rounded-lg px-4 py-3 text-sm text-white border border-border-default"
              value={formData.nationality}
              onChangeText={(text) =>
                setFormData({ ...formData, nationality: text })
              }
              placeholder="Enter your nationality"
              placeholderTextColor="#666666"
            />
          </View>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">
              Place of Residence *
            </Text>
            <TextInput
              className="bg-bg-light rounded-lg px-4 py-3 text-sm text-white border border-border-default"
              value={formData.placeOfResidence}
              onChangeText={(text) =>
                setFormData({ ...formData, placeOfResidence: text })
              }
              placeholder="Enter your place of residence"
              placeholderTextColor="#666666"
            />
          </View>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">
              Annual Income *
            </Text>
            <TouchableOpacity
              className="bg-bg-light rounded-lg px-4 py-3 flex-row justify-between items-center border border-border-default"
              onPress={() => setShowIncomeDropdown(!showIncomeDropdown)}
            >
              <Text
                className={`text-sm ${
                  !formData.annualIncome ? "text-text-muted" : "text-text-dark"
                }`}
              >
                {formData.annualIncome || "Select your annual income range"}
              </Text>
              <ChevronDown size={20} color="#666666" />
            </TouchableOpacity>
            {showIncomeDropdown && (
              <View className="bg-bg-medium rounded-lg mt-2 border border-border-default overflow-hidden">
                {incomeRanges.map((range, index) => (
                  <TouchableOpacity
                    key={index}
                    className="px-4 py-3 border-b border-border-default"
                    onPress={() => {
                      setFormData({ ...formData, annualIncome: range });
                      setShowIncomeDropdown(false);
                    }}
                  >
                    <Text className="text-sm text-white">{range}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            className="bg-rm-gold py-3.5 rounded-lg items-center mt-2"
            onPress={handleSubmit}
          >
            <Text className="text-base font-semibold text-white">
              Submit Application
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View className="flex-col items-center justify-center">
        <Image
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/09/343747.webp",
          }}
          style={{ width: screenWidth, height: 650 }}
          className="mb-0"
          contentFit="cover"
        />
        <View className="absolute items-center mb-8">
          <Text className="text-2xl font-bold text-white mt-4 mb-4 text-center">
            Become one of the association&apos;s champions!
          </Text>
          <Text className="text-base text-white text-center px-5">
            Your support makes a difference. Contribute to the growth of the
            official Real Madrid association, and your name and photo will shine
            on the honor board in front of thousands of Madridistas!
          </Text>
          <TouchableOpacity
            className="bg-rm-gold py-3.5 rounded-lg items-center mt-4 px-6"
            onPress={handleSubmit}
          >
            <Text className="text-base font-semibold text-white">Apply Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const Benefits: {
  title: string;
  description: string;
  items: string[];
}[] = [
  {
    title: "Benefits of the Royal Investor Membership",
    description: "",
    items: [
      "Join the association’s senior management for 12 months",
      "Private meeting with current or former Real Madrid players (subject to availability and coordination)",
      "Exclusive visit to Real Madrid facilities (Valdebebas), including a VIP tour supervised by an official",
      "Attend meetings with official club representatives (subject to feasibility and official schedules)",
      "Official recognition on the website as a “Royal Investor” with a profile and photo",
      "Closed attendance at official meetings and participation in major strategic decisions",
      "Full access to all VIP membership privileges",
      "Luxurious royal souvenir + a personalized certificate of appreciation signed by the association",
      "Special media coverage for the investor across all our platforms",
    ],
  },
  {
    title: "Who is eligible?",
    description:
      "Entrepreneurs, public figures, investors, and Real Madrid fans seeking a real role in developing the largest Arabic-speaking Real Madrid community.",
    items: [
      "Only 3 individuals are selected annually for membership",
      "Each application is reviewed individually",
      "Submitting an application does not guarantee approval. The association reserves the right to reject any application for any reason",
      "Applications are subject to strict criteria",
      "Applications are accepted from any country or nationality",
      "The application form at the bottom of the page must be completed to submit your request",
    ],
  },
];
