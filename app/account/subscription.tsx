import HeaderStack from "@/components/HeaderStack";
import { Spinner } from "@/components/Spinner";
import Colors from "@/constants/colors";
import { useOrder } from "@/hooks/useOrder";
import { useUser } from "@/hooks/useUser";
import { formatDate } from "@/utils/helper";
import { router } from "expo-router";
import { ArrowRight, Calendar, CreditCard, Crown } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SubscriptionScreen() {
  const { getSubscriptionOrders } = useOrder();
  const { user } = useUser();
  const [subscriptions, setSubscriptions] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadSubscriptions = async () => {
    setLoading(true);
    const res = await getSubscriptionOrders(user?.id as any);
    setSubscriptions(res);
    setLoading(false);
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  if (loading) {
    return (
      <View style={styles.spinnerContainer}>
        <HeaderStack title="Subscription" />
        <Spinner content="Loading subscription" />
      </View>
    );
  }

  return (
    <>
      <HeaderStack title="My Subscription" />
      <ScrollView style={styles.container}>
        {subscriptions?.length ? (
          subscriptions.map((subscription: any) => {
            return (
              <View key={subscription.id}>
                <View style={styles.subscriptionCard}>
                  <View style={styles.iconContainer}>
                    <Crown size={48} color={Colors.accent} />
                  </View>
                  <Text style={styles.planName}>
                    {subscription.line_items[0].name}
                  </Text>
                  {/* <Text style={styles.planType}>
                    {subscription.line_items[0].meta_data[0].value}
                  </Text> */}

                  <View style={styles.dateContainer}>
                    <View style={styles.dateItem}>
                      <Calendar size={20} color={Colors.accent} />
                      <View style={styles.dateInfo}>
                        <Text style={styles.dateLabel}>Start Date</Text>
                        <Text style={styles.dateValue}>
                          {formatDate(subscription.start_date_gmt)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.dateItem}>
                      <Calendar size={20} color={Colors.accent} />
                      <View style={styles.dateInfo}>
                        <Text style={styles.dateLabel}>End Date</Text>
                        <Text style={styles.dateValue}>
                          {subscription.next_payment_date_gmt
                            ? formatDate(subscription.next_payment_date_gmt)
                            : "N/A"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.actionsSection}>
                  {/* <TouchableOpacity style={styles.actionButton}>
                    <CreditCard size={24} color={Colors.accent} />
                    <Text style={styles.actionButtonText}>
                      Update Payment Method
                    </Text>
                    <ArrowRight size={20} color={Colors.textWhite} />
                  </TouchableOpacity> */}

                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push("/memberships/packages")}
                  >
                    <Crown size={24} color={Colors.accent} />
                    <Text style={styles.actionButtonText}>Upgrade Plan</Text>
                    <ArrowRight size={20} color={Colors.textWhite} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.noSubscription}>
            <Crown size={64} color={Colors.darkGray} />
            <Text style={styles.noSubText}>No Active Subscription</Text>
            <Text style={styles.noSubSubtext}>
              Join Casa Madridista and enjoy exclusive benefits
            </Text>
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => router.push("/memberships/packages")}
            >
              <Text style={styles.subscribeButtonText}>
                View Membership Plans
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2A2A2A",
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.deepDarkGray,
  },
  subscriptionCard: {
    margin: 24,
    padding: 32,
    backgroundColor: "#1A1A1A",
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  planName: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.accent,
    marginBottom: 8,
    textAlign: "center",
  },
  planType: {
    fontSize: 16,
    color: "#CCCCCC",
    marginBottom: 24,
  },
  dateContainer: {
    width: "100%",
    gap: 16,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: "#CCCCCC",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textWhite,
  },
  actionsSection: {
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3A3A3A",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textWhite,
  },
  benefitsSection: {
    padding: 24,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  benefitBullet: {
    fontSize: 20,
    color: Colors.accent,
    fontWeight: "700" as const,
  },
  benefitText: {
    fontSize: 16,
    color: "#CCCCCC",
  },
  noSubscription: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    marginTop: 100,
  },
  noSubText: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginTop: 24,
    marginBottom: 8,
  },
  noSubSubtext: {
    fontSize: 16,
    color: "#CCCCCC",
    textAlign: "center",
    marginBottom: 32,
  },
  subscribeButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#1A1A1A",
  },
});
