import { development } from "@/config/environment";
import { MaintenanceError, readMaintenance } from "@/utils/maintenance.core";
export type AppInfoResponse = {
  success?: boolean;
  data?: {
    auth?: { username?: string; password?: string };
    woocommerce?: { username?: string; password?: string };
    payment: {
      stripe: {
        publishableKey: string;
      };
      paypal: {
        clientId: string;
        clientSecret: string;
        mode: "sandbox" | "live";
      };
    };
    apiSports?: {
      apiKey: string;
    };
    football?: {
      currentSeason: number;
    };
    revenueCat?: {
      iosApiKey: string;
      androidApiKey: string;
    };
  };
};

let cached: AppInfoResponse | null = null;

export async function fetchAppInfo(
  forceRefresh = false
): Promise<AppInfoResponse> {
  if (cached && !forceRefresh) return cached;

  const url = `${development.DEFAULT_BACKEND_API_URL}app-info`;
  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text();
    // A deployment closed for maintenance says so in the body; the caller
    // shows the maintenance screen for this and nothing else.
    const notice = readMaintenance(res.status, text);
    if (notice) throw new MaintenanceError(notice);
    throw new Error(`Failed to fetch app info: ${res.status} ${text}`);
  }

  const json = (await res.json()) as AppInfoResponse;
  cached = json;
  return json;
}

export function clearAppInfoCache(): void {
  cached = null;
}

export default {
  fetchAppInfo,
  clearAppInfoCache,
};
