// store/thunks/userThunks.ts
import AuthService from "@/services/AuthService";
import i18n from "@/i18n";
import { PaymentMethod } from "@/types/user/profile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk } from "@reduxjs/toolkit";
import * as FileSystem from "expo-file-system";
import * as WebBrowser from "expo-web-browser";
import { Alert } from "react-native";
import {
  clearUser,
  setLoading,
  setPaymentMethods,
  setUser,
} from "../slices/userSlice";
import { RootState } from "../store";

// Login thunk
export const loginUser = createAsyncThunk(
  "user/login",
  async (
    { email, password }: { email: string; password: string },
    { dispatch }
  ) => {
    dispatch(setLoading(true));
    try {
      const userData = await AuthService.login(email, password);
      dispatch(setUser(userData));
      return userData;
    } catch (error: any) {
      Alert.alert(i18n.t("alerts.loginError"), error.message);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Google sign-in: opens OAuth URL in browser; completion is handled by useAuthCallbackDeeplink.
export const loginWithGoogle = createAsyncThunk(
  "user/loginWithGoogle",
  async (_, { dispatch }) => {
    dispatch(setLoading(true));
    try {
      const url = await AuthService.signInWithGoogle();
      await WebBrowser.openBrowserAsync(url);
    } catch (error: any) {
      Alert.alert(i18n.t("auth.signInWithGoogle"), error?.message ?? i18n.t("auth.failedGoogleSignIn"));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Apple sign-in: exchanges Apple identity token directly with Supabase — no browser redirect needed.
export const loginWithApple = createAsyncThunk(
  "user/loginWithApple",
  async (_, { dispatch }) => {
    dispatch(setLoading(true));
    try {
      const userData = await AuthService.signInWithApple();
      dispatch(setUser(userData));
      return userData;
    } catch (error: any) {
      // ERR_CANCELED means the user dismissed the Apple sheet — don't show an error alert.
      if (error?.code !== "ERR_CANCELED") {
        Alert.alert(i18n.t("auth.signInWithApple"), error?.message ?? i18n.t("auth.failedAppleSignIn"));
      }
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Register thunk
export const registerUser = createAsyncThunk(
  "user/register",
  async (
    userData: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
    { dispatch }
  ) => {
    dispatch(setLoading(true));
    try {
      const response = await AuthService.register(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.phone
      );
      Alert.alert(i18n.t("common.success"), i18n.t("auth.registrationSuccess"));
      return response;
    } catch (error: any) {
      Alert.alert(i18n.t("alerts.registrationError"), error.message);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Update user thunk
export const updateUser = createAsyncThunk(
  "user/updateUser",
  async (
    updates: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatarUrl?: string;
    },
    { dispatch, getState }
  ) => {
    const state = getState() as RootState;
    if (!state.user.user) return;

    dispatch(setLoading(true));
    try {
      const updatedProfile = await AuthService.updateProfile(updates);
      const updatedUser = {
        ...state.user.user,
        profile: updatedProfile,
      };
      dispatch(setUser(updatedUser));
      return updatedUser;
    } catch (error: any) {
      Alert.alert(i18n.t("alerts.updateError"), error.message);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const updateCustomer = createAsyncThunk(
  "user/updateCustomer",
  async (
    updates: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
    { dispatch, getState }
  ) => {
    const state = getState() as RootState;
    if (!state.user.user) return;

    dispatch(setLoading(true));
    try {
      const updatedProfile = await AuthService.updateProfile(updates);
      const updatedUser = {
        ...state.user.user,
        profile: updatedProfile,
      };
      dispatch(setUser(updatedUser));
      return updatedUser;
    } catch (error: any) {
      Alert.alert(i18n.t("alerts.updateError"), error.message);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Update avatar thunk
export const updateAvatar = createAsyncThunk(
  "user/updateAvatar",
  async (
    { imageUri, filename }: { imageUri: string; filename: string },
    { dispatch, getState }
  ) => {
    const state = getState() as RootState;
    if (!state.user.user) return;

    dispatch(setLoading(true));
    try {
      const fileUri = imageUri.startsWith("file://")
        ? imageUri
        : `file://${imageUri}`;
      const imageBase64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: "base64",
      });
      const updatedProfile = await AuthService.uploadAvatar(imageBase64, filename);
      const updatedUser = {
        ...state.user.user,
        profile: updatedProfile,
      };

      dispatch(setUser(updatedUser));
      return updatedUser;
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      Alert.alert(
        i18n.t("account.uploadError"),
        error?.message || i18n.t("account.uploadAvatarFailed")
      );
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Load user data thunk
export const loadUserData = createAsyncThunk(
  "user/loadUserData",
  async (_, { dispatch }) => {
    try {
      const user = await AuthService.getCurrentUser();
      if (user) {
        dispatch(setUser(user));
      }

      const paymentMethodsData = await AsyncStorage.getItem("paymentMethods");
      if (paymentMethodsData) {
        dispatch(setPaymentMethods(JSON.parse(paymentMethodsData)));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }
);

// Logout thunk
export const logoutUser = createAsyncThunk(
  "user/logout",
  async (_, { dispatch }) => {
    await AuthService.logout();
    await AsyncStorage.removeItem("paymentMethods");
    dispatch(clearUser());
  }
);

// Payment methods thunks
export const addPaymentMethod = createAsyncThunk(
  "user/addPaymentMethod",
  async (method: PaymentMethod, { dispatch, getState }) => {
    const state = getState() as RootState;
    let methodWithExpiry = method;
    if (method.expiryDate) {
      const [month, year] = method.expiryDate.split("/");
      const exp_month = parseInt(month, 10);
      const exp_year = 2000 + parseInt(year, 10);
      methodWithExpiry = { ...method, exp_month, exp_year };
    }
    // add payment method

    const newMethods = [...state.user.paymentMethods, { ...methodWithExpiry }];
    await AsyncStorage.setItem("paymentMethods", JSON.stringify(newMethods));
    dispatch(setPaymentMethods(newMethods));
    return newMethods;
  }
);

export const deletePaymentMethod = createAsyncThunk(
  "user/deletePaymentMethod",
  async (id: string, { dispatch, getState }) => {
    const state = getState() as RootState;
    const newMethods = state.user.paymentMethods.filter(
      (method) => method.id !== id
    );
    await AsyncStorage.setItem("paymentMethods", JSON.stringify(newMethods));
    dispatch(setPaymentMethods(newMethods));
    return newMethods;
  }
);

export const deleteUser = createAsyncThunk(
  "user/deleteUser",
  async (_: any, { dispatch }) => {
    await AuthService.deleteAccount();
    await AsyncStorage.removeItem("paymentMethods");
    dispatch(clearUser());
  }
);