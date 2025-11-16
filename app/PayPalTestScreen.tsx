import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { development } from "@/config/environment";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import HeaderStack from "@/components/HeaderStack";
import { Spinner } from "@/components/Spinner";
import Colors from "@/constants/colors";

const PayPalPaymentScreen = () => {
  const router = useRouter();
  const { amount, orderId } = useLocalSearchParams();
  const [isWebViewLoading, SetIsWebViewLoading] = useState(false);
  const [paypalUrl, setPaypalUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [shouldShowWebViewLoading, setShouldShowWebviewLoading] =
    useState(true);
  const apiBaseUrl =
    development.PAYPAL_MODE === "sandbox"
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";

  const getAccessToken = async () => {
    try {
      const response = await axios.post(
        `${apiBaseUrl}/v1/oauth2/token`,
        "grant_type=client_credentials",
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          auth: {
            username: development.PAYPAL_CLIENT_ID || "",
            password: development.PAYPAL_CLIENT_SECRET || "",
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error("Error fetching PayPal access token:", error);
      throw error;
    }
  };
  const putPayload = async () => {
    const dataDetail = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      transactions: [
        {
          amount: {
            currency: "USD",
            total: amount,
          },
        },
      ],
      redirect_urls: {
        return_url: "https://example.com",
        cancel_url: "https://example.com",
      },
    };

    try {
      const token = await getAccessToken();
      setAccessToken(token);
      //Resquest payal payment (It will load login page payment detail on the way)
      axios
        .post(`${apiBaseUrl}/v1/payments/payment`, JSON.stringify(dataDetail), {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          const { links } = response.data;
          const approvalUrl = links.find(
            (data: any) => data.rel === "approval_url"
          ).href;
          console.log("response", approvalUrl);
          setPaypalUrl(approvalUrl);
        })
        .catch((err) => {
          console.log({ ...err });
        });
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    putPayload();
  }, []);

  /*---End Paypal checkout section---*/

  const onWebviewLoadStart = () => {
    // if (shouldShowWebViewLoading) {
    //   SetIsWebViewLoading(true);
    // }
  };

  const _onNavigationStateChange = (webViewState: any) => {
    console.log("webViewState", webViewState);

    //When the webViewState.title is empty this mean it's in process loading the first paypal page so there is no paypal's loading icon
    //We show our loading icon then. After that we don't want to show our icon we need to set setShouldShowWebviewLoading to limit it

    if (webViewState.url.includes("https://example.com/")) {
      //   setPaypalUrl("");
      const paymentIDMatch = webViewState.url.match(/paymentId=([^&]*)/);
      const payerIDMatch = webViewState.url.match(/PayerID=([^&]*)/);
      let paymentId = "";
      let PayerID = "";
      if (paymentIDMatch && payerIDMatch) {
        paymentId = paymentIDMatch[1];
        PayerID = payerIDMatch[1];
        console.log("paymentId", paymentId);
        console.log("PayerID", PayerID);
      }

      axios
        .post(
          `${apiBaseUrl}/v1/payments/payment/${paymentId}/execute`,
          { payer_id: PayerID },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
        .then((response) => {
          console.log("*");
          router.navigate(
            `/checkout?payment_status=success&pendingOrderId=${orderId}`
          );
          //setShouldShowWebviewLoading(true);
        })
        .catch((err) => {
          setShouldShowWebviewLoading(true);
          console.log("error:", { ...err });
        });
    }
  };

  if (isWebViewLoading) {
    return (
      <View style={styles.spinnerContainer}>
        <HeaderStack title="Checkout" />
        <Spinner content="Loading" />
      </View>
    );
  }

  return (
    <>
      <HeaderStack title="PayPal Payment" />
      {paypalUrl ? (
        <View style={styles.webview}>
          <WebView
            source={{ uri: paypalUrl }}
            onNavigationStateChange={_onNavigationStateChange}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            onLoadStart={onWebviewLoadStart}
            onLoadEnd={() => SetIsWebViewLoading(false)}
          />
        </View>
      ) : null}
      {isWebViewLoading ? (
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#ffffff",
          }}
        >
          <ActivityIndicator size="small" color="#A02AE0" />
        </View>
      ) : null}
    </>
  );
};

export default PayPalPaymentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    height: "100%",
    width: "100%",
  },
  btn: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: "#61E786",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
  },
  spinnerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.deepDarkGray,
  },
});
