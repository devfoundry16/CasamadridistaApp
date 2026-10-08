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
import { MapPin, Shield, UserPlus, X } from "lucide-react-native";
import MediaService, { type UploadSlot } from "@/services/MediaService";
import { useKeyboardOffsets } from "@/hooks/useKeyboardOffsets";
import MediaPicker, { type PickedMedia } from "./MediaPicker";
import TagPicker from "./TagPicker";
import TagPeopleSheet from "./TagPeopleSheet";
import MentionSuggestions from "./MentionSuggestions";
import Avatar from "@/components/Social/Avatar";
import type { PersonCard } from "@/types/social";
import { activeMention, insertMention, TAG_MAX, type Caret } from "@/utils/mentions.core";
import type { FanClubCountry, FanClub } from "@/services/FanClubService";
import Colors from "@/constants/colors";
import { LOCATION_MAX, normaliseLocation } from "@/utils/post.core";
import { socialKeys } from "@/hooks/social/keys";

type TextField = "title" | "body";

const TITLE_MAX = 200;
const BODY_MAX = 2000;

export default function Composer({ start = null }: { start?: 'images' | 'videos' | null } = {}) {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { keyboardVerticalOffset, bottomInset } = useKeyboardOffsets();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<PickedMedia[]>([]);
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState<FanClubCountry | null>(null);
  const [fanClub, setFanClub] = useState<FanClub | null>(null);
  const [postAsFanClub, setPostAsFanClub] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [tagged, setTagged] = useState<PersonCard[]>([]);
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

  const canPost = !submitting && title.trim().length > 0 && (body.trim().length > 0 || media.length > 0);

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
      router.back();
    } catch (err: any) {
      // Best-effort: the composer keeps its state, so the user can retry.
      if (createdId) PostService.deletePost(createdId).catch(() => {});
      Alert.alert(t('common.error'), err.message ?? t('community.failedToPost'));
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  }, [canPost, title, body, media, location, tagged, country, fanClub, postAsFanClub, roles, queryClient, router, t]);

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
          <MediaPicker media={media} onChange={setMedia} disabled={submitting} start={start} />

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

          {isFanClubAdmin && (
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

          {!postAsFanClub && (
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

        {uploadProgress ? (
          <Text style={styles.progress}>{uploadProgress}</Text>
        ) : null}
      </ScrollView>

      {/* ── Post button ── */}
      <View style={[styles.footer, { paddingBottom: 12 + bottomInset }]}>
        <TouchableOpacity
          onPress={handlePost}
          disabled={!canPost}
          style={[styles.postButton, !canPost && styles.postButtonDisabled]}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.textWhite} />
          ) : (
            <Text style={[styles.postButtonText, !canPost && styles.postButtonTextDisabled]}>
              {t('community.post')}
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
