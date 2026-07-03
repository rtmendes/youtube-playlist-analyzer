import { trpc } from "@/lib/trpc";
import { useCallback, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(_options?: UseAuthOptions) {
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // No-op: auth is bypassed
    }
  }, [logoutMutation]);

  const state = useMemo(() => {
    // Always treat user as authenticated (auth bypassed)
    const user = meQuery.data ?? {
      id: 1,
      openId: "anonymous-local-user",
      name: "Local User",
      email: null,
      role: "admin" as const,
    };

    return {
      user,
      loading: meQuery.isLoading,
      error: null,
      isAuthenticated: true,
    };
  }, [meQuery.data, meQuery.isLoading]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
