// store/thunks/userThunks.ts
import UserService from "@/services/UserService";
import { Address, PaymentMethod, User } from "@/types/user/profile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncThunk } from "@reduxjs/toolkit";
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
      const userData = await UserService.login(email, password);
      dispatch(setUser(userData));
      await AsyncStorage.setItem("user_data", JSON.stringify(userData));
      return userData;
    } catch (error: any) {
      Alert.alert("Login error", error.message);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Register thunk
export const registerUser = createAsyncThunk(
  "user/register",
  async (userData: Omit<User, "id">, { dispatch }) => {
    dispatch(setLoading(true));
    try {
      const response = await UserService.register(userData);
      console.log("Registered user:", response.id);
      Alert.alert("Registration Success");
      return response;
    } catch (error: any) {
      Alert.alert("Registration error", error.message);
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Update user thunk
export const updateUser = createAsyncThunk(
  "user/updateUser",
  async (updates: Partial<User>, { dispatch, getState }) => {
    const state = getState() as RootState;
    if (!state.user.user) return;

    dispatch(setLoading(true));
    try {
      const response = await UserService.update(updates);
      const updatedUser: User = response;
      await AsyncStorage.setItem("user_data", JSON.stringify(updatedUser));
      dispatch(
        setUser({
          ...state.user,
          billing: response.billing,
          shipping: response.shipping,
        })
      );
      return updatedUser;
    } catch (error: any) {
      Alert.alert("Update error", error.message);
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
      const response = await UserService.uploadMedia(imageUri, filename);
      const updatedUser: User = {
        ...state.user.user,
        url: response.source_url,
      } as User;

      await dispatch(updateUser(updatedUser));
      await AsyncStorage.setItem("user_data", JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      Alert.alert("Upload Error", "Failed to upload avatar. Please try again.");
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Update address thunk
export const updateAddress = createAsyncThunk(
  "user/updateAddress",
  async (address: Address, { dispatch, getState }) => {
    const state = getState() as RootState;
    try {
      const response = await UserService.updateAddress(address);
      const updatedUser = {
        ...state.user.user,
        billing: response.billing,
        shipping: response.shipping,
      };
      await AsyncStorage.setItem("user_data", JSON.stringify(updatedUser));
      dispatch(setUser(updatedUser));
      return updatedUser;
    } catch (error: any) {
      Alert.alert("Address Update Error", error.message);
      throw error;
    }
  }
);

// Delete address thunk
export const deleteAddress = createAsyncThunk(
  "user/deleteAddress",
  async (type: "shipping" | "billing", { dispatch, getState }) => {
    const newAddress: Address = {
      type: type,
      email: "",
      first_name: "",
      last_name: "",
      company: "",
      address_1: "",
      address_2: "",
      city: "",
      state: "",
      country: "",
      postcode: "",
      phone: "",
    };
    const state = getState() as RootState;
    try {
      const response = await UserService.updateAddress(newAddress);
      const updatedUser = {
        ...state.user.user,
        billing: response.billing,
        shipping: response.shipping,
      };
      await AsyncStorage.setItem("user_data", JSON.stringify(updatedUser));
      dispatch(setUser(updatedUser));
      return updatedUser;
    } catch (error: any) {
      Alert.alert("Address Delete Error", error.message);
      throw error;
    }
  }
);

// Load user data thunk
export const loadUserData = createAsyncThunk(
  "user/loadUserData",
  async (_, { dispatch }) => {
    try {
      const userData = await AsyncStorage.getItem("user_data");
      if (userData) {
        dispatch(setUser(JSON.parse(userData)));
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
    await UserService.logout();
    await AsyncStorage.multiRemove(["user_data", "paymentMethods"]);
    dispatch(clearUser());
  }
);

// Payment methods thunks
export const addPaymentMethod = createAsyncThunk(
  "user/addPaymentMethod",
  async (method: PaymentMethod, { dispatch, getState }) => {
    const state = getState() as RootState;
    const newMethods = [...state.user.paymentMethods, method];
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
