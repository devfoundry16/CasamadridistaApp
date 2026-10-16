import { useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView } from 'react-native';

import ActionSheet, { type SheetAction } from '@/components/Social/ActionSheet';
import CollectionNameSheet from '@/components/Social/CollectionNameSheet';
import T from '@/components/Social/T';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { socialKeys } from '@/hooks/social/keys';
import { useSavedCollections } from '@/hooks/social/useSavedCollections';
import PostService from '@/services/PostService';
import { collectionErrorKey, type SavedCollection } from '@/utils/savedCollections.core';

interface Props {
  /** The collection shown, or null for every saved post. */
  selected: string | null;
  onSelect: (collectionId: string | null) => void;
}

/** iOS drops a second Modal presented while the first is still closing. */
const HANDOFF_MS = 320;

/**
 * The Saved tab's collections: All, each of yours, and + New. A long press on
 * a collection renames or deletes it; deleting keeps its posts saved.
 */
export default function SavedCollectionsBar({ selected, onSelect }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: collections = [] } = useSavedCollections();
  const [naming, setNaming] = useState<{ mode: 'new' } | { mode: 'rename'; collection: SavedCollection } | null>(null);
  const [managing, setManaging] = useState<SavedCollection | null>(null);

  const fail = (error: unknown) =>
    Alert.alert(t('common.error'), t(collectionErrorKey(error instanceof Error ? error.message : null)));
  const refresh = () => queryClient.invalidateQueries({ queryKey: socialKeys.savedCollections() });

  const submitName = async (name: string) => {
    try {
      if (naming?.mode === 'rename') {
        await PostService.renameCollection(naming.collection.id, name);
      } else {
        const made = await PostService.createCollection(name);
        if (made) onSelect(made.id);
      }
      await refresh();
      setNaming(null);
    } catch (error) {
      fail(error);
    }
  };

  const remove = (collection: SavedCollection) =>
    Alert.alert(t('social.collections.deleteTitle'), t('social.collections.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('social.collections.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await PostService.deleteCollection(collection.id);
            if (selected === collection.id) onSelect(null);
            await refresh();
          } catch (error) {
            fail(error);
          }
        },
      },
    ]);

  const manageActions: SheetAction[] = managing
    ? [
        {
          key: 'rename',
          label: t('social.collections.rename'),
          icon: <Pencil size={20} color={Colors.darkGold} />,
          onPress: () => {
            const collection = managing;
            setManaging(null);
            setTimeout(() => setNaming({ mode: 'rename', collection }), HANDOFF_MS);
          },
        },
        {
          key: 'delete',
          label: t('social.collections.delete'),
          icon: <Trash2 size={20} color={Colors.status.error} />,
          destructive: true,
          onPress: () => {
            const collection = managing;
            setManaging(null);
            setTimeout(() => remove(collection), HANDOFF_MS);
          },
        },
      ]
    : [];

  const chip = (key: string, label: string, on: boolean, onPress: () => void, onLongPress?: () => void, icon?: React.ReactNode) => (
    <Touchable
      key={key}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      accessibilityHint={onLongPress ? t('social.collections.manage') : undefined}
      accessibilityActions={onLongPress ? [{ name: 'longpress', label: t('social.collections.manage') }] : undefined}
      onAccessibilityAction={onLongPress ? (e) => e.nativeEvent.actionName === 'longpress' && onLongPress() : undefined}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: on ? Colors.darkGold : Colors.border.default,
        backgroundColor: on ? 'rgba(188,144,69,0.15)' : 'transparent',
      }}
    >
      {icon}
      <T step="footnote" weight={on ? 'semibold' : 'regular'} color={on ? Colors.text.primary : Colors.text.secondary} numberOfLines={1}>
        {label}
      </T>
    </Touchable>
  );

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
        {chip('all', t('social.collections.all'), selected === null, () => onSelect(null))}
        {collections.map((c) => chip(c.id, c.name, selected === c.id, () => onSelect(c.id), () => setManaging(c)))}
        {chip('new', t('social.collections.new'), false, () => setNaming({ mode: 'new' }), undefined, <Plus size={14} color={Colors.darkGold} />)}
      </ScrollView>

      <ActionSheet
        visible={!!managing}
        title={managing?.name}
        onClose={() => setManaging(null)}
        cancelLabel={t('common.cancel')}
        actions={manageActions}
      />
      <CollectionNameSheet
        visible={!!naming}
        title={naming?.mode === 'rename' ? t('social.collections.renameTitle') : t('social.collections.newTitle')}
        submitLabel={naming?.mode === 'rename' ? t('social.collections.save') : t('social.collections.create')}
        initialName={naming?.mode === 'rename' ? naming.collection.name : ''}
        onSubmit={submitName}
        onClose={() => setNaming(null)}
      />
    </>
  );
}
