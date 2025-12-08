import type { AuthProvider } from "@refinedev/core";
import type { Auth0ContextInterface, User as Auth0User } from "@auth0/auth0-react";
import { GROUPS_CLAIM } from "@/config/constants";
import type { UserWithRoles } from "@/types";

export const createAuthProvider = (auth0: Auth0ContextInterface<Auth0User>): AuthProvider => {
  const { user, logout, isAuthenticated } = auth0;

  return {
    login: async () => ({ success: true }),

    logout: async () => {
      logout({ logoutParams: { returnTo: window.location.origin } });
      return { success: true };
    },

    onError: async (error) => {
      if (error.response?.status === 401) {
        return { logout: true };
      }
      return { error };
    },

    check: async () => {
      if (isAuthenticated) {
        return { authenticated: true };
      }
      return {
        authenticated: false,
        error: { message: "Not authenticated", name: "AuthError" },
        redirectTo: "/login",
        logout: true,
      };
    },

    getPermissions: async () => {
      if (!user) return null;
      return (user[GROUPS_CLAIM] as string[]) || [];
    },

    getIdentity: async (): Promise<UserWithRoles | null> => {
      if (!user) return null;
      return {
        ...user,
        sub: user.sub || "",
        email: user.email || "",
        name: user.name || "",
        picture: user.picture,
        groups: (user[GROUPS_CLAIM] as string[]) || [],
      };
    },
  };
};
