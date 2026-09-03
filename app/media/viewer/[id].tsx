import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import MediaViewerScreen from '@/components/Media/Viewer/MediaViewerScreen';

/**
 * Full-screen gallery viewer. Presentation options (transparentModal, fade,
 * gestures off) are declared in `app/_layout.tsx`, not here: native-stack
 * consumes `presentation` when the screen is created, so setting it from inside
 * flickers on the first frame.
 */
export default function MediaViewerRoute() {
  const { id, index } = useLocalSearchParams<{ id: string; index?: string }>();
  const parsed = Number.parseInt(index ?? '0', 10);
  return (
    <MediaViewerScreen itemId={id} initialIndex={Number.isFinite(parsed) ? parsed : 0} />
  );
}
