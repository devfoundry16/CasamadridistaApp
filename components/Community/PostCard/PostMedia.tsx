import React, { useCallback, useState } from 'react';
import { View, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { PostMedia as PostMediaType } from '@/services/FeedService';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_HEIGHT = 420;

interface Props {
  media: PostMediaType[];
  paused?: boolean;
}

function aspectRatio(m: PostMediaType) {
  if (m.width && m.height) return m.width / m.height;
  return 16 / 9;
}

function VideoPlayer({ media, paused }: { media: PostMediaType; paused: boolean }) {
  const src = media.hls_url ?? media.public_url ?? undefined;
  const player = useVideoPlayer(src ? { uri: src } : null, (p) => {
    p.loop = false;
    if (!paused) p.play();
  });

  const ratio = aspectRatio(media);
  const height = Math.min(SCREEN_WIDTH / ratio, MAX_HEIGHT);

  return (
    <View style={{ width: SCREEN_WIDTH, height }}>
      <VideoView
        player={player}
        style={{ width: SCREEN_WIDTH, height }}
        contentFit="cover"
        nativeControls
      />
    </View>
  );
}

function ImageItem({ media, onPress }: { media: PostMediaType; onPress: () => void }) {
  const { t } = useTranslation();
  const ratio  = aspectRatio(media);
  const height = Math.min(SCREEN_WIDTH / ratio, MAX_HEIGHT);
  const [loaded, setLoaded] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      style={{ width: SCREEN_WIDTH, height }}
      accessibilityRole="imagebutton"
      accessibilityLabel={t('community.openPhoto')}
    >
      {!loaded && (
        <View className="absolute inset-0 items-center justify-center" style={{ backgroundColor: Colors.background.medium }}>
          <ActivityIndicator color={Colors.darkGold} />
        </View>
      )}
      <Image
        source={{ uri: media.thumbnail_url ?? undefined }}
        placeholder={media.blurhash ?? undefined}
        style={{ width: SCREEN_WIDTH, height }}
        contentFit="cover"
        transition={300}
        onLoad={() => setLoaded(true)}
      />
    </Pressable>
  );
}

export default function PostMedia({ media, paused = true }: Props) {
  const router = useRouter();

  const openPhoto = useCallback(
    (m: PostMediaType) => {
      router.push({
        pathname: '/community/photo/[postId]',
        params: { postId: m.post_id, mediaId: m.id },
      });
    },
    [router],
  );

  const ready = media.filter((m) => m.status === 'ready');
  if (!ready.length) return null;

  return (
    <View className="mt-1">
      {ready.map((m) =>
        m.kind === 'video' ? (
          <VideoPlayer key={m.id} media={m} paused={paused} />
        ) : (
          <ImageItem key={m.id} media={m} onPress={() => openPhoto(m)} />
        )
      )}
    </View>
  );
}
