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
          return {
            id: user.id,
            name: user.name,
            role: user.role,
            branchId: user.branchId,
            deliveryScope: user.deliveryScope,
          } as any;
        }

        return null;
      },
    }),
  ],
});
