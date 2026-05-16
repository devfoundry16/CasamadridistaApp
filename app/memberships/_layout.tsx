import Colors from "@/constants/colors";
import {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
  createMaterialTopTabNavigator,
} from "@react-navigation/material-top-tabs";
import { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { Stack, withLayoutContext } from "expo-router";
import { useTranslation } from "react-i18next";
import { useFont } from "@/contexts/FontContext";

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function MembershipsLayout() {
  const { t } = useTranslation();
  const { fontFamilyBold } = useFont();
  return (
    <>
      <Stack.Screen
        options={{
          title: t("nav.membership"),
          headerStyle: { backgroundColor: Colors.darkGold },
          headerTintColor: Colors.text.primary,
          headerTitleStyle: {
            color: Colors.text.primary,
            ...(fontFamilyBold ? { fontFamily: fontFamilyBold } : {}),
          },
          headerTitleAlign: "center",
        }}
      />
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
            tabBarLabelStyle: fontFamilyBold
              ? { fontFamily: fontFamilyBold }
              : {},
          }}
        />
        <MaterialTopTabs.Screen
          name="registration"
          options={{
            title: t("membership.registration"),
            tabBarLabelStyle: fontFamilyBold
              ? { fontFamily: fontFamilyBold }
              : {},
          }}
        />
        <MaterialTopTabs.Screen
          name="royal-investor"
          options={{
            title: t("membership.royalInvestor"),
            tabBarLabelStyle: fontFamilyBold
              ? { fontFamily: fontFamilyBold }
              : {},
          }}
        />
      </MaterialTopTabs>
    </>
  );
}
