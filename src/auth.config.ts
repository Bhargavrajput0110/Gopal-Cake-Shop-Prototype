if (typeof process !== 'undefined') {
  process.env.AUTH_TRUST_HOST = 'true';
}

import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  providers: [],
  pages: {
    signIn: "/login",
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      const publicOrigin = process.env.NODE_ENV === "production" 
        ? 'https://gopal-cake-shop-prototype.onrender.com' 
        : 'http://localhost:3000';
      if (url.startsWith("/")) return `${publicOrigin}${url}`;
      try {
        const u = new URL(url);
        if (u.origin === publicOrigin || u.hostname.includes('onrender.com')) {
          return url;
        }
      } catch (e) {}
      return publicOrigin;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.branchId = (user as any).branchId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).branchId = token.branchId;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Security: NEXTAUTH_SECRET MUST be set in the environment.
  // There is no fallback. Missing this variable will cause auth to fail at startup.
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
