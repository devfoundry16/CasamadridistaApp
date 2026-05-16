import React, { useCallback, useState } from 'react';
import { FlatList, View, Text, ActivityIndicator } from 'react-native';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import CommentService, { type Comment } from '@/services/CommentService';
import CommentRow from './CommentRow';
import CommentInput from './CommentInput';
import Colors from '@/constants/colors';

interface Props {
  postId: string;
}

export default function CommentList({ postId }: Props) {
  const queryClient               = useQueryClient();
  const [replyTo, setReplyTo]     = useState<Comment | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['comments', postId],
    queryFn: ({ pageParam }) => CommentService.getComments(postId, pageParam ?? null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 20_000,
  });

  const comments = data?.pages.flatMap((p) => p.comments) ?? [];

  const handleSubmit = useCallback(async (body: string) => {
    await CommentService.createComment(postId, body, replyTo?.id);
    setReplyTo(null);
    queryClient.invalidateQueries({ queryKey: ['comments', postId] });
  }, [postId, replyTo, queryClient]);

  const renderItem = useCallback(({ item }: { item: Comment }) => (
    <CommentRow comment={item} onReply={setReplyTo} />
  ), []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: Colors.background.dark }}>
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
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View className="py-10 items-center">
            <Text style={{ color: Colors.text.tertiary }}>No comments yet. Start the conversation!</Text>
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
      <CommentInput
        postId={postId}
        replyTo={replyTo?.id}
        onSubmit={handleSubmit}
        placeholder={replyTo ? `Replying to ${replyTo.author?.first_name ?? 'user'}…` : undefined}
      />
    </View>
  );
}
