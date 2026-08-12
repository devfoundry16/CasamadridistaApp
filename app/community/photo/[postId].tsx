import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import PhotoViewerScreen from '@/components/Community/PhotoViewer/PhotoViewerScreen';

export default function PhotoViewerRoute() {
  const { postId, mediaId } = useLocalSearchParams<{ postId: string; mediaId?: string }>();
  return <PhotoViewerScreen postId={postId} initialMediaId={mediaId} />;
}
