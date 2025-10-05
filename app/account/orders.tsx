import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import { ShoppingBag, Package, CheckCircle, XCircle, Clock } from 'lucide-react-native';

export default function OrdersScreen() {
  const { orders } = useAuth();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} color={Colors.success} />;
      case 'cancelled':
        return <XCircle size={20} color={Colors.error} />;
      default:
        return <Clock size={20} color={Colors.accent} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return Colors.success;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.accent;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Orders',
          headerStyle: { backgroundColor: Colors.secondary },
          headerTintColor: Colors.textWhite,
        }}
      />
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
              <TouchableOpacity key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderIconContainer}>
                    <Package size={24} color={Colors.accent} />
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderId}>Order #{order.id}</Text>
                    <Text style={styles.orderDate}>{order.date}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                    {getStatusIcon(order.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.orderBody}>
                  <Text style={styles.itemsLabel}>Items:</Text>
                  {order.items.map((item, index) => (
                    <Text key={index} style={styles.itemText}>
                      • {item}
                    </Text>
                  ))}
                </View>
                <View style={styles.orderFooter}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalAmount}>${order.total.toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
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
    backgroundColor: '#2A2A2A',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.textWhite,
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  ordersList: {
    padding: 24,
  },
  orderCard: {
    backgroundColor: '#3A3A3A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4A4A4A',
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#4A4A4A',
  },
  orderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textWhite,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  orderBody: {
    marginBottom: 16,
  },
  itemsLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textWhite,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#4A4A4A',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textWhite,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
});
