import { Spinner } from "@/components/Spinner";
import Colors from "@/constants/colors";
import { useCart } from "@/hooks/useCart";
import { OrderService } from "@/services/Shop/OrderService";
import { useRouter } from "expo-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react-native";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeFromCart, totalPrice, loading } =
    useCart();
  if (loading) {
    return <Spinner content="Loading cart" />;
  }
  const handleCheckout = () => {
    //create an order
    const line_items = items.map((item) => {
      return {
        productId: item.id,
      };
    });
    OrderService.createOrder(line_items).then((data) => {
      console.log(
        "order key:",
        data.order_key,
        "status: ",
        data.status,
        "customer_id:",
        data.customer_id
      );
      router.push("/checkout");
    });
  };

  if (items && items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ShoppingBag size={80} color={Colors.darkGold} strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>
          Add some luxury items to get started
        </Text>
        <TouchableOpacity
          style={styles.shopButton}
          onPress={() => router.push("/shop" as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.shopButtonText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderCartItem = ({ item }: { item: (typeof items)[0] }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.images[0].src }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.variation.map((val, idx) => {
          return (
            <Text key={idx} style={styles.itemVariation} numberOfLines={2}>
              {val.attribute}: {val.value}
            </Text>
          );
        })}
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          {item.prices.regular_price !== item.prices.price && (
            <Text style={styles.itemRegularPrice}>
              ${(Number(item.prices.regular_price) / 100).toFixed(2)}
            </Text>
          )}
          <Text style={styles.itemPrice}>
            ${(Number(item.prices.price) / 100).toFixed(2)}
          </Text>
        </View>
        <View style={styles.quantityContainer}>
          {item.quantity_limits.editable && (
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.key, item.quantity - 1)}
              activeOpacity={0.7}
            >
              <Minus size={16} color={Colors.darkGold} />
            </TouchableOpacity>
          )}
          <Text style={styles.quantityText}>{item.quantity}</Text>
          {item.quantity_limits.editable && (
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.key, item.quantity + 1)}
              activeOpacity={0.7}
            >
              <Plus size={16} color={Colors.darkGold} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => removeFromCart(item.id)}
        activeOpacity={0.7}
      >
        <Trash2 size={20} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>
            ${(Number(totalPrice) / 100).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.textWhite,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
  },
  shopButton: {
    backgroundColor: Colors.darkGold,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.deepDarkGray,
  },
  listContent: {
    padding: 16,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textWhite,
    marginBottom: 4,
  },
  itemVariation: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textLight,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.darkGold,
    marginBottom: 8,
  },
  itemRegularPrice: {
    fontSize: 14,
    textDecorationLine: "line-through",
    fontWeight: "600" as const,
    color: Colors.textWhite,
    marginBottom: 8,
    marginRight: 4,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textWhite,
    minWidth: 24,
    textAlign: "center",
  },
  deleteButton: {
    padding: 8,
  },
  footer: {
    backgroundColor: Colors.deepDarkGray,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.textWhite,
  },
  totalPrice: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.darkGold,
  },
  checkoutButton: {
    backgroundColor: Colors.darkGold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.textWhite,
  },
});
