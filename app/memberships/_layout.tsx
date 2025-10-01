import { MaterialTopTabNavigationEventMap, MaterialTopTabNavigationOptions, createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import Colors from '@/constants/colors';

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function MembershipsLayout() {
  return (
    <MaterialTopTabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.darkGray,
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600' as const,
          textTransform: 'none' as const,
        },
        tabBarStyle: {
          backgroundColor: Colors.secondary,
        },
        tabBarIndicatorStyle: {
          backgroundColor: Colors.accent,
          height: 3,
        },
      }}
    >
      <MaterialTopTabs.Screen
        name="packages"
        options={{
          title: 'Packages',
        }}
      />
      <MaterialTopTabs.Screen
        name="royal-investor"
        options={{
          title: 'Royal Investor',
        }}
      />
    </MaterialTopTabs>
  );
}
