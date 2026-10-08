'use client';

// =============================================================================
// AI Radar — Client-Side Authentication State Hook
// =============================================================================

import { useState, useEffect } from 'react';

export interface AuthUserState {
  user: {
    id: string;
    email?: string;
    name?: string;
    role?: string;
  } | null;
  authenticated: boolean;
  loading: boolean;
}

export function useAuthUser(): AuthUserState {
  const [state, setState] = useState<AuthUserState>({
    user: null,
    authenticated: false,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.authenticated && data.user) {
          setState({
            user: data.user,
            authenticated: true,
            loading: false,
          });
        } else {
          setState({
            user: null,
            authenticated: false,
            loading: false,
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setState({
            user: null,
            authenticated: false,
            loading: false,
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
