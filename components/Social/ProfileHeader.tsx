import { Image } from 'expo-image';
import { BadgeCheck, Crown, Plus, Shield } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import Colors from '@/constants/colors';
import { usePresence } from '@/hooks/social/usePresence';
import type { SocialProfile } from '@/types/social';
import Touchable from '@/components/Touchable';
import Avatar from './Avatar';
import RelationshipControl from './RelationshipControl';
import SocialButton from './SocialButton';
import T from './T';

/**
 * PHASE 3 SLOT — the story ring around the avatar. `unseen` draws the gold
 * ring, `seen` a muted one; omitted or null draws none. Nothing passes it yet:
 * user Stories wire it up, together with `onAvatarPress` to open them.
 */
export type StoryRingState = 'unseen' | 'seen' | null;

interface Props {
  profile: SocialProfile;
  onMessage: () => void;
  /** Own profile only: the "+ Create" button, which opens the Community composer. */
  onCreate?: () => void;
  /** Phase 3: the story ring. See `StoryRingState`. */
  storyRing?: StoryRingState;
  /** Phase 3: opens the person's story when the ring is showing. */
  onAvatarPress?: () => void;
}

/**
 * The profile header.
 *
 * Leading-aligned and hairline-separated — the grammar `PostCard` already uses —
 * not a centred social-network header. One stats band with real values only:
 * Posts, Friends, Joined. Rank is omitted because no rank data exists; the slot
 * returns with Casa Arena.
 */
export default function ProfileHeader({ profile, onMessage, onCreate, storyRing = null, onAvatarPress }: Props) {
  const { t, i18n } = useTranslation();
  const { user, stats, relationship } = profile;
  const presence = usePresence(relationship.state === 'self' ? undefined : user.id, user.last_active_at);

  const isSelf = relationship.state === 'self';
  const meta = [user.username ? `@${user.username}` : null, countryName(user.country_code, i18n.language)].filter(Boolean).join(' · ');

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 18 }}>
        <StoryRing state={storyRing} onPress={onAvatarPress} label={t('social.profile.openStory')}>
          <Avatar uri={user.avatar_url} name={user.name} size={64} online={presence?.key === 'online'} />
        </StoryRing>
        <View style={{ flex: 1, marginStart: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <T step="title" weight="bold" numberOfLines={1} style={{ flexShrink: 1 }}>
              {user.name || t('community.madridista')}
            </T>
            {user.is_verified ? (
              <View style={{ marginStart: 6 }} accessible accessibilityLabel={t('social.profile.verified')}>
                <BadgeCheck size={18} color={Colors.darkGold} />
              </View>
            ) : null}
          </View>
          {meta ? (
            <T step="footnote" color={Colors.text.tertiary} numberOfLines={1} style={{ marginTop: 2 }}>
              {meta}
            </T>
          ) : null}
          {user.is_member ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Crown size={13} color={Colors.darkGold} />
              <T step="footnote" weight="semibold" color={Colors.darkGold} style={{ marginStart: 5 }}>
                {t('social.profile.member')}
              </T>
            </View>
          ) : null}
          {user.fan_club ? (
            <View
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
              accessible
              accessibilityLabel={t('social.profile.fanClubA11y', { name: user.fan_club.name })}
            >
              {user.fan_club.logo_url ? (
                <Image
                  source={{ uri: user.fan_club.logo_url }}
                  style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.background.card }}
                  contentFit="cover"
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Shield size={14} color={Colors.darkGold} />
              )}
              <T step="footnote" weight="semibold" color={Colors.text.secondary} numberOfLines={1} style={{ marginStart: 5, flexShrink: 1 }}>
                {user.fan_club.name}
              </T>
            </View>
          ) : null}
          {presence ? (
            <T step="caption" color={presence.key === 'online' ? Colors.status.success : Colors.text.tertiary} style={{ marginTop: 4 }}>
              {presence.key === 'online' ? t('social.presence.online') : t(`social.presence.${presence.key}`, { count: presence.value })}
            </T>
          ) : null}
        </View>
      </View>

      {user.bio ? (
        <T step="body" color={Colors.text.secondary} style={{ paddingHorizontal: 16, marginTop: 12 }}>
          {user.bio}
        </T>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 14 }}>
        <View style={{ flex: 1 }}>
          <RelationshipControl
            userId={user.id}
            name={user.name}
            state={relationship.state}
            canMessage={relationship.can_message}
            onMessage={onMessage}
          />
        </View>
        {isSelf && onCreate ? (
          <SocialButton label={t('social.profile.create')} tone="gold" icon={<Plus size={16} color={Colors.text.dark} strokeWidth={2.6} />} onPress={onCreate} />
        ) : null}
      </View>

      <View style={styles.band}>
        <Stat value={stats.posts} label={t('social.profile.posts')} />
        <View style={styles.divider} />
        <Stat value={stats.friends} label={t('social.profile.friends')} />
        <View style={styles.divider} />
        <Stat value={stats.joined_year} label={t('social.profile.joined')} raw />
      </View>
    </View>
  );
}

/** The Phase 3 story ring. With no state it renders the avatar untouched. */
function StoryRing({ state, onPress, label, children }: { state: StoryRingState; onPress?: () => void; label: string; children: React.ReactNode }) {
  if (!state) return <>{children}</>;
  const ring = (
    <View style={{ padding: 2, borderRadius: 999, borderWidth: 2, borderColor: state === 'unseen' ? Colors.darkGold : Colors.border.light }}>
      {children}
    </View>
  );
  if (!onPress) return ring;
  return (
    <Touchable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {ring}
    </Touchable>
  );
}

function Stat({ value, label, raw = false }: { value: number | null; label: string; raw?: boolean }) {
  const shown = value == null ? '—' : raw ? String(value) : compact(value);
  return (
    <View style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 16 }} accessible accessibilityLabel={`${label}: ${shown}`}>
      <T step="headline" weight="bold" ltr>
        {shown}
      </T>
      <T step="caption" color={Colors.text.tertiary} style={{ marginTop: 2 }}>
        {label}
      </T>
    </View>
  );
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

/** "Lebanon" / "لبنان" from "LB", in the app's language; the code if Intl lacks it. */
function countryName(code: string | null, locale: string): string | null {
  if (!code) return null;
  try {
    const names = new Intl.DisplayNames([locale], { type: 'region' });
    return names.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

const styles = StyleSheet.create({
  band: {
    flexDirection: 'row',
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border.default,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border.default,
    marginVertical: 10,
  },
});
