"use client";

import { BackButton } from "@/components/ui/BackButton";
import { motion } from "framer-motion";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] text-[var(--foreground)] pt-32 pb-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-3xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <BackButton fallback="/" label="Back to Home" variant="link" className="px-0 mb-8 text-[var(--brand-champagne)] hover:text-[var(--brand-deep-rose)] uppercase tracking-widest text-[10px] font-bold" />

          <h1 className="font-display font-bold text-4xl md:text-6xl mb-8">
            Privacy <span className="italic font-normal text-[var(--brand-deep-rose)]">Policy</span>
          </h1>
          
          <div className="font-editorial text-[var(--muted-foreground)] text-lg leading-relaxed space-y-8">
            <p className="text-xl">
              At Gopal Cake Shop, we value your trust and respect your privacy. This Privacy Policy outlines how we collect, use, and protect your personal information when you use our website or services.
            </p>

            <div>
              <h2 className="font-display font-bold text-2xl text-[var(--foreground)] mb-4">1. Information We Collect</h2>
              <p className="mb-2">When you place an order or interact with our website, we may collect the following information:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Personal Details:</strong> Name, phone number, and email address.</li>
                <li><strong>Delivery Details:</strong> Delivery addresses, landmarks, and recipient information.</li>
                <li><strong>Order History:</strong> Details of the cakes and products you have purchased.</li>
                <li><strong>Device Information:</strong> Basic analytics data to help us improve our website experience.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-display font-bold text-2xl text-[var(--foreground)] mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>To process, fulfill, and deliver your orders accurately.</li>
                <li>To send order confirmations and delivery updates via WhatsApp.</li>
                <li>To contact you regarding any issues or clarifications regarding your order.</li>
                <li>To improve our products, services, and website functionality.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-display font-bold text-2xl text-[var(--foreground)] mb-4">3. Data Security & Sharing</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>We do not sell, rent, or trade your personal information to third parties.</li>
                <li>Your data is only shared with our internal staff (Sales, Chefs, Delivery Drivers) strictly on a need-to-know basis to fulfill your order.</li>
                <li>We use industry-standard security measures to protect your data against unauthorized access or disclosure.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-display font-bold text-2xl text-[var(--foreground)] mb-4">4. WhatsApp & Communication</h2>
              <p>
                By providing your phone number, you consent to receive order updates, receipts, and delivery notifications via WhatsApp. You may opt out of promotional communications at any time.
              </p>
            </div>

            <div>
              <h2 className="font-display font-bold text-2xl text-[var(--foreground)] mb-4">5. Contact Us</h2>
              <p>
                If you have any questions or concerns regarding our privacy practices, please contact us at our main branch or via our official WhatsApp support number.
              </p>
            </div>
            
            <p className="text-sm mt-12 pt-8 border-t border-[var(--border)]">
              Last Updated: August 2026. This policy may be updated periodically to reflect changes in our practices.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
