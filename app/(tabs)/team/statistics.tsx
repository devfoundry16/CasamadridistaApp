import React, { useMemo } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import Colors from "@/constants/colors";
import WidgetWebView from "@/components/Team/WidgetWebView";
import { teamStatisticsWidgetHtml } from "@/components/Team/widgetHtml";
import { useEnvironment } from "@/hooks/useEnvironment";
import { useSeason } from "@/hooks/football/useSeason";
import { LA_LIGA_LEAGUE_ID, REAL_MADRID_TEAM_ID } from "@/constants/football";

export default function TeamStatisticsTab() {
  const { t, i18n } = useTranslation();
  const { apiSports } = useEnvironment();
  const season = useSeason();

  const lang = i18n.language.startsWith("ar") ? "ar" : "en";
  const apiKey = apiSports?.apiKey ?? "";

  const html = useMemo(
    () =>
      teamStatisticsWidgetHtml({
        apiKey,
        teamId: REAL_MADRID_TEAM_ID,
        leagueId: LA_LIGA_LEAGUE_ID,
        season,
        lang,
      }),
    [apiKey, season, lang],
  );

  if (!apiKey) {
    return <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }} />;
  }

  return (
    <WidgetWebView
      html={html}
      title={t("team.tabStats")}
      loadingLabel={t("team.loadingStats")}
      errorLabel={t("team.errorStats")}
    />
  );
}
