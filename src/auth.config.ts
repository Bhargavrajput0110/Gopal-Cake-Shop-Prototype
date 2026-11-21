if (typeof process !== 'undefined') {
  process.env.AUTH_TRUST_HOST = 'true';
  if (!process.env.AUTH_SECRET && process.env.NEXTAUTH_SECRET) {
    process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET;
  }
}

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      try {
        if (new URL(url).origin === baseUrl) {
          return url;
        }
      } catch (e) {}
      return baseUrl;
    },
    async jwt({ token, user }) {
      // On first sign-in, seed token from credential authorize()
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = (user as any).role ? String((user as any).role).toUpperCase() : token.role;
        token.branchId = (user as any).branchId ?? token.branchId;
        token.deliveryScope = (user as any).deliveryScope ?? token.deliveryScope;
        token.customPermissions = (user as any).customPermissions ?? token.customPermissions;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        if (!session.user) {
          session.user = {} as any;
        }
        session.user.id = token.id as string;
        session.user.name = (token.name as string) || session.user.name;
        (session.user as any).role = token.role ? String(token.role).toUpperCase() : undefined;
        (session.user as any).branchId = token.branchId;
        (session.user as any).deliveryScope = token.deliveryScope;
        (session.user as any).customPermissions = token.customPermissions;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_and_staging_only_1234567890",
} satisfies NextAuthConfig;
