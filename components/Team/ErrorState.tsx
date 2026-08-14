import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/Text";
import Touchable from "@/components/Touchable";
import Colors from "@/constants/colors";

interface Props {
  title: string;
  onRetry: () => void;
  /** Inline variant sits inside a card next to other content. */
  compact?: boolean;
}

export default function ErrorState({ title, onRetry, compact = false }: Props) {
  const { t } = useTranslation();

  return (
    <View
      className={compact ? "items-center py-6 px-4" : "flex-1 items-center justify-center px-8"}
    >
      <Text
        className="text-[14px] text-center mb-3"
        style={{ color: Colors.text.tertiary }}
      >
        {title}
      </Text>
      <Touchable
        onPress={onRetry}
        accessibilityRole="button"
        className="py-2.5 px-5 rounded-xl"
        style={({ pressed }) => ({
          backgroundColor: Colors.darkGold,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text className="text-[13px] font-semibold text-white">{t("team.retry")}</Text>
      </Touchable>
    </View>
  );
}
