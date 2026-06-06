import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ExpoImagePicker from 'expo-image-picker';
import { Image as ImageIcon, Video, X } from 'lucide-react-native';
import Colors from '@/constants/colors';

export interface PickedMedia {
  uri: string;
  kind: 'image' | 'video';
  mimeType?: string;
  thumbnailUri?: string;
}

interface Props {
  media: PickedMedia | null;
  onPick: (media: PickedMedia | null) => void;
}

export default function MediaPicker({ media, onPick }: Props) {
  const { t } = useTranslation();

  const pickImage = async () => {
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 1,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      onPick({ uri: result.assets[0].uri, kind: 'image', mimeType: result.assets[0].mimeType });
    }
  };

  const pickVideo = async () => {
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: 'videos',
      quality: 1,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets[0]) {
      onPick({ uri: result.assets[0].uri, kind: 'video', mimeType: result.assets[0].mimeType });
    }
  };

  return (
    <View>
      {/* Preview */}
      {media && (
        <View className="relative mx-4 rounded-xl overflow-hidden" style={{ height: 200, marginBottom: 14 }}>
          <Image
            source={{ uri: media.thumbnailUri ?? media.uri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {media.kind === 'video' && (
            <View className="absolute bottom-2 left-2 rounded-full px-2 py-0.5"
              style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
              <Text className="text-white text-xs">{t('community.video')}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => onPick(null)}
            className="absolute top-2 right-2 rounded-full p-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          >
            <X size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Buttons */}
      {!media && (
        <View className="flex-row px-4 gap-3" style={{ paddingBottom: 14 }}>
          <TouchableOpacity
            onPress={pickImage}
            className="flex-row items-center rounded-full px-4 py-2"
            style={{ backgroundColor: Colors.background.medium }}
            activeOpacity={0.7}
          >
            <ImageIcon size={16} color={Colors.darkGold} />
            <Text className="ml-2 text-sm" style={{ color: Colors.text.primary }}>{t('community.photo')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={pickVideo}
            className="flex-row items-center rounded-full px-4 py-2"
            style={{ backgroundColor: Colors.background.medium }}
            activeOpacity={0.7}
          >
            <Video size={16} color={Colors.darkGold} />
            <Text className="ml-2 text-sm" style={{ color: Colors.text.primary }}>{t('community.video')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
