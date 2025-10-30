import CartService from "@/services/Shop/CartService";
import { Product } from "@/types/product/product";
import createContextHook from "@nkzw/create-context-hook";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

export interface CartItem {
  id: number;
  name: string;
  quantity: number;
  key: string;
  images: {
    id: number;
    src: string;
    alt: string;
    date_created: Date;
    date_created_gmt: Date;
    date_modified: Date;
    date_modified_gmt: Date;
  }[];
  extensions: {
    subscriptions: {
      billing_period: string; // "year";
      billing_interval: number; //1;
      subscription_length: number; //0;
      trial_length: number; //0;
      trial_period: string; //"month";
      is_resubscribe: boolean; //false;
      switch_type: any; //null;
      synchronization: any; //null;
      sign_up_fees: string; //"0";
      sign_up_fees_tax: string; //"0";
    };
  };
  quantity_limits: { minimum: number; maximum: number; editable: boolean };
  prices: {
    price: string;
    regular_price: string;
    sale_price: string;
    currency_prefix: string;
  };
  variation: [
    {
      raw_attribute: string; // "attribute_pa_billing-period";
      attribute: string; //"Billing Period";
      value: string; //"Yearly";
    },
  ];
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

export const [CartProvider, useCart] = createContextHook(() => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getItemsInCart = useCallback(async () => {
    try {
      setLoading(true);
      const res = await CartService.getItemsInCart();
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
  const addToCart = useCallback((product: any) => {
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
    const data = await CartService.addItemToCart(
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
    const data = await CartService.removeItemInCart(key as any);
    console.log("Successfully Removed, remaining item:", data.items.length);
    return data.items;
  };
  const updateItemInCart = async (key: string, quantity: number) => {
    const data = quantity
      ? await CartService.updateItemInCart(key, quantity)
      : await CartService.removeItemInCart(key);
    console.log("Successfully Updated, remaining item:", data.items.length);
    return data.items;
  };

  const clearCart = useCallback(() => {
    CartService.removeAllItemsInCart();
    setItems([]);
  }, []);
  const totalItems = items?.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items?.reduce(
    (sum, item) => sum + Number(item.prices.price) * item.quantity,
    0
  );

  return useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      loading,
    }),
    [
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      loading,
    ]
  );
});
