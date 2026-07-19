import { OrderStatus } from "@/lib/OrderStateMachine"
import { DocumentText, MagicStar, Reserve, Like1, Brush2, BoxTick, Location, Car, Box, TruckFast, TickCircle, CloseCircle, Warning2, Edit2, TickSquare } from "iconsax-react"

export type StatusConfig = {
  label: string
  color: "secondary" | "info" | "warning" | "success" | "destructive" | "default" | "outline"
  icon: any
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  DRAFT: { label: "Draft", color: "secondary", icon: Edit2 },
  NEW: { label: "New Order", color: "info", icon: MagicStar },
  WAITING_FOR_CHEF: { label: "Waiting for Chef", color: "warning", icon: Reserve },
  CHEF_ACCEPTED: { label: "Chef Accepted", color: "warning", icon: Like1 },
  MAKING: { label: "Making", color: "warning", icon: Reserve },
  DECORATING: { label: "DECORATING", color: "info", icon: Edit2 },
  READY_FOR_PICKUP: { label: "Ready for Pickup", color: "success", icon: BoxTick },
  PENDING_ASSIGNMENT: { label: "Pending Assignment", color: "info", icon: Location },
  ASSIGNED_TO_DRIVER: { label: "Driver Assigned", color: "info", icon: Car },
  PICKED_UP: { label: "Picked Up", color: "info", icon: Box },
  ON_THE_WAY: { label: "On The Way", color: "warning", icon: TruckFast },
  DELIVERED: { label: "DELIVERED", color: "success", icon: TickSquare },
  COMPLETED: { label: "Completed", color: "success", icon: TickCircle },
  CANCELLED: { label: "CANCELLED", color: "destructive", icon: CloseCircle },
  FAILED_DELIVERY: { label: "Failed Delivery", color: "destructive", icon: Warning2 },
}
