import { useCallback, useRef, useState } from "react";
import type { ViewToken } from "react-native";
import type { StandingRow } from "@/types/soccer/standings";
import type { TeamLocation } from "./zones";

export type PinEdge = "top" | "bottom" | null;

/**
 * VirtualizedList builds its `_viewabilityTuples` in the CONSTRUCTOR, so this
 * config is read once at mount and any later object identity is ignored without
 * a warning. It must be module-level — a `useMemo` or an inline literal would
 * appear to work and then silently stop mattering.
 */
const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 60,
  minimumViewTime: 0,
} as const;

/**
 * Tracks whether the followed team's row has scrolled off the top or the bottom.
 *
 * Viewability rather than `onScroll` + offsets: rows are a fixed height today,
 * but the expand-on-tap panel makes them non-uniform, which breaks both offset
 * arithmetic and getItemLayout. Viewability fires only when the visible set
 * changes — a handful of times per flick, never per frame.
 *
 * In a SectionList, `_convertViewable` rewrites each token so `index` is the
 * index WITHIN the section and attaches `section`; section headers and footers
 * come through with `index: null`. Hence the `index == null` guard and the
 * sectionOffsets lookup to get back to a flat position.
 */
export function usePinnedTeamRow(
  teamId: number,
  teamLocation: TeamLocation | undefined,
  sectionOffsets: Record<string, number>,
) {
  const [pin, setPin] = useState<PinEdge>(null);
  // Gates setState so only the two real transitions re-render, not every event.
  const pinRef = useRef<PinEdge>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const commit = (next: PinEdge) => {
        if (next !== pinRef.current) {
          pinRef.current = next;
          setPin(next);
        }
      };

      if (!teamLocation) {
        commit(null);
        return;
      }

      let min = Infinity;
      let max = -Infinity;
      let visible = false;

      for (const token of viewableItems) {
        if (token.index == null) continue; // section header/footer
        const item = token.item as StandingRow | undefined;
        if (!item?.team) continue;
        if (item.team.id === teamId) {
          visible = true;
          break;
        }
        const sectionKey = (token as ViewToken & { section?: { key: string } }).section?.key;
        const flat = (sectionKey ? (sectionOffsets[sectionKey] ?? 0) : 0) + token.index;
        if (flat < min) min = flat;
        if (flat > max) max = flat;
      }

      // No row tokens at all — first paint before layout, or an empty window.
      // Hold the current state rather than guessing.
      if (!visible && max < 0) return;

      commit(visible ? null : teamLocation.flatIndex < min ? "top" : "bottom");
    },
    [teamId, teamLocation, sectionOffsets],
  );

  return { pin, onViewableItemsChanged, viewabilityConfig: VIEWABILITY_CONFIG };
}
