import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  age: string;
  nationality: string;
  placeOfResidence: string;
  annualIncome: string;
  photo?: string;
  subscription?: {
    type: string;
    plan: string;
    startDate: string;
    endDate: string;
  };
}

export interface Address {
  id: string;
  type: 'shipping' | 'billing';
  fullName: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  email?: string;
}

export interface Order {
  id: string;
  date: string;
  items: string[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
}

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
      fullName: 'Ali Fayad',
      email,
      phone: '+1234567890',
      age: '30',
      nationality: 'Spain',
      placeOfResidence: 'Madrid',
      annualIncome: '$50,000 - $100,000',
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    };

    await AsyncStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);
  }, []);

  const register = useCallback(async (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
    };

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
    const updatedUser = { ...user, ...updates };
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
