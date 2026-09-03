import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@/config/supabase';
import CommentService, { type Comment, type CommentsPage } from '@/services/CommentService';
import { normaliseCommentsPage } from '@/services/media/normalise';

/**
 * `media_comments` is a separate table from `post_comments` (the plan's
 * decisions table: polymorphism would break the post counter triggers), so the
 * two live behind different endpoints. This adapter is the seam that lets one
 * set of comment components serve both.
 */
export type CommentTargetKind = 'post' | 'media';

export interface CommentTarget {
  kind: CommentTargetKind;
  id: string;
}

const MEDIA_BASE = `${API_BASE_URL}casa-media`;

async function authHeader(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function fail(error: any, fallback: string): never {
  throw new Error(error?.response?.data?.error || fallback);
}

/**
 * `GET /items/:id/comments` answers the same `{ items, nextCursor }` envelope as
 * every other consumer list — `items`, not `comments` — plus `locked: true`
 * when the item is gated, in which case the thread is deliberately empty: the
 * comments are part of what you unlock.
 */
export async function getComments(
  target: CommentTarget,
  cursor?: string | null,
): Promise<CommentsPage> {
  if (target.kind === 'post') return CommentService.getComments(target.id, cursor);
  try {
    const headers = await authHeader();
    const params: Record<string, string> = {};
    if (cursor) params.cursor = cursor;
    const { data } = await axios.get(`${MEDIA_BASE}/items/${target.id}/comments`, {
      headers,
      params,
    });
    const page = normaliseCommentsPage(data, target.id);
    return {
      comments: page.comments as Comment[],
      nextCursor: page.nextCursor,
      locked: page.locked,
    };
  } catch (error: any) {
    fail(error, 'Failed to load comments');
  }
}

export async function createComment(
  target: CommentTarget,
  body: string,
  parentId?: string,
): Promise<Comment> {
  if (target.kind === 'post') return CommentService.createComment(target.id, body, parentId);
  try {
    const headers = await authHeader();
    const { data } = await axios.post(
      `${MEDIA_BASE}/items/${target.id}/comments`,
      { body, parent_id: parentId },
      { headers },
    );
    // A single created comment, not an envelope — reuse the row mapping only.
    return normaliseCommentsPage({ items: [data] }, target.id).comments[0] as Comment;
  } catch (error: any) {
    fail(error, 'Failed to post comment');
  }
}

export async function deleteComment(kind: CommentTargetKind, commentId: string): Promise<void> {
  if (kind === 'post') return CommentService.deleteComment(commentId);
  try {
    const headers = await authHeader();
    await axios.delete(`${MEDIA_BASE}/comments/${commentId}`, { headers });
  } catch (error: any) {
    fail(error, 'Failed to delete comment');
  }
}

export async function likeComment(kind: CommentTargetKind, commentId: string): Promise<void> {
  if (kind === 'post') return CommentService.likeComment(commentId);
  try {
    const headers = await authHeader();
    await axios.post(`${MEDIA_BASE}/comments/${commentId}/like`, {}, { headers });
  } catch (error: any) {
    fail(error, 'Failed to like comment');
  }
}

export async function unlikeComment(kind: CommentTargetKind, commentId: string): Promise<void> {
  if (kind === 'post') return CommentService.unlikeComment(commentId);
  try {
    const headers = await authHeader();
    await axios.delete(`${MEDIA_BASE}/comments/${commentId}/like`, { headers });
  } catch (error: any) {
    fail(error, 'Failed to unlike comment');
  }
}

/** Single source of truth for the comment query key across both targets. */
export function commentsQueryKey(target: CommentTarget) {
  return ['comments', target.kind, target.id] as const;
}
