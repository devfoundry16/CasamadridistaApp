import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ScrollView } from "react-native";
import HeaderStack from "@/components/HeaderStack";
import { GiveWPService } from "@/services/Donation/GiveWPService";
import { CampaignDetail } from "@/types/campaigns/campaigns";
import Colors from "@/constants/colors";
import { Spinner } from "@/components/Spinner";

export default function CampaignDetailScreen() {
  const { id } = useLocalSearchParams();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const data = await GiveWPService.getCampaignById(Number(id));
        setCampaign(data);
      } catch (error) {
        console.error("Failed to load campaign:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCampaign();
  }, [id]);

  if (loading) {
    return (
      <>
        <HeaderStack title="Campaign Details" />
        <View style={styles.spinnerContainer}>
          <Spinner content="Loading Campaign" />
        </View>
      </>
    );
  }

  if (!campaign) {
    return (
      <View style={styles.container}>
        <HeaderStack title="Campaign Details" />
        <View style={styles.error}>
          <Text style={styles.errorText}>Campaign not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <HeaderStack title="Campaign Details" />
      <View style={styles.content}>
        {campaign.image && (
          <Image source={{ uri: campaign.image }} style={styles.image} />
        )}
        <Text style={styles.title}>{campaign.title}</Text>
        <Text style={styles.description}>{campaign.shortDescription}</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.goal}>
            Goal: {campaign.goalStats.goalFormatted}
          </Text>
          <Text style={styles.raised}>
            Raised: {campaign.goalStats.actualFormatted}
          </Text>
          <Text style={styles.status}>Status: {campaign.status}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.deepDarkGray,
  },
  content: {
    padding: 16,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: Colors.textWhite,
    fontSize: 18,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textWhite,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 24,
  },
  statsContainer: {
    backgroundColor: Colors.cardBg,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goal: {
    fontSize: 18,
    color: Colors.textWhite,
    marginBottom: 8,
  },
  raised: {
    fontSize: 18,
    color: Colors.accent,
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    color: Colors.textLight,
  },
});
