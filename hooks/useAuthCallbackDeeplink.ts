import { API_BASE_URL, supabase } from "@/config/supabase";
import AuthService, { type User } from "@/services/AuthService";
import { setUser } from "@/store/slices/userSlice";
import { store } from "@/store/store";
import axios from "axios";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Linking } from "react-native";

const AUTH_CALLBACK_PATH = "auth/callback";

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

function userFromSession(session: { user: any; access_token: string; refresh_token?: string }): User {
  const u = session.user;
  const meta = u?.user_metadata || {};
  const fullName = meta.full_name || meta.name || "";
  const parts = fullName.trim().split(/\s+/);
  const first_name = meta.given_name || parts[0] || undefined;
  const last_name = meta.family_name || (parts.length > 1 ? parts.slice(1).join(" ") : undefined) || undefined;
  const profile = {
    id: u.id,
    email: u.email ?? "",
    first_name,
    last_name,
    avatar_url: meta.avatar_url || meta.picture,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return {
    id: u.id,
    email: u.email ?? "",
    profile,
  };
}

async function tryHandleAuthCallbackUrl(url: string | null): Promise<boolean> {
  if (!url || !url.includes(AUTH_CALLBACK_PATH) || !url.includes("#")) return false;
  const hashIndex = url.indexOf("#");
  const fragment = url.slice(hashIndex + 1);
  const params = parseFragment(fragment);
  const { access_token, refresh_token } = params;
  if (!access_token || !refresh_token) return false;

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (sessionError) throw new Error(sessionError.message);
  const session = sessionData.session;
  if (!session) throw new Error("No session");

  let user: User;
  try {
    const response = await axios.get(`${API_BASE_URL}auth/profile`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    user = {
      id: session.user.id,
      email: session.user.email ?? "",
      profile: response.data,
    };
  } catch {
    user = userFromSession(session);
  }

  await AuthService.storeOAuthSession(
    session.access_token,
    session.refresh_token ?? refresh_token,
    user
  );
  store.dispatch(setUser(user));
  router.replace("/(tabs)/account");
  return true;
}

/**
 * Listens for OAuth callback deeplink (e.g. Google sign-in).
 * When the app opens with casamadridistaapp://auth/callback#access_token=...&refresh_token=...,
 * parses URL, sets Supabase session, fetches profile (or builds from session), stores auth and updates Redux, then navigates to account.
 */
export function useAuthCallbackDeeplink() {
  const handled = useRef(false);

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || handled.current) return;
      try {
        console.log("handleUrl", url);
        const didHandle = await tryHandleAuthCallbackUrl(url);
        if (didHandle) handled.current = true;
      } catch (err) {
        console.error("OAuth callback error:", err);
        handled.current = false;
      }
    };

    Linking.getInitialURL().then(handleUrl);

    const sub = Linking.addEventListener("url", (e) => {
      handleUrl(e.url);
    });

    return () => sub.remove();
  }, []);
}
