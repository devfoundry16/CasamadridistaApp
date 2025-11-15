import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { WebView } from "react-native-webview";
import { development } from "@/config/environment";
import axios from "axios";

const PayPalPaymentScreen = () => {
  const [isWebViewLoading, SetIsWebViewLoading] = useState(false);
  const [paypalUrl, setPaypalUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [shouldShowWebViewLoading, setShouldShowWebviewLoading] =
    useState(true);
  const buyBook = async () => {
    const dataDetail = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      transactions: [
        {
          amount: {
            currency: "USD",
            total: "26",
            details: {
              shipping: "6",
              subtotal: "20",
              shipping_discount: "0",
              insurance: "0",
              handling_fee: "0",
              tax: "0",
            },
          },
        },
      ],
      redirect_urls: {
        return_url: "https://example.com",
        cancel_url: "https://example.com",
      },
    };

    const url = `https://api-m.sandbox.paypal.com/v1/oauth2/token`;

    const data = "grant_type=client_credentials";

    const auth = {
      username: development.PAYPAL_CLIENT_ID, //"your_paypal-app-client-ID",
      password: development.PAYPAL_CLIENT_SECRET, //"your-paypal-app-secret-ID
    };

    const token = btoa(`${auth.username}:${auth.password}`);
    // Authorise with seller app information (clientId and secret key)
    axios
      .post(url, data, {
        headers: {
          Authorization: `Basic ${token}`,
        },
      })
      .then((response) => {
        setAccessToken(response.data.access_token);

        //Resquest payal payment (It will load login page payment detail on the way)
        axios
          .post(
            `https://api-m.sandbox.paypal.com/v1/payments/payment`,
            JSON.stringify(dataDetail),
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${response.data.access_token}`,
              },
            }
          )
          .then((response) => {
            const { id, links } = response.data;
            const approvalUrl = links.find(
              (data: any) => data.rel === "approval_url"
            ).href;
            console.log("response", approvalUrl);
            setPaypalUrl(approvalUrl);
          })
          .catch((err) => {
            console.log({ ...err });
          });
      })
      .catch((err) => {
        console.log(err);
      });
  };

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
          `https://api-m.sandbox.paypal.com/v1/payments/payment/${paymentId}/execute`,
          { payer_id: PayerID },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
        .then((response) => {
          //setShouldShowWebviewLoading(true);
        })
        .catch((err) => {
          setShouldShowWebviewLoading(true);
          console.log("error:", { ...err });
        });
    }
  };

  return (
    <React.Fragment>
      <View style={styles.container}>
        <Text>Paypal in React Native</Text>
        <TouchableOpacity
          activeOpacity={0.5}
          onPress={buyBook}
          style={styles.btn}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "400",
              textAlign: "center",
              color: "#ffffff",
            }}
          >
            BUY NOW
          </Text>
        </TouchableOpacity>
      </View>
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
    </React.Fragment>
  );
};

export default PayPalPaymentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    height: 500,
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
});
