// store/slices/userSlice.ts
import { PaymentMethod, User } from "@/types/user/profile";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  user: Partial<User> | null;
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
}

const initialState: UserState = {
  user: null,
  paymentMethods: [],
  isLoading: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Partial<User> | null>) => {
      state.user = action.payload;
    },
    setPaymentMethods: (state, action: PayloadAction<PaymentMethod[]>) => {
      state.paymentMethods = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    updateUserData: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    addPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      state.paymentMethods.push(action.payload);
    },
    removePaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethods = state.paymentMethods.filter(
        (method) => method.id !== action.payload
      );
    },
    clearUser: (state) => {
      state.user = null;
      state.paymentMethods = [];
      state.isLoading = false;
    },
  },
});

export const {
  setUser,
  setPaymentMethods,
  setLoading,
  updateUserData,
  addPaymentMethod,
  removePaymentMethod,
  clearUser,
} = userSlice.actions;

export default userSlice.reducer;
