import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import PostService from "@/services/PostService";
import MediaService from "@/services/MediaService";
import MediaPicker, { type PickedMedia } from "./MediaPicker";
import TagPicker from "./TagPicker";
import type { FanClubCountry, FanClub } from "@/services/FanClubService";
import Colors from "@/constants/colors";

export default function Composer() {
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [body, setBody] = useState("");
  const [media, setMedia] = useState<PickedMedia | null>(null);
  const [country, setCountry] = useState<FanClubCountry | null>(null);
  const [fanClub, setFanClub] = useState<FanClub | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const canPost = !submitting && (body.trim().length > 0 || !!media);

  const handlePost = useCallback(async () => {
    if (!canPost) return;
    setSubmitting(true);

    try {
      const kind: "text" | "image" | "video" = media?.kind ?? "text";

      // 1. Create post row
      const post = await PostService.createPost({
        kind,
        body: body.trim() || undefined,
        country_code: country?.country_code ?? undefined,
        tagged_fan_club_id: fanClub?.id ?? undefined,
      });

      // 2. Upload media if present
      if (media) {
        setUploadProgress("Uploading media…");
        if (media.kind === "image") {
          await MediaService.uploadImage(media.uri, post.id);
        } else {
          await MediaService.uploadVideo(media.uri, post.id);
        }
      }

      // Invalidate feed cache so new post appears
      queryClient.invalidateQueries({ queryKey: ["feed"] });

      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to post");
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  }, [canPost, body, media, country, fanClub, queryClient, router]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handlePost}
          disabled={!canPost}
          className="rounded-full px-4 py-1.5 mr-1"
        >
          {submitting ? (
            <ActivityIndicator size="small" color={Colors.textWhite} />
          ) : (
            <Text
              style={{
                color: Colors.textWhite,
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              Post
            </Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, canPost, submitting, handlePost]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-bg-medium"
    >
      <ScrollView keyboardShouldPersistTaps="handled" className="flex-1">
        {/* Text input */}
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Share something with the Madridista community…"
          placeholderTextColor={Colors.text.muted}
          multiline
          maxLength={2000}
          className="px-4 py-3 text-base"
          style={{ color: Colors.text.primary, minHeight: 120 }}
          editable={!submitting}
        />

        {/* Media */}
        <MediaPicker media={media} onPick={setMedia} />

        {/* Tags */}
        <TagPicker
          selectedCountry={country}
          selectedFanClub={fanClub}
          onCountryChange={setCountry}
          onFanClubChange={setFanClub}
        />

        {uploadProgress ? (
          <Text
            className="px-4 text-sm"
            style={{ color: Colors.text.tertiary }}
          >
            {uploadProgress}
          </Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
