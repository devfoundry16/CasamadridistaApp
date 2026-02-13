// hooks/useUser.ts
import { AppDispatch, RootState } from "@/store/store";
import {
  addPaymentMethod,
  deletePaymentMethod,
  loadUserData,
  loginUser,
  logoutUser,
  registerUser,
  updateAvatar,
  updateUser,
  deleteUser,
  updateCustomer,
} from "@/store/thunks/userThunks";
import { PaymentMethod } from "@/types/user/profile";
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
    (userData: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    }) => {
      return dispatch(registerUser(userData));
    },
    [dispatch]
  );

  const updateUserProfile = useCallback(
    (updates: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatarUrl?: string;
    }) => {
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
    (data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    }) => {
      return dispatch(updateCustomer(data));
    },
    [dispatch]
  );

  const getCustomerStripeId = useCallback(async () => {
    // Get Stripe customer ID from user profile
    if (user?.profile?.stripe_customer_id) {
      return user.profile.stripe_customer_id;
    }
    return null;
  }, [user]);

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
  
  const deleteUserProfile = useCallback(() => {
    return dispatch(deleteUser(null as any));
  }, [dispatch]);

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
    deleteUser: deleteUserProfile,
    getStripeId: getCustomerStripeId,
    updateUser: updateUserProfile,
    updateAvatar: updateUserAvatar,
    updateCustomer: updateCustomerProfile,
    addPaymentMethod: addPaymentMethodToUser,
    deletePaymentMethod: removePaymentMethod,
    loadUserData: loadUserDataFromStorage,
    logout,
  };
};
