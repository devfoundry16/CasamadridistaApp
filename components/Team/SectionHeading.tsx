import React from "react";
import { I18nManager, View } from "react-native";
import { Text } from "@/components/Text";
import Touchable from "@/components/Touchable";
import Colors from "@/constants/colors";

interface Props {
  title: string;
  action?: { label: string; onPress: () => void };
}

/**
 * Replaces the full-bleed `bg-rm-gold` bar that was copy-pasted 10x across the
 * two team screens, and the "gold rule - title - gold rule" header in
 * CustomWebView. Gold text on the page background (#1A1A1A) is 5.98:1 — the
 * gold *fill* with white text was 2.91:1 and failed AA.
 */
export default function SectionHeading({ title, action }: Props) {
  return (
    <View className="mb-2">
      <View className="flex-row items-center justify-between">
        <Text
          className="text-[13px] font-bold flex-1"
          style={{
            color: Colors.darkGold,
            // letterSpacing breaks Arabic ligatures — LTR only.
            ...(I18nManager.isRTL ? {} : { letterSpacing: 0.6 }),
          }}
        >
          {title}
        </Text>

        {action ? (
          <Touchable
            onPress={action.onPress}
            accessibilityRole="button"
            hitSlop={12}
            // 44pt tall target; the label itself is only 13px.
            style={({ pressed }) => ({
              height: 44,
              justifyContent: "center",
              paddingStart: 12,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text className="text-[13px] font-semibold" style={{ color: Colors.darkGold }}>
              {action.label}
            </Text>
          </Touchable>
        ) : null}
      </View>
      <View style={{ height: 1, backgroundColor: Colors.border.default, marginTop: 6 }} />
    </View>
  );
}
