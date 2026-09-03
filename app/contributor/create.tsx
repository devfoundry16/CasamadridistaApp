import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ContributorGate from '@/components/Contributor/ContributorGate';
import CoverPicker from '@/components/Contributor/CoverPicker';
import DraftForm, { type DraftFormValue } from '@/components/Contributor/DraftForm';
import StatusBadge from '@/components/Contributor/StatusBadge';
import UploadProgressList from '@/components/Contributor/UploadProgressList';
import SectionHeading from '@/components/Team/SectionHeading';
import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';
import { useAssetMutations, useContributorItem, useContributorItemMutations } from '@/hooks/media/useMyContent';
import { contributorKeys } from '@/hooks/media/keys';
import { useItemUploadReadiness, useItemUploads } from '@/hooks/media/useUploadQueue';
import UploadManager from '@/services/upload/UploadManager';
import { captureWithCamera, pickFromLibrary, type PickResult } from '@/services/upload/pickMedia';
import type { MediaAccessLevel } from '@/types/media/casaMedia';
import {
  isEditableStatus,
  type ContributorItem,
  type ContributorItemType,
  type ContributorMe,
} from '@/types/media/contributor';

const AUTOSAVE_MS = 900;

export default function ContributorCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <ContributorGate returnTo={id ? `/contributor/create?id=${id}` : '/contributor/create'}>
      {(me) => <ItemEditor me={me} itemId={typeof id === 'string' ? id : undefined} />}
    </ContributorGate>
  );
}

const ACCESS_RANK: Record<string, number> = {
  public: 0,
  registered: 1,
  premium: 2,
  internal: 3,
};

/**
 * `registered` is the product default (the schema's own column default), not
 * whatever ceiling the contributor happens to hold — defaulting to the maximum
 * would quietly put every Quick Post behind the paywall for a correspondent
 * whose grant allows `premium`. The ceiling only ever pulls it *down*.
 */
function defaultAccessLevel(me: ContributorMe): MediaAccessLevel | 'internal' {
  const ceiling = me.maxAccessLevel;
  if (!ceiling || ACCESS_RANK[ceiling] === undefined) return 'registered';
  return ACCESS_RANK.registered <= ACCESS_RANK[ceiling] ? 'registered' : ceiling;
}

function emptyValue(me: ContributorMe): DraftFormValue {
  return {
    type: 'photo',
    match_id: me.todayMatch?.id ?? me.allowedMatches[0]?.id ?? null,
    match_phase: null,
    category_id: null,
    title: '',
    short_description: '',
    caption: '',
    access_level: defaultAccessLevel(me),
    tags: '',
    publish_at: null,
    notify_mode: 'digest',
    publish_when_ready: true,
  };
}

function fromItem(item: ContributorItem): DraftFormValue {
  const tags = Array.isArray(item.tags)
    ? item.tags
        .map((tag) => (typeof tag === 'string' ? tag : tag?.name))
        .filter(Boolean)
        .join(', ')
    : '';
  return {
    type: (item.type as ContributorItemType) ?? 'photo',
    match_id: item.match_id ?? null,
    match_phase: item.match_phase ?? null,
    category_id: item.category_id ?? null,
    title: item.title ?? '',
    short_description: item.short_description ?? '',
    caption: item.caption ?? '',
    access_level: item.access_level ?? 'registered',
    tags,
    publish_at: item.publish_at ?? null,
    notify_mode: item.notify_mode ?? 'digest',
    publish_when_ready: true,
  };
}

/**
 * The full editor, for both a new item (`/contributor/create`) and an existing
 * one (`?id=…`). One screen rather than two: the only difference between them
 * is whether the server draft row exists yet, and duplicating 300 lines to
 * express that is how the two drift apart.
 *
 * **Drafts are server rows from the first edit.** The debounce below creates
 * the row as soon as there is something to save; everything after that is a
 * PATCH. That, plus the persisted upload queue, is what makes a draft survive
 * the app being killed — neither the text nor the files live only in memory.
 */
function ItemEditor({ me, itemId: initialId }: { me: ContributorMe; itemId?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [itemId, setItemId] = useState<string | undefined>(initialId);
  const [value, setValue] = useState<DraftFormValue>(() => emptyValue(me));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const hydrated = useRef(!initialId);
  /**
   * The id as of *now*, not as of the last render.
   *
   * `persist` is called from a debounce timer and from button handlers, and the
   * create request takes long enough that a second call can be scheduled before
   * `setItemId` has landed. Reading state there would create the item twice.
   */
  const itemIdRef = useRef<string | undefined>(initialId);
  /** Serialises saves, so the create can never overlap itself. */
  const inFlight = useRef<Promise<string | undefined> | null>(null);
  /** The newest form value, for comparing against what a save actually sent. */
  const valueRef = useRef<DraftFormValue>(value);

  const item = useContributorItem(itemId);
  const { create, update, submit, remove } = useContributorItemMutations();
  const assetMutations = useAssetMutations(itemId);
  const uploads = useItemUploads(itemId);
  const queryClient = useQueryClient();

  // The cover lives on the item (React Query) while uploads live in the queue
  // (Redux), and UploadManager promotes a finished cover without going through
  // either. Nothing else connects the two, so without this the item keeps
  // rendering the previous cover — or none — until some unrelated refetch.
  const coverUploaded = uploads.some(
    (entry) => entry.role === 'cover' && entry.status === 'ready',
  );
  useEffect(() => {
    if (!coverUploaded || !itemId) return;
    void queryClient.invalidateQueries({ queryKey: contributorKeys.item(itemId) });
  }, [coverUploaded, itemId, queryClient]);
  const queue = useItemUploadReadiness(itemId);

  /* Seed the form from the server row exactly once. */
  useEffect(() => {
    if (hydrated.current || !item.data) return;
    hydrated.current = true;
    const seeded = fromItem(item.data);
    valueRef.current = seeded;
    setValue(seeded);
  }, [item.data]);

  const onChange = useCallback((patch: Partial<DraftFormValue>) => {
    setValue((current) => {
      const next = { ...current, ...patch };
      valueRef.current = next;
      return next;
    });
    setDirty(true);
  }, []);

  /**
   * Mark the form clean — but only if it still holds the value we just saved.
   *
   * A PATCH takes long enough to type another word into. Clearing `dirty`
   * unconditionally would drop that word: the effect only re-arms the debounce
   * when `dirty` is true, so the edit would sit unsaved until the next
   * keystroke, or be lost entirely if the user navigated away.
   */
  const settle = useCallback((saved: DraftFormValue) => {
    if (valueRef.current === saved) setDirty(false);
  }, []);

  const toInput = useCallback(
    (next: DraftFormValue) => ({
      type: next.type,
      match_id: next.match_id ?? undefined,
      match_phase: next.match_phase,
      category_id: next.category_id,
      title: next.title.trim() || null,
      short_description: next.short_description.trim() || null,
      caption: next.caption.trim() || null,
      access_level: next.access_level as MediaAccessLevel,
      tags: next.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    }),
    [],
  );

  /**
   * Persist. Creates the row on first call, patches thereafter.
   * Returns the item id so the callers that need one (uploads, submit) can
   * await it rather than racing the debounce.
   */
  const persist = useCallback(
    async (next: DraftFormValue): Promise<string | undefined> => {
      if (!next.match_id) return itemIdRef.current; // the server requires a match_id

      // Wait out whatever is already saving. Its failure is already reported,
      // so swallow it here and decide again with a fresh id.
      if (inFlight.current) await inFlight.current.catch(() => undefined);

      const run = (async (): Promise<string | undefined> => {
        setSaving(true);
        try {
          const existing = itemIdRef.current;
          if (existing) {
            await update.mutateAsync({ id: existing, patch: toInput(next) });
            settle(next);
            return existing;
          }
          const created = await create.mutateAsync(toInput(next));
          itemIdRef.current = created.id;
          setItemId(created.id);
          settle(next);
          return created.id;
        } catch (error: any) {
          Alert.alert(t('contributor.errors.saveFailed'), error?.message ?? '');
          return itemIdRef.current;
        } finally {
          setSaving(false);
        }
      })();

      inFlight.current = run;
      try {
        return await run;
      } finally {
        if (inFlight.current === run) inFlight.current = null;
      }
    },
    [create, settle, t, toInput, update],
  );

  /* Debounced autosave. */
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      void persist(value);
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
    // `persist` changes identity with every mutation object; depending on it
    // here would restart the timer on every keystroke's re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, value]);

  const editable = !item.data || isEditableStatus(String(item.data.status));
  const assets = useMemo(() => item.data?.assets ?? [], [item.data?.assets]);
  const contentAssets = useMemo(
    () => assets.filter((asset) => asset.role !== 'cover'),
    [assets],
  );

  /* ------------------------------ assets ------------------------- */

  const addAssets = useCallback(
    async (role: 'content' | 'cover', source: 'library' | 'camera' = 'library') => {
      const id = await persist(value);
      if (!id) {
        Alert.alert(t('contributor.errors.noMatchTitle'), t('contributor.errors.noMatchBody'));
        return;
      }

      let result: PickResult;
      try {
        result =
          source === 'camera'
            ? // Stills only. A video shot here would land in the same queue, but
              // the camera is the "something is happening right now" path and a
              // clip needs the length and format controls the library gives.
              await captureWithCamera({ limits: me.limits, video: false })
            : await pickFromLibrary({
                limits: me.limits,
                selectionLimit:
                  role === 'cover'
                    ? 1
                    : Math.max(1, me.limits.maxGalleryAssets - contentAssets.length),
                mediaTypes: role === 'cover' ? ['images'] : ['images', 'videos'],
              });
      } catch (error: any) {
        Alert.alert(t('contributor.errors.pickFailed'), error?.message ?? '');
        return;
      }

      if (result.denied) {
        Alert.alert(
          t('contributor.errors.permissionTitle'),
          // The two refusals are fixed in different places in Settings, so the
          // message has to name the right one.
          t(
            result.denied === 'camera'
              ? 'contributor.errors.cameraDenied'
              : 'contributor.errors.libraryDenied',
          ),
        );
        return;
      }
      if (!result.assets.length) return;

      await UploadManager.enqueue(
        result.assets.map((asset, index) => ({
          itemId: id,
          kind: asset.kind,
          localUri: asset.uri,
          mime: asset.mime,
          role,
          position: role === 'cover' ? 0 : contentAssets.length + index,
          width: asset.width,
          height: asset.height,
          durationMs: asset.durationMs,
          sizeBytes: asset.sizeBytes,
        })),
      );
      void item.refetch();
    },
    [contentAssets.length, item, me.limits, persist, t, value],
  );

  /* ------------------------------ actions ------------------------ */

  const doSubmit = useCallback(
    async (mode: 'publish' | 'schedule') => {
      const id = await persist(value);
      if (!id) {
        Alert.alert(t('contributor.errors.noMatchTitle'), t('contributor.errors.noMatchBody'));
        return;
      }
      if (!contentAssets.length && !queue.total) {
        Alert.alert(t('contributor.errors.noAssetsTitle'), t('contributor.errors.noAssetsBody'));
        return;
      }
      // Bytes are still moving: only `publish_when_ready` makes this legal, so
      // refuse rather than send a submit the server will reject.
      if (queue.total > 0 && !queue.allReady && !value.publish_when_ready) {
        Alert.alert(
          t('contributor.errors.stillUploadingTitle'),
          t('contributor.errors.stillUploadingBody'),
        );
        return;
      }

      setBusy(true);
      try {
        await submit.mutateAsync({
          id,
          input:
            mode === 'schedule'
              ? {
                  publish_at: value.publish_at,
                  notify_mode: value.notify_mode,
                  publish_when_ready: value.publish_when_ready,
                }
              : {
                  publish_now: !me.requiresApproval,
                  notify_mode: value.notify_mode,
                  publish_when_ready: value.publish_when_ready,
                },
        });
        // `dismissTo`, not `replace`. Replace swaps only the *current* screen,
        // so the `/contributor` this flow was launched from stays underneath and
        // a second one lands on top of it — after a few edit-and-publish rounds
        // the stack is contributor/my-content/contributor/my-content/… and back
        // walks the whole history instead of leaving. dismissTo pops to the
        // contributor home that is already there, and falls back to replace when
        // there is none (a deep link straight into the editor).
        router.dismissTo('/contributor');
      } catch (error: any) {
        Alert.alert(t('contributor.errors.publishFailed'), error?.message ?? '');
      } finally {
        setBusy(false);
      }
    },
    [contentAssets.length, me.requiresApproval, persist, queue, router, submit, t, value],
  );

  const confirmDelete = useCallback(() => {
    if (!itemId) {
      router.back();
      return;
    }
    Alert.alert(t('contributor.create.deleteTitle'), t('contributor.create.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('contributor.create.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync(itemId);
            router.dismissTo('/contributor');
          } catch (error: any) {
            Alert.alert(t('contributor.errors.deleteFailed'), error?.message ?? '');
          }
        },
      },
    ]);
  }, [itemId, remove, router, t]);

  if (itemId && item.isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: Colors.background.dark }}
      >
        <ActivityIndicator color={Colors.darkGold} />
      </View>
    );
  }

  const primaryLabel = value.publish_at
    ? t('contributor.create.scheduleAction')
    : me.requiresApproval
      ? t('contributor.create.submitForReview')
      : t('contributor.create.publish');

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background.dark }}>
      {/* ── Status strip ─────────────────────────────────────── */}
      {item.data ? (
        <View
          className="flex-row items-center gap-3 px-4 py-2"
          style={{ borderBottomWidth: 1, borderBottomColor: Colors.border.default }}
        >
          <StatusBadge status={String(item.data.status)} />
          <Text className="flex-1 text-[11px]" style={{ color: Colors.text.muted }}>
            {saving
              ? t('contributor.create.saving')
              : dirty
                ? t('contributor.create.unsaved')
                : t('contributor.create.saved')}
          </Text>
          {item.data.status === 'published' ? (
            <Touchable
              onPress={() => router.push(`/media/item/${item.data!.id}`)}
              accessibilityRole="button"
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <Text className="text-[12px] font-semibold" style={{ color: Colors.darkGold }}>
                {t('contributor.create.preview')}
              </Text>
            </Touchable>
          ) : null}
        </View>
      ) : null}

      {item.data?.review_note ? (
        <View className="px-4 py-2" style={{ backgroundColor: 'rgba(249,115,22,0.12)' }}>
          <Text className="text-[12px]" style={{ color: Colors.zone.relegationPlayoff }}>
            {item.data.review_note}
          </Text>
        </View>
      ) : null}

      <DraftForm
        value={value}
        onChange={onChange}
        me={me}
        assets={contentAssets}
        onAddAssets={editable ? () => void addAssets('content') : undefined}
        onCaptureAsset={editable ? () => void addAssets('content', 'camera') : undefined}
        onReorderAssets={(ids) => assetMutations.reorder.mutate(ids)}
        onRemoveAsset={(assetId) => assetMutations.remove.mutate(assetId)}
        onSetCover={(assetId) => assetMutations.setCover.mutate(assetId)}
        disabled={!editable || busy}
        lockType={!!item.data}
        uploads={
          <View className="pt-2">
            <UploadProgressList entries={uploads} />
            {itemId ? (
              <View className="px-4 pt-3">
                <SectionHeading title={t('contributor.cover.title')} />
                <CoverPicker
                  coverUrl={item.data?.cover_url ?? null}
                  onUpload={() => void addAssets('cover')}
                  disabled={!editable || busy}
                />
              </View>
            ) : null}
          </View>
        }
      />

      {/* ── Action bar ───────────────────────────────────────── */}
      <View
        className="px-4 pt-3"
        style={{
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderTopColor: Colors.border.default,
          backgroundColor: Colors.background.deepDark,
        }}
      >
        <View className="flex-row items-center gap-3">
          <Touchable
            onPress={() => void persist(value)}
            disabled={busy || saving || !editable}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flex: 1,
              height: 46,
              borderRadius: 23,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: Colors.border.light,
              opacity: busy || saving || !editable ? 0.5 : pressed ? 0.8 : 1,
            })}
          >
            <Text className="text-[14px] font-semibold" style={{ color: Colors.text.primary }}>
              {t('contributor.create.saveDraft')}
            </Text>
          </Touchable>

          <Touchable
            onPress={() => void doSubmit(value.publish_at ? 'schedule' : 'publish')}
            disabled={busy || !editable}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flex: 1.4,
              height: 46,
              borderRadius: 23,
              flexDirection: 'row',
              gap: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Colors.darkGold,
              opacity: busy || !editable ? 0.5 : pressed ? 0.85 : 1,
            })}
          >
            {busy ? <ActivityIndicator size="small" color={Colors.text.dark} /> : null}
            <Text className="text-[14px] font-bold" style={{ color: Colors.text.dark }}>
              {primaryLabel}
            </Text>
          </Touchable>
        </View>

        <Touchable
          onPress={confirmDelete}
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => ({ alignSelf: 'center', paddingTop: 10, opacity: pressed ? 0.6 : 1 })}
        >
          <Text className="text-[12px] font-semibold" style={{ color: Colors.status.error }}>
            {itemId ? t('contributor.create.delete') : t('contributor.create.discard')}
          </Text>
        </Touchable>
      </View>
    </View>
  );
}
