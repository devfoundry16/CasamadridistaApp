import React from "react";
import { useTranslation } from "react-i18next";
import { TextInput, View } from "react-native";
import { Search, X } from "lucide-react-native";
import Touchable from "@/components/Touchable";
import Colors from "@/constants/colors";

interface Props {
  value: string;
  onChange: (text: string) => void;
  placeholder: string;
}

export default function SearchField({ value, onChange, placeholder }: Props) {
  const { t } = useTranslation();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: 40,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border.default,
        backgroundColor: Colors.background.card,
      }}
    >
      <Search size={16} color={Colors.text.muted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.muted}
        accessibilityLabel={placeholder}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        style={{ flex: 1, marginStart: 8, color: Colors.text.primary, fontSize: 14, textAlign: "auto" }}
      />
      {value ? (
        <Touchable onPress={() => onChange("")} accessibilityRole="button" accessibilityLabel={t("social.friends.clearSearch")} hitSlop={8}>
          <X size={16} color={Colors.text.muted} />
        </Touchable>
      ) : null}
    </View>
  );
}
