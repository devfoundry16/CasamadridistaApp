import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
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
  ShoppingCart,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useCart } from "@/hooks/useCart";
function CartBadge() {
  const { totalItems } = useCart();

  if (totalItems === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{totalItems}</Text>
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
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push("/cart" as any)}
        style={styles.button}
        activeOpacity={0.7}
      >
        <View>
          <ShoppingCart color={Colors.primary} size={24} />
          <CartBadge />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setMenuVisible(true)}
        style={styles.menuButton}
        activeOpacity={0.7}
      >
        <MoreVertical color={Colors.primary} size={24} />
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[styles.menuContainer, { backgroundColor: Colors.primary }]}
          >
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    { borderBottomColor: Colors.border },
                    index === menuItems.length - 1 && styles.menuItemLast,
                  ]}
                  onPress={() => handleMenuItemPress(item.route)}
                  activeOpacity={0.7}
                >
                  <Icon color={Colors.text} size={20} />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", marginRight: 8 },
  button: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 6,
    borderRadius: 8,
  },
  menuButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 16,
  },
  menuContainer: {
    borderRadius: 12,
    minWidth: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  badge: {
    position: "absolute",
    right: -6,
    top: -6,
    backgroundColor: Colors.textWhite,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.darkGold,
    fontSize: 10,
    fontWeight: "700" as const,
  },
});

export default HeaderMenu;
