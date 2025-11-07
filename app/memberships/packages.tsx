import Colors from "@/constants/colors";
import { useCart } from "@/hooks/useCart";
import { useOrder } from "@/hooks/useOrder";
import { useUser } from "@/hooks/useUser";
import { CHECKOUT_PRODUCT_TYPE } from "@/types/shop/checkout";
import { Product } from "@/types/shop/product";
import { router } from "expo-router";
import { Check, Crown, RefreshCcw, X } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
const packages = [
  {
    id: 1,
    name: "Hala Gold Card",
    monthlyPrice: "4.9",
    yearlyPrice: "48",
    yearlyOriginal: "60",
    product_id: 50869,
    variation_id: [50891, 50892],
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
  const { addToCart, items } = useCart();
  const { getSubscriptionOrders } = useOrder();
  const { user } = useUser();
  const cartCount = items.length;
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [billingType, setBillingType] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [loading, setLoading] = useState(false);

  const loadCurrentSubscription = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const subs = await getSubscriptionOrders(user.id);
      const activeSub = subs?.[0]; // Get most recent subscription
      setCurrentSubscription(activeSub);
    } catch (error) {
      console.error("Error loading subscription:", error);
    }
    setLoading(false);
  }, [getSubscriptionOrders, user?.id]);

  useEffect(() => {
    loadCurrentSubscription();
  }, [loadCurrentSubscription]);

  const handlePackage = async (product_id: number, variation_id: number) => {
    // Don't process if it's the current plan
    if (currentSubscription?.line_items[0]?.product_id === product_id) {
      return;
    }

    const product = {
      id: product_id,
      quantity: 1,
      attributes: [
        {
          id: 1,
          name: "Billing Period",
          slug: "pa_billing-period",
          position: 0,
          visible: true,
          variation: true,
          options: [billingType.charAt(0).toUpperCase() + billingType.slice(1)],
        },
      ],
    };

    // Show confirmation if this is a plan change
    if (currentSubscription) {
      const isUpgrade =
        Number(
          packages.find((p) => p.product_id === product_id)?.monthlyPrice
        ) > Number(currentSubscription.line_items[0].price);
      const action = isUpgrade ? "upgrade to" : "downgrade to";
      const currentPlan = currentSubscription.line_items[0].name;
      const newPlan = packages.find((p) => p.product_id === product_id)?.name;

      Alert.alert(
        `Confirm ${isUpgrade ? "Upgrade" : "Downgrade"}`,
        `Are you sure you want to ${action} ${newPlan} from ${currentPlan}?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Continue",
            onPress: () => processPlanChange(product),
          },
        ]
      );
      return;
    }

    // New subscription flow
    if (cartCount) {
      Alert.alert(
        "Invalid Cart",
        `You cannot purchase subscription with other items in the cart. Please clear your cart and try again.`
      );
    } else {
      processPlanChange(product);
    }
  };

  const processPlanChange = async (product: any) => {
    try {
      await addToCart(product as Product);
      router.push(
        `/checkout?productType=${CHECKOUT_PRODUCT_TYPE.SUBSCRIPTION}`
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "There was a problem processing your request"
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Choose Your Membership Package</Text>
        <Text style={styles.subheader}>
          Join Casa Madridista and get exclusive access to Real Madrid content
        </Text>

        {currentSubscription && (
          <View style={styles.currentPlanContainer}>
            <View style={styles.currentPlanHeader}>
              <Crown size={24} color={Colors.darkGold} />
              <Text style={styles.currentPlanTitle}>Current Plan</Text>
            </View>
            <Text style={styles.currentPlanName}>
              {currentSubscription.line_items[0].name}
            </Text>
            <Text style={styles.currentPlanPeriod}>
              {currentSubscription.billing_period === "month"
                ? "Monthly"
                : "Yearly"}{" "}
              Plan
            </Text>
          </View>
        )}

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              billingType === "monthly" && styles.toggleButtonActive,
            ]}
            onPress={() => setBillingType("monthly")}
          >
            <Text
              style={[
                styles.toggleText,
                billingType === "monthly" && styles.toggleTextActive,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              billingType === "yearly" && styles.toggleButtonActive,
            ]}
            onPress={() => setBillingType("yearly")}
          >
            <Text
              style={[
                styles.toggleText,
                billingType === "yearly" && styles.toggleTextActive,
              ]}
            >
              Yearly
            </Text>
          </TouchableOpacity>
        </View>

        {packages.map((pkg) => (
          <View key={pkg.id}>
            <View
              style={
                pkg.badge !== "Popular"
                  ? styles.packageNameContainer
                  : styles.popularPackageNameContainer
              }
            >
              {pkg.badge && (
                <View
                  style={[styles.badge, pkg.badge === "VIP" && styles.vipBadge]}
                >
                  <Text style={styles.badgeText}>
                    {pkg.badge.toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.packageName}>{pkg.name}</Text>
            </View>
            <View
              style={[
                styles.card,
                pkg.badge === "Popular" && styles.popularCard,
              ]}
            >
              <View style={styles.priceContainer}>
                {billingType === "yearly" && (
                  <Text style={styles.yearlyOriginal}>
                    ${pkg.yearlyOriginal}
                  </Text>
                )}
                <Text style={styles.price}>
                  {billingType === "monthly"
                    ? `$${pkg.monthlyPrice}`
                    : `$${pkg.yearlyPrice}`}
                </Text>
                <Text style={styles.period}>
                  {billingType === "monthly" ? " per month" : " per year"}
                </Text>
              </View>
              <View style={styles.featuresContainer}>
                {pkg.features.map((feature, index) => (
                  <View key={index} style={styles.featureColumn}>
                    <View key={index} style={styles.featureRow}>
                      <Check
                        size={20}
                        strokeWidth={4}
                        color={Colors.darkGold}
                      />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                    <View style={styles.accentLine} />
                  </View>
                ))}
                {pkg.non_featured.map((feature, index) => (
                  <View key={index} style={styles.featureColumn}>
                    <View key={index} style={styles.featureRow}>
                      <X size={20} strokeWidth={4} color={Colors.darkGold} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                    <View style={styles.accentLine} />
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.button,
                  pkg.badge === "Popular" && styles.popularButton,
                  currentSubscription?.line_items[0]?.product_id ===
                    pkg.product_id && styles.currentButton,
                ]}
                onPress={() =>
                  handlePackage(
                    pkg.product_id,
                    pkg.variation_id[billingType === "monthly" ? 0 : 1]
                  )
                }
                disabled={
                  currentSubscription?.line_items[0]?.product_id ===
                  pkg.product_id
                }
              >
                {currentSubscription?.line_items[0]?.product_id ===
                pkg.product_id ? (
                  <Text style={[styles.buttonText, styles.currentButtonText]}>
                    CURRENT PLAN
                  </Text>
                ) : currentSubscription ? (
                  <>
                    <RefreshCcw
                      size={16}
                      color={
                        pkg.badge === "Popular"
                          ? Colors.primary
                          : Colors.textWhite
                      }
                    />
                    <Text
                      style={[
                        styles.buttonText,
                        pkg.badge === "Popular" && styles.popularButtonText,
                      ]}
                    >
                      {Number(pkg.monthlyPrice) >
                      Number(currentSubscription.line_items[0].price)
                        ? "UPGRADE"
                        : "DOWNGRADE"}
                    </Text>
                  </>
                ) : (
                  <Text
                    style={[
                      styles.buttonText,
                      pkg.badge === "Popular" && styles.popularButtonText,
                    ]}
                  >
                    BUY NOW
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  currentPlanContainer: {
    backgroundColor: Colors.cardBg,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.darkGold,
  },
  currentPlanHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  currentPlanTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.darkGold,
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  currentPlanPeriod: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.darkGray,
  },
  content: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.primary,
    marginBottom: 8,
    textAlign: "center" as const,
  },
  subheader: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 24,
    textAlign: "center" as const,
  },
  card: {
    backgroundColor: Colors.deepDarkGray,
    padding: 20,
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: "row" as const,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center" as const,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: Colors.darkGold,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textLight,
  },
  toggleTextActive: {
    color: Colors.primary,
  },
  popularCard: {
    borderColor: Colors.darkGold,
    borderWidth: 2,
  },
  badge: {
    position: "absolute" as const,
    top: -10,
    right: -2,
    backgroundColor: Colors.darkGold,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  vipBadge: {
    backgroundColor: Colors.secondary,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  yearlyOriginal: {
    fontSize: 14,
    color: Colors.primary,
    textDecorationLine: "line-through",
    marginRight: 8,
  },
  savingsText: {
    fontSize: 12,
    color: Colors.lightGray,
    fontWeight: "600" as const,
    marginBottom: 12,
  },
  packageName: {
    textAlignVertical: "center" as const,
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.primary,
    textAlign: "center" as const,
  },
  packageNameContainer: {
    height: 60,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: Colors.lightDarkGray,
    borderColor: Colors.primary,
    borderWidth: 1,
    paddingVertical: 8,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  popularPackageNameContainer: {
    height: 60,
    flexDirection: "column" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: Colors.lightDarkGray,
    borderColor: Colors.darkGold,
    borderWidth: 2,
    paddingVertical: 8,
    borderBottomWidth: 0,
  },
  priceContainer: {
    flexDirection: "row" as const,
    alignItems: "baseline" as const,
    marginBottom: 20,
  },
  price: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.primary,
    marginRight: 8,
  },
  period: {
    fontSize: 14,
    color: Colors.primary,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 3,
  },
  featureColumn: {
    flexDirection: "column" as const,
    alignItems: "center" as const,
    marginBottom: 5,
  },
  featureText: {
    fontSize: 14,
    color: Colors.textWhite,
    marginLeft: 12,
    flex: 1,
  },
  button: {
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center" as const,
  },
  popularButton: {
    backgroundColor: Colors.darkGold,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textWhite,
  },
  popularButtonText: {
    color: Colors.primary,
  },
  accentLine: {
    height: 1,
    width: "100%",
    backgroundColor: Colors.lightGray,
    borderRadius: 2,
  },
  currentButton: {
    backgroundColor: Colors.cardBg,
    borderColor: Colors.darkGold,
    borderWidth: 1,
  },
  currentButtonText: {
    color: Colors.darkGold,
  },
});
