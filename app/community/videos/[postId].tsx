import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import VideoViewerScreen from '@/components/Community/VideoViewer/VideoViewerScreen';
import { viewerSourceOf } from '@/utils/feedAutoplay.core';

export default function VideoViewerRoute() {
  const { postId, feed, profile } = useLocalSearchParams<{ postId: string; feed?: string; profile?: string }>();
  return <VideoViewerScreen postId={postId} source={viewerSourceOf({ feed, profile })} />;
}
