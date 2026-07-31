import { useState, useEffect, useRef } from "react";

export type OrderStatus = string;

export interface TransitionAnimation {
  type: "HIGHLIGHT" | "SUCCESS" | "DISPATCH" | "CELEBRATION" | "ERROR" | "NONE";
  transitionId: string;
  shouldAnimate: boolean;
  duration: number; // 0 means persistent/no cleanup
}

const TRANSITIONS = {
  WAITING_TO_ACTIVE: { type: "HIGHLIGHT", duration: 1000 },
  ACTIVE_TO_READY: { type: "SUCCESS", duration: 1500 },
  ANY_TO_READY: { type: "SUCCESS", duration: 1500 },
  READY_TO_DISPATCH: { type: "DISPATCH", duration: 1000 },
  DISPATCH_TO_DELIVERED: { type: "CELEBRATION", duration: 1500 },
  ANY_TO_ERROR: { type: "ERROR", duration: 0 },
  NEW_TO_ANY: { type: "SUCCESS", duration: 1000 },
} as const;

function getTransitionId(prev: OrderStatus, curr: OrderStatus): string {
  const isActive = (s: string) => ["CHEF_ACCEPTED", "MAKING", "DECORATING"].includes(s);
  
  if (prev === "WAITING_FOR_CHEF" && curr === "CHEF_ACCEPTED") return "WAITING_TO_ACTIVE";
  if (isActive(prev) && curr === "READY_FOR_PICKUP") return "ACTIVE_TO_READY";
  if (prev !== "READY_FOR_PICKUP" && curr === "READY_FOR_PICKUP") return "ANY_TO_READY";
  if ((prev === "READY_FOR_PICKUP" || prev === "PENDING_ASSIGNMENT") && (curr === "ASSIGNED_TO_DRIVER" || curr === "ON_THE_WAY")) return "READY_TO_DISPATCH";
  if (prev === "ON_THE_WAY" && curr === "DELIVERED") return "DISPATCH_TO_DELIVERED";
  if (curr === "CANCELLED" || curr === "FAILED") return "ANY_TO_ERROR";
  if (prev === "NEW" && curr !== "NEW") return "NEW_TO_ANY";
  
  return "UNKNOWN";
}

export const DEFAULT_ANIMATION: TransitionAnimation = {
  type: "NONE",
  transitionId: "NONE",
  shouldAnimate: false,
  duration: 0,
};

export function useOrderTransitionAnimation(orderId: string, currentStatus: OrderStatus): TransitionAnimation {
  const [animation, setAnimation] = useState<TransitionAnimation>(DEFAULT_ANIMATION);
  const prevStatusRef = useRef<OrderStatus>(currentStatus);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // 1. Initial Load Protection
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // 2. Duplicate Socket Protection
    if (prevStatusRef.current === currentStatus) {
      return;
    }

    const prev = prevStatusRef.current;
    const curr = currentStatus;
    
    // Immediately update ref to prevent duplicates
    prevStatusRef.current = curr;

    const transitionId = getTransitionId(prev, curr);
    const config = TRANSITIONS[transitionId as keyof typeof TRANSITIONS];

    if (!config) {
      setAnimation(DEFAULT_ANIMATION);
      return;
    }

    // 3. Reduced Motion Support
    const prefersReducedMotion = typeof window !== "undefined" 
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
      : false;

    // Trigger Side-effects (Confetti)
    if (config.type === "CELEBRATION" && !prefersReducedMotion) {
      import("canvas-confetti").then((confetti) => {
        confetti.default({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      });
    }

    // 4. Set Event Queue Intent (Latest event overrides pending due to React cleanup)
    const newAnimation: TransitionAnimation = {
      type: config.type,
      transitionId,
      shouldAnimate: !prefersReducedMotion,
      duration: config.duration,
    };
    
    setAnimation(newAnimation);

    // 5. Cleanup
    if (config.duration > 0) {
      const timer = setTimeout(() => {
        setAnimation(DEFAULT_ANIMATION);
      }, config.duration);
      
      // If a new event arrives rapidly, this clears the old timeout and overriding old animation
      return () => clearTimeout(timer); 
    }
  }, [currentStatus]);

  return animation;
}
