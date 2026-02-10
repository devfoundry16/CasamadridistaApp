import { Check, X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Purchases, { PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
const packages = [
  {
    id: 1,
    name: "Hala Gold Card",
    monthlyPrice: "4.9",
    yearlyPrice: "48",
    yearlyOriginal: "60",
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
    monthlyPrice: "14.9",
    yearlyPrice: "144",
    yearlyOriginal: "180",
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
    monthlyPrice: "34.9",
    yearlyPrice: "336",
    offerIdentifier: 'offer_vip',
    yearlyOriginal: "420",
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
  const [billingType, setBillingType] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [activeProductIds, setActiveProductIds] = useState<string[]>([]);

  const getCustomerInfo = useCallback(async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      setActiveProductIds(customerInfo.activeSubscriptions || []);
    } catch {
      // Silent failure, we can still show default CTA
    }
  }, []);

  useEffect(() => {
    getOfferings();
    getCustomerInfo();
  }, [getCustomerInfo]);
  const handleSubscribe = async (pkg: PurchasesPackage) => {
    console.log(pkg.product.title, pkg.packageType.toLowerCase());
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setActiveProductIds(customerInfo.activeSubscriptions || []);
      if (typeof customerInfo.entitlements.active[pkg.product.title] !== 'undefined') {
        Alert.alert("Success", "Subscription purchased successfully.");
      }
    } catch (error: any) {
      Alert.alert("Alert", error.message || "Failed to purchase subscription. Please try again.");
      return;
    }
  }
  const getOfferings = async () => {
    const offerings = await Purchases.getOfferings();
    if (offerings !== null && offerings.current?.availablePackages.length !== 0) {
      setOfferings(offerings);
    }
  }
  
  return (
    <ScrollView className="flex-1 bg-bg-gray">
      <View className="p-5">
        <Text className="text-2xl font-bold text-text-primary mb-2 text-center">Choose Your Membership Package</Text>
        <Text className="text-sm text-text-primary mb-6 text-center">
          Join Casa Madridista and get exclusive access to Real Madrid content
        </Text>
        <View className="flex-row bg-rm-gold rounded-xl overflow-hidden">
          <TouchableOpacity
            className={`flex-1 py-3 px-4 ${billingType === "monthly" ? "bg-white" : ""}`}
            onPress={() => setBillingType("monthly")}
          >
            <Text className={`text-base font-semibold text-center ${billingType === "monthly" ? "text-rm-gold" : "text-white"}`}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 px-4 ${billingType === "yearly" ? "bg-white" : ""}`}
            onPress={() => setBillingType("yearly")}
          >
            <Text className={`text-base font-semibold text-center ${billingType === "yearly" ? "text-rm-gold" : "text-white"}`}>
              Yearly
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
                let ctaLabel = "Subscribe";
                if (activeProductIds.length > 0) {
                  if (selectedProductId && activeProductIds.includes(selectedProductId)) {
                    ctaLabel = "Current Plan";
                  } else if (!isNaN(currentPrice) && !isNaN(selectedPrice)) {
                    if (selectedPrice > currentPrice) ctaLabel = "Upgrade";
                    else if (selectedPrice < currentPrice) ctaLabel = "Downgrade";
                    else ctaLabel = "Change Plan";
                  } else {
                    ctaLabel = "Change Plan";
                  }
                }

                const disableCTA = !selectedPurchasePackage || ctaLabel === "Current Plan";

                return (
                  <View key={pkg.id}>
                    <View className="mb-6">
                      {pkg.badge && (
                        <View className={`self-start px-3 py-1 rounded-full mb-2 ${pkg.badge === "VIP" ? "bg-rm-gold" : "bg-rm-gold"}`}>
                          <Text className="text-xs font-bold text-white">
                            {pkg.badge.toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <Text className="text-xl font-bold text-white">{pkg.name}</Text>
                    </View>
                    <View className={`bg-bg-medium p-5 mb-4 ${pkg.badge === "Popular" ? "border-2 border-rm-gold" : ""}`}>
                      <View className="mb-4">
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
                          {billingType === "monthly" ? " per month" : " per year"}
                        </Text>
                      </View>
                      <View className="mb-4">
                        {pkg.features.map((feature, index) => (
                          <View key={index} className="mb-2">
                            <View key={index} className="flex-row items-center gap-2">
                              <Check size={20} strokeWidth={4} color="#BC9045" />
                              <Text className="text-sm text-white flex-1">{feature}</Text>
                            </View>
                            <View className="h-px bg-border-default my-1" />
                          </View>
                        ))}
                        {pkg.non_featured.map((feature, index) => (
                          <View key={index} className="mb-2">
                            <View key={index} className="flex-row items-center gap-2">
                              <X size={20} strokeWidth={4} color="#BC9045" />
                              <Text className="text-sm text-white flex-1">{feature}</Text>
                            </View>
                            <View className="h-px bg-border-default my-1" />
                          </View>
                        ))}
                      </View>
                      <TouchableOpacity
                        disabled={disableCTA}
                        className={`py-4 rounded-xl items-center ${pkg.badge === "Popular" ? "bg-rm-gold" : "bg-bg-light"} ${disableCTA ? "opacity-50" : ""}`}
                        onPress={() => selectedPurchasePackage && !disableCTA && handleSubscribe(selectedPurchasePackage)}
                      >
                        <Text className={`text-base font-bold ${pkg.badge === "Popular" ? "text-white" : "text-white"}`}>
                          {selectedPurchasePackage ? ctaLabel : "Not Available"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

