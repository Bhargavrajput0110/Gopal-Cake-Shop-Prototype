"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MagicStar } from "iconsax-react";
import { motion } from "framer-motion";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Exchange session and check if logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push("/customer/orders");
          router.refresh();
        } else {
          // If no session is immediate, listen to auth state changes for a brief moment
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) {
              subscription.unsubscribe();
              router.push("/customer/orders");
              router.refresh();
            }
          });

          // Fallback redirect after 5 seconds if no auth event fires
          const timeout = setTimeout(() => {
            subscription.unsubscribe();
            router.push("/customer/login");
          }, 5000);

          return () => {
            clearTimeout(timeout);
            subscription.unsubscribe();
          };
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        router.push("/customer/login");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center items-center p-4">
      <div className="text-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-12 h-12 bg-[#2C1A14] rounded-full mx-auto flex items-center justify-center shadow-md"
        >
          <MagicStar className="w-6 h-6 text-white" />
        </motion.div>
        <h1 className="text-xl font-heading font-bold text-[#2C1A14]">Finishing Authentication...</h1>
        <p className="text-xs text-muted-foreground">Confirming your session. You will be redirected shortly.</p>
      </div>
    </div>
  );
}
