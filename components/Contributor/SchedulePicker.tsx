import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { CalendarClock, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';

import { Text } from '@/components/Text';
import Touchable from '@/components/Touchable';
import Colors from '@/constants/colors';

interface Props {
  /** ISO string, or null for "publish immediately". */
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** `2026-09-02 18:30` — digits only, so it reads identically under RTL. */
export function formatSchedule(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

/**
 * Publish-at picker.
 *
 * Android's picker is modal and single-mode, so a date/time pair is two
 * sequential dialogs; iOS gets one inline spinner. That is the platform
 * contract for `@react-native-community/datetimepicker`, not a preference —
 * passing `mode="datetime"` on Android silently renders a date picker only.
 */
export default function SchedulePicker({ value, onChange, disabled = false }: Props) {
  const { t } = useTranslation();
  const [stage, setStage] = useState<'idle' | 'date' | 'time'>('idle');
  const [draft, setDraft] = useState<Date>(() => new Date(value ?? Date.now() + 3600_000));

  const open = useCallback(() => {
    setDraft(new Date(value ?? Date.now() + 3600_000));
    setStage('date');
  }, [value]);

  const onDate = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      if (event.type === 'dismissed') {
        setStage('idle');
        return;
      }
      const next = selected ?? draft;
      if (Platform.OS === 'ios') {
        // iOS runs one `datetime` spinner: the value is already complete.
        setDraft(next);
        onChange(next.toISOString());
        setStage('idle');
        return;
      }
      const merged = new Date(next);
      merged.setHours(draft.getHours(), draft.getMinutes(), 0, 0);
      setDraft(merged);
      setStage('time');
    },
    [draft, onChange],
  );

  const onTime = useCallback(
    (event: DateTimePickerEvent, selected?: Date) => {
      setStage('idle');
      if (event.type === 'dismissed' || !selected) return;
      const merged = new Date(draft);
      merged.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      onChange(merged.toISOString());
    },
    [draft, onChange],
  );

  const label = formatSchedule(value) ?? t('contributor.schedule.publishNow');

  return (
    <View>
      <View className="flex-row items-center gap-2">
        <Touchable
          onPress={open}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={t('contributor.schedule.title')}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 40,
            paddingHorizontal: 14,
            borderRadius: 20,
            backgroundColor: Colors.background.card,
            borderWidth: 1,
            borderColor: value ? Colors.darkGold : Colors.border.default,
            opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          })}
        >
          <CalendarClock size={16} color={value ? Colors.darkGold : Colors.text.tertiary} />
          <Text
            className="text-[13px] font-semibold"
            style={{
              color: value ? Colors.text.primary : Colors.text.tertiary,
              writingDirection: 'ltr',
            }}
          >
            {label}
          </Text>
        </Touchable>

        {value ? (
          <Touchable
            onPress={() => onChange(null)}
            accessibilityRole="button"
            accessibilityLabel={t('contributor.schedule.clear')}
            hitSlop={8}
            style={({ pressed }) => ({ padding: 6, opacity: pressed ? 0.6 : 1 })}
          >
            <X size={16} color={Colors.text.tertiary} />
          </Touchable>
        ) : null}
      </View>

      {stage === 'date' ? (
        <DateTimePicker
          value={draft}
          mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          themeVariant="dark"
          onChange={onDate}
        />
      ) : null}

      {stage === 'time' ? (
        <DateTimePicker value={draft} mode="time" display="default" onChange={onTime} />
      ) : null}
    </View>
  );
}
