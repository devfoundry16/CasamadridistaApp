import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { isFreshInstall, pathFromLink, pathFromReferrer } from './deferredLink.core';

/** Set once the check has run to its end, whatever it found. */
const CHECKED_KEY = 'casa_deferred_link_checked';

/**
 * The in-app path a fresh install should open, or null.
 *
 * Only looked for when all of these hold:
 *   - the app was installed in the last week (an update is not an install);
 *   - nobody is signed in;
 *   - the app was not itself opened by a link, which the router is already
 *     handling — opening the carried one too would stack a second screen.
 *
 * iOS reads the clipboard only when the system says it holds a URL, which it
 * can tell without prompting, and marks the check done BEFORE reading so the
 * paste prompt can never appear twice. Android's referrer read shows nothing,
 * so it is marked done only once the store has answered: a failed read is
 * tried again on the next launch rather than losing the link.
 */
export async function consumeDeferredLink(): Promise<string | null> {
  try {
    if (Platform.OS === 'web' || (await AsyncStorage.getItem(CHECKED_KEY))) return null;
    const done = () => AsyncStorage.setItem(CHECKED_KEY, '1');

    const installedAt = await Application.getInstallationTimeAsync();
    if (
      !isFreshInstall(installedAt?.getTime(), Date.now()) ||
      (await AsyncStorage.getItem('auth_token')) ||
      (await Linking.getInitialURL())
    ) {
      await done();
      return null;
    }

    if (Platform.OS === 'android') {
      const referrer = await Application.getInstallReferrerAsync();
      await done();
      return pathFromReferrer(referrer);
    }

    await done();
    if (!(await Clipboard.hasUrlAsync())) return null;
    return pathFromLink(await Clipboard.getUrlAsync());
  } catch {
    // A deferred link is a convenience; never let it break a launch.
    return null;
  }
}
