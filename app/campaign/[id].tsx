import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { Spinner } from "@/components/Spinner";
import { CHECKOUT_PAYMENT_METHOD } from "@/types/shop/checkout";
import { useStripePay } from "@/hooks/useStripePay";
import { useUser } from "@/hooks/useUser";
import { useDonation } from "@/hooks/useDonation";
import CampaignService, { Campaign } from "@/services/CampaignService";

export default function CampaignDetailScreen() {
  const { t } = useTranslation();
  const { id, productType, payment_status } = useLocalSearchParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const { payWithClientSecret } = useStripePay();
  const { user } = useUser();
  const { createDonationIntent, confirmDonation } = useDonation();
  
  const [donationData, setDonationData] = useState({
    amount: 10,
    customAmount: "",
    frequency: "one-time",
    firstName: user?.profile?.first_name || "",
    lastName: user?.profile?.last_name || "",
    email: user?.email || "",
    paymentMethod: CHECKOUT_PAYMENT_METHOD.STRIPE,
  });

  const loadCampaign = useCallback(async () => {
    const campaignId = Array.isArray(id) ? id[0] : id;
    if (!campaignId || typeof campaignId !== "string") {
      setCampaign(null);
      setLoading(false);
      return;
    }
    try {
      const data = await CampaignService.getCampaignById(campaignId);
      setCampaign(data ?? null);
    } catch (error) {
      console.error("Failed to load campaign:", error);
      setCampaign(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCampaign();
    if (payment_status === "success" && productType === "donation") {
      handleSuccess();
    }
  }, [loadCampaign]);

  const handleStripePay = async () => {
    try {
      // Create Stripe payment intent for donation
      const { clientSecret, paymentIntentId } = await createDonationIntent({
        amount: donationData.amount,
        currency: 'usd',
        campaignName: campaign?.title,
        donorName: `${donationData.firstName} ${donationData.lastName}`,
        donorEmail: donationData.email,
      });

      // Process Stripe payment using the same donation intent client secret
      await payWithClientSecret(clientSecret);
      
      // Confirm donation after successful payment
      await confirmDonation({
        paymentIntentId,
        amount: donationData.amount,
        campaignName: campaign?.title,
        donorName: `${donationData.firstName} ${donationData.lastName}`,
        donorEmail: donationData.email,
      });

      Alert.alert(t("common.success"), t("alerts.donationThankYou"));
      router.back();
    } catch (err: any) {
      Alert.alert(t("common.error"), err.message || t("alerts.donationFailed"));
    }
  };

  const handleSuccess = async () => {
    try {
      Alert.alert(t("common.success"), t("alerts.donationThankYou"));
      router.back();
    } catch (err: any) {
      Alert.alert(t("common.error"), err.message || t("alerts.donationFailed"));
    }
  };

  const handlePayment = () => {
    if (donationData.paymentMethod === CHECKOUT_PAYMENT_METHOD.STRIPE)
      handleStripePay();
  };

  if (loading) {
    return (
      <>
        <View className="flex-1 justify-center items-center bg-bg-medium">
          <Spinner content={t("campaign.loading")} />
        </View>
      </>
    );
  }

  if (!campaign) {
    return (
      <View className="flex-1 bg-bg-medium">
        <View className="flex-1 justify-center items-center">
          <Text className="text-white text-lg">{t("alerts.campaignNotFound")}</Text>
        </View>
      </View>
    );
  }

  const renderDonationForm = () => {
    if (currentStep === 1) {
      return (
        <View className="p-4 bg-bg-card mt-4 rounded-lg border border-border-default">
          <Text className="text-xl font-bold text-white mb-2">
            {t("donate.howMuchToday")}
          </Text>
          <Text className="text-base text-text-secondary mb-4">
            {t("donate.impactMessage")}
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
              <Text className="text-white">{t("common.custom")}</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            className="bg-bg-medium text-white p-2.5 mb-4 rounded border border-border-default"
            placeholder={t("campaign.enterCustomAmount")}
            placeholderTextColor={Colors.text.secondary}
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
            <Text className="text-white text-base font-bold">{t("donate.donateNow")}</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (currentStep === 2) {
      return (
        <View className="p-4 bg-bg-card mt-4 rounded-lg border border-border-default">
          <Text className="text-xl font-bold text-white mb-2">{t("donate.donorInfo")}</Text>
          <Text className="text-base text-text-secondary mb-4">
            {t("donate.contactDetails")}
          </Text>
          <TextInput
            className="bg-bg-medium text-white p-2.5 mb-4 rounded border border-border-default"
            placeholder={t("campaign.firstName")}
            value={donationData.firstName}
            onChangeText={(text) =>
              setDonationData({ ...donationData, firstName: text })
            }
          />
          <TextInput
            className="bg-bg-medium text-white p-2.5 mb-4 rounded border border-border-default"
            placeholder={t("campaign.lastName")}
            value={donationData.lastName}
            onChangeText={(text) =>
              setDonationData({ ...donationData, lastName: text })
            }
          />
          <TextInput
            className="bg-bg-medium text-white p-2.5 mb-4 rounded border border-border-default"
            placeholder={t("campaign.emailAddress")}
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
              <Text className="text-white text-base font-bold">{t("common.back")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-rm-gold p-3 rounded items-center flex-1 ml-2"
              onPress={() => setCurrentStep(3)}
            >
              <Text className="text-white text-base font-bold">{t("common.continue")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    } else if (currentStep === 3) {
      return (
        <View className="p-4 bg-bg-card mt-4 rounded-lg border border-border-default">
          <Text className="text-xl font-bold text-white mb-2">{t("donate.paymentDetails")}</Text>
          <Text className="text-base text-text-secondary mb-4">
            {t("donate.reviewDonation")}
          </Text>
          <View className="mb-4">
            <Text className="text-base text-white mb-1">
              {t("donate.amount")}: ${donationData.amount}
            </Text>
            <Text className="text-base text-white mb-1">
              {t("donate.frequency")}: {donationData.frequency}
            </Text>
          </View>
          {/*<View className="mb-4">
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
          </View>*/}
          <View className="flex-row">
            <TouchableOpacity
              className="bg-bg-medium p-3 rounded items-center flex-1 mr-2"
              onPress={() => setCurrentStep(2)}
            >
              <Text className="text-white text-base font-bold">{t("common.back")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-rm-gold p-3 rounded items-center flex-1 ml-2"
              onPress={handlePayment}
            >
              <Text className="text-white text-base font-bold">{t("donate.donateNow")}</Text>
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
            contentFit="cover"
            source={{ uri: campaign.image }}
            style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 20 }}
          />
        )}
        <Text className="text-2xl font-bold text-white mb-2">{campaign.title}</Text>
        <Text className="text-base text-text-secondary mb-4 leading-6">{campaign.shortDescription}</Text>
        <View className="bg-bg-card p-4 rounded-lg border border-border-default">
          <Text className="text-lg text-white mb-2">
            {t("campaign.goal")}: {campaign.goalStats.goalFormatted}
          </Text>
          <Text className="text-lg text-rm-gold mb-2">
            {t("campaign.raised")}: {campaign.goalStats.actualFormatted}
          </Text>
          <Text className="text-base text-text-muted">{t("common.status")}: {campaign.status}</Text>
        </View>
        {renderDonationForm()}
      </View>
    </ScrollView>
  );
}
