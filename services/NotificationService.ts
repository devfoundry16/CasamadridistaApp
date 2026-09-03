import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@/config/supabase';
import AnalyticsService from '@/services/AnalyticsService';
import { anonIdHeader } from '@/services/media/wire';
import type {
  DeviceRegistration,
  InboxPage,
} from '@/types/media/notifications';

const BASE = `${API_BASE_URL}notifications`;

/**
 * Device registry + notification inbox (plan §4.2 "Notifications").
 *
 * `registerDevice` is optional-auth on purpose: an anonymous install still gets
 * a row so it can receive broadcast campaigns, and the row is bound to the user
 * the next time it is upserted after sign-in.
 */
class NotificationServiceClass {
  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private fail(error: any, fallback: string): never {
    throw new Error(error?.response?.data?.error || fallback);
  }

  async registerDevice(registration: DeviceRegistration): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      // `registration` is already the wire body — see `buildDeviceBody`.
      await axios.post(`${BASE}/devices`, registration, { headers });
    } catch (error: any) {
      this.fail(error, 'Failed to register for notifications');
    }
  }

  /**
   * A push token is not proof of ownership: `callerOf()` on the backend accepts
   * the signed-in account *or* a matching `anon_id`. A logged-out unregister has
   * no account, so the anon id goes in both the body and the `x-anon-id` header
   * — DELETE bodies are not reliably forwarded by every proxy.
   */
  async unregisterDevice(token: string, anonId?: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.delete(`${BASE}/devices/${encodeURIComponent(token)}`, {
        headers: { ...headers, ...anonIdHeader(anonId) },
        data: anonId ? { anon_id: anonId } : undefined,
      });
    } catch {
      // Best-effort: logout must not fail because the device row lingered.
    }
  }

  async updateTopics(token: string, topics: string[], anonId?: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.patch(
        `${BASE}/devices/${encodeURIComponent(token)}/topics`,
        { topics, ...(anonId ? { anon_id: anonId } : {}) },
        { headers: { ...headers, ...anonIdHeader(anonId) } },
      );
    } catch (error: any) {
      this.fail(error, 'Failed to update notification settings');
    }
  }

  async getInbox(cursor?: string | null): Promise<InboxPage> {
    try {
      const headers = await this.getAuthHeader();
      const params: Record<string, string> = {};
      if (cursor) params.cursor = cursor;
      const { data } = await axios.get<InboxPage>(`${BASE}/inbox`, { headers, params });
      return {
        notifications: data.notifications ?? [],
        nextCursor: data.nextCursor ?? null,
        unread_count: data.unread_count ?? 0,
      };
    } catch (error: any) {
      this.fail(error, 'Failed to load notifications');
    }
  }

  /** Pass `{ all: true }` to clear the badge in one call. */
  async markRead(payload: { ids?: string[]; all?: boolean }): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(`${BASE}/inbox/read`, payload, { headers });
    } catch (error: any) {
      this.fail(error, 'Failed to mark as read');
    }
  }

  /**
   * Push-open attribution. Fire-and-forget — never blocks the deep-link.
   *
   * The anon id is not optional here: an open arriving without one cannot be
   * joined to the install that received the push, and the endpoint rejects it.
   * Sent in the body and as `x-anon-id` for the same reason as the device
   * routes — one of the two always survives.
   */
  async recordOpened(payload: { campaign_id?: string; item_id?: string }): Promise<void> {
    if (!payload.campaign_id && !payload.item_id) return;
    try {
      const headers = await this.getAuthHeader();
      const anonId = await AnalyticsService.getAnonId();
      await axios.post(
        `${BASE}/opened`,
        { ...payload, anon_id: anonId },
        { headers: { ...headers, ...anonIdHeader(anonId) } },
      );
    } catch {
      // ignore
    }
  }
}

const NotificationService = new NotificationServiceClass();
export default NotificationService;
