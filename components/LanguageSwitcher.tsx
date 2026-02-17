import React, { useState } from "react";
import { View, TouchableOpacity, Modal, Pressable, Text } from "react-native";
import { useTranslation } from "react-i18next";
import CountryFlag from "react-native-country-flag";
import Colors from "@/constants/colors";

const FLAG_SIZE = 20;

type Locale = "en-US" | "ar-SA";

const LOCALES: { lng: Locale; isoCode: string; labelKey: string }[] = [
  { lng: "en-US", isoCode: "US", labelKey: "language.english" },
  { lng: "ar-SA", isoCode: "SA", labelKey: "language.arabic" },
];

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const currentLng = i18n.language?.startsWith("ar") ? "ar-SA" : "en-US";
  const currentFlag = LOCALES.find((x) => x.lng === currentLng);

  const handleSelect = (lng: Locale) => {
    i18n.changeLanguage(lng);
    setVisible(false);
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
        className="p-1.5 rounded-lg"
      >
        <CountryFlag
          isoCode={currentFlag?.isoCode ?? "US"}
          size={FLAG_SIZE}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-start items-end pt-16 pr-4"
          onPress={() => setVisible(false)}
        >
          <View
            className="rounded-xl min-w-[100px] shadow-lg"
            style={{ backgroundColor: Colors.primary }}
          >
            {LOCALES.map((item, index) => (
              <TouchableOpacity
                key={item.lng}
                className={`flex-row items-center py-4 px-4 gap-3 border-text-primary ${index === LOCALES.length - 1 ? "border-b-0" : "border-b-2"}`}
                onPress={() => handleSelect(item.lng)}
                activeOpacity={0.7}
              >
                <CountryFlag isoCode={item.isoCode} size={12} />
                <Text className="text-base font-medium text-text-primary">
                  {t(item.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default LanguageSwitcher;
