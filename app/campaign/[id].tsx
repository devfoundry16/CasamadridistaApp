import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");
import { Image } from "expo-image";

import { GiveWPService } from "@/services/Donation/GiveWPService";
import { CampaignDetail, Donation } from "@/types/campaigns/campaigns";
import { Spinner } from "@/components/Spinner";
import { CHECKOUT_PAYMENT_METHOD } from "@/types/shop/checkout";
import { useStripePay } from "@/hooks/useStripePay";
import { useUser } from "@/hooks/useUser";

export default function CampaignDetailScreen() {
  const { id, amount, productType, payment_status } = useLocalSearchParams();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const { handlePayment: payViaStripe } = useStripePay();
  const { user, updateCustomer } = useUser();
  const [donationData, setDonationData] = useState({
    amount: 10,
    customAmount: "",
    frequency: "one-time",
    firstName: user?.first_name,
    lastName: user?.last_name,
    email: user?.email,
    paymentMethod: CHECKOUT_PAYMENT_METHOD.STRIPE,
  });

  const loadCampaign = useCallback(async () => {
    try {
      const data = await GiveWPService.getCampaignById(Number(id));
      setCampaign(data);
    } catch (error) {
      console.error("Failed to load campaign:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaign();
    if (payment_status === "success" && productType === "donation") {
      handleSuccess();
    }
  }, [loadCampaign]);

  const handleStripePay = () => {
    payViaStripe(0, donationData.amount, user?.billing)
      .then((res) => {
        updateCustomer({
          meta_data: [
            {
              key: "stripe_customer_id",
              value: res?.customer,
            },
          ],
        }).then((data) => {});
        const donation_data: Donation = {
          formId: 52470,
          firstName: donationData.firstName ?? "",
          lastName: donationData.lastName ?? "",
          email: donationData.email ?? "",
          type: donationData.frequency === "one-time" ? "single" : "recurring",
          mode: "live",
          amount: {
            amount: donationData.amount,
            amountInMinorUnits: donationData.amount * 100,
            currency: "USD",
          },
          gatewayTransactionId: res?.paymentIntentId,
          campaignId: Number(id),
          donorId: 2,
          gatewayId: "stripe_payment_element",
        };
        GiveWPService.giveDonation(donation_data).then((res) => {
          Alert.alert("Donate sucessfully");
        });
      })
      .catch((err) => {
        Alert.alert(err.message);
      });
  };

  const handlePayPalPay = () => {
    router.dismissAll();
    router.navigate(
      `/PayPalScreen?amount=${donationData.amount}&productType=donation&payment_status=success&orderId=${id}`
    );
  };

  const handleSuccess = () => {
    // const donation_data: Donation = {
    const donation_data: Donation = {
      formId: 52470,
      firstName: donationData.firstName ?? "",
      lastName: donationData.lastName ?? "",
      email: donationData.email ?? "",
      type: donationData.frequency === "one-time" ? "single" : "recurring",
      mode: "live",
      amount: {
        amount: Number(amount),
        amountInMinorUnits: Number(amount) * 100,
        currency: "USD",
      },
      campaignId: Number(id),
      donorId: 2,
      gatewayId: "paypal_standard",
    };
    GiveWPService.giveDonation(donation_data)
      .then((res) => {
        Alert.alert("Donate sucessfully");
      })
      .catch((err) => {
        Alert.alert(err.message);
      });
  };

  const handlePayment = () => {
    if (donationData.paymentMethod === CHECKOUT_PAYMENT_METHOD.STRIPE)
      handleStripePay();
    else handlePayPalPay();
  };

  if (loading) {
    return (
      <>
        <View className="flex-1 justify-center items-center bg-bg-medium">
          <Spinner content="Loading Campaign" />
        </View>
      </>
    );
  }

  if (!campaign) {
    return (
      <View className="flex-1 bg-bg-medium">
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-lg">Campaign not found.</Text>
        </View>
      </View>
    );
  }

  const renderDonationForm = () => {
    if (currentStep === 1) {
      return (
        <View className="p-4 bg-bg-card mt-4 rounded-lg border border-border-default">
          <Text className="text-xl font-bold text-white mb-2">
            How much would you like to donate today?
          </Text>
          <Text className="text-base text-text-secondary mb-4">
            All donations directly impact our organization and help us further
            our mission.
          </Text>
          <View className="flex-row flex-wrap mb-4">
            {[10, 25, 50, 100, 250, 500].map((amt) => (
              <TouchableOpacity
                key={amt}
                className={`p-2.5 m-1 rounded border ${
                  donationData.amount === amt ? "bg-rm-gold border-border-default" : "bg-bg-medium border border-border-default"
                }`}
                onPress={() =>
                  setDonationData({
                    ...donationData,
                    amount: amt,
                    customAmount: "",
                  })
                }
              >
                <Text className="text-white">${amt}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className={`p-2.5 m-1 rounded border ${
                donationData.amount === (parseFloat(donationData.customAmount) || 0) &&
                donationData.customAmount !== ""
                  ? "bg-rm-gold border-border-default"
                  : "bg-bg-medium border border-border-default"
              }`}
              onPress={() =>
                setDonationData({
                  ...donationData,
                  amount: parseFloat(donationData.customAmount) || 0,
                })
              }
            >
              <Text className="text-white">Custom</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            className="bg-bg-medium text-white p-2.5 mb-4 rounded border border-border-default"
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
            className="bg-rm-gold p-3 rounded items-center flex-1 ml-2"
            onPress={() => setCurrentStep(2)}
          >
            <Text className="text-white text-base font-bold">Donate Now</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (currentStep === 2) {
      return (
        <View className="p-4 bg-bg-card mt-4 rounded-lg border border-border-default">
          <Text className="text-xl font-bold text-white mb-2">Donor Information</Text>
          <Text className="text-base text-text-secondary mb-4">
            Please provide your contact details.
          </Text>
          <TextInput
            className="bg-bg-medium text-white p-2.5 mb-4 rounded border border-border-default"
            placeholder="First Name"
            value={donationData.firstName}
            onChangeText={(text) =>
              setDonationData({ ...donationData, firstName: text })
            }
          />
          <TextInput
            className="bg-bg-medium text-white p-2.5 mb-4 rounded border border-border-default"
            placeholder="Last Name"
            value={donationData.lastName}
            onChangeText={(text) =>
              setDonationData({ ...donationData, lastName: text })
            }
          />
          <TextInput
            className="bg-bg-medium text-white p-2.5 mb-4 rounded border border-border-default"
            placeholder="Email Address"
            value={donationData.email}
            onChangeText={(text) =>
              setDonationData({ ...donationData, email: text })
            }
            keyboardType="email-address"
          />
          <View className="flex-row">
            <TouchableOpacity
              className="bg-bg-medium p-3 rounded items-center flex-1 mr-2"
              onPress={() => setCurrentStep(1)}
            >
              <Text className="text-white text-base font-bold">Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-rm-gold p-3 rounded items-center flex-1 ml-2"
              onPress={() => setCurrentStep(3)}
            >
              <Text className="text-white text-base font-bold">Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else if (currentStep === 3) {
      return (
        <View className="p-4 bg-bg-card mt-4 rounded-lg border border-border-default">
          <Text className="text-xl font-bold text-white mb-2">Payment Details</Text>
          <Text className="text-base text-text-secondary mb-4">
            Review your donation and select payment method.
          </Text>
          <View className="mb-4">
            <Text className="text-base text-white mb-1">
              Amount: ${donationData.amount}
            </Text>
            <Text className="text-base text-white mb-1">
              Frequency: {donationData.frequency}
            </Text>
          </View>
          <View className="mb-4">
            <TouchableOpacity
              onPress={() =>
                setDonationData({
                  ...donationData,
                  paymentMethod: CHECKOUT_PAYMENT_METHOD.STRIPE,
                })
              }
              className="flex-row items-center mb-2"
            >
              <View
                className={`w-5 h-5 rounded-full border-2 mr-2 ${
                  donationData.paymentMethod === CHECKOUT_PAYMENT_METHOD.STRIPE ? "bg-rm-gold border-text-secondary" : "border-text-secondary"
                }`}
              />
              <Text className="text-white">Stripe Pay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                setDonationData({
                  ...donationData,
                  paymentMethod: CHECKOUT_PAYMENT_METHOD.PAYPAL,
                })
              }
              className="flex-row items-center mb-2"
            >
              <View
                className={`w-5 h-5 rounded-full border-2 mr-2 ${
                  donationData.paymentMethod === CHECKOUT_PAYMENT_METHOD.PAYPAL ? "bg-rm-gold border-text-secondary" : "border-text-secondary"
                }`}
              />
              <Text className="text-white">PayPal Pay</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row">
            <TouchableOpacity
              className="bg-bg-medium p-3 rounded items-center flex-1 mr-2"
              onPress={() => setCurrentStep(2)}
            >
              <Text className="text-white text-base font-bold">Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-rm-gold p-3 rounded items-center flex-1 ml-2"
              onPress={handlePayment}
            >
              <Text className="text-white text-base font-bold">Donate Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <ScrollView className="flex-1 bg-bg-medium">
      <View className="p-4">
        {campaign.image && (
          <Image
            contentFit="contain"
            source={{ uri: campaign.image }}
            style={{ width: screenWidth, height: 350, borderRadius: 8 }}
            className="mb-4"
          />
        )}
        <Text className="text-2xl font-bold text-white mb-2">{campaign.title}</Text>
        <Text className="text-base text-text-secondary mb-4 leading-6">{campaign.shortDescription}</Text>
        <View className="bg-bg-card p-4 rounded-lg border border-border-default">
          <Text className="text-lg text-white mb-2">
            Goal: {campaign.goalStats.goalFormatted.replace("&#36;", "$")}
          </Text>
          <Text className="text-lg text-rm-gold mb-2">
            Raised: {campaign.goalStats.actualFormatted.replace("&#36;", "$")}
          </Text>
          <Text className="text-base text-text-muted">Status: {campaign.status}</Text>
        </View>
        {renderDonationForm()}
      </View>
    </ScrollView>
  );
}
