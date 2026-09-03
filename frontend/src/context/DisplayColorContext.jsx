import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { displayColorsApi } from '../api';

const DisplayColorContext = createContext(null);

export function DisplayColorProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await displayColorsApi.get();
    setConfig(data);
    return data;
  }, []);

  useEffect(() => {
    refresh().catch(() => setConfig(null)).finally(() => setLoading(false));
  }, [refresh]);

  const shiftsByCode = useMemo(() => {
    if (!config?.shifts) return {};
    const map = {};
    for (const s of config.shifts) {
      if (s.code) map[s.code] = s;
    }
    return map;
  }, [config]);

  const value = useMemo(() => ({
    config,
    shiftsByCode,
    loading,
    refresh,
  }), [config, shiftsByCode, loading, refresh]);

  return (
    <DisplayColorContext.Provider value={value}>
      {children}
    </DisplayColorContext.Provider>
  );
}

export function useDisplayColors() {
  const ctx = useContext(DisplayColorContext);
  if (!ctx) throw new Error('useDisplayColors must be used within DisplayColorProvider');
  return ctx;
}
