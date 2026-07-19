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

        const isValid = await bcrypt.compare(credentials.pin as string, user.passwordHash);
        
        if (isValid) {
          return {
            id: user.id,
            name: user.name,
            role: user.role,
            branchId: user.branchId,
          } as any;
        }

        return null;
      },
    }),
  ],
});
