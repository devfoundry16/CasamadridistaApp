import AuthService from "@/services/AuthService";
import { Address, PaymentMethod, User } from "@/types/user/profile";
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
  postcode: "",
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
  postcode: "",
  phone: "",
};
export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<Partial<User> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
      // const walletData = await AsyncStorage.getItem("wallet");
      // const ordersData = await AsyncStorage.getItem("orders");
      // const paymentMethodsData = await AsyncStorage.getItem("paymentMethods");

      // if (walletData) setWallet(JSON.parse(walletData));
      // if (ordersData) setOrders(JSON.parse(ordersData));
      // if (paymentMethodsData) setPaymentMethods(JSON.parse(paymentMethodsData));
    } catch (error) {
      console.error("Error loading user data:", error);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    AuthService.login(email, password)
      .then(async (data) => {
        const userData = await AuthService.getUserById();
        setUser(userData);
        setIsLoading(false);
      })
      .catch((error) => {
        Alert.alert("Login error", error.message);
        setIsLoading(false);
      });
  }, []);

  const register = useCallback(async (userData: Omit<User, "id">) => {
    AuthService.register(userData)
      .then(async (response) => {
        const newUser: User = response;
        console.log("Registered user:", newUser.id);
        await AsyncStorage.setItem("user", JSON.stringify(newUser));
        setUser(newUser);
      })
      .catch((error) => {
        setIsLoading(false);
        Alert.alert("Registration error", error.message);
      });
  }, []);

  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      if (!user) return;
      AuthService.update(updates)
        .then(async (response) => {
          const updatedUser: User = response;
          await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
        })
        .catch((error) => {
          setIsLoading(false);
          Alert.alert("Update error", error.message);
        });
    },
    [user]
  );
  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(["user"]);
    setUser(null);
  }, []);
  const updateAvatar = useCallback(
    async (imageUri: string, filename: string) => {
      if (!user) return;
      try {
        setIsLoading(true);
        const response = await AuthService.uploadMedia(imageUri, filename);
        const updatedUser: User = {
          ...user,
          url: response.source_url,
        } as User;
        await updateUser(updatedUser).then(() => setIsLoading(false));
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } catch (error) {
        setIsLoading(false);
        console.error("Error uploading avatar:", error);
        Alert.alert(
          "Upload Error",
          "Failed to upload avatar. Please try again."
        );
      }
    },
    [user]
  );

  const handleAddress = async (address: Address) => {
    const updatedUser = await AuthService.updateAddress(address);
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };
  const updateAddress = useCallback(async (address: Address) => {
    await handleAddress(address);
  }, []);
  const deleteAddress = useCallback(async (type: "shipping" | "billing") => {
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
      postcode: "",
      phone: "",
    };
    await handleAddress(newAddress);
  }, []);

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
      paymentMethods,
      isLoading,
      login,
      register,
      logout,
      updateUser,
      updateAddress,
      deleteAddress,
      addPaymentMethod,
      deletePaymentMethod,
      updateAvatar,
    }),
    [
      user,
      isLoading,
      paymentMethods,
      login,
      register,
      logout,
      updateUser,
      updateAddress,
      deleteAddress,
      addPaymentMethod,
      deletePaymentMethod,
      updateAvatar,
    ]
  );
});
