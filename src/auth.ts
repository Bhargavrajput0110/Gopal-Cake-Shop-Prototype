import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";
import { authConfig } from "./auth.config";
import bcrypt from "bcryptjs";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.branchId = (user as any).branchId;
        token.deliveryScope = (user as any).deliveryScope;
        token.customPermissions = (user as any).customPermissions;
      }

      // Re-read live permissions from DB in Node runtime
      if (token.id) {
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, branchId: true, deliveryScope: true, customPermissions: true, status: true },
          });
          if (fresh && fresh.status !== 'SUSPENDED') {
            token.role = fresh.role;
            token.branchId = fresh.branchId;
            token.deliveryScope = fresh.deliveryScope;
            token.customPermissions = fresh.customPermissions;
          }
        } catch {
          // DB unreachable — keep existing token values, don't break auth
        }
      }

      return token;
    },
  },
  providers: [
    CredentialsProvider({
      name: "PIN",
      credentials: {
        id: { label: "User ID", type: "text" },
        pin: { label: "PIN", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.id || !credentials?.pin) return null;

        const user = await prisma.user.findUnique({
          where: { id: credentials.id as string }
        });

        if (!user || !user.passwordHash || user.status === 'SUSPENDED') return null;

        let isValid = await bcrypt.compare(credentials.pin as string, user.passwordHash);
        
        // Fallback: Allow login if PIN matches the last 4 digits of the user's phone number
        if (!isValid && user.phone) {
          const digitsOnly = user.phone.replace(/\D/g, '');
          if (digitsOnly.length >= 4) {
            const last4 = digitsOnly.slice(-4);
            if (last4 === credentials.pin) {
              isValid = true;
            }
          }
        }
        
        if (isValid) {
          // Record successful login timestamp in DB
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                lastLoginAt: new Date(),
                lastActivityAt: new Date(),
                ...(user.status === 'INVITED' ? { status: 'ACTIVE', activatedAt: new Date() } : {})
              }
            });
          } catch (err) {
            console.error('[Auth] Failed to update lastLoginAt:', err);
          }

          return {
            id: user.id,
            name: user.name,
            role: user.role,
            branchId: user.branchId,
            deliveryScope: user.deliveryScope,
            customPermissions: user.customPermissions,
          } as any;
        }

        return null;
      },
    }),
  ],
});
