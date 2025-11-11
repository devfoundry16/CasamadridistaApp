// hooks/useUser.ts
import UserService from "@/services/UserService";
import { AppDispatch, RootState } from "@/store/store";
import {
  addPaymentMethod,
  deleteAddress,
  deletePaymentMethod,
  loadUserData,
  loginUser,
  logoutUser,
  registerUser,
  updateAddress,
  updateAvatar,
  updateUser,
  updateCustomer,
} from "@/store/thunks/userThunks";
import { Address, PaymentMethod, User } from "@/types/user/profile";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export const useUser = () => {
  const dispatch = useDispatch<AppDispatch>();

  const userState = useSelector((state: RootState) => state.user);
  const { user, paymentMethods, isLoading } = userState;

  const login = useCallback(
    (email: string, password: string) => {
      return dispatch(loginUser({ email, password }));
    },
    [dispatch]
  );

  const register = useCallback(
    (userData: Omit<User, "id">) => {
      return dispatch(registerUser(userData));
    },
    [dispatch]
  );

  const updateUserProfile = useCallback(
    (updates: Partial<User>) => {
      return dispatch(updateUser(updates));
    },
    [dispatch]
  );

  const updateUserAvatar = useCallback(
    (imageUri: string, filename: string) => {
      return dispatch(updateAvatar({ imageUri, filename }));
    },
    [dispatch]
  );

  const updateCustomerProfile = useCallback(
    (data: any) => {
      return dispatch(updateCustomer(data));
    },
    [dispatch]
  );

  const getCustomerStripeId = useCallback(() => {
    return UserService.getStripeId();
  }, []);

  const updateUserAddress = useCallback(
    (address: Address) => {
      return dispatch(updateAddress(address));
    },
    [dispatch]
  );

  const removeAddress = useCallback(
    (type: "shipping" | "billing") => {
      return dispatch(deleteAddress(type));
    },
    [dispatch]
  );

  const addPaymentMethodToUser = useCallback(
    (method: PaymentMethod) => {
      return dispatch(addPaymentMethod(method));
    },
    [dispatch]
  );

  const removePaymentMethod = useCallback(
    (id: string) => {
      return dispatch(deletePaymentMethod(id));
    },
    [dispatch]
  );

  const loadUserDataFromStorage = useCallback(() => {
    return dispatch(loadUserData());
  }, [dispatch]);

  const logout = useCallback(() => {
    return dispatch(logoutUser());
  }, [dispatch]);

  return {
    // State
    user,
    paymentMethods,
    isLoading,

    // Actions
    login,
    register,
    getStripeId: getCustomerStripeId,
    updateUser: updateUserProfile,
    updateAvatar: updateUserAvatar,
    updateCustomer: updateCustomerProfile,
    updateAddress: updateUserAddress,
    deleteAddress: removeAddress,
    addPaymentMethod: addPaymentMethodToUser,
    deletePaymentMethod: removePaymentMethod,
    loadUserData: loadUserDataFromStorage,
    logout,
  };
};
