import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';

import { development } from '@/config/environment';
import { API_BASE_URL } from '@/config/supabase';
import type {
  MatchFormResponse,
  MatchH2HResponse,
  MatchLineupsResponse,
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
