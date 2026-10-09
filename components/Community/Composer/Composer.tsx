import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
  I18nManager,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PostService from "@/services/PostService";
import AuthService from "@/services/AuthService";
import { BarChart3, Globe, MapPin, Plus, Shield, Smile, UserPlus, Users, X } from "lucide-react-native";
import MediaService, { type UploadSlot } from "@/services/MediaService";
import { useKeyboardOffsets } from "@/hooks/useKeyboardOffsets";
import MediaPicker, { type PickedMedia } from "./MediaPicker";
import TagPicker from "./TagPicker";
import TagPeopleSheet from "./TagPeopleSheet";
import FeelingSheet from "./FeelingSheet";
import PreviewSheet from "./PreviewSheet";
import MentionSuggestions from "./MentionSuggestions";
import Avatar from "@/components/Social/Avatar";
import type { PersonCard } from "@/types/social";
import { activeMention, insertMention, TAG_MAX, type Caret } from "@/utils/mentions.core";
import FanClubService, { type FanClubCountry, type FanClub } from "@/services/FanClubService";
import Colors from "@/constants/colors";
import { LOCATION_MAX, normaliseLocation, patchPost, patchPostInPages } from "@/utils/post.core";
import { socialKeys } from "@/hooks/social/keys";
import { useUser } from "@/hooks/useUser";
import { DRAFT_VERSION, isDraftEmpty, type PostDraft } from "@/utils/postDraft.core";
import { clearDraft, keepDraftFile, loadDraft, saveDraft } from "@/utils/postDraft";
import type { Post } from "@/services/FeedService";
import { AUDIENCES, editPayload, feelingOf, overallProgress, type Audience } from "@/utils/postCompose.core";
import { POLL_DURATIONS, POLL_OPTIONS_MAX, POLL_OPTIONS_MIN, POLL_OPTION_MAX_LENGTH, validatePollDraft } from "@/utils/poll.core";

type TextField = "title" | "body";

const TITLE_MAX = 200;
const BODY_MAX = 2000;

interface Props {
  start?: 'images' | 'videos' | null;
  /** Edit mode: the author's own post, already loaded. Media stays as posted. */
  editing?: Post;
}

export default function Composer({ start = null, editing }: Props = {}) {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { keyboardVerticalOffset, bottomInset } = useKeyboardOffsets();

  const [title, setTitle] = useState(editing?.title ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [media, setMedia] = useState<PickedMedia[]>([]);
  const [location, setLocation] = useState(editing?.location_name ?? "");
  const [audience, setAudience] = useState<Audience>(editing?.audience ?? "public");
  const [feeling, setFeeling] = useState<string | null>(editing?.feeling ?? null);
  const [feelingSheet, setFeelingSheet] = useState(false);
  // A poll being written (new posts only): its options as typed and its length.
  const [pollOptions, setPollOptions] = useState<string[] | null>(null);
  const [pollDays, setPollDays] = useState<number>(1);
  // Edit mode: the tags are sent only once the author changes them, so a
  // picker still loading its country list never clears them.
  const [tagsTouched, setTagsTouched] = useState(false);
  const [preview, setPreview] = useState(false);
  const [country, setCountry] = useState<FanClubCountry | null>(null);
  const [fanClub, setFanClub] = useState<FanClub | null>(null);
  const [postAsFanClub, setPostAsFanClub] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  // 0..1 across every file of the post (postCompose.core overallProgress).
  const [uploadFraction, setUploadFraction] = useState(0);
  const [tagged, setTagged] = useState<PersonCard[]>((editing?.tagged ?? []) as PersonCard[]);
  const [tagSheet, setTagSheet] = useState(false);

  // @-autocomplete: which text field has focus, where its caret is, and a
  // caret to impose once after a mention is inserted (then released, so the
  // inputs stay uncontrolled for selection while typing).
  const [focused, setFocused] = useState<TextField | null>(null);
  const [carets, setCarets] = useState<Record<TextField, Caret>>({
    title: { start: 0, end: 0 },
    body: { start: 0, end: 0 },
  });
  const [forcedCaret, setForcedCaret] = useState<{ field: TextField; caret: Caret } | null>(null);

  const mention = useMemo(() => {
    if (!focused || submitting) return null;
    const range = activeMention(focused === "title" ? title : body, carets[focused]);
    return range ? { field: focused, range } : null;
  }, [focused, submitting, title, body, carets]);

  const onCaret = (field: TextField) => (event: { nativeEvent: { selection: Caret } }) => {
    const caret = event.nativeEvent.selection;
    setCarets((current) => ({ ...current, [field]: caret }));
    setForcedCaret((forced) => (forced?.field === field ? null : forced));
  };

  const pickMention = useCallback(
    (person: PersonCard & { username: string }) => {
      if (!mention) return;
      const { field, range } = mention;
      const current = field === "title" ? title : body;
      const next = insertMention(current, range, person.username);
      // Past the field's limit the mention would be cut; leave the text alone.
      if (next.text.length > (field === "title" ? TITLE_MAX : BODY_MAX)) return;
      if (field === "title") setTitle(next.text);
      else setBody(next.text);
      const caret = { start: next.caret, end: next.caret };
      setCarets((c) => ({ ...c, [field]: caret }));
      setForcedCaret({ field, caret });
    },
    [mention, title, body],
  );

  const { data: roles } = useQuery({
    queryKey: ['myRoles'],
    queryFn: () => AuthService.getMyRoles(),
    staleTime: 5 * 60 * 1000,
  });

  const isFanClubAdmin = roles?.fanClubAdmin ?? false;

  // Edit mode: show the post's country and fan club tags in the picker. The
  // post carries the country code and a slim fan club; the picker wants full
  // rows, so both are looked up once.
  const editingCountry = editing?.country_code ?? null;
  const editingClubId = editing?.tagged_fan_club_id ?? null;
  useEffect(() => {
    if (!editing) return;
    let live = true;
    if (editingCountry) {
      FanClubService.getCountries()
        .then((list) => {
          const match = list.find((c) => c.country_code?.toUpperCase() === editingCountry.toUpperCase());
          if (live && match) setCountry((current) => current ?? match);
        })
        .catch(() => {});
    }
    if (editingClubId) {
      FanClubService.getClubById(editingClubId)
        .then((club) => {
          if (live) setFanClub((current) => current ?? club);
        })
        .catch(() => {});
    }
    return () => {
      live = false;
    };
  }, [editing, editingCountry, editingClubId]);

  const hasMedia = media.length > 0 || (editing?.media?.length ?? 0) > 0;
  const isPoll = !editing && pollOptions !== null;
  const pollCheck = isPoll ? validatePollDraft(pollOptions!, pollDays) : null;
  // A poll needs its title and valid options (a body is optional, also when
  // editing one); anything else, a title and a body or media.
  const pollPost = editing ? editing.kind === "poll" : isPoll;
  const canPost =
    !submitting &&
    title.trim().length > 0 &&
    (isPoll ? !!pollCheck?.ok : pollPost || body.trim().length > 0 || hasMedia);
  // Only a personal post has an audience: a fan club post speaks for the club.
  const audienceApplies = editing ? editing.author_type === "user" : !postAsFanClub;
  const sentAudience: Audience = audienceApplies ? audience : "public";
  const pickedFeeling = feelingOf(feeling);

  // ── Draft (a new post only): offered back on open, saved as you type ──
  const draftUserId = !editing ? user?.id : undefined;
  // Until the author has answered "Continue your draft?" FOR THIS ACCOUNT,
  // nothing is saved: an empty composer would otherwise overwrite the draft it
  // is offering. Tied to the user id, because a composer opened before sign-in
  // gets its user later.
  const [draftReadyFor, setDraftReadyFor] = useState<string | null>(null);
  const draftReady = !draftUserId || draftReadyFor === draftUserId;
  const posted = useRef(false);
  // One copy per picked file, made once; the save after it reuses the promise.
  const keptFiles = useRef(new Map<string, Promise<string>>());
  // Only the newest save may write: an older one still copying a video loses.
  const saveSeq = useRef(0);

  useEffect(() => {
    if (!draftUserId) return;
    let live = true;
    loadDraft(draftUserId).then((saved) => {
      if (!live) return;
      if (!saved || isDraftEmpty(saved)) {
        setDraftReadyFor(draftUserId);
        return;
      }
      Alert.alert(t("community.compose.draftTitle"), t("community.compose.draftBody"), [
        {
          text: t("community.compose.draftDiscard"),
          style: "destructive",
          onPress: () => {
            void clearDraft(draftUserId);
            setDraftReadyFor(draftUserId);
          },
        },
        {
          text: t("community.compose.draftContinue"),
          onPress: () => {
            setTitle(saved.title);
            setBody(saved.body);
            setLocation(saved.location);
            setAudience(saved.audience);
            setFeeling(saved.feeling);
            setTagged(saved.tagged as PersonCard[]);
            setCountry(saved.country);
            setFanClub(saved.fanClub as FanClub | null);
            setPostAsFanClub(saved.postAsFanClub);
            setMedia(saved.media as PickedMedia[]);
            if (saved.poll) {
              setPollOptions(saved.poll.options);
              setPollDays(saved.poll.days);
            }
            setDraftReadyFor(draftUserId);
          },
        },
      ]);
    });
    return () => {
      live = false;
    };
    // Once, on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftUserId]);

  useEffect(() => {
    if (!draftUserId || !draftReady || submitting) return;
    const keep = (uri: string) => {
      let copy = keptFiles.current.get(uri);
      if (!copy) {
        copy = keepDraftFile(draftUserId, uri);
        keptFiles.current.set(uri, copy);
        copy.catch(() => keptFiles.current.delete(uri));
      }
      return copy;
    };
    const timer = setTimeout(async () => {
      if (posted.current) return;
      const seq = ++saveSeq.current;
      try {
        // Copies that survive a restart, each made once per picked file.
        const kept = await Promise.all(
          media.map(async (m) => ({
            ...m,
            uri: await keep(m.uri),
            ...(m.thumbnailUri ? { thumbnailUri: await keep(m.thumbnailUri) } : {}),
          })),
        );
        if (posted.current || seq !== saveSeq.current) return;
        const draft: PostDraft = {
          v: DRAFT_VERSION,
          savedAt: new Date().toISOString(),
          title,
          body,
          location,
          audience,
          feeling,
          tagged: tagged.map((p) => ({ id: p.id, name: p.name, username: p.username ?? null, avatar_url: p.avatar_url ?? null })),
          country,
          fanClub: fanClub as unknown as Record<string, unknown> | null,
          postAsFanClub,
          poll: pollOptions ? { options: pollOptions, days: pollDays } : null,
          media: kept.map((m) => ({
            uri: m.uri,
            kind: m.kind,
            mime: m.mime,
            width: m.width,
            height: m.height,
            durationMs: m.durationMs,
            sizeBytes: m.sizeBytes,
            ...(m.thumbnailUri ? { thumbnailUri: m.thumbnailUri } : {}),
          })),
        };
        await saveDraft(draftUserId, draft);
      } catch {
        // A draft that fails to save never blocks posting.
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [draftUserId, draftReady, submitting, title, body, location, audience, feeling, tagged, country, fanClub, postAsFanClub, media, pollOptions, pollDays]);

  const handleSave = useCallback(async () => {
    if (!editing || !canPost) return;
    const payload = editPayload(editing, {
      title,
      body,
      location,
      audience: sentAudience,
      feeling,
      taggedIds: tagged.slice(0, TAG_MAX).map((p) => p.id),
      countryCode: tagsTouched ? country?.country_code ?? null : undefined,
      fanClubId: tagsTouched ? fanClub?.id ?? null : undefined,
    });
    if (!Object.keys(payload).length) {
      router.back();
      return;
    }
    setSubmitting(true);
    try {
      await PostService.updatePost(editing.id, payload);
      // What can be patched now is; the rest (status, tagged people, edited
      // marker) comes back with the refetch.
      const patch: Partial<Post> = {};
      if (payload.title !== undefined) patch.title = payload.title;
      if (payload.body !== undefined) patch.body = payload.body;
      if (payload.location_name !== undefined) patch.location_name = payload.location_name;
      if (payload.audience !== undefined) patch.audience = payload.audience;
      if (payload.feeling !== undefined) patch.feeling = payload.feeling;
      queryClient.setQueryData<Post>(["post", editing.id], (p) => patchPost(p, editing.id, patch));
      queryClient.setQueriesData({ queryKey: ["feed"] }, (d: any) => patchPostInPages(d, editing.id, patch));
      queryClient.invalidateQueries({ queryKey: ["post", editing.id] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: [...socialKeys.all, "profile"] });
      setPreview(false);
      router.back();
    } catch (err: any) {
      Alert.alert(t("common.error"), err.message ?? t("community.failedToPost"));
    } finally {
      setSubmitting(false);
    }
  }, [editing, canPost, title, body, location, sentAudience, feeling, tagged, tagsTouched, country, fanClub, queryClient, router, t]);

  const handlePost = useCallback(async () => {
    if (!canPost) return;
    setSubmitting(true);

    // Set once the post exists: anything failing after that deletes it again,
    // so there is never a half-posted post and a retry starts clean.
    let createdId: string | null = null;
    try {
      // One video, or up to ten photos (MediaPicker never mixes them), or a
      // poll, which takes no media.
      const kind: "text" | "image" | "video" | "poll" =
        pollCheck?.ok ? "poll" : media[0]?.kind ?? "text";
      const locationName = normaliseLocation(location);

      const post = await PostService.createPost({
        kind,
        title: title.trim(),
        body: body.trim() || undefined,
        audience: sentAudience,
        ...(feeling ? { feeling } : {}),
        ...(pollCheck?.ok ? { poll: { options: pollCheck.options, duration_days: pollDays } } : {}),
        country_code: country?.country_code ?? undefined,
        ...(locationName ? { location_name: locationName } : {}),
        ...(tagged.length ? { tagged_user_ids: tagged.slice(0, TAG_MAX).map((p) => p.id) } : {}),
        ...(postAsFanClub && roles?.fanClubId
          ? { fan_club_id: roles.fanClubId }
          : { tagged_fan_club_id: fanClub?.id ?? undefined }),
      });
      createdId = post.id;

      // Reserve every slot before any upload completes. The post stays pending
      // until its last reserved item completes, and the backend refuses new
      // slots (409 media_locked) once one has.
      if (media.length > 0) setUploadProgress(t('community.uploadingMedia'));
      const slots: UploadSlot[] = [];
      for (let position = 0; position < media.length; position++) {
        slots.push(await MediaService.requestUploadSlot(media[position].kind, post.id, position));
      }

      // One at a time, each with its place in the carousel: a stadium
      // connection shared by ten parallel uploads finishes none of them.
      for (let position = 0; position < media.length; position++) {
        const item = media[position];
        setUploadProgress(
          media.length > 1
            ? t('community.uploadingMediaCount', { current: position + 1, total: media.length })
            : t('community.uploadingMedia'),
        );
        // Rounded to whole percent: iOS reports every chunk, and an unchanged
        // value skips the re-render.
        const onProgress = (fraction: number) =>
          setUploadFraction(Math.round(overallProgress(position, fraction, media.length) * 100) / 100);
        if (item.kind === "image") {
          await MediaService.uploadImage(item.uri, post.id, position, slots[position], onProgress);
        } else {
          await MediaService.uploadVideo(item.uri, post.id, position, slots[position], onProgress, item);
        }
      }

      // Posted: the draft is done with, and no pending save may bring it back.
      posted.current = true;
      if (user?.id) void clearDraft(user.id);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      // Your profile's grid and post count, if you came here from "+ Create".
      queryClient.invalidateQueries({ queryKey: [...socialKeys.all, "profile"] });
      setPreview(false);
      router.back();
    } catch (err: any) {
      // Best-effort: the composer keeps its state, so the user can retry.
      if (createdId) PostService.deletePost(createdId).catch(() => {});
      Alert.alert(t('common.error'), err.message ?? t('community.failedToPost'));
    } finally {
      setSubmitting(false);
      setUploadProgress("");
      setUploadFraction(0);
    }
  }, [canPost, title, body, media, location, tagged, country, fanClub, postAsFanClub, roles, sentAudience, feeling, pollCheck, pollDays, user, queryClient, router, t]);

  const submit = editing ? handleSave : handlePost;

  // The post as the feed would show it, for the preview.
  const previewPost = useMemo<Post>(() => {
    const profile = user?.profile;
    const now = new Date().toISOString();
    return {
      ...(editing ?? {}),
      id: editing?.id ?? "preview",
      author_id: editing?.author_id ?? user?.id ?? "",
      author_type: editing?.author_type ?? (postAsFanClub ? "fan_club" : "user"),
      author: editing?.author ?? {
        id: user?.id ?? "",
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        role: "user",
        country_code: null,
      },
      fan_club: editing?.fan_club ?? (postAsFanClub && roles?.fanClubName ? { id: roles.fanClubId ?? "", name: roles.fanClubName, logo_url: null, is_verified: false } as Post["fan_club"] : null),
      kind: editing?.kind ?? (pollOptions ? "poll" : media[0]?.kind ?? "text"),
      title: title.trim() || null,
      body: body.trim() || null,
      location_name: location.trim() || null,
      audience: sentAudience,
      feeling,
      tagged: tagged.map((p) => ({ id: p.id, username: p.username ?? null, name: p.name, avatar_url: p.avatar_url ?? null })),
      created_at: editing?.created_at ?? now,
      media: editing?.media ?? [],
      poll:
        editing?.poll ??
        (pollOptions
          ? {
              closes_at: new Date(Date.now() + pollDays * 86_400_000).toISOString(),
              options: pollOptions.map((label, position) => ({ id: `preview-${position}`, position, label: label.trim() })),
            }
          : null),
    } as Post;
  }, [editing, user, postAsFanClub, roles, media, title, body, location, sentAudience, feeling, tagged, pollOptions, pollDays]);

  return (
    // The offset makes the lift include the header (useKeyboardOffsets explains
    // why); without it the Post bar stayed behind the keyboard on iOS.
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={styles.root}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        // Swipe the form down to put the keyboard away.
        keyboardDismissMode="interactive"
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.card}>

          {/* ── Title ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{t('community.titleLabel')}</Text>
          </View>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('community.titlePlaceholder')}
            placeholderTextColor={Colors.text.muted}
            maxLength={TITLE_MAX}
            style={styles.titleInput}
            editable={!submitting}
            returnKeyType="next"
            onFocus={() => setFocused("title")}
            onBlur={() => setFocused((f) => (f === "title" ? null : f))}
            onSelectionChange={onCaret("title")}
            selection={forcedCaret?.field === "title" ? forcedCaret.caret : undefined}
          />
          {mention?.field === "title" ? <MentionSuggestions query={mention.range.query} onPick={pickMention} /> : null}

          <View style={styles.divider} />

          {/* ── Content ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{t('community.contentLabel')}</Text>
          </View>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={t('community.contentPlaceholder')}
            placeholderTextColor={Colors.text.muted}
            multiline
            maxLength={BODY_MAX}
            style={styles.bodyInput}
            editable={!submitting}
            onFocus={() => setFocused("body")}
            onBlur={() => setFocused((f) => (f === "body" ? null : f))}
            onSelectionChange={onCaret("body")}
            selection={forcedCaret?.field === "body" ? forcedCaret.caret : undefined}
          />
          {mention?.field === "body" ? <MentionSuggestions query={mention.range.query} onPick={pickMention} /> : null}

          <View style={styles.divider} />

          {/* ── Media ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{t('community.mediaLabel')}</Text>
          </View>
          {editing ? (
            // Uploaded media is locked server-side (409 media_locked).
            <Text style={styles.note}>{t("community.compose.mediaLocked")}</Text>
          ) : isPoll ? (
            // A poll takes no photos or videos (the server refuses them too).
            <Text style={styles.note}>{t("community.poll.noMedia")}</Text>
          ) : (
            // Create → Photo/Video opens the library only once "Continue your
            // draft?" is answered: Continue would replace what was just picked.
            <MediaPicker media={media} onChange={setMedia} disabled={submitting} start={draftReady ? start : null} />
          )}

          {/* ── Poll ── */}
          {editing?.kind === "poll" && editing.poll ? (
            <>
              <View style={styles.divider} />
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{t("community.poll.label")}</Text>
              </View>
              {[...editing.poll.options].sort((a, b) => a.position - b.position).map((o) => (
                <Text key={o.id} style={styles.pollLocked}>{o.label}</Text>
              ))}
              <Text style={styles.note}>{t("community.poll.locked")}</Text>
            </>
          ) : null}
          {!editing && media.length === 0 ? (
            <>
              <View style={styles.divider} />
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{t("community.poll.label")}</Text>
              </View>
              {pollOptions ? (
                <View style={styles.pollEditor}>
                  {pollOptions.map((value, i) => (
                    <View key={i} style={styles.pollRow}>
                      <TextInput
                        value={value}
                        onChangeText={(text) => setPollOptions((list) => (list ? list.map((v, j) => (j === i ? text : v)) : list))}
                        placeholder={t("community.poll.optionPlaceholder", { n: i + 1 })}
                        placeholderTextColor={Colors.text.muted}
                        maxLength={POLL_OPTION_MAX_LENGTH}
                        editable={!submitting}
                        accessibilityLabel={t("community.poll.optionPlaceholder", { n: i + 1 })}
                        style={styles.pollInput}
                      />
                      {pollOptions.length > POLL_OPTIONS_MIN ? (
                        <TouchableOpacity
                          onPress={() => setPollOptions((list) => (list ? list.filter((_, j) => j !== i) : list))}
                          disabled={submitting}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={t("community.poll.removeOption")}
                        >
                          <X size={16} color={Colors.text.tertiary} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))}
                  {pollOptions.length < POLL_OPTIONS_MAX ? (
                    <TouchableOpacity
                      onPress={() => setPollOptions((list) => (list ? [...list, ""] : list))}
                      disabled={submitting}
                      style={styles.tagButton}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                    >
                      <Plus size={16} color={Colors.darkGold} />
                      <Text style={styles.tagButtonText}>{t("community.poll.addOption")}</Text>
                    </TouchableOpacity>
                  ) : null}
                  <Text style={styles.subLabel}>{t("community.poll.duration")}</Text>
                  <Text style={styles.note}>{t("community.poll.durationNote")}</Text>
                  <View style={styles.pollDays} accessibilityRole="radiogroup">
                    {POLL_DURATIONS.map((d) => {
                      const on = pollDays === d;
                      return (
                        <TouchableOpacity
                          key={d}
                          onPress={() => setPollDays(d)}
                          disabled={submitting}
                          activeOpacity={0.8}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: on }}
                          style={[styles.choice, on && styles.choiceOn]}
                        >
                          <Text style={[styles.choiceText, on && styles.choiceTextOn]}>{t("community.poll.days", { count: d })}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TouchableOpacity
                    onPress={() => setPollOptions(null)}
                    disabled={submitting}
                    accessibilityRole="button"
                    style={styles.pollRemove}
                  >
                    <Text style={styles.pollRemoveText}>{t("community.poll.remove")}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.chips}>
                  <TouchableOpacity
                    onPress={() => setPollOptions(["", ""])}
                    disabled={submitting}
                    style={styles.tagButton}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                  >
                    <BarChart3 size={16} color={Colors.darkGold} />
                    <Text style={styles.tagButtonText}>{t("community.poll.add")}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : null}

          <View style={styles.divider} />

          {/* ── Location ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{t('community.locationLabel')}</Text>
          </View>
          <View style={styles.locationRow}>
            <MapPin size={16} color={Colors.darkGold} />
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder={t('community.locationPlaceholder')}
              placeholderTextColor={Colors.text.muted}
              maxLength={LOCATION_MAX}
              style={styles.locationInput}
              editable={!submitting}
              returnKeyType="done"
              accessibilityLabel={t('community.locationLabel')}
            />
          </View>

          <View style={styles.divider} />

          {/* ── Tag people ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{t('community.tagPeopleLabel')}</Text>
          </View>
          <View style={styles.chips}>
            {tagged.map((person) => (
              <View key={person.id} style={styles.chip}>
                <Avatar uri={person.avatar_url} name={person.name} size={22} />
                <Text style={styles.chipText} numberOfLines={1}>
                  {person.username ? `@${person.username}` : person.name}
                </Text>
                <TouchableOpacity
                  onPress={() => setTagged((list) => list.filter((p) => p.id !== person.id))}
                  disabled={submitting}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t('community.untagPerson', { name: person.name })}
                >
                  <X size={14} color={Colors.text.tertiary} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => setTagSheet(true)}
              disabled={submitting}
              style={styles.tagButton}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('community.tagPeopleAdd')}
            >
              <UserPlus size={16} color={Colors.darkGold} />
              <Text style={styles.tagButtonText}>
                {tagged.length ? t('community.tagPeopleEdit') : t('community.tagPeopleAdd')}
              </Text>
            </TouchableOpacity>
          </View>

          {audienceApplies && (
            <>
              <View style={styles.divider} />
              {/* ── Audience ── */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{t("community.compose.audienceLabel")}</Text>
              </View>
              <View style={styles.chips} accessibilityRole="radiogroup">
                {AUDIENCES.map((a) => {
                  const on = audience === a;
                  const Icon = a === "friends" ? Users : Globe;
                  return (
                    <TouchableOpacity
                      key={a}
                      onPress={() => setAudience(a)}
                      disabled={submitting}
                      activeOpacity={0.8}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      style={[styles.choice, on && styles.choiceOn]}
                    >
                      <Icon size={15} color={on ? Colors.text.dark : Colors.text.secondary} />
                      <Text style={[styles.choiceText, on && styles.choiceTextOn]}>{t(`community.compose.audience.${a}`)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <View style={styles.divider} />
          {/* ── Feeling / activity ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{t("community.compose.feelingLabel")}</Text>
          </View>
          <View style={styles.chips}>
            <TouchableOpacity
              onPress={() => setFeelingSheet(true)}
              disabled={submitting}
              style={styles.tagButton}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${t("community.compose.feelingLabel")}: ${
                pickedFeeling ? t(`community.compose.feeling.${pickedFeeling.key}`) : t("community.compose.feelingNone")
              }`}
            >
              {pickedFeeling ? (
                <Text style={styles.emoji}>{pickedFeeling.emoji}</Text>
              ) : (
                <Smile size={16} color={Colors.darkGold} />
              )}
              <Text style={styles.tagButtonText}>
                {pickedFeeling ? t(`community.compose.feeling.${pickedFeeling.key}`) : t("community.compose.feelingNone")}
              </Text>
            </TouchableOpacity>
          </View>

          {!editing && isFanClubAdmin && (
            <>
              <View style={styles.divider} />
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{t('community.postAsLabel')}</Text>
              </View>
              <View style={styles.toggleRow}>
                <Shield size={16} color={Colors.darkGold} />
                <Text style={styles.toggleLabel}>{roles?.fanClubName}</Text>
                <Switch
                  value={postAsFanClub}
                  onValueChange={(v) => {
                    setPostAsFanClub(v);
                    if (v) { setCountry(null); setFanClub(null); }
                  }}
                  trackColor={{ false: Colors.border.default, true: Colors.darkGold }}
                  thumbColor="#fff"
                  disabled={submitting}
                />
              </View>
            </>
          )}

          {(editing ? editing.author_type === "user" : !postAsFanClub) && (
            <>
              <View style={styles.divider} />
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{t('community.tagsLabel')}</Text>
              </View>
              <TagPicker
                selectedCountry={country}
                selectedFanClub={fanClub}
                onCountryChange={(c) => {
                  setCountry(c);
                  setTagsTouched(true);
                }}
                onFanClubChange={(c) => {
                  setFanClub(c);
                  setTagsTouched(true);
                }}
              />
            </>
          )}

        </View>

        <TagPeopleSheet visible={tagSheet} selected={tagged} onChange={setTagged} onClose={() => setTagSheet(false)} />
        <FeelingSheet visible={feelingSheet} value={feeling} onChange={setFeeling} onClose={() => setFeelingSheet(false)} />
        <PreviewSheet
          visible={preview}
          post={previewPost}
          media={media}
          submitting={submitting}
          confirmLabel={editing ? t("community.compose.save") : t("community.compose.post")}
          onConfirm={submit}
          onClose={() => setPreview(false)}
        />

        {editing ? <Text style={styles.note}>{t("community.compose.reviewNote")}</Text> : null}

        {uploadProgress ? (
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(uploadFraction * 100) }}
            style={styles.progressBox}
          >
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(uploadFraction * 100)}%` }]} />
            </View>
            <Text style={styles.progress}>
              {uploadProgress} {Math.round(uploadFraction * 100)}%
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* ── Post button ── */}
      <View style={[styles.footer, styles.footerRow, { paddingBottom: 12 + bottomInset }]}>
        <TouchableOpacity
          onPress={() => setPreview(true)}
          disabled={!canPost}
          style={[styles.previewButton, !canPost && styles.previewButtonDisabled]}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={[styles.previewButtonText, !canPost && styles.postButtonTextDisabled]}>
            {t("community.compose.preview")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={submit}
          disabled={!canPost}
          style={[styles.postButton, styles.postButtonGrow, !canPost && styles.postButtonDisabled]}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.textWhite} />
          ) : (
            <Text style={[styles.postButtonText, !canPost && styles.postButtonTextDisabled]}>
              {editing ? t("community.compose.save") : t('community.post')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  scroll: {
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.card,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: Colors.darkGold,
  },
  titleInput: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  bodyInput: {
    color: Colors.text.primary,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
    paddingHorizontal: 16,
    paddingBottom: 14,
    textAlignVertical: 'top',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border.default,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  locationInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 15,
    paddingVertical: 0,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    paddingVertical: 4,
    paddingStart: 4,
    paddingEnd: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.medium,
  },
  chipText: {
    flexShrink: 1,
    color: Colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.darkGold,
  },
  tagButtonText: {
    color: Colors.darkGold,
    fontSize: 13,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  toggleLabel: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border.default,
    backgroundColor: Colors.background.dark,
  },
  postButton: {
    backgroundColor: Colors.darkGold,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: Colors.background.light,
  },
  postButtonGrow: {
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  previewButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.darkGold,
    alignItems: 'center',
  },
  previewButtonDisabled: {
    borderColor: Colors.border.default,
  },
  previewButtonText: {
    color: Colors.darkGold,
    fontWeight: '700',
    fontSize: 15,
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.medium,
  },
  choiceOn: {
    backgroundColor: Colors.darkGold,
    borderColor: Colors.darkGold,
  },
  choiceText: {
    color: Colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  choiceTextOn: {
    color: Colors.text.dark,
  },
  emoji: {
    fontSize: 16,
  },
  pollEditor: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  pollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.background.medium,
  },
  pollInput: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: 15,
    paddingVertical: 10,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  pollDays: {
    flexDirection: 'row',
    gap: 8,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  pollRemove: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  pollRemoveText: {
    color: Colors.status.error,
    fontSize: 13,
    fontWeight: '600',
  },
  pollLocked: {
    color: Colors.text.primary,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  note: {
    fontSize: 13,
    color: Colors.text.tertiary,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  postButtonText: {
    color: Colors.textWhite,
    fontWeight: '700',
    fontSize: 15,
  },
  postButtonTextDisabled: {
    color: Colors.text.muted,
  },
  progressBox: {
    gap: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: Colors.background.light,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.darkGold,
  },
  progress: {
    fontSize: 13,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});
