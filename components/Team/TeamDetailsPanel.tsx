import React from "react";
import { I18nManager, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import CountryFlag from "react-native-country-flag";
import { Text } from "@/components/Text";
import Touchable from "@/components/Touchable";
import Colors from "@/constants/colors";
import countries from "@/constants/countries.json";
import type { CountryMap, TeamInfo } from "@/types/soccer/profile";
import SurfaceCard from "./SurfaceCard";
import SectionHeading from "./SectionHeading";

const map: CountryMap = countries;

function InfoRow({
  label,
  value,
  trailing,
  onPress,
  divider,
}: {
  label: string;
  value?: string | number | null;
  trailing?: React.ReactNode;
  onPress?: () => void;
  divider: boolean;
}) {
  const Chevron = I18nManager.isRTL ? ChevronLeft : ChevronRight;
  const body = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: 56,
        paddingHorizontal: 14,
      }}
    >
      <Text className="text-[13px] flex-1" style={{ color: Colors.text.tertiary }}>
        {label}
      </Text>
      {trailing ?? (
        <Text
          className="text-[14px] font-semibold"
          style={{ color: Colors.text.primary }}
          numberOfLines={1}
        >
          {value ?? "–"}
        </Text>
      )}
      {onPress ? (
        <Chevron size={18} color={Colors.text.muted} style={{ marginStart: 6 }} />
      ) : null}
    </View>
  );

  return (
    <View>
      {onPress ? (
        <Touchable
          onPress={onPress}
          accessibilityRole="button"
          style={({ pressed }) => ({
            backgroundColor: pressed ? Colors.background.light : "transparent",
          })}
        >
          {body}
        </Touchable>
      ) : (
        body
      )}
      {divider ? (
        <View
          style={{
            height: 1,
            backgroundColor: Colors.border.default,
            marginHorizontal: 14,
          }}
        />
      ) : null}
    </View>
  );
}

export default function TeamDetailsPanel({ teamInfo }: { teamInfo?: TeamInfo }) {
  const { t } = useTranslation();
  const router = useRouter();
  const country = teamInfo?.team?.country;

  return (
    <View>
      <SectionHeading title={t("team.clubInfo")} />
      <SurfaceCard padded={false}>
        <InfoRow
          label={t("team.stadium")}
          value={teamInfo?.venue?.name}
          onPress={
            teamInfo?.venue?.id
              ? () => router.push(`/venue/${teamInfo.venue.id}`)
              : undefined
          }
          divider
        />
        <InfoRow
          label={t("team.country")}
          divider
          trailing={
            <View className="flex-row items-center gap-2">
              {country && map[country] ? (
                <CountryFlag isoCode={map[country]} size={14} />
              ) : null}
              <Text
                className="text-[14px] font-semibold"
                style={{ color: Colors.text.primary }}
              >
                {country ?? "–"}
              </Text>
            </View>
          }
        />
        <InfoRow
          label={t("team.founded")}
          value={teamInfo?.team?.founded}
          divider={false}
        />
      </SurfaceCard>
    </View>
  );
}
