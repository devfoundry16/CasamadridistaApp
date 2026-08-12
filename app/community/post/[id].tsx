import React, { useState, useCallback, useMemo, useRef } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import PostService from '@/services/PostService';
import CommentService, { type Comment } from '@/services/CommentService';
import PostHeader   from '@/components/Community/PostCard/PostHeader';
import PostBody     from '@/components/Community/PostCard/PostBody';
import PostMedia    from '@/components/Community/PostCard/PostMedia';
import PostActions  from '@/components/Community/PostCard/PostActions';
import CommentRow   from '@/components/Community/Comments/CommentRow';
import CommentInput, { type CommentInputHandle } from '@/components/Community/Comments/CommentInput';
import ReportSheet  from '@/components/Community/Moderation/ReportSheet';
import { useKeyboardOffsets } from '@/hooks/useKeyboardOffsets';
import Colors from '@/constants/colors';

export default function PostDetailPage() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const [replyTo, setReplyTo]       = useState<Comment | null>(null);
  const commentInputRef             = useRef<CommentInputHandle>(null);

  // Header height + bottom safe-area inset, combined into the exact offset the
  // KeyboardAvoidingView needs. See hooks/useKeyboardOffsets.ts for the maths.
  // Must stay above the early returns below — hook order has to be stable.
  const { keyboardVerticalOffset, bottomInset } = useKeyboardOffsets();

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

  const handleReply = useCallback((comment: Comment) => {
    setReplyTo(comment);
    // Focus immediately: this is a direct response to a user tap, so the
    // keyboard is allowed to open. The KAV recomputes on keyboardWill/DidShow,
    // so the reply banner's extra height does not need to be laid out first.
    commentInputRef.current?.focus();
  }, []);

  const handleCancelReply = useCallback(() => setReplyTo(null), []);

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
          {post.comment_count} {post.comment_count === 1 ? t('community.commentSingular') : t('community.commentPlural')}
        </Text>
        {commentsLoading && (
          <View className="py-6 items-center">
            <ActivityIndicator color={Colors.darkGold} />
          </View>
        )}
      </View>
    );
  }, [post, commentsLoading, t]);

  const screenOptions = (
    <Stack.Screen
      options={{
        title: t('nav.post'),
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
          <Text style={{ color: Colors.text.tertiary }}>{t('community.postNotFound')}</Text>
        </View>
      </>
    );
  }

  return (
    <>
      {screenOptions}
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.background.dark }}
        // "padding" on BOTH platforms. On iOS and on Android edge-to-edge
        // (the Expo SDK 54 default) the window is not resized by the IME, so
        // padding is the correct lift. On legacy Android that DOES resize, the
        // computed padding goes negative and RN clamps it to 0 — so there is no
        // double-push. "height" is wrong here: it caches _initialFrameHeight and
        // drops flex, which re-measures the whole comment FlatList every toggle.
        behavior="padding"
        keyboardVerticalOffset={keyboardVerticalOffset}
        // ReportSheet is an RN <Modal> sibling. Its TextInput still emits global
        // keyboard events, which would otherwise re-layout the comment list
        // underneath the modal for no visible benefit.
        enabled={!reportOpen}
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
          // "handled" => taps on Reply / like register on the FIRST tap while
          // the keyboard is open; taps on empty space still dismiss it.
          keyboardShouldPersistTaps="handled"
          // Chat-style dismissal. 'interactive' is iOS-only; 'on-drag' on Android.
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          ListEmptyComponent={
            commentsLoading ? null : (
              <View className="py-10 items-center">
                <Text style={{ color: Colors.text.tertiary }}>
                  {t('community.noComments')}
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
          ref={commentInputRef}
          postId={id}
          replyTo={replyTo?.id}
          replyToName={replyTo?.author?.first_name ?? null}
          onSubmit={handleSubmit}
          onCancelReply={handleCancelReply}
          bottomInset={bottomInset}
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
