import React from 'react';
import { Stack } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import CommentList from '@/components/Community/Comments/CommentList';
import Colors from '@/constants/colors';

export default function CommentsPage() {
  const { postId } = useLocalSearchParams<{ postId: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Comments',
          headerStyle: { backgroundColor: Colors.darkGold },
          headerTintColor: Colors.textWhite,
        }}
      />
      <CommentList postId={postId} />
    </>
  );
}
