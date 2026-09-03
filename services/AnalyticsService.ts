import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Crypto from 'expo-crypto';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import { API_BASE_URL } from '@/config/supabase';
import type { MediaAnalyticsEvent, MediaEventName } from '@/types/media/casaMedia';
import { buildEventsBody, toEventType } from '@/services/media/wire';

const QUEUE_KEY = 'casa_media_event_queue';
const ANON_ID_KEY = 'casa_media_anon_id';

const FLUSH_AT = 20; // events
const FLUSH_EVERY_MS = 10_000;
const MAX_BATCH = 50; // server cap (plan §4.6)
const MAX_QUEUE = 200; // hard ceiling so an offline device cannot grow forever

/**
 * Casa Media analytics.
 *
 * Contract: **this module never throws and never rejects.** Every public method
 * is fire-and-forget; a failed flush puts the batch back at the head of the
 * queue and waits for the next tick. The queue is mirrored to AsyncStorage so a
 * cold start does not lose the `locked_view` that a signup will be attributed to.
 */
class AnalyticsServiceClass {
  private queue: MediaAnalyticsEvent[] = [];
  private anonId: string | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private appStateSub: { remove: () => void } | null = null;
  private flushing = false;
  private hydrated = false;

  /** Call once from the root layout. Idempotent. */
  start(): void {
    if (this.timer) return;
    void this.hydrate();
    this.timer = setInterval(() => void this.flush(), FLUSH_EVERY_MS);
    this.appStateSub = AppState.addEventListener('change', this.handleAppState);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.appStateSub?.remove();
    this.appStateSub = null;
    // One last attempt before the listeners are gone. Anything still queued is
    // already mirrored to AsyncStorage, so a failure here only defers it to the
    // next launch.
    void this.flush();
  }

  private handleAppState = (state: AppStateStatus) => {
    // Backgrounding is the last chance to ship what is queued.
    if (state === 'background' || state === 'inactive') void this.flush();
  };

  /**
   * Stable per-install id used to attribute an anonymous `locked_view` to the
   * account that is created afterwards. Not a user identifier and never sent
   * anywhere but our own events endpoint.
   */
  async getAnonId(): Promise<string> {
    if (this.anonId) return this.anonId;
    try {
      const stored = await AsyncStorage.getItem(ANON_ID_KEY);
      if (stored) {
        this.anonId = stored;
        return stored;
      }
      const fresh = Crypto.randomUUID();
      await AsyncStorage.setItem(ANON_ID_KEY, fresh);
      this.anonId = fresh;
      return fresh;
    } catch {
      // Storage unavailable: keep a process-lifetime id so the session is at
      // least internally consistent.
      this.anonId = this.anonId ?? Crypto.randomUUID();
      return this.anonId;
    }
  }

  /**
   * `name` is the call-site spelling; what goes on the wire is `event_type`
   * (`eventService.normaliseEvent` drops any event without one, and maps
   * nothing itself). The mapping happens here, once, so the persisted queue is
   * already in wire shape and a batch written by an older build still flushes.
   */
  track(
    name: MediaEventName,
    payload: Omit<MediaAnalyticsEvent, 'event_type' | 'occurred_at' | 'anon_id'> = {},
  ): void {
    void this.enqueue({
      ...payload,
      event_type: toEventType(name),
      occurred_at: new Date().toISOString(),
    });
  }

  private async enqueue(event: MediaAnalyticsEvent): Promise<void> {
    try {
      await this.hydrate();
      // Always, signed in or not: signup attribution joins a pre-signup
      // `locked_view` to the new account by anon_id, and an event without one
      // can never be joined afterwards.
      event.anon_id = await this.getAnonId();
      event.props = { platform: Platform.OS, ...(event.props ?? {}) };
      this.queue.push(event);
      if (this.queue.length > MAX_QUEUE) this.queue = this.queue.slice(-MAX_QUEUE);
      await this.persist();
      if (this.queue.length >= FLUSH_AT) await this.flush();
    } catch {
      // ignore
    }
  }

  private async hydrate(): Promise<void> {
    if (this.hydrated) return;
    this.hydrated = true;
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // A queue written before the `name` → `event_type` fix would be dropped
        // wholesale by the server. Migrate on read rather than lose it.
        const migrated = parsed
          .map((event: any) => {
            const name = event?.event_type ?? event?.name;
            if (!name) return null;
            const { name: _legacy, ...rest } = event;
            return { ...rest, event_type: toEventType(name) };
          })
          .filter(Boolean) as MediaAnalyticsEvent[];
        this.queue = [...migrated, ...this.queue].slice(-MAX_QUEUE);
      }
    } catch {
      // ignore
    }
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch {
      // ignore
    }
  }

  async flush(): Promise<void> {
    if (this.flushing) return;
    await this.hydrate();
    if (!this.queue.length) return;
    this.flushing = true;
    const batch = this.queue.slice(0, MAX_BATCH);
    this.queue = this.queue.slice(batch.length);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API_BASE_URL}casa-media/events`, buildEventsBody(batch), { headers });
      await this.persist();
    } catch {
      // Put the batch back at the head so ordering survives a retry.
      this.queue = [...batch, ...this.queue].slice(-MAX_QUEUE);
      await this.persist();
    } finally {
      this.flushing = false;
    }
  }
}

const AnalyticsService = new AnalyticsServiceClass();
export default AnalyticsService;
