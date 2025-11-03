import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "cache_";
const CACHE_EXPIRY_KEY = "cache_expiry_";
const DEFAULT_CACHE_DURATION = 1000 * 60 * 60 * 24;

export class ApiService {
  async set<T>(
    key: string,
    data: T,
    expiryMs: number = DEFAULT_CACHE_DURATION
  ): Promise<void> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_KEY}${key}`;
      const expiryTime = Date.now() + expiryMs;

      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      await AsyncStorage.setItem(expiryKey, expiryTime.toString());
      console.log("[Cache] Saved:", key);
    } catch (error) {
      console.error("[Cache] Failed to save:", key, error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_KEY}${key}`;

      const expiryTimeStr = await AsyncStorage.getItem(expiryKey);
      if (!expiryTimeStr) {
        console.log("[Cache] No expiry found for:", key);
        return null;
      }

      const expiryTime = parseInt(expiryTimeStr, 10);
      if (Date.now() > expiryTime) {
        console.log("[Cache] Expired:", key);
        await this.remove(key);
        return null;
      }

      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (!cachedData) {
        console.log("[Cache] No data found for:", key);
        return null;
      }

      console.log("[Cache] Retrieved:", key);
      return JSON.parse(cachedData);
    } catch (error) {
      console.error("[Cache] Failed to retrieve:", key, error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const expiryKey = `${CACHE_EXPIRY_KEY}${key}`;
      await AsyncStorage.multiRemove([cacheKey, expiryKey]);
      console.log("[Cache] Removed:", key);
    } catch (error) {
      console.error("[Cache] Failed to remove:", key, error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(
        (key) =>
          key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_EXPIRY_KEY)
      );
      await AsyncStorage.multiRemove(cacheKeys);
      console.log("[Cache] Cleared all cache");
    } catch (error) {
      console.error("[Cache] Failed to clear:", error);
    }
  }
}

export const CacheService = new ApiService();
