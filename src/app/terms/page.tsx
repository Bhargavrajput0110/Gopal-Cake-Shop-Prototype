"use client";

import { BackButton } from "@/components/ui/BackButton";
import { motion } from "framer-motion";

export default function TermsPage() {
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
            Terms & <span className="italic font-normal text-[var(--brand-deep-rose)]">Conditions</span>
          </h1>
          
          <div className="font-editorial text-[var(--muted-foreground)] text-lg leading-relaxed space-y-8">
            <p className="text-xl">
              Welcome to Gopal Cake Shop. By accessing our website, placing an order, or using our services, you agree to be bound by the following terms and conditions. Please read them carefully.
            </p>

            <div>
              <h2 className="font-display font-bold text-2xl text-[var(--foreground)] mb-4">1. Orders & Cancellations</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>All orders are subject to acceptance and availability.</li>
                <li>Because our cakes are perishable and baked fresh to order, <strong>cancellations or modifications must be made at least 24 hours prior</strong> to the scheduled pickup or delivery time.</li>
                <li>Orders cancelled within 24 hours of the scheduled time may not be eligible for a refund.</li>
                <li>Custom cake orders require a minimum of 48 hours notice and a non-refundable deposit.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-display font-bold text-2xl text-[var(--foreground)] mb-4">2. Pricing & Payment</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>All prices are in Indian Rupees (INR) and are inclusive of applicable taxes unless stated otherwise.</li>
                <li>We reserve the right to change prices without prior notice. However, the price confirmed at the time of your order will be honored.</li>
                <li>Full payment or a required advance must be made to confirm an order.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-display font-bold text-2xl text-[var(--foreground)] mb-4">3. Delivery & Pickup</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>We strive to deliver your cakes within the selected time slot. However, delays caused by traffic, weather, or unforeseen circumstances are beyond our control.</li>
                <li>For deliveries, please ensure someone is available at the provided address to receive the cake. If a delivery fails due to unavailability, the cake will be returned to the branch and must be picked up by the customer.</li>
                <li>Upon receiving or picking up the cake, it is the customer's responsibility to check the condition. We will not be liable for damage occurring after the cake has been handed over.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-display font-bold text-2xl text-[var(--foreground)] mb-4">4. Allergens & Ingredients</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>All our cakes are 100% eggless.</li>
                <li>While we take strict precautions, our kitchen processes items containing dairy, gluten, nuts, and soy. We cannot guarantee a completely allergen-free environment. Customers with severe allergies must consume our products at their own risk.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-display font-bold text-2xl text-[var(--foreground)] mb-4">5. Customer Support</h2>
              <p>
                If you have any issues with your order, please contact us immediately upon receipt. We take quality very seriously and will address valid concerns promptly.
              </p>
            </div>
            
            <p className="text-sm mt-12 pt-8 border-t border-[var(--border)]">
              Last Updated: August 2026. Gopal Cake Shop reserves the right to amend these terms at any time.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
