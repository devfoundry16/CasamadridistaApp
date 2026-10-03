import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Search, Users, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, I18nManager, RefreshControl, SectionList, TextInput, View } from 'react-native';

import PersonRow from '@/components/Social/PersonRow';
import RelationshipControl from '@/components/Social/RelationshipControl';
import SocialButton from '@/components/Social/SocialButton';
import T from '@/components/Social/T';
import SegmentTab from '@/components/Social/SegmentTab';
import EmptyState from '@/components/Team/EmptyState';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { typeStyle } from '@/constants/type';
import { useFont } from '@/contexts/FontContext';
import { useFriendRequests, useFriends, useSuggestions, useUserSearch } from '@/hooks/social/useFriends';
import { useOnlineIds } from '@/hooks/social/usePresence';
import { useMyProfile, useRelationshipAction } from '@/hooks/social/useProfile';
import SocialService from '@/services/SocialService';
import type { PersonCard, RelationshipState } from '@/types/social';
import { presenceLabel, splitOnline } from '@/utils/chat.core';

type Segment = 'requests' | 'friends' | 'suggested';

/**
 * Friends (§7–§9, §21): requests, friends and suggestions — and search across
 * everyone by name or @username, narrowed to your country or your fan club.
 *
 * My Friends opens with an Online section (C3): friends the presence channel
 * shows live, then friends active in the last few minutes. Presence is watched
 * once, at screen level, for the loaded page of friends who show their
 * activity (50 at most), and the same signal drives the section and each
 * row's dot. The list refreshes every minute while the screen is in focus.
 */
export default function FriendsScreen() {
  const { t } = useTranslation();
  const { isArabic } = useFont();
  const [segment, setSegment] = useState<Segment>('friends');
  const [query, setQuery] = useState('');
  const [sameCountry, setSameCountry] = useState(false);
  const [sameClub, setSameClub] = useState(false);

  const { data: me } = useMyProfile();
  const requests = useFriendRequests();
  const friends = useFriends();
  const suggestions = useSuggestions();
  const country = sameCountry ? me?.user.country_code ?? null : null;
  const fanClub = sameClub ? me?.user.fan_club_id ?? null : null;
  const search = useUserSearch(query, country, fanClub);

  // Only friends who show their activity: the server refuses the others'
  // presence channel, and a refused join is retried for ever.
  const watchable = useMemo(() => (friends.data ?? []).filter((f) => f.last_active_at).map((f) => f.id), [friends.data]);
  const live = useOnlineIds(watchable);

  // "Active 5 minutes ago" and the Online section must not freeze while the
  // screen stays open.
  const [now, setNow] = useState(Date.now());
  const refetchFriends = friends.refetch;
  useFocusEffect(
    useCallback(() => {
      const id = setInterval(() => {
        setNow(Date.now());
        void refetchFriends();
      }, 60_000);
      return () => clearInterval(id);
    }, [refetchFriends]),
  );
  useEffect(() => setNow(Date.now()), [friends.data]);

  const searching = query.trim().length >= 2 || sameCountry || sameClub;
  const incoming = useMemo(() => requests.data?.incoming ?? [], [requests.data]);

  const sections = useMemo(() => {
    // A section with no rows is left out everywhere: the list shows its empty
    // state only when there are no sections at all.
    if (searching) return [{ key: 'results', data: (search.data ?? []).map((p) => ({ person: p as PersonCard, state: p.relationship, detail: null as string | null })) }].filter((s) => s.data.length);
    if (segment === 'requests') {
      return [
        { key: 'incoming', data: incoming.map((p) => ({ person: p, state: 'request_received' as RelationshipState, detail: null })) },
        { key: 'outgoing', data: (requests.data?.outgoing ?? []).map((p) => ({ person: p, state: 'request_sent' as RelationshipState, detail: null })) },
      ].filter((s) => s.data.length);
    }
    if (segment === 'suggested') {
      return [{
        key: 'suggested',
        data: (suggestions.data ?? []).map((p) => ({
          person: p as PersonCard,
          state: 'none' as RelationshipState,
          detail: p.reason === 'mutual' ? t('social.friends.mutual', { count: p.mutual_count }) : t(`social.friends.reason_${p.reason}`),
        })),
      }].filter((s) => s.data.length);
    }
    const { online, rest } = splitOnline(friends.data ?? [], now, live);
    const row = (p: (typeof online)[number]) => {
      const presence = presenceLabel(live.has(p.id), p.last_active_at, now);
      const text = !presence ? null : presence.key === 'online' ? t('social.presence.online') : t(`social.presence.${presence.key}`, { count: presence.value });
      return {
        person: p as PersonCard,
        state: 'friends' as RelationshipState,
        // The handle stays; presence follows it.
        detail: [p.username ? `@${p.username}` : null, text].filter(Boolean).join(' · ') || null,
        online: live.has(p.id),
      };
    };
    return [
      { key: 'online', data: online.map(row) },
      { key: online.length ? 'all' : 'friends', data: rest.map(row) },
    ].filter((s) => s.data.length);
  }, [searching, search.data, segment, incoming, requests.data, suggestions.data, friends.data, now, live, t]);

  const loading = searching ? search.isLoading && search.fetchStatus !== 'idle' : segment === 'requests' ? requests.isLoading : segment === 'suggested' ? suggestions.isLoading : friends.isLoading;
  const refetch = () => {
    void requests.refetch();
    void friends.refetch();
    void suggestions.refetch();
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.medium }}>
      <Stack.Screen options={{ title: t('social.friends.title') }} />

      <View style={{ padding: 16, paddingBottom: 8, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border.default, backgroundColor: Colors.background.deepDark }}>
          <Search size={16} color={Colors.text.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('social.friends.searchPlaceholder')}
            placeholderTextColor={Colors.text.muted}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel={t('social.friends.searchPlaceholder')}
            style={{ ...typeStyle('body', isArabic), flex: 1, color: Colors.text.primary, paddingVertical: 10, marginStart: 8, textAlign: I18nManager.isRTL ? 'right' : 'left' }}
          />
          {query ? (
            <Touchable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('social.friends.clearSearch')}>
              <X size={16} color={Colors.text.muted} />
            </Touchable>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {me?.user.country_code ? <Chip label={t('social.friends.myCountry')} on={sameCountry} onPress={() => setSameCountry((v) => !v)} /> : null}
          {me?.user.fan_club_id ? <Chip label={t('social.friends.myFanClub')} on={sameClub} onPress={() => setSameClub((v) => !v)} /> : null}
        </View>

        {!searching ? (
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: Colors.border.default }}>
            <SegmentTab label={t('social.friends.tabFriends')} on={segment === 'friends'} onPress={() => setSegment('friends')} />
            <SegmentTab label={t('social.friends.tabRequests')} count={incoming.length} on={segment === 'requests'} onPress={() => setSegment('requests')} />
            <SegmentTab label={t('social.friends.tabSuggested')} on={segment === 'suggested'} onPress={() => setSegment('suggested')} />
          </View>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.darkGold} style={{ marginTop: 32 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(row, i) => `${row.person.id}-${i}`}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.darkGold} colors={[Colors.darkGold]} />}
          renderSectionHeader={({ section }) =>
            section.key === 'incoming' || section.key === 'outgoing' || section.key === 'online' || section.key === 'all' ? (
              <T step="caption" weight="semibold" color={Colors.text.tertiary} style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 }}>
                {t(`social.friends.section_${section.key}`)}
              </T>
            ) : null
          }
          renderItem={({ item }) => (
            <Row person={item.person} state={item.state} detail={item.detail} online={(item as { online?: boolean }).online === true} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={Users}
              title={searching ? t('social.friends.noResults') : t(`social.friends.empty_${segment}`)}
              body={searching ? undefined : t(`social.friends.emptyBody_${segment}`)}
            />
          }
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

function Row({ person, state, detail, online }: { person: PersonCard; state: RelationshipState; detail: string | null; online: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  const action = useRelationshipAction(person.id);
  const message = async () => {
    try {
      const conversation = await SocialService.open(person.id);
      router.push(`/social/chat/${conversation.id}`);
    } catch {
      Alert.alert(t('common.error'), t('social.errors.generic'));
    }
  };

  const trailing =
    state === 'friends' ? (
      <SocialButton label={t('social.actions.message')} tone="outline" onPress={() => void message()} />
    ) : state === 'none' ? (
      <SocialButton label={t('social.actions.add')} tone="gold" busy={action.isPending} onPress={() => action.mutate('request')} />
    ) : state === 'request_received' ? (
      <View style={{ width: 176 }}>
        <RelationshipControl userId={person.id} name={person.name} state={state} canMessage={false} onMessage={() => {}} compact />
      </View>
    ) : state === 'request_sent' ? (
      <SocialButton label={t('social.actions.requested')} tone="muted" busy={action.isPending} onPress={() => action.mutate('cancel')} />
    ) : null;

  return <PersonRow person={person} detail={detail ?? undefined} trailing={trailing} online={online} />;
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      style={({ pressed }) => ({ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: on ? Colors.darkGold : Colors.border.light, backgroundColor: on ? 'rgba(188,144,69,0.12)' : 'transparent', opacity: pressed ? 0.7 : 1 })}
    >
      <T step="footnote" weight={on ? 'semibold' : 'regular'} color={on ? Colors.darkGold : Colors.text.secondary}>
        {label}
      </T>
    </Touchable>
  );
}
