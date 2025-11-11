import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import HeaderStack from "@/components/HeaderStack";
import { GiveWPService } from "@/services/Donation/GiveWPService";
import { CampaignDetail } from "@/types/campaigns/campaigns";
import Colors from "@/constants/colors";
import { Spinner } from "@/components/Spinner";
import { CHECKOUT_PAYMENT_METHOD } from "@/types/shop/checkout";
import { useStripePay } from "@/hooks/useStripePay";
import { useUser } from "@/hooks/useUser";

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const { handlePayment: payViaStripe } = useStripePay();
  const { user } = useUser();
  const [donationData, setDonationData] = useState({
    amount: 10,
    customAmount: "",
    frequency: "one-time",
    firstName: user?.first_name,
    lastName: user?.last_name,
    email: user?.email,
    paymentMethod: CHECKOUT_PAYMENT_METHOD.STRIPE,
  });

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const data = await GiveWPService.getCampaignById(Number(id));
        setCampaign(data);
      } catch (error) {
        console.error("Failed to load campaign:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCampaign();
  }, [id]);

  const handleStripePay = () => {
    payViaStripe(0, donationData.amount, user?.billing)
      .then((data) => {
        console.log("stripe:", data);
        Alert.alert("Donate sucessfully");
      })
      .catch((err) => {
        Alert.alert(err.message);
      });
  };

  const handlePayPalPay = () => {};

  const handlePayment = () => {
    if (donationData.paymentMethod === CHECKOUT_PAYMENT_METHOD.STRIPE)
      handleStripePay();
    else handlePayPalPay();
  };

  if (loading) {
    return (
      <>
        <HeaderStack title="Campaign Details" />
        <View style={styles.spinnerContainer}>
          <Spinner content="Loading Campaign" />
        </View>
      </>
    );
  }

  if (!campaign) {
    return (
      <View style={styles.container}>
        <HeaderStack title="Campaign Details" />
        <View style={styles.error}>
          <Text style={styles.errorText}>Campaign not found.</Text>
        </View>
      </View>
    );
  }

  const renderDonationForm = () => {
    if (currentStep === 1) {
      return (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            How much would you like to donate today?
          </Text>
          <Text style={styles.formDescription}>
            All donations directly impact our organization and help us further
            our mission.
          </Text>
          <View style={styles.amountButtons}>
            {[10, 25, 50, 100, 250, 500].map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[
                  styles.amountButton,
                  donationData.amount === amt && styles.selectedAmount,
                ]}
                onPress={() =>
                  setDonationData({
                    ...donationData,
                    amount: amt,
                    customAmount: "",
                  })
                }
              >
                <Text style={styles.amountText}>${amt}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.amountButton,
                donationData.amount ===
                  (parseFloat(donationData.customAmount) || 0) &&
                  donationData.customAmount !== "" &&
                  styles.selectedAmount,
              ]}
              onPress={() =>
                setDonationData({
                  ...donationData,
                  amount: parseFloat(donationData.customAmount) || 0,
                })
              }
            >
              <Text style={styles.amountText}>Custom</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter custom amount"
            value={donationData.customAmount}
            onChangeText={(text) =>
              setDonationData({
                ...donationData,
                customAmount: text,
                amount: parseFloat(text) || 0,
              })
            }
            keyboardType="numeric"
          />
          {/* <View style={styles.frequencyContainer}>
            <Text style={styles.frequencyLabel}>Giving Frequency:</Text>
            <TouchableOpacity
              onPress={() =>
                setDonationData({ ...donationData, frequency: "one-time" })
              }
              style={styles.radioOption}
            >
              <View
                style={[
                  styles.radio,
                  donationData.frequency === "one-time" && styles.radioSelected,
                ]}
              />
              <Text style={styles.radioText}>One-time</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                setDonationData({ ...donationData, frequency: "monthly" })
              }
              style={styles.radioOption}
            >
              <View
                style={[
                  styles.radio,
                  donationData.frequency === "monthly" && styles.radioSelected,
                ]}
              />
              <Text style={styles.radioText}>Monthly</Text>
            </TouchableOpacity>
          </View> */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setCurrentStep(2)}
          >
            <Text style={styles.buttonText}>Donate Now</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (currentStep === 2) {
      return (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Donor Information</Text>
          <Text style={styles.formDescription}>
            Please provide your contact details.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={donationData.firstName}
            onChangeText={(text) =>
              setDonationData({ ...donationData, firstName: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={donationData.lastName}
            onChangeText={(text) =>
              setDonationData({ ...donationData, lastName: text })
            }
          />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={donationData.email}
            onChangeText={(text) =>
              setDonationData({ ...donationData, email: text })
            }
            keyboardType="email-address"
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setCurrentStep(1)}
            >
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => setCurrentStep(3)}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else if (currentStep === 3) {
      return (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Payment Details</Text>
          <Text style={styles.formDescription}>
            Review your donation and select payment method.
          </Text>
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              Amount: ${donationData.amount}
            </Text>
            <Text style={styles.summaryText}>
              Frequency: {donationData.frequency}
            </Text>
          </View>
          <View style={styles.paymentOptions}>
            <TouchableOpacity
              onPress={() =>
                setDonationData({
                  ...donationData,
                  paymentMethod: CHECKOUT_PAYMENT_METHOD.STRIPE,
                })
              }
              style={styles.radioOption}
            >
              <View
                style={[
                  styles.radio,
                  donationData.paymentMethod ===
                    CHECKOUT_PAYMENT_METHOD.STRIPE && styles.radioSelected,
                ]}
              />
              <Text style={styles.radioText}>Stripe Pay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                setDonationData({
                  ...donationData,
                  paymentMethod: CHECKOUT_PAYMENT_METHOD.PAYPAL,
                })
              }
              style={styles.radioOption}
            >
              <View
                style={[
                  styles.radio,
                  donationData.paymentMethod ===
                    CHECKOUT_PAYMENT_METHOD.PAYPAL && styles.radioSelected,
                ]}
              />
              <Text style={styles.radioText}>PayPal Pay</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setCurrentStep(2)}
            >
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handlePayment}
            >
              <Text style={styles.buttonText}>Donate Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <ScrollView style={styles.container}>
      <HeaderStack title="Campaign Details" />
      <View style={styles.content}>
        {campaign.image && (
          <Image source={{ uri: campaign.image }} style={styles.image} />
        )}
        <Text style={styles.title}>{campaign.title}</Text>
        <Text style={styles.description}>{campaign.shortDescription}</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.goal}>
            Goal: {campaign.goalStats.goalFormatted}
          </Text>
          <Text style={styles.raised}>
            Raised: {campaign.goalStats.actualFormatted}
          </Text>
          <Text style={styles.status}>Status: {campaign.status}</Text>
        </View>
        {renderDonationForm()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.deepDarkGray,
  },
  content: {
    padding: 16,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: Colors.textWhite,
    fontSize: 18,
  },
  image: {
    width: "100%",
    height: 350,
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textWhite,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 24,
  },
  statsContainer: {
    backgroundColor: Colors.cardBg,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goal: {
    fontSize: 18,
    color: Colors.textWhite,
    marginBottom: 8,
  },
  raised: {
    fontSize: 18,
    color: Colors.accent,
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    color: Colors.textLight,
  },
  formContainer: {
    padding: 16,
    backgroundColor: Colors.cardBg,
    marginTop: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textWhite,
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  amountButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  amountButton: {
    backgroundColor: Colors.deepDarkGray,
    padding: 10,
    margin: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedAmount: {
    backgroundColor: Colors.accent,
  },
  amountText: {
    color: Colors.textWhite,
  },
  input: {
    backgroundColor: Colors.deepDarkGray,
    color: Colors.textWhite,
    padding: 10,
    marginBottom: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  frequencyContainer: {
    marginBottom: 16,
  },
  frequencyLabel: {
    fontSize: 16,
    color: Colors.textWhite,
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    marginRight: 8,
  },
  radioSelected: {
    backgroundColor: Colors.accent,
  },
  radioText: {
    color: Colors.textWhite,
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    flex: 1,
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: Colors.deepDarkGray,
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  buttonRow: {
    flexDirection: "row",
  },
  buttonText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontWeight: "bold",
  },
  summary: {
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    color: Colors.textWhite,
    marginBottom: 4,
  },
  paymentOptions: {
    marginBottom: 16,
  },
});
