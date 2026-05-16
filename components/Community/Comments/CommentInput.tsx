import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Send } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface Props {
  postId: string;
  replyTo?: string | null;
  onSubmit: (body: string) => Promise<void>;
  placeholder?: string;
}

export default function CommentInput({ postId, replyTo, onSubmit, placeholder }: Props) {
  const [text, setText]           = useState('');
  const [loading, setLoading]     = useState(false);
  const inputRef                  = useRef<TextInput>(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    try {
      await onSubmit(trimmed);
      setText('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="flex-row items-center px-3 py-2 border-t"
      style={{ borderColor: Colors.border.default, backgroundColor: Colors.background.dark }}
    >
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        placeholder={placeholder ?? (replyTo ? 'Write a reply…' : 'Write a comment…')}
        placeholderTextColor={Colors.text.muted}
        multiline
        maxLength={1000}
        className="flex-1 rounded-2xl px-4 py-2 text-sm"
        style={{ backgroundColor: Colors.background.medium, color: Colors.text.primary, maxHeight: 100 }}
      />
      <TouchableOpacity
        onPress={handleSend}
        disabled={!text.trim() || loading}
        className="ml-2 p-2 rounded-full"
        style={{ backgroundColor: text.trim() ? Colors.darkGold : Colors.background.medium }}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Send size={18} color={text.trim() ? '#fff' : Colors.text.tertiary} />
        )}
      </TouchableOpacity>
    </View>
  );
}
