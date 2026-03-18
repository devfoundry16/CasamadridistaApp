import { sendRoyalInvestorEmail } from "@/services/EmailService";
import { Image } from "expo-image";
import {
  Check,
  ChevronDown,
  Crown,
} from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import {
  Alert,
  Dimensions,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

export default function RoyalInvestorScreen() {
  const { t } = useTranslation();
  const incomeRanges = t("royalInvestor.incomeRanges", { returnObjects: true }) as string[];
  const benefits = t("royalInvestor.benefits", { returnObjects: true }) as {
    title: string;
    description: string;
    items: string[];
  }[];
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

  const handleSubmit = async () => {
    if (
      !formData.fullName ||
      !formData.age ||
      !formData.phoneNumber ||
      !formData.email ||
      !formData.nationality ||
      !formData.placeOfResidence ||
      !formData.annualIncome
    ) {
      Alert.alert(t("common.error"), t("membership.pleaseFillAllFields"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert(t("alerts.invalidEmail"), t("membership.invalidEmail"));
      return;
    }

    try {
      await sendRoyalInvestorEmail({
        fullName: formData.fullName.trim(),
        age: formData.age.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim(),
        nationality: formData.nationality.trim(),
        placeOfResidence: formData.placeOfResidence.trim(),
        annualIncome: formData.annualIncome.trim(),
      });
      Alert.alert(
        t("common.success"),
        t("royalInvestor.submittedSuccess")
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
    } catch (error: unknown) {
      console.error("Error submitting application:", error);
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      Alert.alert(
        t("common.error"),
        message || t("royalInvestor.submitFailed")
      );
    }
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
            {t("royalInvestor.programTitle")}
          </Text>
          <Text className="text-base text-white text-center px-5">
            {t("royalInvestor.programSubtitle")}
          </Text>
        </View>
      </View>
      <View className="p-9">
        <View className="mb-4">
          <Text className="text-3xl font-bold text-rm-gold mb-3">
            {t("royalInvestor.rareOpportunityTitle")}
          </Text>
          <Text className="text-[15px] text-white leading-6 mb-3">
            {t("royalInvestor.rareOpportunityParagraph1")}
          </Text>
          <Text className="text-[15px] text-white leading-6 mb-3">
            {t("royalInvestor.rareOpportunityParagraph2")}
          </Text>
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/34534535.webp",
            }}
            style={{ width: '100%', height: 208, borderRadius: 12 }}
            className="mt-3 mb-3"
            contentFit="cover"
          />
        </View>

        {benefits.map((benefit, index) => (
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
            {t("royalInvestor.applicationTitle")}
          </Text>
          <Text className="text-sm text-white italic mb-6">
            {t("royalInvestor.applicationSubtitle")}
          </Text>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">
              {t("player.fullName")} *
            </Text>
            <TextInput
              className="bg-bg-light rounded-lg px-4 py-3 text-sm text-white border border-border-default"
              value={formData.fullName}
              onChangeText={(text) =>
                setFormData({ ...formData, fullName: text })
              }
              placeholder={t("royalInvestor.placeholderFullName")}
              placeholderTextColor="#666666"
            />
          </View>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">
              {t("player.age")} *
            </Text>
            <TextInput
              className="bg-bg-light rounded-lg px-4 py-3 text-sm text-white border border-border-default"
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              placeholder={t("royalInvestor.placeholderAge")}
              placeholderTextColor="#666666"
              keyboardType="numeric"
            />
          </View>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">
              {t("auth.phone")} *
            </Text>
            <TextInput
              className="bg-bg-light rounded-lg px-4 py-3 text-sm text-white border border-border-default"
              value={formData.phoneNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, phoneNumber: text })
              }
              placeholder={t("royalInvestor.placeholderPhone")}
              placeholderTextColor="#666666"
              keyboardType="phone-pad"
            />
          </View>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">
              {t("auth.emailAddress")}
            </Text>
            <TextInput
              className="bg-bg-light rounded-lg px-4 py-3 text-sm text-white border border-border-default"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder={t("royalInvestor.placeholderEmail")}
              placeholderTextColor="#666666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">
              {t("player.nationality")} *
            </Text>
            <TextInput
              className="bg-bg-light rounded-lg px-4 py-3 text-sm text-white border border-border-default"
              value={formData.nationality}
              onChangeText={(text) =>
                setFormData({ ...formData, nationality: text })
              }
              placeholder={t("royalInvestor.placeholderNationality")}
              placeholderTextColor="#666666"
            />
          </View>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">
              {t("royalInvestor.placeOfResidence")} *
            </Text>
            <TextInput
              className="bg-bg-light rounded-lg px-4 py-3 text-sm text-white border border-border-default"
              value={formData.placeOfResidence}
              onChangeText={(text) =>
                setFormData({ ...formData, placeOfResidence: text })
              }
              placeholder={t("royalInvestor.placeholderResidence")}
              placeholderTextColor="#666666"
            />
          </View>

          <View className="mb-5">
            <Text className="text-sm font-semibold text-white mb-2">
              {t("royalInvestor.annualIncome")} *
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
                {formData.annualIncome || t("royalInvestor.selectIncomeRange")}
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
              {t("royalInvestor.submitApplication")}
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
            {t("royalInvestor.becomeChampion")}
          </Text>
          <Text className="text-base text-white text-center px-5">
            {t("royalInvestor.bottomBannerText")}
          </Text>
          <TouchableOpacity
            className="bg-rm-gold py-3.5 rounded-lg items-center mt-4 px-6"
            onPress={handleSubmit}
          >
            <Text className="text-base font-semibold text-white">{t("common.applyNow")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
