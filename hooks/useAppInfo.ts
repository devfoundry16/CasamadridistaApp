import { useEffect, useState, useCallback } from "react";
import { fetchAppInfo, AppInfoResponse } from "@/services/AppInfoService";

export default function useAppInfo() {
  const [data, setData] = useState<AppInfoResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAppInfo(force);
      setData(res);
    } catch (err: any) {
      setError(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await load(false);
    })();
    return () => {
      mounted = false;
    };
  }, [load]);

  return {
    data,
    loading,
    error,
    refresh: () => load(true),
  } as const;
}
