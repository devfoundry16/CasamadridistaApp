import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import i18n from '@/i18n';
import Colors from '@/constants/colors';
import { reminderFireAt, reminderPlan, type SavedReminder } from '@/utils/matchExtras.core';

/**
 * Kickoff reminders: local notifications this phone schedules for itself. No
 * server is involved. Stored per fixture so the match screen can show the bell
 * as set, move a reminder when kickoff moves, and clear them all on sign-out.
 */

const STORAGE_KEY = 'match_reminders';
const CHANNEL_ID = 'matches';

type Store = Record<string, SavedReminder>;

async function load(): Promise<Store> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

const save = (store: Store) => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));

export async function getReminder(fixtureId: number): Promise<SavedReminder | null> {
  return (await load())[String(fixtureId)] ?? null;
}

export interface ReminderMatch {
  id: number;
  date: string;
  home: { name: string | null };
  away: { name: string | null };
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: i18n.t('match.center.reminderChannel'),
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: Colors.darkGold,
  });
}

async function schedule(match: ReminderMatch, offsetMin: number, at: Date): Promise<string> {
  await ensureChannel();
  const time = new Date(match.date).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${match.home.name ?? ''} vs ${match.away.name ?? ''}`,
      body: offsetMin === 0 ? i18n.t('match.center.reminderNow') : i18n.t('match.center.reminderBody', { time }),
      data: { v: 1, type: 'match_reminder', match_id: match.id },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL_ID },
  });
}

/**
 * Remind this phone `offsetMin` minutes before kickoff, replacing any reminder
 * already set for the match. Asks for notification permission the first time.
 */
export async function setReminder(match: ReminderMatch, offsetMin: number): Promise<'set' | 'denied' | 'past'> {
  const at = reminderFireAt(match.date, offsetMin);
  if (!at) return 'past';

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== 'granted') return 'denied';

  await clearReminder(match.id);
  const notificationId = await schedule(match, offsetMin, at);
  const store = await load();
  store[String(match.id)] = { notificationId, offsetMin, kickoff: match.date };
  await save(store);
  return 'set';
}

export async function clearReminder(fixtureId: number): Promise<void> {
  const store = await load();
  const saved = store[String(fixtureId)];
  if (!saved) return;
  await Notifications.cancelScheduledNotificationAsync(saved.notificationId).catch(() => {});
  delete store[String(fixtureId)];
  await save(store);
}

/**
 * Bring a saved reminder in line with the match as it now stands: moved with a
 * changed kickoff, dropped once it can no longer fire. Returns what is set.
 */
export async function syncReminder(match: ReminderMatch): Promise<SavedReminder | null> {
  const saved = await getReminder(match.id);
  const plan = reminderPlan(saved, match.date);
  if (plan === 'none') return null;
  if (plan === 'keep') return saved;
  if (plan === 'drop') {
    await clearReminder(match.id);
    return null;
  }
  return (await setReminder(match, saved!.offsetMin)) === 'set' ? getReminder(match.id) : null;
}

/** Every reminder off, on sign-out: they belong to the person, not the phone. */
export async function clearAllReminders(): Promise<void> {
  const store = await load();
  await Promise.all(Object.values(store).map((r) => Notifications.cancelScheduledNotificationAsync(r.notificationId).catch(() => {})));
  await AsyncStorage.removeItem(STORAGE_KEY);
}
