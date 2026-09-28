import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { MapPin, MoreHorizontal } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import type { Post } from '@/services/FeedService';
import VerifiedBadge from '../VerifiedBadge';
import FanClubBadge from '../FanClubBadge';
import Colors from '@/constants/colors';

interface Props {
  post: Post;
  onAuthorPress?: () => void;
  onReportPress?: () => void;
}

function authorAvatarUrl(post: Post): string | null {
  if (post.author_type === 'fan_club' && post.fan_club?.logo_url) {
    return post.fan_club.logo_url;
  }
  return post.author?.avatar_url ?? null;
}

const PLACEHOLDER = require('@/assets/images/placeholder_avatar.png');
const CASA_LOGO = require('@/assets/icons/splash-icon-dark.png');

export default function PostHeader({ post, onAuthorPress, onReportPress }: Props) {
  const { t } = useTranslation();

  // An official Casa teaser. `author_id` is the manager who clicked "Add to
  // Community", which is bookkeeping, not a byline: show the club's name and
  // logo, never the manager's.
  const isCasa = post.author_type === 'casa';

  const displayName = (() => {
    if (isCasa) return t('community.casaAuthor');
    if (post.author_type === 'fan_club' && post.fan_club?.name) {
      return post.fan_club.name;
    }
    const a = post.author;
    if (!a) return t('community.unknown');
    return [a.first_name, a.last_name].filter(Boolean).join(' ') || t('community.madridista');
  })();

  const avatarUrl   = authorAvatarUrl(post);
  const avatar      = isCasa ? CASA_LOGO : avatarUrl ? { uri: avatarUrl } : PLACEHOLDER;
  const isFanClub   = post.author_type === 'fan_club';
  const isVerified  = isCasa
    || (isFanClub
      ? post.fan_club?.is_verified
      : post.author?.role === 'moderator' || post.author?.role === 'admin');
  const subtitle    = !isFanClub && !isCasa && post.author?.country_code
    ? post.author.country_code
    : null;
  const location    = post.location_name?.trim() || null;
  const timeAgo     = formatDistanceToNow(new Date(post.created_at), { addSuffix: false });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onAuthorPress} activeOpacity={0.8}>
        <Image
          source={avatar}
          style={[styles.avatar, (isFanClub || isCasa) && styles.avatarRing]}
          contentFit="cover"
          transition={200}
        />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <TouchableOpacity onPress={onAuthorPress} activeOpacity={0.8} style={styles.nameGroup}>
            <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
            {isVerified && <VerifiedBadge size={13} />}
            {isFanClub && <FanClubBadge small />}
          </TouchableOpacity>
          <Text style={styles.time} numberOfLines={1}>· {timeAgo}</Text>
        </View>
        {subtitle || location ? (
          <View style={styles.subRow}>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {subtitle && location ? <Text style={styles.subtitle}> · </Text> : null}
            {location ? (
              <View
                style={styles.location}
                accessible
                accessibilityLabel={t('community.locationA11y', { location })}
              >
                <MapPin size={11} color={Colors.text.tertiary} />
                <Text style={[styles.subtitle, styles.locationText]} numberOfLines={1}>{location}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {onReportPress && (
        <TouchableOpacity onPress={onReportPress} activeOpacity={0.7} style={styles.moreButton}>
          <MoreHorizontal size={18} color={Colors.text.tertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarRing: {
    borderWidth: 2,
    borderColor: Colors.darkGold,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  time: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginLeft: 4,
    flexShrink: 0,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  locationText: {
    marginStart: 3,
    flexShrink: 1,
  },
  moreButton: {
    paddingLeft: 8,
    paddingTop: 2,
  },
});
