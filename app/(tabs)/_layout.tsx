import { Tabs } from "expo-router";
import {
  Home,
  Newspaper,
  Image as ImageIcon,
  User,
  Layout,
  Store,
} from "lucide-react-native";
import React from "react";
import Colors from "@/constants/colors";
import HeaderMenu from '../components/HeaderMenu';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.darkGray,
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.secondary,
        },
        headerTintColor: Colors.textWhite,
        headerTitleStyle: {
          fontWeight: "700" as const,
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
        headerRight: () => <HeaderMenu />
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: "Casa Madridista",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="news"
        options={{
          title: "News",
          headerTitle: "Latest News",
          tabBarIcon: ({ color, size }) => (
            <Newspaper size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-formation"
        options={{
          title: "Formation",
          headerTitle: "Formation Builder",
          tabBarIcon: ({ color, size }) => <Layout size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: "Team",
          headerTitle: "Ream Madrid Team",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: "Store",
          headerTitle: "Store",
          tabBarIcon: ({ color, size }) => <Store size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
