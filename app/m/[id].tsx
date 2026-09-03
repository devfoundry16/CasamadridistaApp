import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

/**
 * Universal-link landing route: `https://<MEDIA_LINK_DOMAIN>/m/<uuid>`.
 *
 * iOS `associatedDomains` and the Android `/m` intent filter (both in app.json)
 * hand that URL to the app, and expo-router matches it here. A `Redirect`
 * rather than a `router.replace` in an effect, so the item screen is the only
 * entry that ever lands in the history stack — the user must not be able to go
 * "back" to an empty shim.
 *
 * The `?c=` campaign parameter is forwarded so push attribution survives the hop.
 */
export default function MediaUniversalLinkRoute() {
  const { id, c } = useLocalSearchParams<{ id: string; c?: string }>();

  if (!id) return <Redirect href="/media" />;

  return (
    <Redirect
      href={{ pathname: '/media/item/[id]', params: { id, ...(c ? { c } : {}) } }}
    />
  );
}
