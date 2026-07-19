import {  } from "iconsax-react"

export interface NavItem {
  name: string
  href: string
  icon: any
  badge?: number
}

export interface NavSection {
  label?: string
  items: NavItem[]
}

export interface AppConfig {
  /** Displayed in the sidebar header */
  appName: string
  /** Subtitle under the app name (e.g. "Admin Panel", "Sales Desk") */
  appSubtitle: string
  /** Navigation sections. Use multiple sections to add group labels. */
  nav: NavSection[]
  /** The root href of this portal, used for exact-match active detection */
  rootHref: string
  /** User display info */
  user?: {
    name: string
    role: string
    initials: string
    mockId?: string
  }
  /** Override sign-out behaviour */
  onSignOut?: () => void
}
