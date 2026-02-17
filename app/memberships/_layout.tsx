import Colors from "@/constants/colors";
import {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  createMaterialTopTabNavigator,
} from "@react-navigation/material-top-tabs";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import { useTranslation } from "react-i18next";

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function MembershipsLayout() {
  const { t } = useTranslation();
  return (
    <>
      <MaterialTopTabs
        screenOptions={{
          tabBarActiveTintColor: Colors.secondary,
          tabBarInactiveTintColor: Colors.secondary,
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: "600" as const,
            textTransform: "none" as const,
          },
          tabBarStyle: {
            backgroundColor: Colors.primary,
          },
          tabBarIndicatorStyle: {
            backgroundColor: Colors.secondary,
            height: 3,
          },
        }}
      >
        <MaterialTopTabs.Screen
          name="packages"
          options={{
            title: t("membership.packages"),
          }}
        />
        <MaterialTopTabs.Screen
          name="royal-investor"
          options={{
            title: t("membership.royalInvestor"),
          }}
        />
      </MaterialTopTabs>
    </>
  );
}
