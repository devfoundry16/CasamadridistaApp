import React from "react";
import { View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { Text } from "@/components/Text";
import Touchable from "@/components/Touchable";
import Colors from "@/constants/colors";

interface Props {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void };
}

export default function EmptyState({ icon: Icon, title, body, action }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-12">
      {Icon ? <Icon size={28} color={Colors.text.muted} /> : null}
      <Text
        className="text-[15px] font-semibold text-center mt-3"
        style={{ color: Colors.text.secondary }}
      >
        {title}
      </Text>
      {body ? (
        <Text
          className="text-[13px] leading-5 text-center mt-1.5"
          style={{ color: Colors.text.tertiary }}
        >
          {body}
        </Text>
      ) : null}
      {action ? (
        <Touchable
          onPress={action.onPress}
          accessibilityRole="button"
          className="mt-4 py-2.5 px-5 rounded-xl"
          style={({ pressed }) => ({
            backgroundColor: Colors.darkGold,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text className="text-[13px] font-semibold text-white">{action.label}</Text>
        </Touchable>
      ) : null}
    </View>
  );
}
