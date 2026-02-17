import { Text } from "@/components/Text";
import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import {
  Crown,
  Heart,
  Info,
  Mail,
  MoreVertical,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";

function HeaderMenu() {
  const router = useRouter();
  const { t } = useTranslation();
  const [menuVisible, setMenuVisible] = useState(false);

  const menuItems = [
    { labelKey: "nav.campaigns", icon: Heart, route: "/donate" },
    { labelKey: "nav.aboutUs", icon: Info, route: "/about" },
    { labelKey: "nav.memberships", icon: Crown, route: "/memberships" },
    { labelKey: "nav.contact", icon: Mail, route: "/contact" },
  ];

  const handleMenuItemPress = (route: string) => {
    setMenuVisible(false);
    router.navigate(route as any);
  };

  return (
    <View className="flex-row items-center mr-2">
      <TouchableOpacity
        onPress={() => setMenuVisible(true)}
        className="px-4 py-2"
        activeOpacity={0.7}
      >
        <MoreVertical color={Colors.text.primary} size={24} />
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-start items-end pt-16 pr-4"
          onPress={() => setMenuVisible(false)}
        >
          <View
            className="rounded-xl min-w-[200px] shadow-lg"
            style={{ backgroundColor: Colors.primary }}
          >
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={index}
                  className={`flex-row items-center py-4 px-4 gap-3 border-text-primary ${index === menuItems.length - 1 ? "border-b-0" : "border-b-2"}`}
                  onPress={() => handleMenuItemPress(item.route)}
                  activeOpacity={0.7}
                >
                  <Icon color={Colors.text.primary} size={20} />
                  <Text className="text-base font-medium text-text-primary">{t(item.labelKey)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default HeaderMenu;
