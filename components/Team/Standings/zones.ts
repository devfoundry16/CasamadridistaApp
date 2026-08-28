import Colors from "@/constants/colors";
import type { StandingRow } from "@/types/soccer/standings";

/**
 * Qualification zones, derived from API-Football's free-text `description`.
 *
 * That string is NOT stable across seasons. Verified against the live endpoint
 * for league 140:
 *
 *   2026  "Champions League league stage" / "Europa League league stage"
 *         / "ECL Playoffs" / "Relegation"          (4 CL slots)
 *   2025  "Promotion - Champions League (League phase)"
 *         / "Promotion - Europa League (League phase)"
 *         / "Promotion - Conference League (Qualification)"
 *         / "Relegation - LaLiga2"                 (5 CL slots)
 *
 * So: match on alias tokens rather than full competition names, and never
 * hardcode rank ranges — the slot count moves year to year.
 */
export type ZoneKey =
  | "champions"
  | "championsQual"
  | "europa"
  | "conference"
  | "promotion"
  | "relegationPlayoff"
  | "relegation"
  | "knockout"
  | "knockoutPlayoff"
  | "eliminated"
  | "unknown"
  | "none";

interface ZoneStyle {
  color: string;
  /** null means "render the raw description instead" — see zoneLabelKey. */
  labelKey: string | null;
}

export const ZONE_STYLE: Record<ZoneKey, ZoneStyle> = {
  champions: { color: Colors.zone.champions, labelKey: "team.zoneChampionsLeague" },
  championsQual: {
    color: Colors.zone.championsQual,
    labelKey: "team.zoneChampionsQualifying",
  },
  europa: { color: Colors.zone.europa, labelKey: "team.zoneEuropaLeague" },
  conference: { color: Colors.zone.conference, labelKey: "team.zoneConferenceLeague" },
  promotion: { color: Colors.zone.champions, labelKey: "team.zonePromotion" },
  relegationPlayoff: {
    color: Colors.zone.relegationPlayoff,
    labelKey: "team.zoneRelegationPlayoff",
  },
  relegation: { color: Colors.zone.relegation, labelKey: "team.zoneRelegation" },
  knockout: { color: Colors.zone.champions, labelKey: "team.zoneKnockout" },
  knockoutPlayoff: {
    color: Colors.zone.championsQual,
    labelKey: "team.zoneKnockoutPlayoff",
  },
  eliminated: { color: Colors.zone.neutral, labelKey: "team.zoneEliminated" },
  unknown: { color: Colors.zone.neutral, labelKey: null },
  none: { color: "transparent", labelKey: null },
};

const QUALIFYING = /\b(qualif\w*|playoffs?|play offs?|preliminary|round)\b/;

/** Does this description name the competition the table itself belongs to? */
function isStageOf(normalised: string, competitionName: string): boolean {
  const name = competitionName
    .toLowerCase()
    .replace(/[()\-–—,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!name) return false;
  if (normalised.includes(name)) return true;
  // "UEFA Champions League" vs a description saying just "Champions League".
  const stripped = name.replace(/^(uefa|fifa|conmebol|afc|caf|concacaf) /, "");
  return stripped.length > 3 && normalised.includes(stripped);
}

/**
 * The parenthetical detail, which is what actually distinguishes two stages of
 * the same competition: "Play Offs: 1/8-finals" vs "Play Offs: 1/16-finals".
 */
export function stageDetail(description: string | null): string | null {
  if (!description) return null;
  const match = description.match(/\(([^)]+)\)/);
  return match ? match[1].trim() : null;
}

/**
 * The match order below is load-bearing. Each rule exists because a real
 * payload breaks the obvious ordering:
 *
 *  1. Relegation first — "Relegation - LaLiga2" carries no competition token,
 *     and a relegation play-off must not fall through to `promotion`.
 *  2. Conference before Europa — the official name is "UEFA Europa Conference
 *     League", so a Europa-first check swallows every Conference row.
 *  3. Champions before promotion — 2025's string is "Promotion - Champions
 *     League (League phase)"; matching "promotion" first paints the whole CL
 *     band with the promotion colour.
 *
 * Short aliases are \b-anchored so "ecl" can't match inside another word.
 */
export function zoneForDescription(
  description: string | null | undefined,
  /**
   * The name of the competition this table belongs to. Supplying it is what
   * separates a DESTINATION ("finish here and you reach the Champions League",
   * on a La Liga table) from a STAGE ("finish here and you reach the knockout
   * round", on the Champions League's own table). Without it, both read as
   * "Champions League" and the Champions League table paints two adjacent bands
   * the same colour with the same label — losing the only thing that table is
   * for, which is who goes straight through and who plays a play-off.
   *
   * Measured strings this handles:
   *   UCL 2025  1-8   "Promotion - Champions League (Play Offs: 1/8-finals)"
   *             9-24  "Promotion - Champions League (Play Offs: 1/16-finals)"
   *   CWC 2025  1-2   "Promotion - FIFA Club World Cup (Play Offs: 1/8-finals)"
   */
  competitionName?: string,
): ZoneKey {
  const raw = (description ?? "").trim();
  if (!raw || raw === "-") return "none";

  const s = raw
    .toLowerCase()
    .replace(/[()\-–—,]/g, " ")
    .replace(/\s+/g, " ");
  const has = (re: RegExp) => re.test(s);
  const isQualifying = QUALIFYING.test(s);

  // A stage within this same competition, not a route out of it.
  if (competitionName && isStageOf(s, competitionName)) {
    if (has(/\beliminated\b/) || has(/\bknocked out\b/)) return "eliminated";
    // The round fraction is what separates the two: 1/8-finals is the round of
    // 16 proper, 1/16-finals is the play-off that feeds it. Larger denominator
    // means an earlier, conditional round.
    const fraction = s.match(/\b1 ?\/ ?(\d+)\b/);
    if (fraction) return Number(fraction[1]) > 8 ? "knockoutPlayoff" : "knockout";
    if (has(/\bround of 16\b/) || has(/\blast 16\b/) || has(/\bknockout\b/))
      return "knockout";
    if (has(/\bplay ?offs?\b/)) return "knockoutPlayoff";
    return "knockout";
  }

  if (has(/\brelegation\b/) || has(/\bdemot\w*\b/)) {
    return isQualifying ? "relegationPlayoff" : "relegation";
  }
  if (has(/\bconference\b/) || has(/\b(ecl|uecl)\b/)) return "conference";
  if (has(/\beuropa\b/) || has(/\buel\b/)) return "europa";
  if (has(/\bchampions\b/) || has(/\bucl\b/)) {
    return isQualifying ? "championsQual" : "champions";
  }
  if (has(/\bpromotion\b/)) return "promotion";

  return "unknown";
}

export interface StandingsSection {
  /** Run index — unique even when two separate runs map to the same zone. */
  key: string;
  zone: ZoneKey;
  color: string;
  labelKey: string | null;
  /** Shown verbatim when labelKey is null and the zone is `unknown`. */
  rawDescription: string | null;
  /**
   * For a stage within this same competition, the parenthetical detail
   * ("Play Offs: 1/8-finals"). Rendered INSTEAD of the generic zone label so
   * two knockout bands read as the distinct rounds they are.
   */
  stageLabel: string | null;
  group: string;
  /**
   * First section of its group. Multi-group tables would otherwise print the
   * group name once per band — "Group A · Play Offs" followed by a bare
   * "Group A" — eight times over on the Club World Cup.
   */
  isGroupStart: boolean;
  data: StandingRow[];
}

export interface TeamLocation {
  sectionIndex: number;
  itemIndex: number;
  flatIndex: number;
}

export interface BuiltSections {
  sections: StandingsSection[];
  /** Section key -> flat index of its first row. */
  sectionOffsets: Record<string, number>;
  teamLocation: Map<number, TeamLocation>;
  /** True when more than one distinct `group` is present (group stages). */
  multiGroup: boolean;
}

/**
 * Split rows into bands, one pass.
 *
 * A new band starts when `group` OR the raw `description` string changes. The
 * comparison is on the raw string rather than the derived zone key on purpose:
 * two adjacent but differently-worded descriptions are two bands per the API's
 * own intent, and string equality is both cheaper and more faithful.
 *
 * `group` is in the break condition as insurance for multi-group competitions.
 * useStandings' `select` does `standings.flat()`, so without it Group A and
 * Group B would merge into one run. La Liga is single-group, so this is free.
 *
 * sectionOffsets and teamLocation come out of the same pass because the pinned
 * row needs all three in agreement; computing them separately invites drift.
 */
export function buildStandingsSections(
  rows: StandingRow[],
  competitionName?: string,
): BuiltSections {
  const sections: StandingsSection[] = [];
  const sectionOffsets: Record<string, number> = {};
  const teamLocation = new Map<number, TeamLocation>();
  const groups = new Set<string>();

  let prevKey: string | null = null;
  let current: StandingsSection | null = null;

  rows.forEach((row, flatIndex) => {
    groups.add(row.group);
    const breakKey = `${row.group} ${row.description ?? ""}`;

    if (breakKey !== prevKey || current === null) {
      const zone = zoneForDescription(row.description, competitionName);
      const style = ZONE_STYLE[zone];
      const isStage =
        zone === "knockout" || zone === "knockoutPlayoff" || zone === "eliminated";
      current = {
        key: String(sections.length),
        zone,
        color: style.color,
        labelKey: style.labelKey,
        rawDescription: row.description ?? null,
        stageLabel: isStage ? stageDetail(row.description ?? null) : null,
        group: row.group,
        isGroupStart: sections.length === 0 || sections[sections.length - 1].group !== row.group,
        data: [],
      };
      sections.push(current);
      sectionOffsets[current.key] = flatIndex;
      prevKey = breakKey;
    }

    teamLocation.set(row.team.id, {
      sectionIndex: sections.length - 1,
      itemIndex: current.data.length,
      flatIndex,
    });
    current.data.push(row);
  });

  return { sections, sectionOffsets, teamLocation, multiGroup: groups.size > 1 };
}

/** The zones present in a table, in table order, for the legend. */
export function legendZones(sections: StandingsSection[]): StandingsSection[] {
  // Keyed on the description too, not just the zone: two differently-worded
  // bands can share a zone (two `unknown`s, or two knockout rounds), and
  // deduping on the zone alone would show one in the legend while the table
  // shows both.
  const seen = new Set<string>();
  return sections.filter((s) => {
    if (s.zone === "none") return false;
    const key = `${s.zone}:${s.stageLabel ?? s.rawDescription ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
