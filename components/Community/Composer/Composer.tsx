import React, { useState, useCallback, useMemo } from "react";
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
import { Globe, MapPin, Shield, Smile, UserPlus, Users, X } from "lucide-react-native";
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
import type { FanClubCountry, FanClub } from "@/services/FanClubService";
import Colors from "@/constants/colors";
import { LOCATION_MAX, normaliseLocation, patchPost, patchPostInPages } from "@/utils/post.core";
import { socialKeys } from "@/hooks/social/keys";
import { useUser } from "@/hooks/useUser";
import type { Post } from "@/services/FeedService";
import { AUDIENCES, editPayload, feelingOf, type Audience } from "@/utils/postCompose.core";

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
  const [preview, setPreview] = useState(false);
  const [country, setCountry] = useState<FanClubCountry | null>(null);
  const [fanClub, setFanClub] = useState<FanClub | null>(null);
  const [postAsFanClub, setPostAsFanClub] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
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

  const hasMedia = media.length > 0 || (editing?.media?.length ?? 0) > 0;
  const canPost = !submitting && title.trim().length > 0 && (body.trim().length > 0 || hasMedia);
  // Only a personal post has an audience: a fan club post speaks for the club.
  const audienceApplies = editing ? editing.author_type === "user" : !postAsFanClub;
  const sentAudience: Audience = audienceApplies ? audience : "public";
  const pickedFeeling = feelingOf(feeling);

  const handleSave = useCallback(async () => {
    if (!editing || !canPost) return;
    const payload = editPayload(editing, {
      title,
      body,
      location,
      audience: sentAudience,
      feeling,
      taggedIds: tagged.slice(0, TAG_MAX).map((p) => p.id),
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
  }, [editing, canPost, title, body, location, sentAudience, feeling, tagged, queryClient, router, t]);

  const handlePost = useCallback(async () => {
    if (!canPost) return;
    setSubmitting(true);

    // Set once the post exists: anything failing after that deletes it again,
    // so there is never a half-posted post and a retry starts clean.
    let createdId: string | null = null;
    try {
      // One video, or up to ten photos: MediaPicker never mixes them.
      const kind: "text" | "image" | "video" = media[0]?.kind ?? "text";
      const locationName = normaliseLocation(location);

      const post = await PostService.createPost({
        kind,
        title: title.trim(),
        body: body.trim() || undefined,
        audience: sentAudience,
        ...(feeling ? { feeling } : {}),
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
        if (item.kind === "image") {
          await MediaService.uploadImage(item.uri, post.id, position, slots[position]);
        } else {
          await MediaService.uploadVideo(item.uri, post.id, position, slots[position]);
        }
      }

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
    }
  }, [canPost, title, body, media, location, tagged, country, fanClub, postAsFanClub, roles, sentAudience, feeling, queryClient, router, t]);

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
      kind: editing?.kind ?? media[0]?.kind ?? "text",
      title: title.trim() || null,
      body: body.trim() || null,
      location_name: location.trim() || null,
      audience: sentAudience,
      feeling,
      tagged: tagged.map((p) => ({ id: p.id, username: p.username ?? null, name: p.name, avatar_url: p.avatar_url ?? null })),
      created_at: editing?.created_at ?? now,
      media: editing?.media ?? [],
    } as Post;
  }, [editing, user, postAsFanClub, roles, media, title, body, location, sentAudience, feeling, tagged]);

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
          ) : (
            <MediaPicker media={media} onChange={setMedia} disabled={submitting} start={start} />
          )}

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

          {!editing && !postAsFanClub && (
            <>
              <View style={styles.divider} />
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{t('community.tagsLabel')}</Text>
              </View>
              <TagPicker
                selectedCountry={country}
                selectedFanClub={fanClub}
                onCountryChange={setCountry}
                onFanClubChange={setFanClub}
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
          <Text style={styles.progress}>{uploadProgress}</Text>
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
  progress: {
    fontSize: 13,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});
