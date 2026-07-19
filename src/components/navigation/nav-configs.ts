/**
 * Navigation configurations for each ERP portal.
 * Each config drives AppSidebar, MobileNav, and AppTopbar — no duplication.
 */

import { Category, Bag, Profile2User, Shop, Setting2, Box, Tag, People, TruckFast, Notification, Chart, Clock, Star1, ClipboardText, Car, Card, AddCircle, Activity, Reserve, BoxTick, ArrowSwapHorizontal, Gallery } from "iconsax-react"
import type { AppConfig } from "./navigation.types"

import { signOut } from "next-auth/react"

const SIGN_OUT = async () => {
  document.cookie = "gopal_dummy_role=; path=/; max-age=0"
  document.cookie = "e2e-bypass-auth=; path=/; max-age=0"
  
  try {
    await signOut({ callbackUrl: '/login' })
  } catch (e) {
    window.location.href = "/login"
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export const ADMIN_NAV_CONFIG: AppConfig = {
  appName: "Gopal Cake Shop",
  appSubtitle: "Admin Panel",
  rootHref: "/admin",
  user: { name: "Gopal Bhai", role: "Owner · Admin", initials: "G", mockId: "ADM-01" },
  onSignOut: SIGN_OUT,
  nav: [
    {
      label: "Management",
      items: [
        { name: "Dashboard",     href: "/admin",                icon: Category },
        { name: "Orders",        href: "/admin/orders",         icon: Bag },
        { name: "Products",      href: "/admin/products",       icon: Box },
        { name: "Categories",    href: "/admin/categories",     icon: Tag },
        { name: "Design Library",href: "/admin/design-library", icon: Star1 },
        { name: "Users",         href: "/admin/users",          icon: Profile2User },
        { name: "Customers",     href: "/admin/customers",      icon: People },
        { name: "Drivers",       href: "/admin/drivers",        icon: TruckFast },
        { name: "Media",         href: "/admin/media",          icon: Gallery },
        { name: "Reviews",       href: "/admin/reviews",        icon: Star1 },
        { name: "Notifications", href: "/admin/notifications",  icon: Notification },
        { name: "Analytics",     href: "/admin/analytics",      icon: Chart },
        { name: "Settings",      href: "/admin/settings",       icon: Setting2 },
      ],
    },
  ],
}

// ─── Sales ───────────────────────────────────────────────────────────────────
export const SALES_NAV_CONFIG: AppConfig = {
  appName: "Gopal Bakery",
  appSubtitle: "Sales Desk",
  rootHref: "/sales",
  user: { name: "Pooja Mehta", role: "Sales Rep", initials: "PM", mockId: "SALES-01" },
  onSignOut: SIGN_OUT,
  nav: [
    {
      items: [
        { name: "Command Center",        href: "/sales",          icon: Activity },
        { name: "Orders",                href: "/sales/orders",   icon: ClipboardText },
        { name: "POS Terminal",          href: "/sales/pos",      icon: Shop },
        { name: "Delivery Assignment",   href: "/sales/delivery", icon: Car },
        { name: "Vendor Dispatch",       href: "/sales/vendors",  icon: TruckFast },
        { name: "Payments",              href: "/sales/payments", icon: Card },
        { name: "Transfers",             href: "/sales/transfers",icon: ArrowSwapHorizontal },
      ],
    },
  ],
}

// ─── Manager ─────────────────────────────────────────────────────────────────
export const MANAGER_NAV_CONFIG: AppConfig = {
  appName: "Gopal Bakery",
  appSubtitle: "Branch Manager",
  rootHref: "/manager",
  user: { name: "Rahul Sharma", role: "Branch Manager", initials: "RS", mockId: "MGR-KHM" },
  onSignOut: SIGN_OUT,
  nav: [
    {
      items: [
        { name: "Branch Dashboard", href: "/manager",            icon: Category },
        { name: "Kitchen Queue",    href: "/manager/kitchen",    icon: Reserve, badge: 5 },
        { name: "Local Inventory",  href: "/manager/inventory",  icon: BoxTick },
        { name: "Delivery Boys",    href: "/manager/riders",     icon: Car },
      ],
    },
  ],
}

// ─── Chef ─────────────────────────────────────────────────────────────────────
export const CHEF_NAV_CONFIG: AppConfig = {
  appName: "Kitchen Display",
  appSubtitle: "Chef Station",
  rootHref: "/chef",
  user: { name: "Chef Sanjeev", role: "Head Chef", initials: "CS", mockId: "CHEF-01" },
  onSignOut: SIGN_OUT,
  nav: [
    {
      items: [
        { name: "Order Queue", href: "/chef", icon: ClipboardText },
      ],
    },
  ],
}

// ─── Delivery / Driver ───────────────────────────────────────────────────────
export const DELIVERY_NAV_CONFIG: AppConfig = {
  appName: "Driver App",
  appSubtitle: "Delivery Portal",
  rootHref: "/driver",
  user: { name: "Amit Kumar", role: "Driver", initials: "AK", mockId: "DRV-14" },
  onSignOut: SIGN_OUT,
  nav: [
    {
      items: [
        { name: "My Deliveries", href: "/driver", icon: Car },
      ],
    },
  ],
}

// ─── Vendor ──────────────────────────────────────────────────────────────────
export const VENDOR_NAV_CONFIG: AppConfig = {
  appName: "Vendor Portal",
  appSubtitle: "Tasks",
  rootHref: "/vendor",
  user: { name: "PrintMagic Studio", role: "Vendor", initials: "PM", mockId: "VND-PHOTO" },
  onSignOut: SIGN_OUT,
  nav: [
    {
      items: [
        { name: "My Tasks", href: "/vendor", icon: ClipboardText },
      ],
    },
  ],
}
