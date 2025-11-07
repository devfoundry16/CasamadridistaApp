import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { WebView } from "react-native-webview";
import axios from "axios";

const PayPalPaymentScreen = () => {
  const [isWebViewLoading, SetIsWebViewLoading] = useState(false);
  const [paypalUrl, setPaypalUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  //When loading paypal page it refirects lots of times. This prop to control start loading only first time
  const [shouldShowWebViewLoading, setShouldShowWebviewLoading] =
    useState(true);

  /*---Paypal checkout section---*/
  const buyBook = async () => {
    //Check out https://developer.paypal.com/docs/integration/direct/payments/paypal-payments/# for more detail paypal checkout
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

    const url = `https://api.sandbox.paypal.com/v1/oauth2/token`;

    const data = "grant_type=client_credentials";

    const auth = {
      username:
        "AapxI4eDA_IYOkdxLaucbB_niz7HFRWa75EWSmNqdF4ncue96ai9kvs9-t3l1BwtuvgCLf0UqdEoKyaw", //"your_paypal-app-client-ID",
      password:
        "EBY9B2Tktx_NssrKdYnghJ5J9GSCUo5Y4HRq5fIv_GonVm4P6_gRroyetwxTCqYPsfkOGgaC12yMboR_", //"your-paypal-app-secret-ID
    };

    // const token = btoa(`${auth.username}:${auth.password}`);
    const token =
      "A21AALYThv4lbvRXFh3wgILA8Qi1j1uUG6RSsW0QBK3xKxDRxgLFjtSdKOHlnf-hc1zRZfSqZF1Cz2rMC1Xd5sW01ZOTlfaCA";
    // Authorise with seller app information (clientId and secret key)
    axios
      .post(url, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setAccessToken(response.data.access_token);

        //Resquest payal payment (It will load login page payment detail on the way)
        axios
          .post(
            `https://api.sandbox.paypal.com/v1/payments/payment`,
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
      const { PayerID, paymentId } = webViewState.url;

      console.log(paymentId, PayerID);

      axios
        .post(
          `https://api.sandbox.paypal.com/v1/payments/payment/${paymentId}/execute`,
          { payer_id: PayerID },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
        .then((response) => {
          setShouldShowWebviewLoading(true);
          console.log("execute:", response);
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
