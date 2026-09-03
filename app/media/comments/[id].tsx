import { useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import CommentList from '@/components/Community/Comments/CommentList';
import Colors from '@/constants/colors';
import { useKeyboardOffsets } from '@/hooks/useKeyboardOffsets';
import type { CommentTarget } from '@/services/MediaCommentsAdapter';

/**
 * Comments on a media item.
 *
 * The list itself is the community `CommentList`, parameterised by target — see
 * `services/MediaCommentsAdapter.ts` for why the two comment tables are behind
 * one component.
 */
export default function MediaCommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { keyboardVerticalOffset } = useKeyboardOffsets();
  const target = useMemo<CommentTarget>(() => ({ kind: 'media', id }), [id]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background.dark }}
      // "padding" on both platforms — see the reasoning in
      // app/community/post/[id].tsx.
      behavior="padding"
      keyboardVerticalOffset={keyboardVerticalOffset}
      enabled={Platform.OS !== 'web'}
    >
      <CommentList target={target} />
    </KeyboardAvoidingView>
  );
}
