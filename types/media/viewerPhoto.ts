/**
 * The only thing the zoom/pager viewer actually needs to know about a photo.
 *
 * `PhotoPager` and `ZoomablePhoto` were written against `PostMedia` (the
 * community feed's row shape). Casa Media assets are a different table with
 * different column names, so rather than duplicating 400 lines of gesture maths
 * the viewer now speaks this minimal type and each caller adapts into it.
 */
export interface ViewerPhoto {
  /** Stable identity — drives `recyclingKey` and the pager's React keys. */
  id: string;
  /** Full-resolution image. Null renders the placeholder only. */
  uri: string | null;
  /** Low-res still shown underneath while the full image decodes. */
  previewUri?: string | null;
  blurhash?: string | null;
  /** Intrinsic size, when known. Recovered from decode when it is not. */
  width?: number | null;
  height?: number | null;
}
