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
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PostService from "@/services/PostService";
import AuthService from "@/services/AuthService";
import { Shield } from "lucide-react-native";
import MediaService from "@/services/MediaService";
import MediaPicker, { type PickedMedia } from "./MediaPicker";
import TagPicker from "./TagPicker";
import type { FanClubCountry, FanClub } from "@/services/FanClubService";
import Colors from "@/constants/colors";

export default function Composer() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<PickedMedia | null>(null);
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

  const canPost = !submitting && title.trim().length > 0 && (body.trim().length > 0 || !!media);

  const handlePost = useCallback(async () => {
    if (!canPost) return;
    setSubmitting(true);

    try {
      const kind: "text" | "image" | "video" = media?.kind ?? "text";

      const post = await PostService.createPost({
        kind,
        title: title.trim(),
        body: body.trim() || undefined,
        country_code: country?.country_code ?? undefined,
        ...(postAsFanClub && roles?.fanClubId
          ? { fan_club_id: roles.fanClubId }
          : { tagged_fan_club_id: fanClub?.id ?? undefined }),
      });

      if (media) {
        setUploadProgress("Uploading media…");
        if (media.kind === "image") {
          await MediaService.uploadImage(media.uri, post.id);
        } else {
          await MediaService.uploadVideo(media.uri, post.id);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["feed"] });
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to post");
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  }, [canPost, title, body, media, country, fanClub, queryClient, router]);

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
            <Text style={styles.sectionLabel}>Title</Text>
          </View>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Add a title…"
            placeholderTextColor={Colors.text.muted}
            maxLength={200}
            style={styles.titleInput}
            editable={!submitting}
            returnKeyType="next"
          />

          <View style={styles.divider} />

          {/* ── Content ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Content</Text>
          </View>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Share something with the Madridista community…"
            placeholderTextColor={Colors.text.muted}
            multiline
            maxLength={2000}
            style={styles.bodyInput}
            editable={!submitting}
          />

          <View style={styles.divider} />

          {/* ── Media ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Media</Text>
          </View>
          <MediaPicker media={media} onPick={setMedia} />

          {isFanClubAdmin && (
            <>
              <View style={styles.divider} />
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>Post As</Text>
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
                <Text style={styles.sectionLabel}>Tags</Text>
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
              Post
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
