import { useCallback, useEffect, useState } from "react";
import { GiveWPService } from "@/services/Donation/GiveWPService";
import { View, Text, TouchableOpacity } from "react-native";
import { CampaignDetail } from "@/types/campaigns/campaigns";
import { ScrollView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { parseAmount } from "@/utils/helper";
import { Spinner } from "@/components/Spinner";
export default function DonateScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [campaignsList, setCampaignsList] = useState<CampaignDetail[]>([]);

  const loadCampaignsList = useCallback(async () => {
    setLoading(true);
    const res = await GiveWPService.getCampaignsList();
    setCampaignsList(res);
    setLoading(false);
  }, []);
  useEffect(() => {
    loadCampaignsList();
  }, [loadCampaignsList]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-medium">
        <Spinner content="Loading campaign" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-bg-medium m-0 p-0">
      <View className="p-4">
        {campaignsList.map((cp) => {
          const progress = (cp.goalStats.actual / cp.goalStats.goal) * 100;
          return (
            <TouchableOpacity
              key={cp.id}
              className="flex-col bg-bg-card p-4 pl-[50px] pr-[50px] mb-3 rounded-lg border border-border-default gap-2.5"
              onPress={() => {
                // Navigate to campaign details or donation page
                router.push(`/campaign/${cp.id}`);
                // You can add navigation here, e.g., router.push(`/donate/${cp.id}`)
              }}
            >
              <View className="flex-row gap-2.5 justify-center items-center">
                {/* <Image
                  source={{ uri: cp.image }}
                  className="w-[100px] h-[100px] rounded-[50px] mb-2"
                /> */}
                <Text className="text-lg font-bold text-white mb-2">{cp.title}</Text>
              </View>
              <View className="h-2 bg-border-default rounded overflow-hidden my-2">
                <View
                  className="h-full bg-rm-gold rounded"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </View>
              <View className="flex-col justify-center items-center">
                <Text className="text-base text-text-secondary mb-1">
                  Amount Raised: ${parseAmount(cp.goalStats.actual)}
                </Text>
                <Text className="text-base text-text-secondary mb-1">
                  Our Goal: ${parseAmount(cp.goalStats.goal)}
                </Text>
                <Text className="text-base text-rm-gold font-semibold">Status: {cp.status}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
