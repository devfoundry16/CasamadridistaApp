import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import Composer from '@/components/Community/Composer/Composer';
import Colors from '@/constants/colors';
import { useUser } from '@/hooks/useUser';
import PostService from '@/services/PostService';
import { isOwnPost } from '@/utils/post.core';
import { isUuid } from '@/utils/pushPayload.core';

/**
 * Edit your own post: the composer, pre-filled. Reached from the post's "..."
 * menu. Someone else's post, or a link to one, goes back to the feed: the
 * server refuses the edit anyway (403).
 */
export default function EditPostPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const validId = isUuid(id);

  const { data: post, isPending, isError } = useQuery({
    queryKey: ['post', id],
    queryFn: () => PostService.getPost(id),
    enabled: validId,
  });

  if (!validId || isError) return <Redirect href="/" />;
  if (isPending || !post) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.dark }}>
        <ActivityIndicator color={Colors.darkGold} />
      </View>
    );
  }
  if (!isOwnPost(post, user?.id)) return <Redirect href="/" />;
  return <Composer editing={post} />;
}
