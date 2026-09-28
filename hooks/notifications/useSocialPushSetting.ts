import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import PushService from '@/services/PushService';

/**
 * The Account "Social activity" switch: whether this device gets pushes for
 * likes, comments, mentions, tags and friend requests.
 *
 * The switch moves at once and moves back if the server refuses, so it never
 * shows a state the device does not have. `value` is null until the stored
 * choice has been read, so the switch does not flash on and then off.
 *
 * `permitted` is whether the OS lets the app notify at all (null until known).
 * It is checked again whenever the app comes back to the foreground, so turning
 * notifications on in Settings and returning enables the switch.
 */
export function useSocialPushSetting() {
  const [value, setValue] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [permitted, setPermitted] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    const check = () => {
      void PushService.permissionGranted().then((granted) => {
        if (alive) setPermitted(granted);
      });
    };
    check();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    let alive = true;
    void PushService.isSocialEnabled().then((on) => {
      if (alive) setValue(on);
    });
    return () => {
      alive = false;
    };
  }, []);

  /** Resolves to false when the change did not stick. */
  const set = useCallback(async (on: boolean): Promise<boolean> => {
    const previous = value;
    setValue(on);
    setSaving(true);
    try {
      await PushService.setSocialEnabled(on);
      return true;
    } catch {
      setValue(previous);
      return false;
    } finally {
      setSaving(false);
    }
  }, [value]);

  return { value, saving, permitted, set };
}
