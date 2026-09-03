import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@/config/supabase';
import type {
  CompleteUploadMeta,
  ContributorAsset,
  ContributorCategory,
  ContributorItem,
  ContributorItemInput,
  ContributorItemStats,
  ContributorLimits,
  ContributorMatch,
  ContributorMe,
  ContributorPage,
  ContributorStats,
  SubmitItemInput,
  UploadSlot,
} from '@/types/media/contributor';
import { normaliseMe } from '@/services/media/contributorMe';

// `normaliseMe` and the fallback limits live in a pure module so the recorded
// `/contributor/me` response can be replayed under `node --test`.
export { DEFAULT_LIMITS, normaliseMe } from '@/services/media/contributorMe';

const BASE = `${API_BASE_URL}casa-media/contributor`;

/** An `Error` that remembers the HTTP status it came from. */
export interface ApiError extends Error {
  status?: number;
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error;
}

export interface ContributorItemQuery {
  status?: string;
  match_id?: number;
  type?: string;
  page?: number;
  limit?: number;
}


/**
 * Contributor half of the Casa Media API (plan §4.2, contributor block).
 *
 * Same conventions as `CasaMediaService`: singleton class, `Authorization` read
 * from AsyncStorage per call, axios errors normalised to `Error(message)`.
 * Unlike the consumer service, every one of these routes is hard-authenticated
 * — a 403 here is a real answer ("you are not a contributor", "your access is
 * suspended") and its message is shown to the user verbatim.
 */
class ContributorMediaServiceClass {
  private async getAuthHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Normalise an axios error to `Error(message)` — same convention as
   * `CasaMediaService` — but keep the HTTP status on it.
   *
   * The status is what lets `ContributorGate` tell "you are not a contributor"
   * (403, a definitive answer with no retry button) from "the request did not
   * arrive" (a transport failure, retryable). Sniffing the message text for
   * that was a heuristic that would misread any prose 500.
   */
  private fail(error: any, fallback: string): never {
    const failure: ApiError = new Error(error?.response?.data?.error || fallback);
    if (typeof error?.response?.status === 'number') failure.status = error.response.status;
    throw failure;
  }

  private params(input: Record<string, unknown>): Record<string, string | number> {
    const out: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined || value === null || value === '') continue;
      out[key] = value as string | number;
    }
    return out;
  }

  /* ------------------------------- me ------------------------------ */

  async getMe(): Promise<ContributorMe> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.get<Record<string, any>>(`${BASE}/me`, { headers });
      return normaliseMe(data);
    } catch (error: any) {
      this.fail(error, 'Failed to load your contributor profile');
    }
  }

  async listMatches(
    query: { season?: number; league_id?: number; page?: number; limit?: number } = {},
  ): Promise<ContributorPage<ContributorMatch>> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.get<ContributorPage<ContributorMatch>>(`${BASE}/matches`, {
        headers,
        params: this.params(query as Record<string, unknown>),
      });
      return normalisePage(data);
    } catch (error: any) {
      this.fail(error, 'Failed to load matches');
    }
  }

  /* ------------------------------ items ---------------------------- */

  async listItems(query: ContributorItemQuery = {}): Promise<ContributorPage<ContributorItem>> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.get<ContributorPage<ContributorItem>>(`${BASE}/items`, {
        headers,
        params: this.params(query as Record<string, unknown>),
      });
      return normalisePage(data);
    } catch (error: any) {
      this.fail(error, 'Failed to load your content');
    }
  }

  async createItem(input: ContributorItemInput): Promise<ContributorItem> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.post<ContributorItem>(`${BASE}/items`, input, { headers });
      return normaliseItem(data);
    } catch (error: any) {
      this.fail(error, 'Failed to create the post');
    }
  }

  async getItem(id: string): Promise<ContributorItem> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.get<ContributorItem>(`${BASE}/items/${id}`, { headers });
      return normaliseItem(data);
    } catch (error: any) {
      this.fail(error, 'Failed to load the post');
    }
  }

  async updateItem(id: string, patch: ContributorItemInput): Promise<ContributorItem> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.patch<ContributorItem>(`${BASE}/items/${id}`, patch, { headers });
      return normaliseItem(data);
    } catch (error: any) {
      this.fail(error, 'Failed to save');
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.delete(`${BASE}/items/${id}`, { headers });
    } catch (error: any) {
      this.fail(error, 'Failed to delete');
    }
  }

  async submit(id: string, input: SubmitItemInput = {}): Promise<ContributorItem> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.post<ContributorItem>(`${BASE}/items/${id}/submit`, input, {
        headers,
      });
      return normaliseItem(data);
    } catch (error: any) {
      this.fail(error, 'Failed to submit');
    }
  }

  /* ------------------------------ assets --------------------------- */

  async requestUpload(
    itemId: string,
    input: { kind: 'image' | 'video'; role?: 'content' | 'cover'; position?: number },
  ): Promise<UploadSlot> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.post<UploadSlot>(
        `${BASE}/items/${itemId}/assets`,
        { kind: input.kind, role: input.role ?? 'content', position: input.position ?? 0 },
        { headers },
      );
      return data;
    } catch (error: any) {
      this.fail(error, 'Failed to start the upload');
    }
  }

  /** A slot for the public cover image (`role: 'cover'`). */
  async requestCoverUpload(itemId: string): Promise<UploadSlot> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.post<UploadSlot>(
        `${BASE}/items/${itemId}/cover`,
        // `{ slot: true }` is required. The endpoint takes exactly two shapes and
        // 400s on anything else, so an empty body asked for nothing at all.
        { slot: true },
        { headers },
      );
      return data;
    } catch (error: any) {
      this.fail(error, 'Failed to start the cover upload');
    }
  }

  /**
   * Promote an already-uploaded asset to the cover.
   *
   * Sent as `{ from_asset_id }` per the contract. A server that only knows how
   * to mint a cover *slot* will answer with one and ignore the field, which is
   * why the cover picker also offers "upload a new photo" — that path needs no
   * server support beyond the slot itself.
   */
  async setCoverFromAsset(itemId: string, assetId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.post(`${BASE}/items/${itemId}/cover`, { from_asset_id: assetId }, { headers });
    } catch (error: any) {
      this.fail(error, 'Failed to set the cover');
    }
  }

  async completeUpload(
    itemId: string,
    assetId: string,
    meta: CompleteUploadMeta,
  ): Promise<ContributorAsset> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.post<ContributorAsset>(
        `${BASE}/items/${itemId}/assets/${assetId}/complete`,
        meta,
        { headers },
      );
      return data;
    } catch (error: any) {
      this.fail(error, 'Failed to finish the upload');
    }
  }

  /**
   * A fresh slot for an asset that already exists. The response carries the
   * SAME `assetId`; never call `requestUpload` to recover from a failure or the
   * item ends up with an orphaned asset row.
   */
  async retryUpload(itemId: string, assetId: string): Promise<UploadSlot> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.post<UploadSlot>(
        `${BASE}/items/${itemId}/assets/${assetId}/retry`,
        {},
        { headers },
      );
      return data;
    } catch (error: any) {
      this.fail(error, 'Failed to retry the upload');
    }
  }

  async getAsset(itemId: string, assetId: string): Promise<ContributorAsset> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.get<ContributorAsset>(
        `${BASE}/items/${itemId}/assets/${assetId}`,
        { headers },
      );
      return data;
    } catch (error: any) {
      this.fail(error, 'Failed to check the upload');
    }
  }

  /**
   * Reorder a gallery.
   *
   * Both key spellings are sent: the plan's `order` and the server's
   * `asset_ids`. One request, no version sniffing, and an unknown key is
   * ignored rather than 400ing.
   */
  async reorderAssets(itemId: string, assetIds: string[]): Promise<ContributorAsset[]> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.patch<{ assets?: ContributorAsset[] }>(
        `${BASE}/items/${itemId}/assets/reorder`,
        { asset_ids: assetIds, order: assetIds },
        { headers },
      );
      return data?.assets ?? [];
    } catch (error: any) {
      this.fail(error, 'Failed to reorder');
    }
  }

  async deleteAsset(itemId: string, assetId: string): Promise<void> {
    try {
      const headers = await this.getAuthHeader();
      await axios.delete(`${BASE}/items/${itemId}/assets/${assetId}`, { headers });
    } catch (error: any) {
      this.fail(error, 'Failed to remove the file');
    }
  }

  /* ------------------------------ stats ---------------------------- */

  async getItemStats(id: string): Promise<ContributorItemStats> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.get<ContributorItemStats>(`${BASE}/items/${id}/stats`, {
        headers,
      });
      return data;
    } catch (error: any) {
      this.fail(error, 'Failed to load stats');
    }
  }

  async getStats(): Promise<ContributorStats> {
    try {
      const headers = await this.getAuthHeader();
      const { data } = await axios.get<ContributorStats>(`${BASE}/stats`, { headers });
      return data;
    } catch (error: any) {
      this.fail(error, 'Failed to load stats');
    }
  }
}

/* ------------------------------------------------------------------ */
/* Normalisation                                                       */
/* ------------------------------------------------------------------ */

function normalisePage<T>(data: Partial<ContributorPage<T>> | undefined): ContributorPage<T> {
  return {
    data: data?.data ?? [],
    total: data?.total ?? data?.data?.length ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
  };
}

function normaliseItem(item: ContributorItem): ContributorItem {
  return { ...item, assets: item?.assets ?? [], asset_count: item?.asset_count ?? 0 };
}


const ContributorMediaService = new ContributorMediaServiceClass();
export default ContributorMediaService;
