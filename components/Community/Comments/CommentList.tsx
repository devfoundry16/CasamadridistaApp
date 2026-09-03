import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, View, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Text } from '@/components/Text';
import type { Comment } from '@/services/CommentService';
import {
  commentsQueryKey,
  createComment,
  getComments,
  type CommentTarget,
} from '@/services/MediaCommentsAdapter';
import CommentRow from './CommentRow';
import CommentInput from './CommentInput';
import Colors from '@/constants/colors';

interface Props {
  /**
   * What the comments hang off. Posts and Casa Media items live in separate
   * tables behind separate endpoints (see MediaCommentsAdapter), so the target
   * is part of the identity of the list — and of its query key.
   */
  target: CommentTarget;
}

export default function CommentList({ target }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  const queryKey = useMemo(() => commentsQueryKey(target), [target]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey,
      queryFn: ({ pageParam }) => getComments(target, pageParam ?? null),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      staleTime: 20_000,
      enabled: !!target.id,
    });

  const comments = data?.pages.flatMap((p) => p.comments) ?? [];
  // The server answers a gated item with `{ items: [], nextCursor: null,
  // locked: true }`. Without this the screen reads as "be the first to comment"
  // on a thread the viewer is not allowed to see or post to.
  const locked = !!data?.pages[0]?.locked;

  const handleSubmit = useCallback(
    async (body: string) => {
      await createComment(target, body, replyTo?.id);
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey });
    },
    [target, replyTo, queryClient, queryKey],
  );

  const renderItem = useCallback(
    ({ item }: { item: Comment }) => (
      <CommentRow comment={item} targetKind={target.kind} onReply={setReplyTo} />
    ),
    [target.kind],
  );

  if (isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: Colors.background.dark }}
      >
        <ActivityIndicator color={Colors.darkGold} />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.background.dark }}>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View className="py-10 items-center px-8">
            <Text style={{ color: Colors.text.tertiary, textAlign: 'center' }}>
              {locked ? t('casaMedia.commentsLocked') : t('community.noComments')}
            </Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-3 items-center">
              <ActivityIndicator color={Colors.darkGold} />
            </View>
          ) : null
        }
      />
      {/* Posting is refused server-side on a locked item; don't offer the box. */}
      {locked ? null : (
        <CommentInput
          replyTo={replyTo?.id}
          replyToName={replyTo?.author?.first_name ?? null}
          onSubmit={handleSubmit}
          onCancelReply={() => setReplyTo(null)}
        />
      )}
    </View>
  );
}
