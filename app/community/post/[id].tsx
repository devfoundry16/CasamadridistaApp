import React, { useState } from 'react';
import { ScrollView, View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import PostService from '@/services/PostService';
import PostHeader  from '@/components/Community/PostCard/PostHeader';
import PostBody    from '@/components/Community/PostCard/PostBody';
import PostMedia   from '@/components/Community/PostCard/PostMedia';
import PostActions from '@/components/Community/PostCard/PostActions';
import ReportSheet from '@/components/Community/Moderation/ReportSheet';
import Colors from '@/constants/colors';

export default function PostDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const [reportOpen, setReportOpen] = useState(false);

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['post', id],
    queryFn:  () => PostService.getPost(id),
    enabled:  !!id,
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: Colors.background.dark }}>
        <ActivityIndicator color={Colors.darkGold} />
      </View>
    );
  }

  if (isError || !post) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: Colors.background.dark }}>
        <Text style={{ color: Colors.text.tertiary }}>Post not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Post', headerStyle: { backgroundColor: Colors.darkGold }, headerTintColor: Colors.textWhite }} />
      <ScrollView style={{ backgroundColor: Colors.background.dark }}>
        <PostHeader post={post} />
        <PostBody   post={post} />
        {post.media?.length > 0 && <PostMedia media={post.media} paused={false} />}
        <PostActions
          post={post}
          onCommentPress={() => router.push(`/community/comments/${post.id}`)}
          onReportPress={() => setReportOpen(true)}
        />
      </ScrollView>
      <ReportSheet visible={reportOpen} postId={post.id} onClose={() => setReportOpen(false)} />
    </>
  );
}
