"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
  label?: string;
  fallback?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "xs";
}

export function BackButton({ 
  className, 
  label = "Back", 
  fallback, 
  variant = "ghost",
  size = "default"
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else if (fallback) {
      router.push(fallback);
    } else {
      router.push("/");
    }
  };

  return (
    <Button 
      variant={variant === "ghost" ? "secondary" : variant} 
      size={size}
      onClick={handleBack} 
      className={cn(
        "flex items-center gap-2 rounded-full font-bold tracking-wide transition-all shadow-sm hover:shadow-md", 
        variant === "ghost" && "bg-secondary/10 hover:bg-secondary/20 text-secondary-foreground border border-secondary/20",
        variant === "link" && "bg-background/80 backdrop-blur-sm border border-border shadow-sm px-4 py-2 hover:bg-background/100 text-foreground",
        className
      )}
    >
      <ArrowLeft className="w-4 h-4" />
      {label && <span>{label}</span>}
    </Button>
  );
}
