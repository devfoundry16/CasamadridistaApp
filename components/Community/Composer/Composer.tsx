import React, { useState, useCallback } from "react";
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
import { MapPin, Shield } from "lucide-react-native";
import MediaService, { type UploadSlot } from "@/services/MediaService";
import MediaPicker, { type PickedMedia } from "./MediaPicker";
import TagPicker from "./TagPicker";
import type { FanClubCountry, FanClub } from "@/services/FanClubService";
import Colors from "@/constants/colors";
import { LOCATION_MAX, normaliseLocation } from "@/utils/post.core";
import { socialKeys } from "@/hooks/social/keys";

export default function Composer() {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<PickedMedia[]>([]);
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState<FanClubCountry | null>(null);
  const [fanClub, setFanClub] = useState<FanClub | null>(null);
  const [postAsFanClub, setPostAsFanClub] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

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
  }, [canPost, title, body, media, location, country, fanClub, postAsFanClub, roles, queryClient, router, t]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
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
            maxLength={200}
            style={styles.titleInput}
            editable={!submitting}
            returnKeyType="next"
          />

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
            maxLength={2000}
            style={styles.bodyInput}
            editable={!submitting}
          />

          <View style={styles.divider} />

          {/* ── Media ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>{t('community.mediaLabel')}</Text>
          </View>
          <MediaPicker media={media} onChange={setMedia} disabled={submitting} />

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

        {uploadProgress ? (
          <Text style={styles.progress}>{uploadProgress}</Text>
        ) : null}
      </ScrollView>

      {/* ── Post button ── */}
      <View style={styles.footer}>
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
