import HeaderStack from "@/components/HeaderStack";
import { useEffect, useState } from "react";
import { GiveWPService } from "@/services/Donation/GiveWPService";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Campaigns } from "@/types/campaigns/campaigns";
import Colors from "@/constants/colors";
import { ScrollView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";

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
        {campaignsList.map((cp) => (
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
            <Text style={styles.campaignGoal}>Goal: {cp.goal}</Text>
            <Text style={styles.campaignStats}>
              Donations: {cp.donationsCount} | Revenue: {cp.revenue}
            </Text>
            <Text style={styles.campaignStatus}>Status: {cp.status}</Text>
          </TouchableOpacity>
        ))}
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
});
