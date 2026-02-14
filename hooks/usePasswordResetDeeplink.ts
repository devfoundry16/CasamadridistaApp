import { supabase } from "@/config/supabase";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Linking } from "react-native";

const PASSWORD_RESET_PATH = "auth/reset-password";

function parseFragment(fragment: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!fragment) return params;
  fragment.split("&").forEach((pair) => {
    const [key, value] = pair.split("=");
    if (key && value) {
      params[key] = decodeURIComponent(value.replace(/\+/g, " "));
    }
  });
  return params;
}

async function tryHandlePasswordResetUrl(url: string | null): Promise<boolean> {
  if (!url || !url.includes(PASSWORD_RESET_PATH)) return false;
  const hashIndex = url.indexOf("#");
  if (hashIndex === -1) return false;
  const fragment = url.slice(hashIndex + 1);
  const params = parseFragment(fragment);
  const { access_token, refresh_token, type } = params;
  if (type !== "recovery" || !access_token || !refresh_token) return false;
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return false;
  router.replace("/auth/reset-password");
  return true;
}

/**
 * Listens for password reset deeplink (e.g. from email link).
 * When the app opens with casamadridistaapp://auth/reset-password#access_token=...&refresh_token=...&type=recovery,
 * sets the Supabase session and navigates to the reset-password screen.
 */
export function usePasswordResetDeeplink() {
  const handled = useRef(false);

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || handled.current) return;
      const didHandle = await tryHandlePasswordResetUrl(url);
      if (didHandle) handled.current = true;
    };

    Linking.getInitialURL().then((url) => {
      handleUrl(url);
    });

    const sub = Linking.addEventListener("url", (e) => {
      handleUrl(e.url);
    });

    return () => sub.remove();
  }, []);
}
