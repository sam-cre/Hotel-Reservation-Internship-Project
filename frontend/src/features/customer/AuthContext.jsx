import { useEffect, useMemo, useState } from 'react';
import { authApi } from '../../services/api.js';
import { AuthContext } from './auth-context.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    authApi
      .current(controller.signal)
      .then(setUser)
      .catch((error) => {
        if (error.code !== 'ERR_CANCELED') setUser(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      async login(input) {
        const next = await authApi.login(input);
        setUser(next);
        return next;
      },
      async register(input) {
        const next = await authApi.register(input);
        setUser(next);
        return next;
      },
      async logout() {
        await authApi.logout();
        setUser(null);
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
