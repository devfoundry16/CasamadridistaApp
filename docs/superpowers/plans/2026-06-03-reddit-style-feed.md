# Reddit-Style Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Show more/less" toggle with a Reddit-style pattern — feed cards always show a truncated preview, tapping anywhere on a card opens a unified post detail screen that shows the full content with inline comments.

**Architecture:** Feed cards become fully tappable `Pressable` components that navigate to `/community/post/[id]`. The post detail screen is redesigned as a single `FlatList` with the post content as `ListHeaderComponent` and comments as list items, topped by a sticky `CommentInput`. The standalone comments route (`/community/comments/[postId]`) is replaced by a redirect to the post detail.

**Tech Stack:** React Native `Pressable`, `FlatList`, `KeyboardAvoidingView`; TanStack React Query `useInfiniteQuery`; expo-router `Stack`.

---

### Task 1: Simplify PostBody — remove toggle, add `truncate` prop

**Files:**
- Modify: `frontend/components/Community/PostCard/PostBody.tsx`

- [ ] **Step 1: Replace the entire file content**

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import type { Post } from '@/services/FeedService';
import TagPills from '../TagPills';
import Colors from '@/constants/colors';

const MAX_LINES = 5;

interface Props {
  post: Post;
  truncate?: boolean;
}

export default function PostBody({ post, truncate = true }: Props) {
  if (!post.body && !post.country_code && !post.tagged_fan_club) return null;

  return (
    <View className="px-4 py-1">
      {post.body ? (
        <Text
          numberOfLines={truncate ? MAX_LINES : undefined}
          style={{ color: Colors.text.primary, lineHeight: 20 }}
        >
          {post.body}
        </Text>
      ) : null}
      <TagPills
        countryCode={post.country_code}
        fanClubName={post.tagged_fan_club?.name}
      />
    </View>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep PostBody
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
cd frontend && git add components/Community/PostCard/PostBody.tsx
git commit -m "refactor(PostBody): remove Show-more toggle, add truncate prop"
```

---

### Task 2: Make PostCard fully tappable → navigate to post detail

**Files:**
- Modify: `frontend/components/Community/PostCard/index.tsx`

- [ ] **Step 1: Replace file content**

```tsx
import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { Post } from '@/services/FeedService';
import PostHeader  from './PostHeader';
import PostBody    from './PostBody';
import PostMedia   from './PostMedia';
import PostActions from './PostActions';
import Colors from '@/constants/colors';

interface Props {
  post: Post;
  paused?: boolean;
}

function PostCard({ post, paused = true }: Props) {
  const router = useRouter();

  const goToPost = useCallback(() => {
    router.push(`/community/post/${post.id}`);
  }, [post.id, router]);

  const goToReport = useCallback(() => {
    router.push(`/community/report/${post.id}`);
  }, [post.id, router]);

  return (
    <Pressable onPress={goToPost} style={styles.container}>
      <PostHeader post={post} onAuthorPress={goToPost} onReportPress={goToReport} />
      <PostBody   post={post} truncate />
      {post.media?.length > 0 && (
        <PostMedia media={post.media} paused={paused} />
      )}
      <PostActions post={post} onCommentPress={goToPost} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border.default,
  },
});

export default memo(PostCard);
```

> **Note:** `PostActions` buttons (`TouchableOpacity`) are nested inside the `Pressable`. In React Native, inner touchables intercept their own events and do not bubble to the outer `Pressable` — so like/share/bookmark still work independently. The comment icon press (`onCommentPress={goToPost}`) also navigates to the post detail, matching Reddit's behaviour where tapping the comment count opens the thread.

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep PostCard
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd frontend && git add components/Community/PostCard/index.tsx
git commit -m "feat(PostCard): make card fully tappable, navigate to post detail"
```

---

### Task 3: Redesign post detail — unified post + inline comments

**Files:**
- Modify: `frontend/app/community/post/[id].tsx`

The current page uses a `ScrollView` and routes the comment button to the separate comments screen. Replace it with a single `FlatList` (post as `ListHeaderComponent`, comments as items) plus a `KeyboardAvoidingView`-wrapped `CommentInput` pinned to the bottom. All comment data-fetching logic from `CommentList` is inlined here; no nested scroll views.

- [ ] **Step 1: Replace file content**

```tsx
import React, { useState, useCallback } from 'react';
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

  if (postLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: Colors.background.dark }}>
        <ActivityIndicator color={Colors.darkGold} />
      </View>
    );
  }

  if (postError || !post) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: Colors.background.dark }}>
        <Text style={{ color: Colors.text.tertiary }}>Post not found.</Text>
      </View>
    );
  }

  const postContent = (
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

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Post',
          headerStyle: { backgroundColor: Colors.darkGold },
          headerTintColor: Colors.textWhite,
        }}
      />
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
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "post/\[id\]"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd frontend && git add app/community/post/\[id\].tsx
git commit -m "feat(PostDetail): unified post + inline comments, remove separate comments route dependency"
```

---

### Task 4: Redirect standalone comments page to post detail

**Files:**
- Modify: `frontend/app/community/comments/[postId].tsx`

The standalone comments screen is now superseded. Replace it with an immediate redirect to the post detail so any back-navigation or existing deep links still resolve correctly.

- [ ] **Step 1: Replace file content**

```tsx
import { useLocalSearchParams, Redirect } from 'expo-router';

export default function CommentsRedirect() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  return <Redirect href={`/community/post/${postId}`} />;
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd frontend && npx tsc --noEmit 2>&1 | grep "comments/\[postId\]"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd frontend && git add app/community/comments/\[postId\].tsx
git commit -m "refactor(comments): redirect standalone comments page to post detail"
```

---

## Self-review

| Requirement | Task |
|---|---|
| Feed cards always truncated (no toggle) | Task 1 |
| Tapping a card opens post detail | Task 2 |
| Post detail shows full text | Task 3 (`truncate={false}`) |
| Comments inline below post content | Task 3 (FlatList + ListHeaderComponent) |
| Comment input at bottom of detail screen | Task 3 (CommentInput + KeyboardAvoidingView) |
| Reply-to flow preserved | Task 3 (`replyTo` state + `handleReply` callback) |
| Existing `/community/comments/[postId]` links don't 404 | Task 4 (Redirect) |
| Like / share / bookmark buttons still work independently | Task 2 (inner TouchableOpacity intercepts own events) |
