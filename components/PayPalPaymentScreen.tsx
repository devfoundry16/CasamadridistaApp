import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useOrder } from "@/hooks/useOrder";
import { OrderStatus } from "@/types/shop/order";
import axios from "axios";
import { development } from "@/config/environment";

interface PayPalConfig {
  clientId: string;
  baseUrl: string;
}

interface PayPalOrder {
  id: string;
  status: string;
}

interface PayPalApprovalData {
  orderID: string;
  payerID?: string;
}

interface PayPalErrorData {
  error: string;
  errorMessage: string;
}

export default function PayPalPaymentScreen(props: any) {
  const router = useRouter();
  const { orderId, amount, productType } = props;
  const { updateOrder, createSubscriptionOrder } = useOrder();

  const [loading, setLoading] = useState(true);
  const [orderCreated, setOrderCreated] = useState(false);
  const [paypalOrderId, setPaypalOrderId] = useState<string>("");
  const [approvalUrl, setApprovalUrl] = useState<string>("");
  const [isCapturing, setIsCapturing] = useState(false);

  const PAYPAL_CLIENT_ID = development.PAYPAL_CLIENT_ID || "";
  const BACKEND_API_URL = `${development.DEFAULT_BACKEND_API_URL}paypal` || "";

  // Create PayPal order on component mount
  useEffect(() => {
    createPayPalOrder();
  }, []);

  /**
   * Create a PayPal order with the specified amount and order details
   */
  const createPayPalOrder = async () => {
    try {
      setLoading(true);

      const orderAmount = Number(amount) || 0;

      console.log(
        "Creating PayPal order for amount:",
        orderAmount,
        productType,
        orderId
      );
      // Call your backend to create a PayPal order
      const response = await axios.post(`${BACKEND_API_URL}/create-order`, {
        amount: orderAmount,
        currency: "USD",
        orderDescription: `Order for ${productType}`,
        pendingOrderId: Number(orderId),
      });

      const { id, links } = response.data;

      if (!id) {
        throw new Error("Failed to create PayPal order");
      }

      setPaypalOrderId(id);

      // Find the approval link
      const approvalLink = links?.find((link: any) => link.rel === "approve");

      console.log("PayPal approval link:", approvalLink);

      if (approvalLink?.href) {
        setApprovalUrl(approvalLink.href);
        setOrderCreated(true);
      } else {
        throw new Error("No approval link found");
      }

      setLoading(false);
    } catch (error: any) {
      console.error("PayPal Order Creation Error:", error);
      setLoading(false);
      Alert.alert(
        "Payment Error",
        error.message || "Failed to create PayPal order. Please try again.",
        [
          {
            text: "Retry",
            onPress: createPayPalOrder,
          },
          {
            text: "Cancel",
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  /**
   * Handle PayPal approval by intercepting the return URL
   */
  const handlePayPalApproval = async (navState: any) => {
    try {
      const url = navState.url;

      // Check if this is the return URL with PayPal order ID and payer ID
      if (
        url.includes("paypal.com") ||
        url.includes("returnUrl") ||
        url.includes("orderID")
      ) {
        // Extract orderID and payerID from URL or callback data
        const orderIDMatch = url.match(/orderID=([^&]*)/);
        const payerIDMatch = url.match(/payerID=([^&]*)/);

        if (orderIDMatch) {
          const extractedOrderId = orderIDMatch[1];

          // Capture the PayPal payment
          await capturePayPalPayment(extractedOrderId, payerIDMatch?.[1]);
          return false; // Stop loading the page
        }
      }

      return true; // Continue loading
    } catch (error) {
      console.error("Error handling PayPal approval:", error);
      return true;
    }
  };

  /**
   * Capture the approved PayPal payment
   */
  const capturePayPalPayment = async (
    paypalOrderId: string,
    payerId?: string
  ) => {
    try {
      setIsCapturing(true);

      // Call your backend to capture the payment
      const response = await axios.post(`${BACKEND_API_URL}/capture-order`, {
        orderID: paypalOrderId,
        payerID: payerId,
        pendingOrderId: Number(orderId),
      });

      const { status } = response.data;

      if (status === "COMPLETED") {
        // Update the order with PayPal payment details
        await updateOrder(Number(orderId), {
          payment_method: "paypal",
          payment_method_title: "PayPal",
          set_paid: true,
          status: OrderStatus.PROCESSING,
          meta_data: [
            {
              key: "_paypal_order_id",
              value: paypalOrderId,
            },
            {
              key: "_paypal_payer_id",
              value: payerId || "N/A",
            },
          ],
        });

        // If this is a subscription product, create the subscription
        if (productType === "subscription") {
          await createSubscriptionOrder(Number(orderId));
        }

        setIsCapturing(false);

        Alert.alert(
          "Payment Successful",
          "Your PayPal payment has been processed successfully!",
          [
            {
              text: "Continue",
              onPress: () => {
                router.push("/cart");
              },
            },
          ]
        );
      } else {
        throw new Error(`Payment not completed. Status: ${status}`);
      }
    } catch (error: any) {
      setIsCapturing(false);
      console.error("PayPal Capture Error:", error);

      Alert.alert(
        "Payment Capture Failed",
        error.response?.data?.message ||
          error.message ||
          "Failed to capture PayPal payment. Please try again.",
        [
          {
            text: "Retry",
            onPress: () => createPayPalOrder(),
          },
          {
            text: "Cancel",
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PayPal Payment</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.darkGold} />
          <Text style={styles.loadingText}>Preparing PayPal payment...</Text>
        </View>
      </View>
    );
  }

  if (isCapturing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.backButton} />
          <Text style={styles.headerTitle}>Processing Payment</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.darkGold} />
          <Text style={styles.loadingText}>Capturing your payment...</Text>
        </View>
      </View>
    );
  }

  if (!orderCreated || !approvalUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>PayPal Payment</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.errorContainer}
          contentContainerStyle={styles.errorContent}
        >
          <Text style={styles.errorTitle}>Unable to Initialize Payment</Text>
          <Text style={styles.errorText}>
            We could not set up your PayPal payment. Please try again.
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={createPayPalOrder}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PayPal Payment</Text>
        <View style={styles.backButton} />
      </View>

      <WebView
        source={{ uri: approvalUrl }}
        onNavigationStateChange={handlePayPalApproval}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.webviewLoading}>
            <ActivityIndicator size="large" color={Colors.darkGold} />
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("WebView error:", nativeEvent);
          Alert.alert(
            "Loading Error",
            "Failed to load PayPal payment page. Please try again.",
            [
              {
                text: "Retry",
                onPress: createPayPalOrder,
              },
              {
                text: "Cancel",
                onPress: () => router.back(),
              },
            ]
          );
        }}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  webview: {
    flex: 1,
    height: 500,
  },
  webviewLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.cardBg,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.deepDarkGray,
  },
  errorContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: Colors.darkGold,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
    alignItems: "center",
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.darkBg,
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 200,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textPrimary,
  },
});
