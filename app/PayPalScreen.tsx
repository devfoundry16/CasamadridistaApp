import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { development } from "@/config/environment";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Spinner } from "@/components/Spinner";

const PayPalPaymentScreen = () => {
  const router = useRouter();
  const { amount, orderId, productType } = useLocalSearchParams();
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
      Alert.alert("Error", "Failed to get PayPal access token");
      throw error;
    }
  };
  const putPayload = async () => {
    SetIsWebViewLoading(true);
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
          SetIsWebViewLoading(false);
          setPaypalUrl(approvalUrl);
        })
        .catch((err) => {
          Alert.alert("Error", "Failed to initiate PayPal payment");
          SetIsWebViewLoading(false);
        });
    } catch (err) {
      Alert.alert("Error", "Failed to initiate PayPal payment");
      SetIsWebViewLoading(false);
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
    //When the webViewState.title is empty this mean it's in process loading the first paypal page so there is no paypal's loading icon
    //We show our loading icon then. After that we don't want to show our icon we need to set setShouldShowWebviewLoading to limit it

    if (
      webViewState.url.includes("https://example.com/") &&
      webViewState.title !== ""
    ) {
      //   setPaypalUrl("");
      const paymentIDMatch = webViewState.url.match(/paymentId=([^&]*)/);
      const payerIDMatch = webViewState.url.match(/PayerID=([^&]*)/);
      let paymentId = "";
      let PayerID = "";
      if (paymentIDMatch && payerIDMatch) {
        paymentId = paymentIDMatch[1];
        PayerID = payerIDMatch[1];
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
          if (productType === "donation") {
            router.replace(
              `/campaign/${orderId}?payment_status=success&productType=${productType}&amount=${amount}`
            );
          } else {
            router.replace(
              `/checkout?payment_status=success&pendingOrderId=${orderId}&productType=${productType}&amount=${amount}`
            );
          }
          //setShouldShowWebviewLoading(true);
        })
        .catch((err) => {
          setShouldShowWebviewLoading(true);
        });
    }
  };

  if (isWebViewLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-bg-medium">
        <Spinner content="Loading" />
      </View>
    );
  }

  return (
    <>
      {paypalUrl ? (
        <View className="h-full w-full">
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
    </>
  );
};

export default PayPalPaymentScreen;
