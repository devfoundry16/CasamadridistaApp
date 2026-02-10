import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  Text,
} from "react-native";
import {
  Info,
  Mail,
  Crown,
  Heart,
  MoreVertical,
} from "lucide-react-native";

import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useCart } from "@/hooks/useCart";
function CartBadge() {
  const { totalItems } = useCart();

  if (totalItems === 0) return null;

  return (
    <View className="absolute -right-1.5 -top-1.5 bg-rm-white rounded-lg min-w-4 h-4 items-center justify-center px-1">
      <Text className="text-rm-gold text-[10px] font-bold">{totalItems}</Text>
    </View>
  );
}
function HeaderMenu() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const menuItems = [
    { label: "Campaigns", icon: Heart, route: "/donate" },
    { label: "About Us", icon: Info, route: "/about" },
    { label: "Memberships", icon: Crown, route: "/memberships" },
    { label: "Contact", icon: Mail, route: "/contact" },
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
            style={{ backgroundColor: Colors.secondary }}
          >
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={index}
                  className={`flex-row items-center py-4 px-4 gap-3 border-b-2 border-rm-gold`}
                  onPress={() => handleMenuItemPress(item.route)}
                  activeOpacity={0.7}
                >
                  <Icon color={Colors.brand.gold} size={20} />
                  <Text className="text-base font-medium text-rm-gold">{item.label}</Text>
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
