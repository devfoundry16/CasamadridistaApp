import HeaderMenu from "@/components/HeaderMenu";
import Colors from "@/constants/colors";
import { Tabs } from "expo-router";

import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.darkGold,
        tabBarInactiveTintColor: Colors.darkGray,
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.secondary,
        },
        headerTintColor: Colors.textWhite,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "600" as const,
        },
        tabBarStyle: {
          backgroundColor: Colors.primary,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600" as const,
        },
        headerRight: () => <HeaderMenu />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: "Casamadridista",
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-formation"
        options={{
          title: "Formation",
          headerTitle: "Formation Builder",
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="soccer-ball-o" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="penalty"
        options={{
          title: "Penalty",
          headerTitle: "Penalty Game",
          headerTitleAlign: "center",
          headerShown: false,
          tabBarPosition: "right",
          tabBarItemStyle: {
            width: 30,
          },
          tabBarStyle: {
            display: "none",
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="game-controller" size={size + 5} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: "Team",
          headerTitle: "Ream Madrid Team",
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="users" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          headerTitle: "Shop",
          headerTitleAlign: "center",
          tabBarItemStyle: {
            display: "none",
          },
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="shopping-bag" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="donate"
        options={{
          title: "Donation",
          headerTitle: "Donation",
          headerTitleAlign: "center",

          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="donate" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          headerTitle: "My Account",
          headerTitleAlign: "center",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
