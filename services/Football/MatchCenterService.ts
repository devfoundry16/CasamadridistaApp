import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, isAxiosError } from 'axios';

import { development } from '@/config/environment';
import { API_BASE_URL } from '@/config/supabase';
import { normaliseBroadcasts, normaliseTrophies, type Broadcasts, type Trophies } from '@/utils/matchWatch.core';
import type {
  MatchFormResponse,
  MatchH2HResponse,
  MatchLineupsResponse,
  MatchPreview,
  MatchStatsResponse,
  MatchSummaryResponse,
  PollPick,
  PredictionTally,
} from '@/types/soccer/matchCenter';

/** The match screen's tabs: GET /api/match/fixture/:id/<tab>. */
class MatchCenterApi {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${development.DEFAULT_BACKEND_API_URL}match/fixture`,
      headers: { Accept: 'application/json' },
      timeout: 15_000,
    });
  }

  private async authHeader(): Promise<Record<string, string>> {
    const token = await AsyncStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async get<T>(fixtureId: number, tab: string): Promise<T> {
    const { data } = await this.api.get<T>(`/${fixtureId}/${tab}`);
    return data;
  }

  summary = (id: number) => this.get<MatchSummaryResponse>(id, 'summary');
  form = (id: number) => this.get<MatchFormResponse>(id, 'form');
  h2h = (id: number) => this.get<MatchH2HResponse>(id, 'h2h');
  lineups = (id: number) => this.get<MatchLineupsResponse>(id, 'lineups');
  stats = (id: number) => this.get<MatchStatsResponse>(id, 'stats');

  // The two poll calls carry the account token, so they go through the
  // default axios: AuthService's interceptors (proactive refresh, refresh on
  // 401) are registered there only, not on the instance above.

  /** The poll, with the reader's own pick when signed in. */
  async predictions(id: number): Promise<PredictionTally> {
    const { data } = await axios.get<PredictionTally>(`${API_BASE_URL}match/fixture/${id}/predictions`, {
      headers: await this.authHeader(),
      timeout: 15_000,
    });
    return data;
  }

  /**
   * The AI preview, or null when there is none to show. Signed in, so an admin
   * can read it before it is switched on for fans.
   */
  async preview(id: number): Promise<MatchPreview | null> {
    try {
      const { data } = await axios.get<MatchPreview>(`${API_BASE_URL}match/fixture/${id}/preview`, {
        headers: await this.authHeader(),
        timeout: 15_000,
      });
      return data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  }

  /**
   * Where to watch, by country (entered by the Casa Media desk), or null when
   * nothing is entered. The server prefers the signed-in viewer's profile
   * country; `region` (the phone's) is the fallback.
   */
  async broadcasts(id: number, region: string | null): Promise<Broadcasts | null> {
    try {
      const { data } = await axios.get(`${API_BASE_URL}match/fixture/${id}/broadcasts`, {
        headers: await this.authHeader(),
        params: region ? { country: region } : {},
        timeout: 15_000,
      });
      return normaliseBroadcasts(data);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  }

  /** The two clubs' trophies (entered by the desk), or null when not both are entered. */
  async trophies(id: number): Promise<Trophies | null> {
    try {
      const { data } = await axios.get(`${API_BASE_URL}match/fixture/${id}/trophies`, { timeout: 15_000 });
      return normaliseTrophies(data);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  }

  /** The match as a calendar file, opened in the browser (iOS offers "Add to Calendar"). */
  calendarUrl = (id: number) => `${API_BASE_URL}match/fixture/${id}/calendar.ics`;

  async vote(id: number, pick: PollPick): Promise<PredictionTally> {
    const { data } = await axios.post<PredictionTally>(
      `${API_BASE_URL}match/fixture/${id}/predictions`,
      { pick },
      { headers: await this.authHeader(), timeout: 15_000 },
    );
    return data;
  }
}

const MatchCenterService = new MatchCenterApi();
export default MatchCenterService;
