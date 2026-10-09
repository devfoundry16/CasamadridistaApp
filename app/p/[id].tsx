import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

/**
 * Universal-link landing route for a shared community post:
 * `https://<MEDIA_LINK_DOMAIN>/p/<uuid>` (constants/media.ts postWebUrl).
 *
 * iOS `associatedDomains` and the Android `/p/` intent filter (app.json) hand
 * that URL to the app, and expo-router matches it here. A `Redirect`, as in
 * app/m/[id].tsx, so the post screen is the only entry in the history stack.
 */
export default function PostUniversalLinkRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) return <Redirect href="/" />;
  return <Redirect href={{ pathname: '/community/post/[id]', params: { id } }} />;
}
