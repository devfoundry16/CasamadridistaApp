import HeaderStack from "@/components/HeaderStack";
import { useEffect, useState } from "react";
import { GiveWPService } from "@/services/Donation/GiveWPService";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Campaigns } from "@/types/campaigns/campaigns";
import Colors from "@/constants/colors";
import { ScrollView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";

const parseAmount = (str: string): number => {
  const cleaned = str.replace(/[$,]/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export default function DonateScreen() {
  const router = useRouter();
  const [campaignsList, setCampaignsList] = useState<Campaigns[]>([]);
  const loadCampaignsList = async () => {
    const res = await GiveWPService.getCampaignsList();
    console.log("========Campaign List=========");
    setCampaignsList(res.items);
  };
  useEffect(() => {
    loadCampaignsList();
  }, []);
  return (
    <ScrollView style={styles.container}>
      <HeaderStack title="Donate" />
      <View style={styles.campaignsContainer}>
        {campaignsList.map((cp) => {
          const goalAmount = parseAmount(cp.goal);
          const raisedAmount = parseAmount(cp.revenue);
          const progress =
            goalAmount > 0 ? (raisedAmount / goalAmount) * 100 : 0;

          return (
            <TouchableOpacity
              key={cp.id}
              style={styles.campaignCard}
              onPress={() => {
                // Navigate to campaign details or donation page
                console.log(`Selected campaign: ${cp.title}`);
                router.push(`/campaign/${cp.id}`);
                // You can add navigation here, e.g., router.push(`/donate/${cp.id}`)
              }}
            >
              <Text style={styles.campaignTitle}>{cp.title}</Text>
              <Text style={styles.campaignGoal}>{cp.goal}</Text>
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${Math.min(progress, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {cp.revenue} raised of {cp.goal} ({progress.toFixed(1)}%)
              </Text>
              <Text style={styles.campaignStats}>
                Donations: {cp.donationsCount}
              </Text>
              <Text style={styles.campaignStatus}>Status: {cp.status}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
    margin: 0,
    padding: 0,
  },
  campaignsContainer: {
    padding: 16,
  },
  campaignCard: {
    backgroundColor: Colors.cardBg,
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textWhite,
    marginBottom: 8,
  },
  campaignGoal: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  campaignStats: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
  campaignStatus: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: "600",
  },
  progressContainer: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginVertical: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 4,
  },
});
