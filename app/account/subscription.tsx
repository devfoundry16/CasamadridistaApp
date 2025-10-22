import HeaderStack from "@/components/HeaderStack";
import Colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { ArrowRight, Calendar, CreditCard, Crown } from "lucide-react-native";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SubscriptionScreen() {
  const { user } = useAuth();

  return (
    <>
      <HeaderStack title="My Subscription" />
      <ScrollView style={styles.container}>
        {user?.subscription ? (
          <>
            <View style={styles.subscriptionCard}>
              <View style={styles.iconContainer}>
                <Crown size={48} color={Colors.accent} />
              </View>
              <Text style={styles.planName}>{user.subscription.plan}</Text>
              <Text style={styles.planType}>{user.subscription.type}</Text>

              <View style={styles.dateContainer}>
                <View style={styles.dateItem}>
                  <Calendar size={20} color={Colors.accent} />
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <Text style={styles.dateValue}>
                      {user.subscription.startDate}
                    </Text>
                  </View>
                </View>
                <View style={styles.dateItem}>
                  <Calendar size={20} color={Colors.accent} />
                  <View style={styles.dateInfo}>
                    <Text style={styles.dateLabel}>End Date</Text>
                    <Text style={styles.dateValue}>
                      {user.subscription.endDate}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.actionsSection}>
              <TouchableOpacity style={styles.actionButton}>
                <CreditCard size={24} color={Colors.accent} />
                <Text style={styles.actionButtonText}>
                  Update Payment Method
                </Text>
                <ArrowRight size={20} color={Colors.textWhite} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/memberships/packages")}
              >
                <Crown size={24} color={Colors.accent} />
                <Text style={styles.actionButtonText}>Upgrade Plan</Text>
                <ArrowRight size={20} color={Colors.textWhite} />
              </TouchableOpacity>
            </View>

            <View style={styles.benefitsSection}>
              <Text style={styles.sectionTitle}>Your Benefits</Text>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitBullet}>✓</Text>
                <Text style={styles.benefitText}>
                  Exclusive access to member events
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitBullet}>✓</Text>
                <Text style={styles.benefitText}>Priority ticket booking</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitBullet}>✓</Text>
                <Text style={styles.benefitText}>
                  Official merchandise discounts
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitBullet}>✓</Text>
                <Text style={styles.benefitText}>Monthly newsletter</Text>
              </View>
            </View>
          </>
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
