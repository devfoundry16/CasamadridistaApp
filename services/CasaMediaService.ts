import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@/config/supabase';
import type {
  MediaArchiveFilters,
  MediaArchivePage,
  MediaCategory,
  MediaHomePayload,
  MediaItem,
  MediaListPage,
  MediaMatchPage,
  MediaPhase,
  MediaPlayback,
  MediaShareChannel,
  MediaStoryGroup,
  MediaTimelinePayload,
} from '@/types/media/casaMedia';
import type { ReportReason } from '@/services/ReportService';
import {
  groupStoriesByMatch,
  normaliseArchive,
  normaliseArchiveFilters,
  normaliseCategories,
  normaliseHome,
  normaliseItem,
  normaliseList,
  normaliseMatchPage,
  normalisePlayback,
  normaliseTimeline,
} from '@/services/media/normalise';
import { anonIdHeader, pickSignedWidth } from '@/services/media/wire';
import AnalyticsService from '@/services/AnalyticsService';

const BASE = `${API_BASE_URL}casa-media`;

export interface MediaListQuery {
  /** uuid **or** slug — the backend resolves both. */
  category?: string;
  type?: string;
  phase?: MediaPhase;
  match_id?: number;
  /** `access_level <> 'public'`. Serialised as `exclusive=1`. */
  exclusive?: boolean;
  /** `trending` = last 30 days by view count. */
  sort?: 'trending';
  cursor?: string | null;
  limit?: number;
}

export interface MediaArchiveQuery {
  season?: number;
  league_id?: number;
  opponent_team_id?: number;
  cursor?: string | null;
}

/**
 * Consumer half of the Casa Media API (plan §4.2).
 *
 * Same shape as every other service in this repo: a singleton class, an
 * `Authorization` header read from AsyncStorage per call, and axios errors
 * normalised to `Error(message)` so React Query surfaces something printable.
 * Endpoints that are optional-auth are called with or without the header — the
 * server decides what a viewer may see, never this client.
 */
class CasaMediaServiceClass {
  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private fail(error: any, fallback: string): never {
    throw new Error(error?.response?.data?.error || fallback);
  }

  /**
   * Drops undefined/null so axios never serialises `?cursor=null`, and encodes
   * booleans as the `1` the backend's truthiness check expects (`false` would
   * otherwise arrive as the *string* "false", which is truthy).
   */
  private params(input: Record<string, unknown>): Record<string, string | number> {
    const out: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined || value === null || value === '' || value === false) continue;
      out[key] = value === true ? 1 : (value as string | number);
    }
    return out;
  }

  /* --------------------------- reads --------------------------- */

  async getHome(): Promise<MediaHomePayload> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.get(`${BASE}/home`, { headers });
      return normaliseHome(data);
    } catch (error: any) {
      this.fail(error, 'Failed to load Casa Media');
    }
  }

  /** `{ items, nextCursor }` like every other consumer list — not `{ categories }`. */
  async getCategories(): Promise<MediaCategory[]> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.get(`${BASE}/categories`, { headers });
      return normaliseCategories(data);
    } catch (error: any) {
      this.fail(error, 'Failed to load categories');
    }
  }

  async list(query: MediaListQuery = {}): Promise<MediaListPage> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.get(`${BASE}/items`, {
        headers,
        params: this.params(query as Record<string, unknown>),
      });
      return normaliseList(data);
    } catch (error: any) {
      this.fail(error, 'Failed to load media');
    }
  }

  /**
   * `width` is baked into the signed photo URLs server-side, so it must be one
   * of the whitelisted rungs; anything else is coerced to the 1080 default.
   */
  async getItem(id: string, targetPx?: number): Promise<MediaItem> {
    try {
      const headers = await this.getAuthHeader();
      // `getItem` is the one read that *writes*: the controller emits a
      // server-side `locked_view` when access is denied, stamped with
      // `req.query.anon_id || req.headers['x-anon-id']`. Without it that row
      // has no anon id and signup attribution can never join it to the account
      // the teaser goes on to create — which is the whole point of the teaser.
      const anonId = await AnalyticsService.getAnonId();
      const { data } = await axios.get(`${BASE}/items/${id}`, {
        headers: { ...headers, ...anonIdHeader(anonId) },
        params: this.params({ w: targetPx ? pickSignedWidth(targetPx) : null, anon_id: anonId }),
      });
      return normaliseItem(data);
    } catch (error: any) {
      this.fail(error, 'Failed to load this item');
    }
  }

  /** Fresh signed URLs — playback tokens are short-lived by design. */
  async getPlayback(id: string, targetPx?: number): Promise<MediaPlayback> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.post(
        `${BASE}/items/${id}/playback`,
        targetPx ? { w: pickSignedWidth(targetPx) } : {},
        { headers },
      );
      return normalisePlayback(data, id);
    } catch (error: any) {
      this.fail(error, 'Failed to start playback');
    }
  }

  async getMatchMedia(
    matchId: number,
    options: { phase?: MediaPhase; category?: string; cursor?: string | null } = {},
  ): Promise<MediaMatchPage> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.get(`${BASE}/matches/${matchId}`, {
        headers,
        params: this.params(options as Record<string, unknown>),
      });
      return normaliseMatchPage(data);
    } catch (error: any) {
      this.fail(error, 'Failed to load match media');
    }
  }

  async getTimeline(matchId: number, cursor?: string | null): Promise<MediaTimelinePayload> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.get(`${BASE}/matches/${matchId}/from-madrid-now`, {
        headers,
        params: this.params({ cursor }),
      });
      return normaliseTimeline(data);
    } catch (error: any) {
      this.fail(error, 'Failed to load the timeline');
    }
  }

  /**
   * `GET /stories` is a flat `{ items, nextCursor }` of story teasers — there is
   * no server-side group. The rail's bubbles are built here, one per fixture,
   * per the contract addendum.
   */
  async getStories(): Promise<MediaStoryGroup[]> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.get(`${BASE}/stories`, { headers });
      return groupStoriesByMatch(normaliseList(data).items);
    } catch (error: any) {
      this.fail(error, 'Failed to load stories');
    }
  }

  async getArchive(query: MediaArchiveQuery = {}): Promise<MediaArchivePage> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.get(`${BASE}/archive`, {
        headers,
        params: this.params(query as Record<string, unknown>),
      });
      return normaliseArchive(data);
    } catch (error: any) {
      this.fail(error, 'Failed to load the archive');
    }
  }

  async getArchiveFilters(): Promise<MediaArchiveFilters> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.get(`${BASE}/archive/filters`, { headers });
      return normaliseArchiveFilters(data);
    } catch (error: any) {
      this.fail(error, 'Failed to load archive filters');
    }
  }

  async search(q: string, cursor?: string | null): Promise<MediaListPage> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.get(`${BASE}/search`, {
        headers,
        params: this.params({ q, cursor }),
      });
      return normaliseList(data);
    } catch (error: any) {
      this.fail(error, 'Search failed');
    }
  }

  async getSaved(cursor?: string | null): Promise<MediaListPage> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.get(`${BASE}/saved`, {
        headers,
        params: this.params({ cursor }),
      });
      return normaliseList(data);
    } catch (error: any) {
      this.fail(error, 'Failed to load saved media');
    }
  }

  /* ------------------------ engagement ------------------------- */

  async like(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(`${BASE}/items/${id}/like`, {}, { headers });
    } catch (error: any) {
      this.fail(error, 'Failed to like');
    }
  }

  async unlike(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.delete(`${BASE}/items/${id}/like`, { headers });
    } catch (error: any) {
      this.fail(error, 'Failed to unlike');
    }
  }

  async save(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(`${BASE}/items/${id}/save`, {}, { headers });
    } catch (error: any) {
      this.fail(error, 'Failed to save');
    }
  }

  async unsave(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.delete(`${BASE}/items/${id}/save`, { headers });
    } catch (error: any) {
      this.fail(error, 'Failed to unsave');
    }
  }

  /** `channel` lets the server attribute the share; it returns the canonical link. */
  async share(id: string, channel: MediaShareChannel): Promise<{ share_url: string }> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.post<{ share_url: string }>(
        `${BASE}/items/${id}/share`,
        { channel },
        { headers },
      );
      return data;
    } catch (error: any) {
      this.fail(error, 'Failed to share');
    }
  }

  /** Story reaction (emoji). DELETE removes it. */
  async react(id: string, reaction: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.put(`${BASE}/items/${id}/reaction`, { reaction }, { headers });
    } catch (error: any) {
      this.fail(error, 'Failed to react');
    }
  }

  async unreact(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.delete(`${BASE}/items/${id}/reaction`, { headers });
    } catch (error: any) {
      this.fail(error, 'Failed to remove the reaction');
    }
  }

  /** A story reply is a comment on the story item. */
  async reply(id: string, body: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(`${BASE}/items/${id}/comments`, { body }, { headers });
    } catch (error: any) {
      this.fail(error, 'Failed to send');
    }
  }

  async report(id: string, reason: ReportReason, description?: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(`${BASE}/items/${id}/report`, { reason, description }, { headers });
    } catch (error: any) {
      this.fail(error, 'Failed to report');
    }
  }

  /* --------------------- fire-and-forget ----------------------- */

  async storyView(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(`${BASE}/items/${id}/story-view`, {}, { headers });
    } catch {
      // Counters are best-effort; never surface a failure to the viewer.
    }
  }

  async recordViews(itemIds: string[]): Promise<void> {
    if (!itemIds.length) return;
    try {
      const headers = await this.getAuthHeader();
      await axios.post(`${BASE}/views`, { item_ids: itemIds }, { headers });
    } catch {
      // ignore
    }
  }
}

const CasaMediaService = new CasaMediaServiceClass();
export default CasaMediaService;
