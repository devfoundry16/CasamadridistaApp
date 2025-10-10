import UserApiService from '@/services/authApi';
import { Address, Order, PaymentMethod, User } from '@/types/user/profile';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
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
      const userData = await AsyncStorage.getItem('user');
      const walletData = await AsyncStorage.getItem('wallet');
      const ordersData = await AsyncStorage.getItem('orders');
      const addressesData = await AsyncStorage.getItem('addresses');
      const paymentMethodsData = await AsyncStorage.getItem('paymentMethods');

      if (userData) setUser(JSON.parse(userData));
      if (walletData) setWallet(JSON.parse(walletData));
      if (ordersData) setOrders(JSON.parse(ordersData));
      if (addressesData) setAddresses(JSON.parse(addressesData));
      if (paymentMethodsData) setPaymentMethods(JSON.parse(paymentMethodsData));
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const mockUser: User = {
      id: '1',
      username: 'alifayad03',
      first_name: 'Ali',
      last_name: 'Fayad',
      name: 'Ali Fayad',
      email: 'alifayad03@gmail.com',
      password: 'password123',
      age: '30',
      nationality: 'Lebanon',
      placeOfResidence: 'Berlin',
      annualIncome: '$50,000 - $100,000',
      photo: 'https://casamadridista.com/wp-content/uploads/2025/08/IMG_3689.jpg',
      role: ["subscriber"],
    };

    await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);
  }, []);

  const register = useCallback(async (userData: Omit<User, 'id'>) => {
    const response = await UserApiService.register(userData);
    const newUser: User = response;
    console.log('Registered user:', newUser)
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['user', 'wallet', 'orders', 'addresses', 'paymentMethods']);
    setUser(null);
    setWallet(0);
    setOrders([]);
    setAddresses([]);
    setPaymentMethods([]);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    const response = await UserApiService.update(updates);
    const updatedUser: User = response;
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, [user]);

  const updateWallet = useCallback(async (amount: number) => {
    const newWallet = wallet + amount;
    await AsyncStorage.setItem('wallet', JSON.stringify(newWallet));
    setWallet(newWallet);
  }, [wallet]);

  const addOrder = useCallback(async (order: Order) => {
    const newOrders = [...orders, order];
    await AsyncStorage.setItem('orders', JSON.stringify(newOrders));
    setOrders(newOrders);
  }, [orders]);

  const addAddress = useCallback(async (address: Address) => {
    const newAddresses = [...addresses, address];
    await AsyncStorage.setItem('addresses', JSON.stringify(newAddresses));
    setAddresses(newAddresses);
  }, [addresses]);

  const updateAddress = useCallback(async (id: string, updates: Partial<Address>) => {
    const newAddresses = addresses.map(addr => 
      addr.id === id ? { ...addr, ...updates } : addr
    );
    await AsyncStorage.setItem('addresses', JSON.stringify(newAddresses));
    setAddresses(newAddresses);
  }, [addresses]);

  const deleteAddress = useCallback(async (id: string) => {
    const newAddresses = addresses.filter(addr => addr.id !== id);
    await AsyncStorage.setItem('addresses', JSON.stringify(newAddresses));
    setAddresses(newAddresses);
  }, [addresses]);

  const addPaymentMethod = useCallback(async (method: PaymentMethod) => {
    const newMethods = [...paymentMethods, method];
    await AsyncStorage.setItem('paymentMethods', JSON.stringify(newMethods));
    setPaymentMethods(newMethods);
  }, [paymentMethods]);

  const deletePaymentMethod = useCallback(async (id: string) => {
    const newMethods = paymentMethods.filter(method => method.id !== id);
    await AsyncStorage.setItem('paymentMethods', JSON.stringify(newMethods));
    setPaymentMethods(newMethods);
  }, [paymentMethods]);

  return useMemo(() => ({
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
  }), [user, isLoading, wallet, orders, addresses, paymentMethods, login, register, logout, updateUser, updateWallet, addOrder, addAddress, updateAddress, deleteAddress, addPaymentMethod, deletePaymentMethod]);
});
