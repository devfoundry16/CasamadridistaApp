import ShopApiService from "@/services/ShopService";
import { Product } from "@/types/product/product";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

export interface CartItem extends Product {
  quantity: number;
  key: string;
  quantity_limits: { minimum: number; maximum: number; editable: boolean };
  prices: {
    price: string;
    regular_price: string;
    sale_price: string;
    currency_prefix: string;
  };
  variation: [];
}
export default function buildVariationsFromAttributes(attributes?: any[]) {
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

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getItemsInCart = useCallback(async () => {
    try {
      setLoading(true);
      const res = await ShopApiService.getItemsInCart();
      console.log("global", res.items.length);
      setLoading(false);
      return res;
    } catch (error) {
      console.error("Error fetching cart items:", error);
      return { items: [] };
    }
  }, []);

  useEffect(() => {
    getItemsInCart().then((data) => {
      setItems(data.items);
    });
  }, [getItemsInCart]);

  /*Add to cart*/
  const addToCart = useCallback((product: Product) => {
    addItemToCart(product)
      .then((data) => setItems(data))
      .catch((error) => Alert.alert(error.response.data.message));
  }, []);
  /*Remove from cart*/
  const removeFromCart = useCallback((productId: number) => {
    removeItemFromCart(productId)
      .then((data) => setItems(data))
      .catch((error) => Alert.alert(error.response.data.message));
  }, []); // No dependency on items needed
  /*Update quantity*/
  const updateQuantity = useCallback((key: string, quantity: number) => {
    updateItemInCart(key, quantity)
      .then((data) => setItems(data))
      .catch((error) => Alert.alert(error.response.data.message));
  }, []);
  const addItemToCart = async (product: Product) => {
    const body = {
      id: product.id,
      quantity: 1,
      variation: buildVariationsFromAttributes((product as any).attributes),
    };
    // If your ShopApiService expects (id, qty) change this call accordingly.
    const data = await ShopApiService.addItemToCart(
      body.id,
      body.quantity,
      body.variation
    );
    console.log("Successfully Added, remaining item:", data.items.length);
    return data.items;
  };
  const removeItemFromCart = async (productId: number) => {
    let key;
    setItems((prevItems) => {
      key = prevItems.find((item) => item.id == productId)?.key;
      return prevItems;
    });
    const data = await ShopApiService.removeItemInCart(key as any);
    console.log("Successfully Removed, remaining item:", data.items.length);
    return data.items;
  };
  const updateItemInCart = async (key: string, quantity: number) => {
    const data = quantity
      ? await ShopApiService.updateItemInCart(key, quantity)
      : await ShopApiService.removeItemInCart(key);
    console.log("Successfully Updated, remaining item:", data.items.length);
    return data.items;
  };

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);
  const totalItems = items?.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items?.reduce(
    (sum, item) => sum + Number(item.prices.price) * item.quantity,
    0
  );
  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    loading,
  };
};
