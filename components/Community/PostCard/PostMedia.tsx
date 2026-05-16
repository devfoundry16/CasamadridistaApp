import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play } from 'lucide-react-native';
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
  const src = media.hls_url ?? undefined;
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

function ImageItem({ media }: { media: PostMediaType }) {
  const ratio  = aspectRatio(media);
  const height = Math.min(SCREEN_WIDTH / ratio, MAX_HEIGHT);
  const [loaded, setLoaded] = useState(false);

  return (
    <View style={{ width: SCREEN_WIDTH, height }}>
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
    </View>
  );
}

export default function PostMedia({ media, paused = true }: Props) {
  const ready = media.filter((m) => m.status === 'ready');
  if (!ready.length) return null;

  return (
    <View className="mt-1">
      {ready.map((m) =>
        m.kind === 'video' ? (
          <VideoPlayer key={m.id} media={m} paused={paused} />
        ) : (
          <ImageItem key={m.id} media={m} />
        )
      )}
    </View>
  );
}
