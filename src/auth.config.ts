import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  providers: [],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      const publicOrigin = process.env.NEXTAUTH_URL || 'https://gopal-cake-shop-prototype.onrender.com';
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
  secret: process.env.NEXTAUTH_SECRET || "gopal-bakery-super-secret-key-12345",
} satisfies NextAuthConfig;
