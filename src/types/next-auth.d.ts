/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      branchId: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    branchId: string | null
  }
}
