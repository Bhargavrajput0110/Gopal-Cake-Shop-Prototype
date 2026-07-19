"use client";

import React, { useState, useRef } from 'react';
import { CloudPlus, CloseSquare, Refresh2, Gallery } from "iconsax-react";
import Image from 'next/image';

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
  const [previewUrls, setPreviewUrls] = useState<string[]>(existingImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    
    if (previewUrls.length + files.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} images here.`);
      return;
    }

    setIsUploading(true);
    const newUrls: string[] = [];

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      alert("Cloudinary credentials are missing in the environment!");
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
          alert("Failed to upload an image.");
        }
      }

      const updatedUrls = [...previewUrls, ...newUrls];
      setPreviewUrls(updatedUrls);
      onUploadSuccess(updatedUrls);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed. Check console.");
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
          className={`relative border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-secondary/30 hover:bg-secondary/70 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            multiple={maxFiles > 1}
            accept="image/*"
            onChange={handleFileChange}
          />
          
          {isUploading ? (
            <Refresh2 className="w-8 h-8 text-primary animate-spin mb-2" />
          ) : (
            <CloudPlus className="w-8 h-8 text-muted-foreground mb-2" />
          )}
          
          <p className="text-sm font-bold text-foreground">
            {isUploading ? "Uploading..." : label}
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            {isUploading ? "Please wait..." : `Max ${maxFiles} images. PNG, JPG.`}
          </p>
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
