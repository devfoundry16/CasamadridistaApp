/**
 * Shown in place of the whole app while the backend is refusing requests for
 * maintenance (see `utils/maintenance.core.ts`). The root layout renders this
 * instead of the navigator, so nothing underneath is making requests.
 */
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { useEnvironment } from "@/hooks/useEnvironment";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, View } from "react-native";

const CASA_LOGO = require("@/assets/icons/splash-icon-dark.png");

export default function MaintenanceScreen() {
  const { t } = useTranslation();
  const { maintenance, loadEnvironment } = useEnvironment();
  const [checking, setChecking] = useState(false);

  // The splash screen is normally hidden once the home data has loaded, which
  // never happens here.
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const retry = async () => {
    setChecking(true);
    try {
      // Success clears the maintenance state and the app replaces this screen.
      await loadEnvironment();
    } finally {
      setChecking(false);
    }
  };

  return (
    <View
      className="flex-1 items-center justify-center bg-bg-deep-dark px-8"
      accessibilityViewIsModal
    >
      <Image
        source={CASA_LOGO}
        style={{ width: 112, height: 112, marginBottom: 28 }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Text
        className="text-2xl font-bold text-rm-gold text-center mb-3"
        accessibilityRole="header"
      >
        {t("maintenance.title")}
      </Text>
      <Text className="text-base text-white text-center opacity-90 mb-8">
        {maintenance.message ?? t("maintenance.message")}
      </Text>
      <Button
        title={t("maintenance.retry")}
        onPress={retry}
        loading={checking}
        disabled={checking}
        style={{ minWidth: 180 }}
      />
    </View>
  );
}
