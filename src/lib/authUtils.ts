import { signOut as nextAuthSignOut } from "next-auth/react";
import { supabase } from "@/lib/supabase";

export async function authSignOut(callbackUrl: string = "/login") {
  await supabase.auth.signOut();
  await nextAuthSignOut({ callbackUrl });
}
