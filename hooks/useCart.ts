import { AppDispatch, RootState } from "@/store/store";
import {
  addToCart,
  clearCartItems,
  getCartItems,
  removeFromCart,
  updateQuantity,
} from "@/store/thunks/cartThunks";
import { Product } from "@/types/shop/product";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

export const useCart = () => {
  const dispatch = useDispatch<AppDispatch>();

  const cartState = useSelector((state: RootState) => state.cart);
  const { items, loading, totalItems, totalPrice } = cartState;

  const loadCartItems = useCallback(() => {
    dispatch(getCartItems());
  }, [dispatch]);

  const addItemToCart = useCallback(
    (product: Product) => {
      return dispatch(addToCart(product));
    },
    [dispatch]
  );

  const removeItemFromCart = useCallback(
    (productId: number) => {
      return dispatch(removeFromCart(productId));
    },
    [dispatch]
  );

  const updateItemQuantity = useCallback(
    (key: string, quantity: number) => {
      return dispatch(updateQuantity({ key, quantity }));
    },
    [dispatch]
  );

  const clearCart = useCallback(() => {
    return dispatch(clearCartItems());
  }, [dispatch]);

  return {
    // State
    items,
    loading,
    totalItems,
    totalPrice,

    // Actions
    loadCartItems,
    addToCart: addItemToCart,
    removeFromCart: removeItemFromCart,
    updateQuantity: updateItemQuantity,
    clearCart,
  };
};

// Export the helper function separately since it's used elsewhere
export { buildVariationsFromAttributes } from "@/store/thunks/cartThunks";
