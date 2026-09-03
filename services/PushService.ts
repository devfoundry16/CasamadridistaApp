import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import i18n from '@/i18n';
import Colors from '@/constants/colors';
import NotificationService from '@/services/NotificationService';
import AnalyticsService from '@/services/AnalyticsService';
import { buildDeviceBody } from '@/services/media/wire';

const TOKEN_KEY = 'expo_push_token';
const ANDROID_CHANNEL_ID = 'casa-media';

export type PushRegistrationOutcome =
  | 'registered'
  | 'denied'
  | 'unsupported'
  | 'failed';

/** IANA zone, or null on a runtime without a full ICU build. */
function resolveTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

function resolveProjectId(): string | undefined {
  // `easConfig` is populated in EAS builds; `expoConfig.extra.eas` is what
  // app.json carries locally. Either one is a valid source.
  return (
    (Constants as any)?.easConfig?.projectId ??
    (Constants.expoConfig?.extra as any)?.eas?.projectId
  );
}

/**
 * Expo push registration.
 *
 * Registration is idempotent and safe to call on every `user.id` change: the
 * backend upserts on the token, binding the row to the signed-in user (or
 * leaving it anonymous). The token itself is cached so `unregister()` can find
 * it during logout, before the auth token is cleared.
 */
class PushServiceClass {
  private token: string | null = null;

  /**
   * Foreground presentation. Registered once from the root layout — a banner is
   * the point of a match-day alert even when the app is open.
   */
  installForegroundHandler(onReceived?: () => void): () => void {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: true,
      }),
    });
    const sub = Notifications.addNotificationReceivedListener(() => onReceived?.());
    return () => sub.remove();
  }

  /** Android requires an explicit channel or the notification is silent. */
  private async ensureAndroidChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
      await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: i18n.t('notifications.channelName'),
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: Colors.darkGold,
      });
    } catch {
      // ignore
    }
  }

  async getStoredToken(): Promise<string | null> {
    if (this.token) return this.token;
    try {
      this.token = await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
      this.token = null;
    }
    return this.token;
  }

  /**
   * Ask for permission, fetch the Expo token, register it with the backend.
   * Never throws — a device that cannot receive push must not break the app.
   */
  async register(): Promise<PushRegistrationOutcome> {
    // A simulator has no APNs/FCM token; asking would only produce an error.
    if (!Device.isDevice) return 'unsupported';

    const projectId = resolveProjectId();
    if (!projectId) return 'unsupported';

    try {
      await this.ensureAndroidChannel();

      const existing = await Notifications.getPermissionsAsync();
      let granted = existing.granted;
      if (!granted && existing.canAskAgain) {
        granted = (await Notifications.requestPermissionsAsync()).granted;
      }
      if (!granted) return 'denied';

      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
      if (!token) return 'failed';

      await this.persistAndRegister(token);
      return 'registered';
    } catch {
      return 'failed';
    }
  }

  /**
   * A push token can be rolled by the service while the app is running; the old
   * one silently stops delivering. Re-register the moment that happens.
   */
  installTokenRefreshListener(): () => void {
    const sub = Notifications.addPushTokenListener(() => {
      const projectId = resolveProjectId();
      if (!projectId) return;
      Notifications.getExpoPushTokenAsync({ projectId })
        .then(({ data }) => (data ? this.persistAndRegister(data) : undefined))
        .catch(() => {});
    });
    return () => sub.remove();
  }

  private async persistAndRegister(token: string): Promise<void> {
    this.token = token;
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
    try {
      await NotificationService.registerDevice(
        buildDeviceBody({
          expoPushToken: token,
          platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
          topics: ['media'],
          locale: i18n.language,
          appVersion: Constants.expoConfig?.version ?? null,
          deviceName: Device.modelName ?? null,
          // Quiet hours are scheduled per device; without this the backend can
          // only guess from country_code.
          timezone: resolveTimezone(),
          anonId: await AnalyticsService.getAnonId(),
        }),
      );
    } catch {
      // Registration is retried on the next `user.id` change / app launch.
    }
  }

  /**
   * Detach the device from the account. MUST run before the auth token is
   * cleared, otherwise the request is anonymous and the row keeps its user_id.
   */
  async unregister(): Promise<void> {
    const token = await this.getStoredToken();
    if (!token) return;
    // The anon id is what authorises the call when the device was registered
    // logged-out, and the only thing that authorises it once the auth token has
    // already been cleared.
    await NotificationService.unregisterDevice(token, await AnalyticsService.getAnonId());
    this.token = null;
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(Math.max(0, count));
    } catch {
      // ignore
    }
  }
}

const PushService = new PushServiceClass();
export default PushService;
