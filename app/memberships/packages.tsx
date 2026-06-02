import {Spinner} from "@/components/Spinner";
import {Check, X} from "lucide-react-native";
import React, {useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {Text} from "@/components/Text";
import {
  Alert,
  ScrollView,
  TouchableOpacity,
  View,
  Platform
} from "react-native";
import Purchases, {PurchasesOfferings, PurchasesPackage} from 'react-native-purchases';
import {useLocalSearchParams, useRouter} from "expo-router";
import SubscriptionService from '@/services/SubscriptionService';

const packages = [
  {
    id: 1,
    name: "Hala Gold Card",
    monthlyPrice: "4.99",
    yearlyPrice: "47.99",
    yearlyOriginal: "59.99",
    product_id: 50869,
    variation_id: [50891, 50892],
    offerIdentifier: 'offer_hala',
    features: [
      "OLicial digital membership card",
      "WhatsApp news channel access",
      "Vote in formations and polls",
      "Exclusive video content (1/month)",
      "5% discount on tickets & merchandise",
    ],
    non_featured: [
      "Members-only competitions",
      "Access to symbolic Real Madrid tickets",
      "Name on gratitude page",
      "Monthly live session",
      "Annual event invite or signed gift",
      "Right to attend & vote in fan club meetings",
    ],
  },
  {
    id: 2,
    name: "Rey de Europa Premium",
    monthlyPrice: "14.99",
    yearlyPrice: "143.99",
    yearlyOriginal: "179.99",
    product_id: 50874,
    variation_id: [50888, 50889],
    offerIdentifier: 'offer_rey',
    features: [
      "OLicial digital membership card",
      "WhatsApp news channel access",
      "Vote in formations and polls",
      "Exclusive video content (1/month)",
      "10% discount on tickets & merchandise",
      "Members-only competitions",
      "Access to symbolic Real Madrid tickets",
    ],
    non_featured: [
      "Name on gratitude page",
      "Monthly live session",
      "Annual event invite or signed gift",
      "Right to attend & vote in fan club meetings",
    ],
    badge: "Popular",
  },
  {
    id: 3,
    name: "Galácticos - VIP",
    monthlyPrice: "34.99",
    yearlyPrice: "334.99",
    offerIdentifier: 'offer_vip',
    yearlyOriginal: "419.99",
    product_id: 50879,
    variation_id: [50883, 50884],
    features: [
      "OLicial digital membership card",
      "WhatsApp news channel access",
      "Vote in formations and polls",
      "Exclusive video content (weekly/monthly)",
      "20% discount on tickets & merchandise",
      "Members-only competitions",
      "Access to symbolic Real Madrid tickets",
      "Name on gratitude page",
      "Monthly live session with team or analysis",
      "1 exclusive annual event or signed gift",
      "Right to attend & vote in fan club meetings",
    ],
    non_featured: [],
    badge: "VIP",
  },
];

export default function PackagesScreen() {
  const {t} = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{
    fanClubId?: string;
    fanClubName?: string;
    country?: string;
  }>();
  const [billingType, setBillingType] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [activeProductIds, setActiveProductIds] = useState<string[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);

  const getCustomerInfo = useCallback(async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setActiveProductIds(customerInfo.activeSubscriptions || []);
    } catch {
      // Silent failure, we can still show default CTA
    }
  }, []);

  const getOfferings = useCallback(async () => {
    try {
      const result = await Purchases.getOfferings();
      if (result !== null && result.current?.availablePackages.length !== 0) {
        setOfferings(result);
      }
    } finally {
      setIsLoadingPackages(false);
    }
  }, []);

  useEffect(() => {
    setIsLoadingPackages(true);
    Promise.all([getOfferings(), getCustomerInfo()]).finally(() => {
      setIsLoadingPackages(false);
    });
  }, [getOfferings, getCustomerInfo]);
  const handleSubscribe = async (pkg: PurchasesPackage) => {
    console.log(pkg.product.title, pkg.packageType.toLowerCase());
    try {
      const {customerInfo} = await Purchases.purchasePackage(pkg);
      setActiveProductIds(customerInfo.activeSubscriptions || []);
      if (typeof customerInfo.entitlements.active[pkg.product.title] !== 'undefined') {
        SubscriptionService.createSubscription({
          subscriptionType: pkg.product.identifier,
          price:            pkg.product.price,
          currency:         pkg.product.currencyCode,
          fanClubId:        params.fanClubId || null,
        }).catch(() => {});

        router.push({
          pathname: '/memberships/registration' as any,
          params: {
            fanClubId:   params.fanClubId || undefined,
            fanClubName: params.fanClubName || undefined,
            country:     params.country || undefined,
          },
        });
      }
    } catch (error: any) {
      Alert.alert(t("common.error"), error.message || t("alerts.subscriptionFailed"));
      return;
    }
  }
  if (isLoadingPackages) {
    return (
      <View className="flex-1 bg-bg-medium justify-center items-center">
        <Spinner content={t("membership.loadingPackages")}/>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-bg-medium">
      <View className="p-5">
        <Text className="text-2xl font-bold text-text-primary mb-2 text-center">{t("membership.choosePackage")}</Text>
        <Text className="text-sm text-text-primary mb-6 text-center">
          {t("home.joinLargest")}
        </Text>
        <View className="flex-row bg-rm-gold rounded-xl overflow-hidden mb-6 p-1">
          <TouchableOpacity
            className={`flex-1 py-3 px-4 rounded-xl ${billingType === "monthly" ? "bg-white" : ""}`}
            onPress={() => setBillingType("monthly")}
          >
            <Text
              className={`text-base font-semibold text-center ${billingType === "monthly" ? "text-rm-gold" : "text-white"}`}>
              {t("membership.monthly")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 px-4 rounded-xl ${billingType === "yearly" ? "bg-white" : ""}`}
            onPress={() => setBillingType("yearly")}
          >
            <Text
              className={`text-base font-semibold text-center ${billingType === "yearly" ? "text-rm-gold" : "text-white"}`}>
              {t("membership.yearly")}
            </Text>
          </TouchableOpacity>
        </View>
        {Object.values(offerings?.all || {}).map(offering => (
          <View key={offering.identifier}>
            {packages
              .filter(pkg => pkg.offerIdentifier === offering.identifier)
              .map(pkg => {
                // Determine correct PurchasesPackage by billingType
                const selectedPurchasePackage =
                  offering.availablePackages.find(apkg =>
                    billingType === "monthly"
                      ? apkg.packageType.toLowerCase() === "monthly"
                      : apkg.packageType.toLowerCase() === "annual" || apkg.packageType.toLowerCase() === "yearly"
                  );

                const selectedProductId = selectedPurchasePackage?.product.identifier;

                // Find current active package (if any) within this offering to compare pricing
                const currentActiveId = activeProductIds.find(id =>
                  offering.availablePackages.some(apkg => apkg.product.identifier === id)
                );
                const currentActivePackage = offering.availablePackages.find(
                  apkg => apkg.product.identifier === currentActiveId
                );

                const selectedPrice = selectedPurchasePackage?.product.price ?? NaN;
                const currentPrice = currentActivePackage?.product.price ?? NaN;

                // Derive CTA label based on current active subscription
                let ctaLabel = t("membership.subscribe");
                if (activeProductIds.length > 0) {
                  if (selectedProductId && activeProductIds.includes(selectedProductId)) {
                    ctaLabel = t("membership.currentPlan");
                  } else if (!isNaN(currentPrice) && !isNaN(selectedPrice)) {
                    if (selectedPrice > currentPrice) ctaLabel = t("membership.upgrade");
                    else if (selectedPrice < currentPrice) ctaLabel = t("membership.downgrade");
                    else ctaLabel = t("membership.changePlan");
                  } else {
                    ctaLabel = t("membership.changePlan");
                  }
                }

                const disableCTA = !selectedPurchasePackage || ctaLabel === t("membership.currentPlan");

                return (
                  <View key={pkg.id}>

                    <View className={`bg-bg-card p-5 mb-4 ${pkg.badge === "Popular" ? "border-2 border-rm-gold" : ""}`}>
                      <View className="mb-6">
                        {pkg.badge && (
                          <View
                            className={`self-start px-3 py-1 rounded-full mb-2 ${pkg.badge === "VIP" ? "bg-rm-gold" : "bg-rm-gold"}`}>
                            <Text className="text-xs font-bold text-white">
                              {pkg.badge.toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <Text className="text-xl font-bold text-white">{pkg.name}</Text>
                      </View>
                      <View className="mb-4 flex-row items-center gap-2">
                        {billingType === "yearly" && (
                          <Text className="text-sm text-text-secondary line-through">
                            ${pkg.yearlyOriginal}
                          </Text>
                        )}
                        <Text className="text-2xl font-bold text-rm-gold">
                          {billingType === "monthly"
                            ? `$${pkg.monthlyPrice}`
                            : `$${pkg.yearlyPrice}`}
                        </Text>
                        <Text className="text-sm text-text-secondary">
                          {billingType === "monthly" ? t("membership.perMonth") : t("membership.perYear")}
                        </Text>
                      </View>
                      <View className="mb-4">
                        {pkg.features.map((feature, index) => (
                          <View key={index} className="mb-2">
                            <View key={index} className="flex-row items-center gap-2">
                              <Check size={20} strokeWidth={4} color="#BC9045"/>
                              <Text className="text-sm text-white flex-1">{feature}</Text>
                            </View>
                            <View className="h-px bg-border-default my-1"/>
                          </View>
                        ))}
                        {pkg.non_featured.map((feature, index) => (
                          <View key={index} className="mb-2">
                            <View key={index} className="flex-row items-center gap-2">
                              <X size={20} strokeWidth={4} color="#BC9045"/>
                              <Text className="text-sm text-white flex-1">{feature}</Text>
                            </View>
                            <View className="h-px bg-border-default my-1"/>
                          </View>
                        ))}
                      </View>
                      <TouchableOpacity
                        disabled={disableCTA}
                        className={`py-4 rounded-xl items-center ${pkg.badge === "Popular" ? "bg-rm-gold" : "bg-bg-light"} ${disableCTA ? "opacity-50" : ""}`}
                        onPress={() => selectedPurchasePackage && !disableCTA && handleSubscribe(selectedPurchasePackage)}
                      >
                        <Text
                          className={`text-base font-bold ${pkg.badge === "Popular" ? "text-white" : "text-white"}`}>
                          {selectedPurchasePackage ? ctaLabel : t("membership.notAvailable")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
          </View>
        ))}
        {/* Legal footer — required by Apple Guideline 3.1.2(c) */}
        {
          Platform.OS === 'ios' &&
            <View className="mt-6 mb-4 px-2">
                <Text className="text-xs text-text-secondary text-center mb-3 leading-5">
                  {t("membership.autoRenewDisclosure")}
                </Text>
                <View className="flex-row justify-center items-center gap-4">
                    <TouchableOpacity onPress={() => router.push("/terms-of-service")}>
                        <Text className="text-xs text-rm-gold underline">
                          {t("membership.termsOfUse")}
                        </Text>
                    </TouchableOpacity>
                    <Text className="text-xs text-text-secondary">|</Text>
                    <TouchableOpacity onPress={() => router.push("/privacy-policy")}>
                        <Text className="text-xs text-rm-gold underline">
                          {t("membership.privacyPolicy")}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        }
      </View>
    </ScrollView>
  );
}

