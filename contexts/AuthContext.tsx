import AuthService from "@/services/AuthService";
import { Address, Order, PaymentMethod, User } from "@/types/user/profile";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
const initialBillingAddress = {
  type: "billing" as "shipping" | "billing",
  email: "",
  first_name: "",
  last_name: "",
  company: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  phone: "",
};
const initialShippingAddress = {
  type: "shipping" as "shipping" | "billing",
  email: "",
  first_name: "",
  last_name: "",
  company: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  phone: "",
};
export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<Partial<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wallet, setWallet] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [billingAddress, setBillingAddress] = useState<Address | null>(
    initialBillingAddress
  );
  const [shippingAddress, setShippingAddress] = useState<Address | null>(
    initialShippingAddress
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const walletData = await AsyncStorage.getItem("wallet");
      const ordersData = await AsyncStorage.getItem("orders");
      // const billingAddressData =
      //   await AsyncStorage.getItem("billingAddressData");
      // const shippingAddressData = await AsyncStorage.getItem(
      //   "shippingAddressData"
      // );
      const paymentMethodsData = await AsyncStorage.getItem("paymentMethods");

      if (userData) {
        setUser(JSON.parse(userData));
        await getAddressData();
      }
      if (walletData) setWallet(JSON.parse(walletData));
      if (ordersData) setOrders(JSON.parse(ordersData));
      // if (billingAddressData) setBillingAddress(JSON.parse(billingAddressData));
      // if (shippingAddressData)
      //   setShippingAddress(JSON.parse(shippingAddressData));
      if (paymentMethodsData) setPaymentMethods(JSON.parse(paymentMethodsData));
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAddressData = useCallback(async () => {
    const addresses = await AuthService.getAddress();
    setBillingAddress({ type: "billing", ...addresses.billing });
    setShippingAddress({ type: "shipping", ...addresses.shipping });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    AuthService.login(email, password)
      .then(async (data) => {
        const userData = await AuthService.getUserById();
        setUser(userData);
        await getAddressData();
      })
      .catch((error) => {
        Alert.alert("Login error", error.message);
      });
  }, []);

  const register = useCallback(async (userData: Omit<User, "id">) => {
    AuthService.register(userData)
      .then(async (response) => {
        const newUser: User = response;
        console.log("Registered user:", newUser);
        await AsyncStorage.setItem("user", JSON.stringify(newUser));
        setUser(newUser);
      })
      .catch((error) => {
        Alert.alert("Registration error", error.message);
      });
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([
      "user",
      "wallet",
      "orders",
      "billingAddressData",
      "shippingAddressData",
      "paymentMethods",
    ]);
    setUser(null);
    setWallet(0);
    setOrders([]);
    setBillingAddress(null);
    setShippingAddress(null);
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
        Alert.alert(
          "Upload Error",
          "Failed to upload avatar. Please try again."
        );
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

  const handleAddress = async (address: Address) => {
    const response = await AuthService.updateAddress(address);
    let newAddress: Address;
    if (address.type == "billing") {
      newAddress = { ...response.billing, type: "billing" };
      setBillingAddress(newAddress);
    } else {
      newAddress = { ...response.shipping, type: "shipping" };
      setShippingAddress(newAddress);
    }
  };
  const updateAddress = useCallback(
    async (address: Address) => {
      await handleAddress(address);
    },
    [billingAddress, shippingAddress]
  );
  const deleteAddress = useCallback(
    async (type: "shipping" | "billing") => {
      let newAddress: Address = {
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
        postalCode: "",
        phone: "",
      };
      await handleAddress(newAddress);
    },
    [billingAddress, shippingAddress]
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
      billingAddress,
      shippingAddress,
      paymentMethods,
      login,
      register,
      logout,
      updateUser,
      updateWallet,
      addOrder,
      updateAddress,
      deleteAddress,
      addPaymentMethod,
      deletePaymentMethod,
      updateAvatar,
    }),
    [
      user,
      isLoading,
      wallet,
      orders,
      billingAddress,
      shippingAddress,
      paymentMethods,
      login,
      register,
      logout,
      updateUser,
      updateWallet,
      addOrder,
      updateAddress,
      deleteAddress,
      addPaymentMethod,
      deletePaymentMethod,
      updateAvatar,
    ]
  );
});
