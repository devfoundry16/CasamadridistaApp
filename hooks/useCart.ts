// import CartService from "@/services/Shop/CartService";
// import { CartItem } from "@/types/shop/cart";
// import { Product } from "@/types/shop/product";
// import createContextHook from "@nkzw/create-context-hook";
// import { useCallback, useEffect, useMemo, useState } from "react";
// import { Alert } from "react-native";
// export default function buildVariationsFromAttributes(attributes?: any[]) {
//   if (!Array.isArray(attributes) || attributes.length === 0) return [];

//   return attributes.flatMap((attr) => {
//     const attributeKey = attr.slug ?? attr.name ?? `attr_${attr.id}`;
//     const options = Array.isArray(attr.options) ? attr.options : [];
//     return options.map((opt: string) => ({
//       attribute: attributeKey,
//       value: opt,
//     }));
//   });
// }

// export const [CartProvider, useCart] = createContextHook(() => {
//   const [items, setItems] = useState<CartItem[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);

//   const getItemsInCart = useCallback(async () => {
//     try {
//       setLoading(true);
//       const res = await CartService.getItemsInCart();
//       setLoading(false);
//       return res;
//     } catch (error) {
//       setLoading(false);
//       return { items: [] };
//     }
//   }, []);

//   useEffect(() => {
//     getItemsInCart().then((data) => {
//       setItems(data.items);
//     });
//   }, [getItemsInCart]);

//   /*Add to cart*/
//   const addToCart = useCallback((product: any) => {
//     addItemToCart(product)
//       .then((data) => setItems(data))
//       .catch((error) => Alert.alert(error.response.data.message));
//   }, []);
//   /*Remove from cart*/
//   const removeFromCart = useCallback((productId: number) => {
//     removeItemFromCart(productId)
//       .then((data) => setItems(data))
//       .catch((error) => Alert.alert(error.response.data.message));
//   }, []); // No dependency on items needed
//   /*Update quantity*/
//   const updateQuantity = useCallback((key: string, quantity: number) => {
//     updateItemInCart(key, quantity)
//       .then((data) => setItems(data))
//       .catch((error) => Alert.alert(error.response.data.message));
//   }, []);
//   const addItemToCart = async (product: Product) => {
//     const body = {
//       id: product.id,
//       quantity: 1,
//       variation: buildVariationsFromAttributes((product as any).attributes),
//     };
//     // If your ShopApiService expects (id, qty) change this call accordingly.
//     const data = await CartService.addItemToCart(
//       body.id,
//       body.quantity,
//       body.variation
//     );
//     console.log("Successfully Added, remaining item:", data.items.length);
//     return data.items;
//   };
//   const removeItemFromCart = async (productId: number) => {
//     let key;
//     setItems((prevItems) => {
//       key = prevItems.find((item) => item.id == productId)?.key;
//       return prevItems;
//     });
//     const data = await CartService.removeItemInCart(key as any);
//     console.log("Successfully Removed, remaining item:", data.items.length);
//     return data.items;
//   };
//   const updateItemInCart = async (key: string, quantity: number) => {
//     const data = quantity
//       ? await CartService.updateItemInCart(key, quantity)
//       : await CartService.removeItemInCart(key);
//     console.log("Successfully Updated, remaining item:", data.items.length);
//     return data.items;
//   };

//   const clearCart = useCallback(() => {
//     CartService.removeAllItemsInCart();
//     setItems([]);
//   }, []);
//   const totalItems = items?.reduce((sum, item) => sum + item.quantity, 0);
//   const totalPrice = items?.reduce(
//     (sum, item) => sum + Number(item.prices.price) * item.quantity,
//     0
//   );

//   return useMemo(
//     () => ({
//       items,
//       addToCart,
//       removeFromCart,
//       updateQuantity,
//       clearCart,
//       totalItems,
//       totalPrice,
//       loading,
//     }),
//     [
//       items,
//       addToCart,
//       removeFromCart,
//       updateQuantity,
//       clearCart,
//       totalItems,
//       totalPrice,
//       loading,
//     ]
//   );
// });

// hooks/useCart.ts
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
