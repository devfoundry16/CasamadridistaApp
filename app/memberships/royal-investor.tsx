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
  Check,
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
        <View style={styles.section}>
          <Text style={{ ...styles.sectionTitle, fontSize: 32 }}>
            Rare Opportunity!
          </Text>
          <Text style={styles.sectionText}>
            The rarest opportunity to join the heart of the association and its
            senior management through an exceptional contribution.
          </Text>
          <Text style={styles.sectionText}>
            We offer this unique membership to visionary individuals who believe
            in the future of CasaMadridista as a global Real Madrid community
            and wish to support its mission from a truly influential leadership
            position.
          </Text>
          <Image
            source={{
              uri: "https://casamadridista.com/wp-content/uploads/2025/09/34534535.webp",
            }}
            style={{
              width: "100%",
              height: 208,
              borderRadius: 12,
              marginTop: 12,
              marginBottom: 12,
            }}
            contentFit="cover"
          />
        </View>

        {Benefits.map((benefit, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{benefit.title}</Text>
            {benefit.description ? (
              <Text style={styles.sectionText}>{benefit.description}</Text>
            ) : null}
            {benefit.items.map((item, idx) => (
              <View key={idx} style={styles.valueItem}>
                <Check size={20} strokeWidth={4} color={Colors.darkGold} />
                <Text key={idx} style={styles.valueText}>
                  <Text style={styles.valueText}>{item}</Text>
                </Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Join Application Form</Text>
          <Text style={styles.formDescription}>
            To join the Royal Investor Membership, please fill out the form
            Below. All applications are subject to official review, and you will
            be contacted as soon as possible.
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
      <View style={styles.headerContent}>
        <Image
          source={{
            uri: "https://casamadridista.com/wp-content/uploads/2025/09/343747.webp",
          }}
          style={styles.footerImage}
          contentFit="cover"
        />
        <View style={styles.heroSection}>
          <Text style={styles.footerTitle}>
            Become one of the association's champions!
          </Text>
          <Text style={styles.subtitle}>
            Your support makes a difference. Contribute to the growth of the
            official Real Madrid association, and your name and photo will shine
            on the honor board in front of thousands of Madridistas!
          </Text>
          <TouchableOpacity style={{...styles.submitButton, paddingHorizontal: 24, marginTop: 16}}>
            <Text style={styles.submitButtonText}>Apply Now</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkGray,
  },
  content: {
    padding: 35,
  },
  headerContent: {
    flexDirection: "column" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  heroImage: {
    width: "100%",
    height: 300,
    marginBottom: 0,
  },
  footerImage: {
    width: "100%",
    height: 650,
    marginBottom: 0,
  },
  footerTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginTop: 16,
    marginBottom: 16,
    textAlign: "center" as const,
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
    marginBottom: 16,
    textAlign: "center" as const,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textWhite,
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
  section: {
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: "700" as const,
    color: Colors.darkGold,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: Colors.textWhite,
    lineHeight: 24,
    marginBottom: 12,
  },
  valueItem: {
    flexDirection: "row",
    alignItems: "center" as const,
    marginBottom: 12,
    gap: 12,
  },
  valueText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textWhite,
    lineHeight: 22,
  },
  valueBold: {
    fontWeight: "700" as const,
    color: Colors.textWhite,
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
    color: Colors.textWhite,
    lineHeight: 20,
  },
  formSection: {},
  formTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.secondary,
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 14,
    color: Colors.textWhite,
    fontStyle: "italic" as const,
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
    backgroundColor: Colors.darkGold,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center" as const,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textWhite,
  },
});
