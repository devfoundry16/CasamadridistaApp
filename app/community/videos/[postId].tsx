import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import VideoViewerScreen from '@/components/Community/VideoViewer/VideoViewerScreen';
import { feedTabOf } from '@/utils/feedAutoplay.core';

export default function VideoViewerRoute() {
  const { postId, feed } = useLocalSearchParams<{ postId: string; feed?: string }>();
  return <VideoViewerScreen postId={postId} feed={feedTabOf(feed)} />;
}
