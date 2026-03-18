// import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import { View, TouchableOpacity } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
// import { useRouter } from "expo-router";
// import { Spinner } from "@/components/Spinner";
// import CampaignService, { Campaign } from "@/services/CampaignService";
import * as WebBrowser from "expo-web-browser";

const DONATION_URL = "https://casamadridista.com/active-campaigns/";

export default function DonateScreen() {
  const { t } = useTranslation();

  // --- In-app donation flow (commented per App Store Guideline - donations must use external link) ---
  // const router = useRouter();
  // const [loading, setLoading] = useState<boolean>(true);
  // const [campaignsList, setCampaignsList] = useState<Campaign[]>([]);
  // const loadCampaignsList = useCallback(async () => {
  //   setLoading(true);
  //   try {
  //     const list = await CampaignService.getCampaigns();
  //     setCampaignsList(list);
  //   } catch {
  //     setCampaignsList([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);
  // useEffect(() => {
  //   loadCampaignsList();
  // }, [loadCampaignsList]);
  // if (loading) {
  //   return (
  //     <View className="flex-1 justify-center items-center bg-bg-medium">
  //       <Spinner content={t("donate.loading")} />
  //     </View>
  //   }
  // return (
  //   <ScrollView className="flex-1 bg-bg-medium m-0 p-0">
  //     <View className="p-4">
  //       {campaignsList.map((cp) => {
  //         const progress = (cp.goalStats.actual / cp.goalStats.goal) * 100;
  //         return (
  //           <TouchableOpacity
  //             key={cp.id}
  //             className="flex-col bg-bg-card p-4 pl-[50px] pr-[50px] mb-3 rounded-lg border border-border-default gap-2.5"
  //             onPress={() => router.push(`/campaign/${cp.id}`)}
  //           >
  //             <View className="flex-row gap-2.5 justify-center items-center">
  //               <Text className="text-lg font-bold text-white mb-2">{cp.title}</Text>
  //             </View>
  //             <View className="h-2 bg-border-default rounded overflow-hidden my-2">
  //               <View className="h-full bg-rm-gold rounded" style={{ width: `${Math.min(progress, 100)}%` }} />
  //             </View>
  //             <View className="flex-col justify-center items-center">
  //               <Text className="text-base text-text-secondary mb-1">{t("campaign.raised")}: {cp.goalStats.actualFormatted}</Text>
  //               <Text className="text-base text-text-secondary mb-1">{t("campaign.goal")}: {cp.goalStats.goalFormatted}</Text>
  //               <Text className="text-base text-rm-gold font-semibold">{t("common.status")}: {cp.status}</Text>
  //             </View>
  //           </TouchableOpacity>
  //         );
  //       })}
  //     </View>
  //   </ScrollView>
  // );

  const handleOpenDonationLink = () => {
    WebBrowser.openBrowserAsync(DONATION_URL);
  };

  return (
    <ScrollView className="flex-1 bg-bg-medium">
      <View className="flex-1 p-6 justify-center items-center min-h-[400px]">
        <Text className="text-lg text-text-primary text-center mb-4">
          {t("donate.donateNow")}
        </Text>
        <Text className="text-sm text-text-secondary text-center mb-6">
          {t("donate.impactMessage")}
        </Text>
        <TouchableOpacity
          className="bg-rm-gold py-4 px-8 rounded-xl"
          onPress={handleOpenDonationLink}
        >
          <Text className="text-base font-bold text-white">
            {t("donate.donateNow")}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
