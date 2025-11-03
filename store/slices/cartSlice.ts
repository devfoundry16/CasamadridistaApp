// store/slices/cartSlice.ts
import { CartItem } from "@/types/shop/cart";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CartState {
  items: CartItem[];
  loading: boolean;
  totalItems: number;
  totalPrice: number;
}

const initialState: CartState = {
  items: [],
  loading: false,
  totalItems: 0,
  totalPrice: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      state.totalItems = action.payload.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      state.totalPrice = action.payload.reduce(
        (sum, item) => sum + Number(item.prices.price) * item.quantity,
        0
      );
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
    },
  },
});

export const { setCartItems, setLoading, clearCart } = cartSlice.actions;

export default cartSlice.reducer;
