import AuthService from "@/services/AuthService";
import { Address, Order, PaymentMethod, User } from "@/types/user/profile";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<Partial<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wallet, setWallet] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const walletData = await AsyncStorage.getItem("wallet");
      const ordersData = await AsyncStorage.getItem("orders");
      const addressesData = await AsyncStorage.getItem("addresses");
      const paymentMethodsData = await AsyncStorage.getItem("paymentMethods");

      if (userData) setUser(JSON.parse(userData));
      if (walletData) setWallet(JSON.parse(walletData));
      if (ordersData) setOrders(JSON.parse(ordersData));
      if (addressesData) setAddresses(JSON.parse(addressesData));
      if (paymentMethodsData) setPaymentMethods(JSON.parse(paymentMethodsData));
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    AuthService.login(email, password).then(async (data) => {

      const userData = await AuthService.getUserById();
      setUser(userData);

    }).catch((error) => {
      Alert.alert("Login error", error.message);
    });
  }, []);

  const register = useCallback(async (userData: Omit<User, "id">) => {
    AuthService.register(userData).then(async (response) => {
      const newUser: User = response;
      console.log("Registered user:", newUser);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
    }).catch((error) => {
      Alert.alert("Registration error", error.message);
    });
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([
      "user",
      "wallet",
      "orders",
      "addresses",
      "paymentMethods",
    ]);
    setUser(null);
    setWallet(0);
    setOrders([]);
    setAddresses([]);
    setPaymentMethods([]);
  }, []);

  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      if (!user) return;
      const response = await AuthService.update(updates);
      const updatedUser: User = response;
      console.log("Updated user:", updatedUser);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    },
    [user]
  );
  const updateAvatar = useCallback(
    async (imageUri: string, filename: string) => {
      if (!user) return;
      try {
        const response = await AuthService.uploadMedia(imageUri, filename);
        const updatedUser: User = {
          ...user,
          photo: response.source_url,
        } as User;
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } catch (error) {
        console.error("Error uploading avatar:", error);
        Alert.alert("Upload Error", "Failed to upload avatar. Please try again.");
      }
    },
    [user]
  );
  const updateWallet = useCallback(
    async (amount: number) => {
      const newWallet = wallet + amount;
      await AsyncStorage.setItem("wallet", JSON.stringify(newWallet));
      setWallet(newWallet);
    },
    [wallet]
  );

  const addOrder = useCallback(
    async (order: Order) => {
      const newOrders = [...orders, order];
      await AsyncStorage.setItem("orders", JSON.stringify(newOrders));
      setOrders(newOrders);
    },
    [orders]
  );

  const addAddress = useCallback(
    async (address: Address) => {
      const newAddresses = [...addresses, address];
      await AsyncStorage.setItem("addresses", JSON.stringify(newAddresses));
      setAddresses(newAddresses);
    },
    [addresses]
  );

  const updateAddress = useCallback(
    async (id: string, updates: Partial<Address>) => {
      const newAddresses = addresses.map((addr) =>
        addr.id === id ? { ...addr, ...updates } : addr
      );
      await AsyncStorage.setItem("addresses", JSON.stringify(newAddresses));
      setAddresses(newAddresses);
    },
    [addresses]
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      const newAddresses = addresses.filter((addr) => addr.id !== id);
      await AsyncStorage.setItem("addresses", JSON.stringify(newAddresses));
      setAddresses(newAddresses);
    },
    [addresses]
  );

  const addPaymentMethod = useCallback(
    async (method: PaymentMethod) => {
      const newMethods = [...paymentMethods, method];
      await AsyncStorage.setItem("paymentMethods", JSON.stringify(newMethods));
      setPaymentMethods(newMethods);
    },
    [paymentMethods]
  );

  const deletePaymentMethod = useCallback(
    async (id: string) => {
      const newMethods = paymentMethods.filter((method) => method.id !== id);
      await AsyncStorage.setItem("paymentMethods", JSON.stringify(newMethods));
      setPaymentMethods(newMethods);
    },
    [paymentMethods]
  );

  return useMemo(
    () => ({
      user,
      isLoading,
      wallet,
      orders,
      addresses,
      paymentMethods,
      login,
      register,
      logout,
      updateUser,
      updateWallet,
      addOrder,
      addAddress,
      updateAddress,
      deleteAddress,
      addPaymentMethod,
      deletePaymentMethod,
      updateAvatar
    }),
    [
      user,
      isLoading,
      wallet,
      orders,
      addresses,
      paymentMethods,
      login,
      register,
      logout,
      updateUser,
      updateWallet,
      addOrder,
      addAddress,
      updateAddress,
      deleteAddress,
      addPaymentMethod,
      deletePaymentMethod,
      updateAvatar
    ]
  );
});
