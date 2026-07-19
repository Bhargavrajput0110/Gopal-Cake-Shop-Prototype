"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Refresh2, Location, Map, CloseSquare } from "iconsax-react";
import { motion, AnimatePresence } from "framer-motion";

const LeafletAddressPicker = dynamic(
  () => import("@/components/home/LeafletAddressPicker").then((mod) => mod.LeafletAddressPicker),
  { ssr: false, loading: () => <div className="p-4 text-center text-sm text-[#D4AF37]"><Refresh2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Initializing GPS...</div> }
);

export function HeroDeliveryChecker() {
  const [isOpen, setIsOpen] = useState(false);
   
  const [address, setAddress] = useState("");
  const [branchDistances, setBranchDistances] = useState<{branch: string, distanceKm: number}[]>([]);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [distanceError, setDistanceError] = useState("");
   
  const [selectedBranch, setSelectedBranch] = useState("");

  return (
    <div className="w-full max-w-lg mt-8 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-full p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl transition-all duration-500 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 via-[#D4AF37]/20 to-[#D4AF37]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                <Map className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-bold tracking-wide">Check Delivery Availability</h3>
                <p className="text-white/50 text-xs">Find your closest branch & delivery fee</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#D4AF37] transition-colors">
              <Location className="w-4 h-4 text-white" />
            </div>
          </div>
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full bg-[#0a0a0a]/80 backdrop-blur-3xl border border-[#D4AF37]/30 rounded-3xl p-5 shadow-[0_0_50px_rgba(212,175,55,0.15)] relative"
        >
          <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
            <CloseSquare className="w-5 h-5" />
          </button>
          
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Location className="w-4 h-4 text-[#D4AF37]" />
            Where are we delivering?
          </h3>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 relative z-50">
            <LeafletAddressPicker 
              onAddressChange={(addr) => setAddress(addr)}
              onCalculating={(isCalc) => setIsCalculatingDistance(isCalc)}
              onDistancesCalculated={(distances, err) => {
                setBranchDistances(distances);
                setDistanceError(err);
                if (distances.length > 0) setSelectedBranch(distances[0].branch);
              }}
            />
          </div>

          <AnimatePresence mode="wait">
            {isCalculatingDistance ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-3 text-[#D4AF37] font-medium text-sm mt-6 mb-2">
                <Refresh2 className="w-4 h-4 animate-spin" />
                Calculating exact routes via OSRM...
              </motion.div>
            ) : distanceError ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 text-sm text-red-400 font-medium text-center">
                {distanceError}
              </motion.div>
            ) : branchDistances.length > 0 ? (
              <motion.div key="results" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 mt-5">
                
                <label className="text-sm font-medium text-white/70 flex items-center justify-between">
                  Closest Branches to You
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-1 rounded-full uppercase tracking-widest border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    Live GPS Routing
                  </span>
                </label>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {branchDistances.map((b, idx) => {
                    const fee = Math.round(b.distanceKm * 20);
                    const isClosest = idx === 0;
                    return (
                      <div
                        key={b.branch}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                          isClosest ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-white/10 bg-white/5"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className={`font-bold text-sm ${isClosest ? "text-[#D4AF37]" : "text-white"}`}>
                            {b.branch} {isClosest && "⭐"}
                          </span>
                          <span className="text-xs text-white/50">{b.distanceKm} km away</span>
                        </div>
                        {b.distanceKm !== 999 && (
                          <div className="text-right">
                            <span className="block text-xs font-bold text-white bg-white/10 px-2 py-1 rounded-md border border-white/20">
                              Fee: ₹{fee}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

        </motion.div>
      )}
    </div>
  );
}
