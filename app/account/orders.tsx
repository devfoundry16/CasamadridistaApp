import { Spinner } from "@/components/Spinner";
import { useOrder } from "@/hooks/useOrder";
import { useUser } from "@/hooks/useUser";
import { useCart } from "@/hooks/useCart";
import { Order, OrderStatus } from "@/types/shop/order";
import { getProductType } from "@/utils/helper";
import { router } from "expo-router";
import {
  CheckCircle,
  Clock,
  Package,
  ShoppingBag,
  XCircle,
} from "lucide-react-native";
import React, { useCallback, useEffect } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OrdersScreen() {
  const { user } = useUser();
  const { getOrders, updateOrder } = useOrder();
  const { removeFromCart } = useCart();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getOrders(user?.id as any);
      setOrders(res);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      Alert.alert("Error", error.message);
    }
  }, [getOrders, user?.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case OrderStatus.PROCESSING:
        return <CheckCircle size={20} color="#10B981" />;
      case OrderStatus.PENDING:
        return <Clock size={20} color="#BC9045" />;
      case OrderStatus.CANCELLED:
        return <XCircle size={20} color="#EF4444" />;
      default:
        return <Clock size={20} color="#0033A0" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case OrderStatus.PROCESSING:
        return "#10B981";
      case OrderStatus.PENDING:
        return "#BC9045";
      case OrderStatus.CANCELLED:
        return "#EF4444";
      default:
        return "#0033A0";
    }
  };

  const handleProcessPayment = (order: Order) => {
    const productType = getProductType(order.line_items);
    router.push(
      `/checkout?pendingOrderId=${order.id}&productType=${productType}`
    );
  };

  const cancelOrder = async (order: Order) => {
    try {
      // Update order status to cancelled
      await updateOrder(order.id, {
        status: OrderStatus.CANCELLED,
      });

      // Remove any matching line items from cart
      const productIds = order.line_items.map((item) => item.product_id);
      for (const productId of productIds) {
        await removeFromCart(productId);
      }

      // Refresh orders list
      await loadOrders();

      Alert.alert(
        "Order Cancelled",
        "Your order has been cancelled successfully"
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "There was a problem cancelling your order"
      );
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-medium">
        <Spinner content="Loading orders" />
      </View>
    );
  }

  return (
    <>
      <ScrollView className="flex-1 bg-bg-medium">
        {orders.length === 0 ? (
          <View className="flex-1 items-center justify-center p-12 mt-24">
            <ShoppingBag size={64} color="#515151" />
            <Text className="text-2xl font-bold text-white mt-6 mb-2">No orders yet</Text>
            <Text className="text-base text-text-secondary text-center">
              Your order history will appear here once you make a purchase
            </Text>
          </View>
        ) : (
          <View className="p-6">
            {orders.map((order) => (
              <View key={order.id} className="bg-bg-light rounded-2xl p-5 mb-4 border border-border-light">
                <View className="flex-row items-center mb-4 pb-4 border-b border-border-light">
                  <View className="w-12 h-12 rounded-[24px] bg-bg-medium justify-center items-center mr-3">
                    <Package size={24} color={getStatusColor(order.status)} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-white mb-1">Order #{order.id}</Text>
                    <Text className="text-sm text-text-secondary">{order.created_at}</Text>
                  </View>
                  <View
                    className="flex-row items-center px-3 py-1.5 rounded-xl gap-1.5"
                    style={{ backgroundColor: getStatusColor(order.status) + "20" }}
                  >
                    {getStatusIcon(order.status)}
                    <Text
                      className="text-xs font-semibold capitalize"
                      style={{ color: getStatusColor(order.status) }}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-white mb-2">Items:</Text>
                  {order.line_items.map((item, index) => (
                    <Text key={index} className="text-sm text-text-secondary mb-1">
                      • {item.name}
                    </Text>
                  ))}
                </View>
                <View className="flex-row justify-between items-center pt-4 border-t border-border-light">
                  <Text className="text-base font-semibold text-white">Total:</Text>
                  <Text
                    className="text-2xl font-bold"
                    style={{ color: getStatusColor(order.status) }}
                  >
                    ${Number(order.total).toFixed(2)}
                  </Text>
                </View>
                {order.status === OrderStatus.PENDING && (
                  <View className="gap-2.5 mt-3">
                    <TouchableOpacity
                      className="flex-row items-center justify-center px-3 py-1.5 rounded-xl bg-bg-light"
                      onPress={() => handleProcessPayment(order)}
                    >
                      <Text className="text-xs font-semibold text-text-tertiary">
                        Process Payment
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-row items-center justify-center px-3 py-1.5 rounded-xl bg-bg-light"
                      onPress={() => cancelOrder(order)}
                    >
                      <Text className="text-xs font-semibold text-text-tertiary">
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}
