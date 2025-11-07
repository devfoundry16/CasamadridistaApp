import { useState } from "react";
import { useCart } from "./useCart";
import { BRAINTREE_API_URL } from "@env"; // Assume you have this in your .env file, e.g., BRAINTREE_API_URL=https://your-server.com/braintree
export const useBraintreePay = () => {
  const { totalPrice } = useCart();
  const [paypalHtml, setPaypalHtml] = useState<string>("");
  const handlePayment = async (orderId: number, walletAmount: number = 0) => {
    try {
      const amount = (walletAmount || totalPrice / 100).toFixed(2);
      // Fetch Braintree client token from your server
      const tokenResponse = await fetch(`${BRAINTREE_API_URL}/client_token`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const clientToken = await tokenResponse.text(); // Braintree client token is typically a string
      if (!clientToken) {
        throw new Error("Failed to retrieve client token");
      }
      // Generate HTML for WebView with Braintree and PayPal SDKs
      const html = `
        
        
        
            <meta charset="utf-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1">
        
        
            
            <script src="https://js.braintreegateway.com/web/3.100.0/js/client.min.js"></script>
            <script src="https://js.braintreegateway.com/web/3.100.0/js/paypal-checkout.min.js"></script>
            <script src="https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_SANDBOX_CLIENT_ID¤cy=USD&intent=capture&enable-funding=paypal"></script>
            <script>
                braintree.client.create({
                    authorization: '${clientToken}'
                }, function(clientErr, clientInstance) {
                    if (clientErr) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: clientErr.message }));
                        return;
                    }
                    braintree.paypalCheckout.create({
                        client: clientInstance
                    }, function (createErr, paypalCheckoutInstance) {
                        if (createErr) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: createErr.message }));
                            return;
                        }
                        paypal.Buttons({
                            fundingSource: paypal.FUNDING.PAYPAL,
                            style: {
                                label: 'pay',
                                color: 'gold',
                                shape: 'pill'
                            },
                            createOrder: function () {
                                return paypalCheckoutInstance.createPayment({
                                    flow: 'checkout',
                                    amount: '${amount}',
                                    currency: 'USD',
                                    intent: 'capture'
                                });
                            },
                            onApprove: function (data, actions) {
                                return paypalCheckoutInstance.tokenizePayment(data, function (tokenizeErr, payload) {
                                    if (tokenizeErr) {
                                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: tokenizeErr.message }));
                                    } else {
                                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', nonce: payload.nonce }));
                                    }
                                });
                            },
                            onCancel: function (data) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'cancel' }));
                            },
                            onError: function (err) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: err.message }));
                            }
                        }).render('#paypal-button');
                    });
                });
            </script>
        
        
      `;
      setPaypalHtml(html);
    } catch (error) {
      console.error("Braintree Payment Error:", error);
      Alert.alert("Error", "Failed to initialize payment.");
    }
  };
  return { handlePayment, paypalHtml, setPaypalHtml };
};
