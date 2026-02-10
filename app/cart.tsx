import { Spinner } from "@/components/Spinner";
import { useCart } from "@/hooks/useCart";
import { CHECKOUT_PRODUCT_TYPE } from "@/types/shop/checkout";
import { useRouter } from "expo-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react-native";
import {
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, totalPrice, loading } =
    useCart();
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-medium">
        <Spinner content="Processing cart" />
      </View>
    );
  }

  if (items && items.length === 0) {
    return (
      <View className="flex-1 bg-bg-medium">
        <View className="flex-1 bg-bg-medium items-center justify-center p-6">
          <ShoppingBag size={80} color="#BC9045" strokeWidth={1.5} />
          <Text className="text-2xl font-bold text-white mt-6 mb-2">Your cart is empty</Text>
          <Text className="text-base text-text-secondary text-center mb-8">
            Add some luxury items to get started
          </Text>
          <TouchableOpacity
            className="bg-rm-gold px-8 py-4 rounded-xl"
            onPress={() => router.push("/shop" as any)}
            activeOpacity={0.8}
          >
            <Text className="text-base font-semibold text-white">Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderCartItem = ({ item }: { item: (typeof items)[0] }) => (
    <View className="flex-row bg-bg-card rounded-xl p-3 mb-3 border border-border-default">
      <Image
        source={{ uri: item.images[0].src }}
        style={{ width: 80, height: 80, borderRadius: 8 }}
        className="bg-border-default"
      />
      <View className="flex-1 ml-3 justify-between">
        <Text className="text-base font-semibold text-white mb-1" numberOfLines={2}>
          {item.name}
        </Text>
        {item.variation.map((val, idx) => {
          return (
            <Text key={idx} className="text-xs font-semibold text-text-muted mb-1" numberOfLines={2}>
              {val.attribute}: {val.value}
            </Text>
          );
        })}
        <View className="flex-1 flex-row items-center">
          {item.prices.regular_price !== item.prices.price && (
            <Text className="text-sm line-through font-semibold text-white mb-2 mr-1">
              ${(Number(item.prices.regular_price) / 100).toFixed(2)}
            </Text>
          )}
          <Text className="text-lg font-bold text-rm-gold mb-2">
            ${(Number(item.prices.price) / 100).toFixed(2)}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          {item.quantity_limits.editable && (
            <TouchableOpacity
              className="w-7 h-7 rounded-md bg-border-default items-center justify-center"
              onPress={() => updateQuantity(item.key, item.quantity - 1)}
              activeOpacity={0.7}
            >
              <Minus size={16} color="#BC9045" />
            </TouchableOpacity>
          )}
          <Text className="text-base font-semibold text-white min-w-6 text-center">{item.quantity}</Text>
          {item.quantity_limits.editable && (
            <TouchableOpacity
              className="w-7 h-7 rounded-md bg-border-default items-center justify-center"
              onPress={() => updateQuantity(item.key, item.quantity + 1)}
              activeOpacity={0.7}
            >
              <Plus size={16} color="#BC9045" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <TouchableOpacity
        className="p-2"
        onPress={() => removeFromCart(item.id)}
        activeOpacity={0.7}
      >
        <Trash2 size={20} color="#A0A0A0" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-bg-medium">
      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />
      <View className="bg-bg-medium p-4 border-t border-border-default">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-semibold text-white">Total</Text>
          <Text className="text-[28px] font-bold text-rm-gold">
            ${(Number(totalPrice) / 100).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-rm-gold py-4 rounded-xl items-center"
          onPress={() =>
            router.push(
              `/checkout?productType=${CHECKOUT_PRODUCT_TYPE.STANDARD}` as any
            )
          }
          activeOpacity={0.8}
        >
          <Text className="text-lg font-semibold text-white">Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
