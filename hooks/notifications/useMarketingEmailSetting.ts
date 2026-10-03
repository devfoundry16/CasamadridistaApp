import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import NotificationService from '@/services/NotificationService';

/**
 * The Account "News by email" switch (admin §45): whether Casa Madridista may
 * send this account campaign emails. Every email also carries an unsubscribe
 * link that sets the same flag.
 *
 * `value` is null until the server answers, so the switch does not flash; it
 * moves at once and moves back if the save fails.
 */
export function useMarketingEmailSetting(enabled: boolean) {
  const [value, setValue] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  // Read again whenever Account comes back into view, so a failed read is
  // retried and an unsubscribe made from an email shows here.
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      let alive = true;
      NotificationService.getMarketingEmails()
        .then((on) => {
          if (alive) setValue(on);
        })
        .catch(() => {});
      return () => {
        alive = false;
      };
    }, [enabled])
  );

  /** Resolves to false when the change did not stick. */
  const set = useCallback(async (on: boolean) => {
    const before = value;
    setValue(on);
    setSaving(true);
    try {
      const saved = await NotificationService.setMarketingEmails(on);
      if (saved === null) throw new Error('no answer');
      setValue(saved);
      return true;
    } catch {
      setValue(before);
      return false;
    } finally {
      setSaving(false);
    }
  }, [value]);

  return { value, saving, set };
}
