import { useGlobalSearchParams, useRouter } from 'expo-router';
import { CalendarClock } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import CustomWebView from '@/components/CustomWebView';
import { Card, Crest, ResultDot, TabScroll, Updated } from '@/components/Match/Center/parts';
import WatchExclusiveBanner from '@/components/Media/Match/WatchExclusiveBanner';
import { isFinishedStatus } from '@/components/Media/Match/MatchIdentityStrip';
import { Text } from '@/components/Text';
import Colors from '@/constants/colors';
import { useMatchForm, useMatchSummary } from '@/hooks/football/matchCenter';
import { useMatchMedia } from '@/hooks/media/useMatchMedia';
import { useEnvironment } from '@/hooks/useEnvironment';
import type { MatchSummary, StandingRef, TeamForm } from '@/types/soccer/matchCenter';

/**
 * Details: competition, kickoff and stadium, both clubs' places in the table
 * and their last five results. Live and finished matches also keep the
 * API-Sports match widget, which draws the events timeline.
 *
 * The id comes from the GLOBAL params: entered at `/match/123/media`, this
 * lazily mounted sibling gets no local `id` at all.
 */
export default function MatchDetailsTab() {
  const { id } = useGlobalSearchParams();
  const matchId = Number.parseInt(String(id ?? ''), 10);
  const { t } = useTranslation();
  const router = useRouter();
  const summary = useMatchSummary(matchId);
  const form = useMatchForm(matchId);

  const { data: media } = useMatchMedia(Number.isFinite(matchId) ? matchId : undefined);
  const mediaCount = media?.pages.reduce((sum, page) => sum + page.items.length, 0) ?? 0;
  const showBanner = isFinishedStatus(media?.pages[0]?.match?.status_short) && mediaCount > 0;

  return (
    <TabScroll
      query={summary}
      isEmpty={() => false}
      empty={{ icon: CalendarClock, title: t('match.center.noData') }}
    >
      {({ match, standings, fetched_at }) => (
        <>
          {showBanner ? (
            <WatchExclusiveBanner
              count={mediaCount}
              onPress={() => router.push({ pathname: '/match/[id]/media', params: { id: String(id) } })}
            />
          ) : null}

          <InfoCard match={match} />

          {standings ? <StandingsCard match={match} home={standings.home} away={standings.away} /> : null}

          {form.data && (form.data.home.matches.length || form.data.away.matches.length) ? (
            <Card title={t('match.center.formTitle')}>
              <FormLine name={match.home.name} logo={match.home.logo} form={form.data.home} />
              <FormLine name={match.away.name} logo={match.away.logo} form={form.data.away} />
            </Card>
          ) : null}

          {match.state === 'live' || match.state === 'finished' ? <EventsWidget fixtureId={match.id} /> : null}

          <Updated at={fetched_at} />
        </>
      )}
    </TabScroll>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: 12 }}>
      <Text className="text-[13px]" style={{ color: Colors.text.tertiary }}>
        {label}
      </Text>
      <Text className="text-[13px] font-semibold" style={{ color: Colors.text.primary, flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

function InfoCard({ match }: { match: MatchSummary }) {
  const { t } = useTranslation();
  const kickoff = new Date(match.date).toLocaleString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (
    <Card>
      <InfoRow label={t('match.center.competition')} value={match.league.name} />
      <InfoRow label={t('match.center.round')} value={match.league.round} />
      <InfoRow label={t('match.center.kickoff')} value={kickoff} />
      <InfoRow label={t('match.center.venue')} value={[match.venue.name, match.venue.city].filter(Boolean).join(', ') || null} />
    </Card>
  );
}

function StandingsCard({ match, home, away }: { match: MatchSummary; home: StandingRef | null; away: StandingRef | null }) {
  const { t } = useTranslation();
  const row = (name: string | null, logo: string | null, s: StandingRef | null) =>
    s ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 }}>
        <Text className="text-[15px] font-bold" style={{ color: Colors.darkGold, width: 28, fontVariant: ['tabular-nums'] }}>
          {s.rank}
        </Text>
        <Crest uri={logo} />
        <Text className="text-[14px] font-semibold" style={{ flex: 1, color: Colors.text.primary }} numberOfLines={1}>
          {name}
        </Text>
        {s.played != null ? (
          <Text className="text-[12px]" style={{ color: Colors.text.tertiary }}>
            {t('match.center.playedShort', { count: s.played })}
          </Text>
        ) : null}
        <Text className="text-[13px] font-bold" style={{ color: Colors.text.primary }}>
          {t('match.center.points', { count: s.points })}
        </Text>
      </View>
    ) : null;
  return (
    <Card title={t('match.center.standingsTitle')}>
      {row(match.home.name, match.home.logo, home)}
      {row(match.away.name, match.away.logo, away)}
    </Card>
  );
}

function FormLine({ name, logo, form }: { name: string | null; logo: string | null; form: TeamForm }) {
  const { t } = useTranslation();
  return (
    <View style={{ paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Crest uri={logo} size={20} />
        <Text className="text-[13px] font-semibold" style={{ flex: 1, color: Colors.text.primary }} numberOfLines={1}>
          {name}
        </Text>
        {form.matches.length ? (
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {/* Oldest first, so the newest result sits at the end of the row. */}
            {[...form.matches].reverse().map((m) => (
              <ResultDot key={m.id} result={m.result} />
            ))}
          </View>
        ) : (
          <Text className="text-[12px]" style={{ color: Colors.text.tertiary }}>
            {t('match.center.formEmpty')}
          </Text>
        )}
      </View>
    </View>
  );
}

/**
 * The API-Sports game widget, as the match page had it before: its fixture card
 * carries the events and timeline once the match has started.
 */
function EventsWidget({ fixtureId }: { fixtureId: number }) {
  const { apiSports } = useEnvironment();
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>body { margin: 0; padding: 0; background-color: transparent; }</style>
      </head>
      <body>
        <api-sports-widget data-type="config" data-key="${apiSports.apiKey || ''}" data-sport="football" data-theme="grey" data-show-logos="true"></api-sports-widget>
        <api-sports-widget data-type="game" data-game-id="${fixtureId}" data-quarters="true" data-game-tab="statistics"></api-sports-widget>
        <script type="module" src="https://widgets.api-sports.io/3.1.0/widgets.js"></script>
      </body>
    </html>`;
  return <CustomWebView size={800} statsHtml={html} />;
}
