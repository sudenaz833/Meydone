import { useEffect, useState } from "react";
import { AUTH_CHANGED_EVENT } from "../utils/auth";

/** Token değişince (çıkış vb.) bileşeni yeniden hesaplatır. */
export function useAuthSyncTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    function onAuth() {
      setTick((t) => t + 1);
    }
    window.addEventListener(AUTH_CHANGED_EVENT, onAuth);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuth);
  }, []);
  return tick;
}
