import type { PollPick, PredictionTally } from '@/utils/matchCenter.core';

/** Shapes of /api/match/fixture/:id/* (backend/utils/matchCenterRules.js). */

export type MatchState = 'upcoming' | 'live' | 'finished' | 'other';

export interface TeamRef {
  id: number | null;
  name: string | null;
  logo: string | null;
}

export interface LeagueRef {
  id: number | null;
  name: string | null;
  logo: string | null;
  round: string | null;
  season: number | null;
}

export interface MatchSummary {
  id: number;
  date: string;
  timestamp: number | null;
  status: { short: string | null; long: string | null; elapsed: number | null };
  state: MatchState;
  league: LeagueRef;
  venue: { name: string | null; city: string | null };
  home: TeamRef;
  away: TeamRef;
  goals: { home: number | null; away: number | null };
}

export interface StandingRef {
  rank: number;
  points: number;
  played: number | null;
  form: string | null;
  group: string | null;
}

export interface MatchSummaryResponse {
  match: MatchSummary;
  standings: { home: StandingRef | null; away: StandingRef | null } | null;
  fetched_at: string;
}

export interface FormMatch {
  id: number;
  date: string;
  league: LeagueRef;
  home: boolean;
  opponent: TeamRef;
  goalsFor: number;
  goalsAgainst: number;
  result: 'W' | 'D' | 'L';
}

export interface TeamForm {
  matches: FormMatch[];
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface MatchFormResponse {
  home: TeamForm;
  away: TeamForm;
}

export interface H2HMatch {
  id: number;
  date: string;
  league: LeagueRef;
  home: TeamRef;
  away: TeamRef;
  goals: { home: number; away: number };
}

export interface MatchH2HResponse {
  matches: H2HMatch[];
  homeWins: number;
  draws: number;
  awayWins: number;
}

export interface LineupPlayer {
  id: number | null;
  name: string | null;
  number: number | null;
  pos: string | null;
  grid: string | null;
}

export interface TeamLineup {
  team: TeamRef;
  formation: string | null;
  coach: { id: number | null; name: string | null; photo: string | null } | null;
  startXI: LineupPlayer[];
  substitutes: LineupPlayer[];
}

export interface Absence {
  id: number | null;
  name: string | null;
  photo: string | null;
  type: string | null;
  reason: string | null;
}

export interface MatchLineupsResponse {
  state: MatchState;
  lineups: TeamLineup[];
  injuries: { home: Absence[]; away: Absence[] };
  fetched_at: string;
}

export interface StatRow {
  type: string;
  home: string | number | null;
  away: string | number | null;
}

export interface SeasonRow {
  key: string;
  home: string | number | null;
  away: string | number | null;
}

export interface MatchStatsResponse {
  match: StatRow[];
  season: { league: { id: number | null; name: string | null }; season: number | null; rows: SeasonRow[] };
  fetched_at: string;
}

export type { PollPick, PredictionTally };
