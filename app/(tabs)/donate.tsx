import { useEffect, useState } from "react";
import { GiveWPService } from "@/services/Donation/GiveWPService";
import { StyleSheet, View, Text, TouchableOpacity, Image } from "react-native";
import { CampaignDetail } from "@/types/campaigns/campaigns";
import Colors from "@/constants/colors";
import { ScrollView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { parseAmount } from "@/utils/helper";
import { Spinner } from "@/components/Spinner";
export default function DonateScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [campaignsList, setCampaignsList] = useState<CampaignDetail[]>([]);
  const loadCampaignsList = async () => {
    setLoading(true);
    const res = await GiveWPService.getCampaignsList();
    console.log("========Campaign List=========");
    setCampaignsList(res);
    setLoading(false);
  };
  useEffect(() => {
    loadCampaignsList();
  }, []);

  if (loading) {
    return (
      <View style={styles.spinnerContainer}>
        <Spinner content="Loading campaign" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.campaignsContainer}>
        {campaignsList.map((cp) => {
          const progress = (cp.goalStats.actual / cp.goalStats.goal) * 100;
          return (
            <TouchableOpacity
              key={cp.id}
              style={styles.campaignCard}
              onPress={() => {
                // Navigate to campaign details or donation page
                router.push(`/campaign/${cp.id}`);
                // You can add navigation here, e.g., router.push(`/donate/${cp.id}`)
              }}
            >
              <View style={styles.title}>
                <Image
                  source={{ uri: cp.image }}
                  style={styles.campaignImage}
                />
                <Text style={styles.campaignTitle}>{cp.title}</Text>
              </View>
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${Math.min(progress, 100)}%` },
                  ]}
                />
              </View>
              <View style={styles.info}>
                <Text style={styles.campaignStats}>
                  Amount Raised: ${parseAmount(cp.goalStats.actual)}
                </Text>
                <Text style={styles.campaignStats}>
                  Our Goal: ${parseAmount(cp.goalStats.goal)}
                </Text>
                <Text style={styles.campaignStatus}>Status: {cp.status}</Text>
              </View>
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
  spinnerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.deepDarkGray,
  },
  title: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  campaignsContainer: {
    padding: 16,
  },
  campaignCard: {
    flexDirection: "column",
    backgroundColor: Colors.cardBg,
    padding: 16,
    paddingLeft: 50,
    paddingRight: 50,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  campaignImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  campaignTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textWhite,
    marginBottom: 8,
  },
  campaignGoal: {
    fontSize: 16,
    color: Colors.lightGray,
    marginBottom: 4,
  },
  campaignStats: {
    fontSize: 16,
    color: Colors.lightGray,
    marginBottom: 4,
  },
  campaignStatus: {
    fontSize: 16,
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
