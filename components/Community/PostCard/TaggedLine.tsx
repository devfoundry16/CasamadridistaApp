import { useRouter } from 'expo-router';
import { Users } from 'lucide-react-native';
import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import T from '@/components/Social/T';
import { Text as AppText } from '@/components/Text';
import Colors from '@/constants/colors';
import type { TaggedUser } from '@/services/FeedService';
import { splitTagged } from '@/utils/mentions.core';

interface Props {
  tagged: TaggedUser[] | undefined;
  /** Name everyone (post detail) rather than two and "N more" (feed card). */
  all?: boolean;
}

/**
 * "with @ali, @bale and 3 more" under a post. Each person opens their profile.
 *
 * The names are nested texts with their own `onPress`, so on a feed card a
 * name opens the profile while "and 3 more" falls through to the card, which
 * opens the post where everyone is named.
 */
export default function TaggedLine({ tagged, all = false }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { shown, more } = splitTagged(tagged, all ? Infinity : 2);
  if (!shown.length) return null;

  const label = (person: TaggedUser) => (person.username ? `@${person.username}` : person.name);

  return (
    <View style={styles.row}>
      <Users size={13} color={Colors.text.tertiary} style={styles.icon} />
      <T step="footnote" color={Colors.text.tertiary} style={styles.text}>
        {t('community.taggedWith')}{' '}
        {shown.map((person, i) => (
          <Fragment key={person.id}>
            {i > 0 ? t('community.listSeparator') : null}
            <AppText
              onPress={() => router.push(`/user/${person.id}`)}
              accessibilityRole="link"
              style={{ color: Colors.text.primary, fontWeight: '600' }}
            >
              {label(person)}
            </AppText>
          </Fragment>
        ))}
        {more > 0 ? ` ${t('community.taggedMore', { count: more })}` : null}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  icon: {
    marginTop: 3,
    marginEnd: 5,
  },
  text: {
    flex: 1,
  },
});
