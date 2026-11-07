"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { ScanBarcode, CloseSquare, Flash, TickCircle, Warning2 } from "iconsax-react";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (item: any) => void;
}

export function BarcodeScannerModal({ isOpen, onClose, onScanSuccess }: BarcodeScannerModalProps) {
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [processing, setProcessing] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const processBarcode = async (barcodeText: string) => {
    if (processing) return;
    try {
      setProcessing(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch("/api/v1/inventory/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode: barcodeText,
          action: "LOOKUP"
        })
      });

      const data = await res.json();
      if (data.success && data.unit) {
        setSuccessMsg(`✓ Added ${data.unit.itemTitle} (${data.unit.variantWeight}) - ₹${data.unit.sellingPrice}`);
        // Play gentle beep if supported
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(800, audioCtx.currentTime);
          osc.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.15);
        } catch (e) {}

        setTimeout(() => {
          onScanSuccess(data.unit);
          setProcessing(false);
          setSuccessMsg(null);
        }, 600);
      } else {
        setErrorMsg(data.error || "Item not found or already sold");
        setProcessing(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Network error verifying barcode");
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setManualBarcode("");

      const qrRegionId = "pos-barcode-reader";
      const html5QrCode = new Html5Qrcode(qrRegionId);
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 180 },
        aspectRatio: 1.0
      };

      html5QrCode
        .start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            processBarcode(decodedText);
          },
          () => {
            // Ignore scan parse frame misses
          }
        )
        .then(() => setScanning(true))
        .catch((err) => {
          console.warn("Camera start error:", err);
          setErrorMsg("Camera access denied or unavailable. You can enter the barcode manually below.");
        });

      return () => {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-md rounded-3xl p-6 shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <ScanBarcode size={22} className="text-[var(--brand-deep-rose)]" variant="Bold" />
            <h3 className="font-black text-lg text-foreground">Scan Cake Barcode</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-xl hover:bg-secondary/50"
          >
            <CloseSquare size={22} />
          </button>
        </div>

        {/* Viewfinder Frame */}
        <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border border-border flex items-center justify-center">
          <div id="pos-barcode-reader" className="w-full h-full object-cover"></div>

          {/* Scanner Overlay Line */}
          <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)] pointer-events-none animate-pulse"></div>

          {/* Toast inside camera view */}
          {successMsg && (
            <div className="absolute bottom-4 inset-x-4 p-3 bg-emerald-600/95 text-white rounded-xl text-center text-xs font-bold shadow-lg flex items-center justify-center gap-1.5">
              <TickCircle size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="absolute bottom-4 inset-x-4 p-3 bg-rose-600/95 text-white rounded-xl text-center text-xs font-bold shadow-lg flex items-center justify-center gap-1.5">
              <Warning2 size={16} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Manual Barcode Input Fallback */}
        <div className="space-y-2 pt-2">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Or Enter Barcode Manually
          </label>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualBarcode.trim()) processBarcode(manualBarcode.trim());
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="e.g. GCS-FB-261105-001..."
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              className="flex-1 px-3 py-2 bg-secondary/40 border border-border rounded-xl text-xs text-foreground font-mono focus:outline-none"
            />
            <button
              type="submit"
              disabled={processing || !manualBarcode.trim()}
              className="px-4 py-2 bg-[var(--brand-deep-rose)] text-white text-xs font-bold rounded-xl uppercase tracking-wider disabled:opacity-50"
            >
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
