// store/thunks/cartThunks.ts
import CartService from "@/services/Shop/CartService";
import { Product } from "@/types/shop/product";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { Alert } from "react-native";
import { clearCart, setCartItems, setLoading } from "../slices/cartSlice";
import { RootState } from "../store";

// Helper function (moved from original file)
export function buildVariationsFromAttributes(attributes?: any[]) {
  if (!Array.isArray(attributes) || attributes.length === 0) return [];

  return attributes.flatMap((attr) => {
    const attributeKey = attr.slug ?? attr.name ?? `attr_${attr.id}`;
    const options = Array.isArray(attr.options) ? attr.options : [];
    return options.map((opt: string) => ({
      attribute: attributeKey,
      value: opt,
    }));
  });
}

// Get cart items
export const getCartItems = createAsyncThunk(
  "cart/getItems",
  async (_, { dispatch }) => {
    dispatch(setLoading(true));
    try {
      const res = await CartService.getItemsInCart();
      dispatch(setCartItems(res.items || []));
      return res.items;
    } catch (error) {
      dispatch(setLoading(false));
      dispatch(setCartItems([]));
      return [];
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Add item to cart
export const addToCart = createAsyncThunk(
  "cart/addItem",
  async (product: Product, { dispatch, getState }) => {
    try {
      const body = {
        id: product.id,
        quantity: 1,
        variation: buildVariationsFromAttributes((product as any).attributes),
      };

      const data = await CartService.addItemToCart(
        body.id,
        body.quantity,
        body.variation
      );

      console.log("Successfully Added, remaining item:", data.items.length);
      dispatch(setCartItems(data.items || []));
      return data.items;
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      Alert.alert(
        error.response?.data?.message || "Failed to add item to cart"
      );
      throw error;
    }
  }
);

// Remove item from cart
export const removeFromCart = createAsyncThunk(
  "cart/removeItem",
  async (productId: number, { dispatch, getState }) => {
    try {
      const state = getState() as RootState;
      const key = state.cart.items.find((item) => item.id === productId)?.key;

      if (!key) {
        throw new Error("Item not found in cart");
      }

      const data = await CartService.removeItemInCart(key);
      console.log("Successfully Removed, remaining item:", data.items.length);
      dispatch(setCartItems(data.items || []));
      return data.items;
    } catch (error: any) {
      console.error("Error removing from cart:", error);
      Alert.alert(
        error.response?.data?.message || "Failed to remove item from cart"
      );
      throw error;
    }
  }
);

// Update item quantity
export const updateQuantity = createAsyncThunk(
  "cart/updateQuantity",
  async (
    { key, quantity }: { key: string; quantity: number },
    { dispatch }
  ) => {
    try {
      let data;
      if (quantity > 0) {
        data = await CartService.updateItemInCart(key, quantity);
      } else {
        data = await CartService.removeItemInCart(key);
      }

      console.log("Successfully Updated, remaining item:", data.items.length);
      dispatch(setCartItems(data.items || []));
      return data.items;
    } catch (error: any) {
      console.error("Error updating quantity:", error);
      Alert.alert(
        error.response?.data?.message || "Failed to update item quantity"
      );
      throw error;
    }
  }
);

// Clear entire cart
export const clearCartItems = createAsyncThunk(
  "cart/clearCart",
  async (_, { dispatch }) => {
    try {
      await CartService.removeAllItemsInCart();
      dispatch(clearCart());
    } catch (error: any) {
      console.error("Error clearing cart:", error);
      Alert.alert("Failed to clear cart");
      throw error;
    }
  }
);
