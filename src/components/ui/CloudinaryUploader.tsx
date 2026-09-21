"use client";

import React, { useState, useRef, useEffect } from 'react';
import { CloudPlus, CloseSquare, Refresh2, Gallery } from "iconsax-react";
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface CloudinaryUploaderProps {
  onUploadSuccess: (urls: string[]) => void;
  maxFiles?: number;
  folder?: string;
  label?: string;
  existingImages?: string[];
}

export default function CloudinaryUploader({
  onUploadSuccess,
  maxFiles = 5,
  folder = 'gopal-cakes/misc',
  label = 'Upload Images',
  existingImages = []
}: CloudinaryUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>(existingImages);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingText, setLoadingText] = useState("Preparing image...");

  useEffect(() => {
    if (!isUploading) return;
    const messages = [
      "Sprinkling some sugar...",
      "Whipping the frosting...",
      "Baking the pixels...",
      "Prepping for edible print...",
      "Almost done..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoadingText(messages[i]);
    }, 2500);
    return () => clearInterval(interval);
  }, [isUploading]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setErrorMsg(null);
    const files = Array.from(e.target.files);
    
    if (previewUrls.length + files.length > maxFiles) {
      setErrorMsg(`You can only upload up to ${maxFiles} images here.`);
      return;
    }

    const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
    const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setErrorMsg(`Image size too large. Each image must be under 8MB.`);
      return;
    }

    setIsUploading(true);
    const newUrls: string[] = [];

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      setErrorMsg("Cloudinary credentials are missing in the environment!");
      setIsUploading(false);
      return;
    }

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', folder);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.secure_url) {
          newUrls.push(data.secure_url);
        } else {
          console.error("Cloudinary upload error:", data);
          setErrorMsg(data.error?.message || "Failed to upload an image.");
        }
      }

      const updatedUrls = [...previewUrls, ...newUrls];
      setPreviewUrls(updatedUrls);
      onUploadSuccess(updatedUrls);
    } catch (error: any) {
      console.error("Upload failed", error);
      setErrorMsg(error.message || "Upload failed. Check console.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // reset
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    const updatedUrls = previewUrls.filter((_, i) => i !== indexToRemove);
    setPreviewUrls(updatedUrls);
    onUploadSuccess(updatedUrls);
  };

  return (
    <div className="w-full space-y-3">
      {/* Upload Zone */}
      {previewUrls.length < maxFiles && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-secondary/30 hover:bg-secondary/70 min-h-[140px] ${isUploading ? 'pointer-events-none border-primary/40 bg-primary/5' : ''}`}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            multiple={maxFiles > 1}
            accept="image/*"
            onChange={handleFileChange}
          />
          
          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div 
                key="uploading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center justify-center gap-3 w-full"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Gallery className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center min-h-[40px]">
                  <motion.p 
                    key={loadingText}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm font-bold text-primary text-center"
                  >
                    {loadingText}
                  </motion.p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Please wait</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center gap-2"
              >
                <CloudPlus className="w-8 h-8 text-muted-foreground mb-1" />
                <p className="text-sm font-bold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground font-medium text-center">
                  Max {maxFiles} images. PNG/JPG (Up to 8MB/ea).
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold">
          {errorMsg}
        </div>
      )}

      {/* Previews */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {previewUrls.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-secondary border border-border">
              <Image 
                src={url} 
                alt={`Preview ${i+1}`} 
                fill 
                className="object-cover" 
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-rose-500/90 text-white rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all"
              >
                <CloseSquare className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
