import type {
  LeaderMode,
  LeaderUnit,
  Position,
  StatGroup,
  StatKey,
  TeamStatKey,
} from "@/utils/topPlayers.core";

/**
 * GET /api/stats/leaders/... and /team-leaders/... (backend
 * controller/playerLeadersController.js). Every value is the provider's or
 * arithmetic on it; a stat with no value for a player leaves that player out.
 */
export type LeadersStatus = "ready" | "syncing" | "unavailable";

export interface LeaderEntry {
  rank: number;
  player_id: number;
  name: string | null;
  photo: string | null;
  team_id: number;
  team_name: string | null;
  team_logo: string | null;
  position: Position | null;
  minutes: number | null;
  value: number;
  /** Single-match boards only. */
  fixture_id?: number;
  kickoff_at?: string | null;
  opponent_id?: number | null;
  opponent_name?: string | null;
  opponent_logo?: string | null;
}

export interface LeaderStatMeta {
  key: StatKey;
  group: StatGroup;
  unit: LeaderUnit;
  mode: LeaderMode;
  modes: LeaderMode[];
  lower: boolean;
  /** Minimum minutes a player needed to be ranked; null when none applies. */
  threshold: number | null;
  /** False when the provider does not cover this stat here (e.g. match ratings of a past season). */
  available: boolean;
}

export interface LeaderStat extends LeaderStatMeta {
  entries: LeaderEntry[];
}

interface LeadersHead {
  status: LeadersStatus;
  source: string;
  updatedAt: string | null;
  matchesUpdatedAt?: string | null;
  teamId?: number;
}

export interface LeadersHub extends LeadersHead {
  stats: LeaderStat[];
}

export interface Leaderboard extends LeadersHead {
  stat: LeaderStatMeta;
  entries: LeaderEntry[];
}

export interface TeamLeaderEntry {
  rank: number;
  team_id: number;
  name: string | null;
  logo: string | null;
  played: number;
  value: number;
}

export interface TeamLeaderStat {
  key: TeamStatKey;
  unit: LeaderUnit;
  lower: boolean;
  entries: TeamLeaderEntry[];
}

export interface TeamLeaders extends LeadersHead {
  stats: TeamLeaderStat[];
}
