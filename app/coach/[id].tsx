import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";

import countries from "@/constants/countries.json";
import { useFootball } from "@/hooks/useFootball";
import { CountryMap } from "@/types/soccer/profile";
import CountryFlag from "react-native-country-flag";

const map: CountryMap = countries;
export default function PlayerDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const { coachList } = useFootball();

  const coachId = Number(id);

  const coachWithTeam = coachList.find((p) => p.player.id === coachId);
  const coach = coachWithTeam?.player;

  return (
    <ScrollView className="flex-1 bg-bg-medium" showsVerticalScrollIndicator={false}>
      <View className="pt-10 pb-10 px-5 items-center">
        <Image
          source={{ uri: coach?.photo }}
          style={{ width: 140, height: 140, borderRadius: 70 }}
          className="border-4 border-rm-gold mb-4 bg-bg-light"
          contentFit="cover"
        />
        <Text className="text-[28px] font-bold text-rm-gold mb-1 text-center">{coach?.name}</Text>
        <Text className="text-base text-white opacity-90 uppercase tracking-wider">{coach?.position}</Text>
      </View>

      <View className="p-4">
        <View className="mb-6">
          <Text className="text-xl font-bold text-rm-gold mb-3 pl-1">{t("player.playerInformation")}</Text>
          <View className="rounded-xl p-4 pt-0">
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-sm text-white font-medium">{t("player.fullName")}</Text>
              <Text className="text-sm text-white font-semibold">{coach?.name}</Text>
            </View>
            <View className="h-px bg-border-default" />
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-sm text-white font-medium">{t("player.age")}</Text>
              <Text className="text-sm text-white font-semibold">{coach?.age}</Text>
            </View>
            <View className="h-px bg-border-default" />
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-sm text-white font-medium">{t("player.nationality")}</Text>
              {coach?.nationality && map[coach?.nationality] ? (
                <CountryFlag isoCode={map[coach?.nationality]} size={25} />
              ) : null}
            </View>
            <View className="h-px bg-border-default" />
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-sm text-white font-medium">{t("player.placeOfBirth")}</Text>
              <View className="flex-row justify-center items-center">
                <Text className="text-sm text-white font-semibold">{coach?.birth.place} </Text>
                {coach?.birth.country && map[coach?.birth.country] ? (
                  <CountryFlag isoCode={map[coach?.birth.country]} size={25} />
                ) : null}
              </View>
            </View>
            <View className="h-px bg-border-default" />
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-sm text-white font-medium">{t("player.dateOfBirth")}</Text>
              <Text className="text-sm text-white font-semibold">{coach?.birth.date}</Text>
            </View>
            <View className="h-px bg-border-default" />
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-sm text-white font-medium">{t("player.weight")}</Text>
              <Text className="text-sm text-white font-semibold">{coach?.weight}</Text>
            </View>
            <View className="h-px bg-border-default" />
            <View className="flex-row justify-between items-center py-3">
              <Text className="text-sm text-white font-medium">{t("player.height")}</Text>
              <Text className="text-sm text-white font-semibold">{coach?.height}</Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-xl font-bold text-rm-gold mb-3 pl-1">{t("player.club")}</Text>
          <View className="flex-row items-center rounded-xl p-4">
            <Image
              source={{
                uri: "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
              }}
              style={{ width: 60, height: 60 }}
              className="mr-4"
              contentFit="contain"
            />
            <View className="flex-1">
              <Text className="text-lg font-bold text-white mb-1">{t("player.realMadrid")}</Text>
              <Text className="text-sm text-white">{t("player.losBlancos")}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
