import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import Colors from "@/constants/colors";
import {
  Crown,
  TrendingUp,
  Users,
  Award,
  ChevronDown,
} from "lucide-react-native";
import { Image } from "expo-image";

const benefits = [
  {
    icon: Crown,
    title: "Exclusive Access",
    description: "VIP access to all club events and facilities",
  },
  {
    icon: TrendingUp,
    title: "Investment Returns",
    description: "Share in club success and revenue growth",
  },
  {
    icon: Users,
    title: "Network",
    description: "Connect with elite investors and club management",
  },
  {
    icon: Award,
    title: "Recognition",
    description: "Special recognition at Santiago Bernabéu",
  },
];

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
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContent}>
        <Image
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/09/4234234234.webp",
          }}
          style={styles.heroImage}
          contentFit="cover"
        />
        <View style={styles.heroSection}>
          <Crown size={48} color={Colors.darkGold} />
          <Text style={styles.title}>Royal Investor Program</Text>
          <Text style={styles.subtitle}>
            Join an elite group of investors supporting Real Madrid's legacy
          </Text>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.benefitsSection}>
          <Text style={styles.sectionTitle}>Investor Benefits</Text>
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <View key={index} style={styles.benefitCard}>
                <View style={styles.iconContainer}>
                  <Icon size={24} color={Colors.accent} />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDescription}>
                    {benefit.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Join Application Form</Text>
          <Text style={styles.formDescription}>
            Fill out the form below to apply for the Royal Investor Program
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(text) =>
                setFormData({ ...formData, fullName: text })
              }
              placeholder="Enter your full name"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age *</Text>
            <TextInput
              style={styles.input}
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
              placeholder="Enter your age"
              placeholderTextColor={Colors.textLight}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.phoneNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, phoneNumber: text })
              }
              placeholder="Enter your phone number"
              placeholderTextColor={Colors.textLight}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter your email address"
              placeholderTextColor={Colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nationality *</Text>
            <TextInput
              style={styles.input}
              value={formData.nationality}
              onChangeText={(text) =>
                setFormData({ ...formData, nationality: text })
              }
              placeholder="Enter your nationality"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Place of Residence *</Text>
            <TextInput
              style={styles.input}
              value={formData.placeOfResidence}
              onChangeText={(text) =>
                setFormData({ ...formData, placeOfResidence: text })
              }
              placeholder="Enter your place of residence"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Annual Income *</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowIncomeDropdown(!showIncomeDropdown)}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !formData.annualIncome && styles.dropdownPlaceholder,
                ]}
              >
                {formData.annualIncome || "Select your annual income range"}
              </Text>
              <ChevronDown size={20} color={Colors.textLight} />
            </TouchableOpacity>
            {showIncomeDropdown && (
              <View style={styles.dropdownMenu}>
                {incomeRanges.map((range, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setFormData({ ...formData, annualIncome: range });
                      setShowIncomeDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{range}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Application</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  content: {
    padding: 20,
  },
  headerContent: {
    flexDirection: "column" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  heroImage: {
    width: "100%",
    height: 235,
    marginBottom: 12,
  },
  heroSection: {
    position: "absolute" as const,
    alignItems: "center" as const,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.secondary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center" as const,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: "center" as const,
    paddingHorizontal: 20,
  },
  investmentCard: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.accent,
    marginBottom: 12,
  },
  investmentAmount: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 12,
  },
  investmentDescription: {
    fontSize: 14,
    color: Colors.textWhite,
    lineHeight: 22,
    opacity: 0.9,
  },
  benefitsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.secondary,
    marginBottom: 16,
  },
  benefitCard: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.secondary,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.secondary,
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdown: {
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownText: {
    fontSize: 14,
    color: Colors.text,
  },
  dropdownPlaceholder: {
    color: Colors.textLight,
  },
  dropdownMenu: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden" as const,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemText: {
    fontSize: 14,
    color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center" as const,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.secondary,
  },
});
