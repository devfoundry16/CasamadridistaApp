import React, { useState } from "react";
import { View } from "react-native";
import WebView from "react-native-webview";
import { Spinner } from "@/components/Spinner";
import Colors from "@/constants/colors";
import SectionHeading from "./SectionHeading";
import ErrorState from "./ErrorState";

interface Props {
  html: string;
  /** Native heading rendered above the embed. */
  title: string;
  loadingLabel: string;
  errorLabel: string;
}

/**
 * Full-bleed frame for an api-sports widget.
 *
 * Deliberately NOT CustomWebView: that hard-codes `height: size`, which is
 * right for the four existing embeds inside ScrollViews but wrong here, where
 * the widget owns the whole tab viewport. flex:1 lets the WebView scroll itself
 * and sidesteps measurement entirely — the widget never reports its own height
 * (no postMessage / ResizeObserver anywhere in the bundle).
 *
 * The widget renders a fixed grey theme we cannot restyle, so rather than
 * pretend it's our surface we frame it with our own chrome: our heading above,
 * our loading and error states. The first thing the eye lands on is ours.
 */
export default function WidgetWebView({ html, title, loadingLabel, errorLabel }: Props) {
  const [reloadKey, setReloadKey] = useState(0);
  const [failed, setFailed] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.deepDark }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <SectionHeading title={title} />
      </View>

      {failed ? (
        <ErrorState
          title={errorLabel}
          onRetry={() => {
            setFailed(false);
            setReloadKey((k) => k + 1);
          }}
        />
      ) : (
        <View style={{ flex: 1, paddingTop: 8 }}>
          <WebView
            key={reloadKey}
            source={{ html }}
            style={{ flex: 1, backgroundColor: Colors.background.deepDark }}
            containerStyle={{ backgroundColor: Colors.background.deepDark }}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: Colors.background.deepDark,
                }}
              >
                <Spinner content={loadingLabel} />
              </View>
            )}
            originWhitelist={["*"]}
            // Android: cooperate with RN parents rather than swallowing drags.
            nestedScrollEnabled
            // Do NOT copy CustomWebView's scalesPageToFit={true} — it reintroduces
            // pinch/pan that competes with the pager's horizontal swipe.
            scalesPageToFit={false}
            setSupportMultipleWindows={false}
            onError={() => setFailed(true)}
            onHttpError={() => setFailed(true)}
          />
        </View>
      )}

    </View>
  );
}
