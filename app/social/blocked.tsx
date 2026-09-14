import { Stack } from 'expo-router';
import { Ban } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, View } from 'react-native';

import PersonRow from '@/components/Social/PersonRow';
import SocialButton from '@/components/Social/SocialButton';
import EmptyState from '@/components/Team/EmptyState';
import Colors from '@/constants/colors';
import { useBlocked } from '@/hooks/social/useFriends';
import { useRelationshipAction } from '@/hooks/social/useProfile';
import type { PersonCard } from '@/types/social';

/** The people you blocked, so a block is never a one-way door. */
export default function BlockedScreen() {
  const { t } = useTranslation();
  const { data = [], isLoading } = useBlocked();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.medium }}>
      <Stack.Screen options={{ title: t('social.blocked.title') }} />
      {isLoading ? (
        <ActivityIndicator color={Colors.darkGold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <BlockedRow person={item} />}
          ListEmptyComponent={<EmptyState icon={Ban} title={t('social.blocked.emptyTitle')} body={t('social.blocked.emptyBody')} />}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      )}
    </View>
  );
}

function BlockedRow({ person }: { person: PersonCard }) {
  const { t } = useTranslation();
  const unblock = useRelationshipAction(person.id);
  return <PersonRow person={person} trailing={<SocialButton label={t('social.actions.unblock')} tone="outline" busy={unblock.isPending} onPress={() => unblock.mutate('unblock')} />} />;
}
