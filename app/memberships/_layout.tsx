import Colors from "@/constants/colors";
import {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  createMaterialTopTabNavigator,
} from "@react-navigation/material-top-tabs";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { Stack, withLayoutContext } from "expo-router";

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function MembershipsLayout() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Memberships",
          headerStyle: {
            backgroundColor: Colors.secondary,
          },
          headerTintColor: Colors.textWhite,
          headerTitleStyle: {
            fontWeight: "700" as const,
          },
        }}
      />
      <MaterialTopTabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.deepDarkGray,
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: "600" as const,
            textTransform: "none" as const,
          },
          tabBarStyle: {
            backgroundColor: Colors.secondary,
          },
          tabBarIndicatorStyle: {
            backgroundColor: Colors.primary,
            height: 3,
          },
        }}
      >
        <MaterialTopTabs.Screen
          name="packages"
          options={{
            title: "Packages",
          }}
        />
        <MaterialTopTabs.Screen
          name="royal-investor"
          options={{
            title: "Royal Investor",
          }}
        />
      </MaterialTopTabs>
    </>
  );
}
