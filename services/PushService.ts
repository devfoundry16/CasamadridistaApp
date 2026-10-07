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
import {
  parseSocialPref,
  registrationTopics,
  serialiseSocialPref,
  SOCIAL_PREF_KEY,
  SOCIAL_TOPIC,
  withTopic,
} from '@/utils/pushTopics.core';
import { listenerTokenOptions, shouldRegister, type PushRegistrationKey } from '@/utils/pushRegistration.core';

const TOKEN_KEY = 'expo_push_token';
const ANDROID_CHANNEL_ID = 'casa-media';
/** Must equal `channelId` in backend/services/social/dmPushService.js. */
const MESSAGES_CHANNEL_ID = 'messages';
/** Must equal the `channelId` the backend's social pushes (likes, comments, mentions, tags, friends) send. */
const SOCIAL_CHANNEL_ID = 'social';

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
  /** The topics the server last said this device has; null until it has said. */
  private topics: string[] | null = null;
  /** The account the app last registered for; null when signed out. */
  private userId: string | null = null;
  /** The last registration the server accepted, so an unchanged one is not sent again. */
  private last: PushRegistrationKey | null = null;
  /** The registration being sent now; concurrent callers wait for it instead of sending their own. */
  private inFlight: Promise<void> | null = null;

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
      // Direct messages get their own channel so a person can silence match-day
      // media without silencing friends, and so a message can use higher
      // importance than a campaign. The id is what dmPushService sends as
      // `channelId`. A push to a channel that does not exist is not dropped:
      // expo-notifications falls back to its "Miscellaneous" channel, so it
      // arrives, but without this channel's importance or its own switch.
      await Notifications.setNotificationChannelAsync(MESSAGES_CHANNEL_ID, {
        name: i18n.t('social.notifications.channelName'),
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: Colors.darkGold,
      });
      // Likes, comments, mentions, tags and friend requests: their own channel
      // so they can be silenced without silencing messages.
      await Notifications.setNotificationChannelAsync(SOCIAL_CHANNEL_ID, {
        name: i18n.t('social.notifications.socialChannelName'),
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
  async register(userId: string | null = this.userId): Promise<PushRegistrationOutcome> {
    this.userId = userId;
    // A simulator has no APNs/FCM token; asking would only produce an error.
    if (!Device.isDevice) {
      if (__DEV__) await Notifications.requestPermissionsAsync().catch(() => {});
      return 'unsupported';
    }

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
   *
   * The Expo token is derived from the device token the event carries. Asking
   * for it without `devicePushToken` would ask APNs again, which fires this
   * listener again: on a real iPhone that looped, POSTing the device 20+ times
   * a second (expo-notifications warns against exactly this).
   */
  installTokenRefreshListener(): () => void {
    const sub = Notifications.addPushTokenListener((devicePushToken) => {
      const projectId = resolveProjectId();
      if (!projectId) return;
      Notifications.getExpoPushTokenAsync(listenerTokenOptions(projectId, devicePushToken))
        .then(({ data }) => (data ? this.persistAndRegister(data) : undefined))
        .catch(() => {});
    });
    return () => sub.remove();
  }

  /** One registration at a time: a call made while one is sending waits for it, then checks again. */
  private async persistAndRegister(token: string): Promise<void> {
    while (this.inFlight) await this.inFlight.catch(() => {});
    const run = this.sendRegistration(token);
    this.inFlight = run;
    try {
      await run;
    } finally {
      if (this.inFlight === run) this.inFlight = null;
    }
  }

  private async sendRegistration(token: string): Promise<void> {
    this.token = token;
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
    // `dm`: direct-message pushes (backend dmPushService only sends to devices
    // that registered it — a build that cannot open a conversation never does).
    // `social`: likes, comments, mentions, tags and friend requests, unless
    // switched off in Account. Registration overwrites the row's topics, so the
    // switch is read every time.
    const topics = registrationTopics(await this.isSocialEnabled());
    const key: PushRegistrationKey = { token, userId: this.userId, topicsKey: [...topics].sort().join(',') };
    if (!shouldRegister(this.last, key)) return;
    try {
      const stored = await NotificationService.registerDevice(
        buildDeviceBody({
          expoPushToken: token,
          platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
          topics,
          locale: i18n.language,
          appVersion: Constants.expoConfig?.version ?? null,
          deviceName: Device.modelName ?? null,
          // Quiet hours are scheduled per device; without this the backend can
          // only guess from country_code.
          timezone: resolveTimezone(),
          anonId: await AnalyticsService.getAnonId(),
        }),
      );
      this.topics = stored;
      // Recorded only once the server has it, so a failed send is tried again.
      this.last = key;
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
    this.topics = null;
    this.last = null;
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Whether the OS lets this app show notifications. When it does not, the
   * Account switch cannot do anything, and says so. If the OS cannot be asked,
   * assume it does rather than lock the switch.
   */
  async permissionGranted(): Promise<boolean> {
    try {
      return (await Notifications.getPermissionsAsync()).granted;
    } catch {
      return true;
    }
  }

  /** The Account "Social activity" switch. On unless switched off. */
  async isSocialEnabled(): Promise<boolean> {
    try {
      return parseSocialPref(await AsyncStorage.getItem(SOCIAL_PREF_KEY));
    } catch {
      return true;
    }
  }

  /**
   * Switch social pushes on or off for this device, keeping its other topics.
   *
   * The choice is stored first, so a device with no token yet (permission not
   * granted, simulator) registers with it later. With a token, the server is
   * told now; if that fails the stored choice is put back and the error thrown,
   * so the switch can flip back rather than show a state the server lacks.
   */
  async setSocialEnabled(on: boolean): Promise<void> {
    const previous = await this.isSocialEnabled();
    await AsyncStorage.setItem(SOCIAL_PREF_KEY, serialiseSocialPref(on));
    const token = await this.getStoredToken();
    if (!token) return;
    const next = withTopic(this.topics ?? registrationTopics(previous), SOCIAL_TOPIC, on);
    try {
      const stored = await NotificationService.updateTopics(token, next, await AnalyticsService.getAnonId());
      this.topics = stored ?? next;
      // What the server now holds, so the next registration is not sent only to repeat it.
      if (this.last) this.last = { ...this.last, topicsKey: [...this.topics].sort().join(',') };
    } catch (error) {
      await AsyncStorage.setItem(SOCIAL_PREF_KEY, serialiseSocialPref(previous)).catch(() => {});
      throw error;
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
