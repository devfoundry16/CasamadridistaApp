import { OrderService } from "@/services/Shop/OrderService";
import { Order } from "@/types/shop/order";
import { useCallback } from "react";

export const useOrder = () => {
  const addOrder = useCallback(async (order: Partial<Order>) => {
    return OrderService.createOrder(order);
  }, []);

  const getOrderById = useCallback(async (id: number) => {
    return OrderService.getOrderById(id);
  }, []);

  const getOrders = useCallback(async (customer_id: number) => {
    return OrderService.getOrders(customer_id);
  }, []);

  const createSubscriptionOrder = useCallback(async (order_id: number) => {
    return OrderService.createSubscriptionOrder(order_id);
  }, []);

  const updateSubscription = useCallback(
    async (subscriptionId: number, data: any) => {
      return OrderService.updateSubscription(subscriptionId, data);
    },
    []
  );

  const getSubscriptionOrders = useCallback(async (customer_id: number) => {
    return OrderService.getSubscriptionOrders(customer_id);
  }, []);

  const updateOrder = useCallback(
    async (orderId: number, data: Partial<Order>) => {
      return OrderService.updateOrder(orderId, data);
    },
    []
  );
  return {
    addOrder,
    getOrderById,
    getOrders,
    createSubscriptionOrder,
    getSubscriptionOrders,
    updateOrder,
    updateSubscription,
  };
};
