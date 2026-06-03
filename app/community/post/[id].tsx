import React, { useState, useCallback, useMemo } from 'react';
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import PostService from '@/services/PostService';
import CommentService, { type Comment } from '@/services/CommentService';
import PostHeader   from '@/components/Community/PostCard/PostHeader';
import PostBody     from '@/components/Community/PostCard/PostBody';
import PostMedia    from '@/components/Community/PostCard/PostMedia';
import PostActions  from '@/components/Community/PostCard/PostActions';
import CommentRow   from '@/components/Community/Comments/CommentRow';
import CommentInput from '@/components/Community/Comments/CommentInput';
import ReportSheet  from '@/components/Community/Moderation/ReportSheet';
import Colors from '@/constants/colors';

export default function PostDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const [replyTo, setReplyTo]       = useState<Comment | null>(null);

  const { data: post, isLoading: postLoading, isError: postError } = useQuery({
    queryKey: ['post', id],
    queryFn:  () => PostService.getPost(id),
    enabled:  !!id,
  });

  const {
    data: commentsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: commentsLoading,
  } = useInfiniteQuery({
    queryKey: ['comments', id],
    queryFn: ({ pageParam }) => CommentService.getComments(id, pageParam ?? null),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 20_000,
    enabled: !!id,
  });

  const comments = commentsData?.pages.flatMap((p) => p.comments) ?? [];

  const handleSubmit = useCallback(async (body: string) => {
    await CommentService.createComment(id, body, replyTo?.id);
    setReplyTo(null);
    queryClient.invalidateQueries({ queryKey: ['comments', id] });
  }, [id, replyTo, queryClient]);

  const handleReply = useCallback((comment: Comment) => setReplyTo(comment), []);

  const postContent = useMemo(() => {
    if (!post) return null;
    return (
      <View>
        <PostHeader post={post} onReportPress={() => setReportOpen(true)} />
        <PostBody   post={post} truncate={false} />
        {post.media?.length > 0 && <PostMedia media={post.media} paused={false} />}
        <PostActions post={post} />
        <View style={styles.divider} />
        <Text style={styles.commentsLabel}>
          {post.comment_count} {post.comment_count === 1 ? 'Comment' : 'Comments'}
        </Text>
        {commentsLoading && (
          <View className="py-6 items-center">
            <ActivityIndicator color={Colors.darkGold} />
          </View>
        )}
      </View>
    );
  }, [post, commentsLoading]);

  const screenOptions = (
    <Stack.Screen
      options={{
        title: 'Post',
        headerStyle: { backgroundColor: Colors.darkGold },
        headerTintColor: Colors.textWhite,
      }}
    />
  );

  if (postLoading) {
    return (
      <>
        {screenOptions}
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: Colors.background.dark }}>
          <ActivityIndicator color={Colors.darkGold} />
        </View>
      </>
    );
  }

  if (postError || !post) {
    return (
      <>
        {screenOptions}
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: Colors.background.dark }}>
          <Text style={{ color: Colors.text.tertiary }}>Post not found.</Text>
        </View>
      </>
    );
  }

  return (
    <>
      {screenOptions}
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.background.dark }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CommentRow comment={item} onReply={handleReply} />}
          ListHeaderComponent={postContent}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ paddingBottom: 8 }}
          style={{ backgroundColor: Colors.background.dark }}
          ListEmptyComponent={
            commentsLoading ? null : (
              <View className="py-10 items-center">
                <Text style={{ color: Colors.text.tertiary }}>
                  No comments yet. Start the conversation!
                </Text>
              </View>
            )
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
          postId={id}
          replyTo={replyTo?.id}
          onSubmit={handleSubmit}
          placeholder={replyTo ? `Replying to ${replyTo.author?.first_name ?? 'user'}…` : undefined}
        />
      </KeyboardAvoidingView>
      <ReportSheet visible={reportOpen} postId={post.id} onClose={() => setReportOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border.default,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  commentsLabel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.tertiary,
  },
});
