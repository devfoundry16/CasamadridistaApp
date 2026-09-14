import { BadgeCheck, Crown } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import Colors from '@/constants/colors';
import { usePresence } from '@/hooks/social/usePresence';
import type { SocialProfile } from '@/types/social';
import Avatar from './Avatar';
import RelationshipControl from './RelationshipControl';
import T from './T';

interface Props {
  profile: SocialProfile;
  onMessage: () => void;
}

/**
 * The profile header.
 *
 * Leading-aligned and hairline-separated — the grammar `PostCard` already uses —
 * not a centred social-network header. One stats band with real values only:
 * Posts, Friends, Joined. Rank is omitted because no rank data exists; the slot
 * returns with Casa Arena.
 */
export default function ProfileHeader({ profile, onMessage }: Props) {
  const { t, i18n } = useTranslation();
  const { user, stats, relationship } = profile;
  const presence = usePresence(relationship.state === 'self' ? undefined : user.id, user.last_active_at);

  const meta = [user.username ? `@${user.username}` : null, countryName(user.country_code, i18n.language)].filter(Boolean).join(' · ');

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 18 }}>
        <Avatar uri={user.avatar_url} name={user.name} size={64} online={presence?.key === 'online'} />
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

      <View style={{ paddingHorizontal: 16, marginTop: 14 }}>
        <RelationshipControl
          userId={user.id}
          name={user.name}
          state={relationship.state}
          canMessage={relationship.can_message}
          onMessage={onMessage}
        />
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
