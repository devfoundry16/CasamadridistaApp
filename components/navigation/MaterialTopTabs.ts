import {
  createMaterialTopTabNavigator,
  type MaterialTopTabNavigationEventMap,
  type MaterialTopTabNavigationOptions,
} from "@react-navigation/material-top-tabs";
import type { ParamListBase, TabNavigationState } from "@react-navigation/native";
import { withLayoutContext } from "expo-router";

const { Navigator } = createMaterialTopTabNavigator();

/**
 * Shared expo-router binding for material top tabs.
 *
 * Kept in one module so there is only ever one wrapped Navigator — two separate
 * createMaterialTopTabNavigator() calls is a latent bug, not just duplication.
 * React Navigation instantiates independent navigator state per render tree, so
 * reusing this across layouts is safe.
 */
export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);
