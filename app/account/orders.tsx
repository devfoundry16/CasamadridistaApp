import HeaderStack from "@/components/HeaderStack";
import { Spinner } from "@/components/Spinner";
import Colors from "@/constants/colors";
import { useOrder } from "@/hooks/useOrder";
import { useUser } from "@/hooks/useUser";
import { useCart } from "@/hooks/useCart";
import { Order, OrderStatus } from "@/types/shop/order";
import { getProductType } from "@/utils/helper";
import { router } from "expo-router";
import { Alert } from "react-native";
import {
  CheckCircle,
  Clock,
  Package,
  ShoppingBag,
  XCircle,
} from "lucide-react-native";
import React, { useCallback, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
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
        return <CheckCircle size={20} color={Colors.success} />;
      case OrderStatus.PENDING:
        return <Clock size={20} color={Colors.accent} />;
      case OrderStatus.CANCELLED:
        return <XCircle size={20} color={Colors.error} />;
      default:
        return <Clock size={20} color={Colors.royalBlue} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case OrderStatus.PROCESSING:
        return Colors.success;
      case OrderStatus.PENDING:
        return Colors.accent;
      case OrderStatus.CANCELLED:
        return Colors.error;
      default:
        return Colors.royalBlue;
    }
  };

  const handleProcessPayment = (order: Order) => {
    console.log(order.line_items);
    const productType = getProductType(order.line_items);
    console.log(productType);
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
      <View style={styles.spinnerContainer}>
        <HeaderStack title="Orders" />
        <Spinner content="Loading orders" />
      </View>
    );
  }

  return (
    <>
      <HeaderStack title="Orders" />
      <ScrollView style={styles.container}>
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <ShoppingBag size={64} color={Colors.darkGray} />
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>
              Your order history will appear here once you make a purchase
            </Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderIconContainer}>
                    <Package size={24} color={getStatusColor(order.status)} />
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderId}>Order #{order.id}</Text>
                    <Text style={styles.orderDate}>{order.created_at}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(order.status) + "20" },
                    ]}
                  >
                    {getStatusIcon(order.status)}
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(order.status) },
                      ]}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderBody}>
                  <Text style={styles.itemsLabel}>Items:</Text>
                  {order.line_items.map((item, index) => (
                    <Text key={index} style={styles.itemText}>
                      • {item.name}
                    </Text>
                  ))}
                </View>
                <View style={styles.orderFooter}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text
                    style={{
                      ...styles.totalAmount,
                      color: getStatusColor(order.status),
                    }}
                  >
                    ${Number(order.total).toFixed(2)}
                  </Text>
                </View>
                {order.status === OrderStatus.PENDING && (
                  <View style={{ gap: 10 }}>
                    <TouchableOpacity
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusColor(order.status) + "20",
                          justifyContent: "center",
                        },
                      ]}
                      onPress={() => handleProcessPayment(order)}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(order.status) },
                        ]}
                      >
                        Process Payment
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: Colors.lightGray + "20",
                          justifyContent: "center",
                        },
                      ]}
                      onPress={() => cancelOrder(order)}
                    >
                      <Text
                        style={[styles.statusText, { color: Colors.lightGray }]}
                      >
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2A2A2A",
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.deepDarkGray,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 48,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#CCCCCC",
    textAlign: "center",
  },
  ordersList: {
    padding: 24,
  },
  orderCard: {
    backgroundColor: "#3A3A3A",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#4A4A4A",
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#4A4A4A",
  },
  orderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: "#CCCCCC",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600" as const,
    textTransform: "capitalize" as const,
  },
  orderBody: {
    marginBottom: 16,
  },
  itemsLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textWhite,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 14,
    color: "#CCCCCC",
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#4A4A4A",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textWhite,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.accent,
  },
});
