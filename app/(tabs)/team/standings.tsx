import React, { useMemo } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import Colors from "@/constants/colors";
import WidgetWebView from "@/components/Team/WidgetWebView";
import { standingsWidgetHtml } from "@/components/Team/widgetHtml";
import { useEnvironment } from "@/hooks/useEnvironment";
import { useSeason } from "@/hooks/football/useSeason";
import { LA_LIGA_LEAGUE_ID } from "@/constants/football";

export default function TeamStandingsTab() {
  const { t, i18n } = useTranslation();
  const { apiSports } = useEnvironment();
  const season = useSeason();

  const lang = i18n.language.startsWith("ar") ? "ar" : "en";
  const apiKey = apiSports?.apiKey ?? "";

  const html = useMemo(
    () =>
      standingsWidgetHtml({
        apiKey,
        leagueId: LA_LIGA_LEAGUE_ID,
        season,
        lang,
      }),
    [apiKey, season, lang],
  );

  // /api/app-info hasn't landed yet — rendering the widget without a key just
  // shows its own error state.
  if (!apiKey) {
    return <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }} />;
  }

  return (
    <WidgetWebView
      html={html}
      title={t("team.tabStandings")}
      loadingLabel={t("team.loadingStandings")}
      errorLabel={t("team.errorStandings")}
    />
  );
}
