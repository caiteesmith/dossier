// ── Enums ────────────────────────────────────────────────────────

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'proposal_sent'
  | 'negotiating'
  | 'booked'
  | 'lost'

export type LeadSource =
  | 'website'
  | 'instagram'
  | 'referral_vendor'
  | 'referral_client'
  | 'google'
  | 'wedding_wire'
  | 'the_knot'
  | 'other'

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export type TaskCategory = 'admin' | 'client' | 'day_of' | 'post_wedding' | 'manual'

// ── Core entities ─────────────────────────────────────────────────

export interface Lead {
  id: string
  photographerId: string
  firstName: string
  lastName: string
  partnerName?: string
  email: string
  phone?: string
  weddingDate?: string        // ISO date string YYYY-MM-DD
  venueName?: string
  venueLocation?: string
  status: LeadStatus
  source?: LeadSource
  referralName?: string
  budget?: number
  notes?: string
  inquiryDate: string
  followUpAt?: string
  createdAt: string
  updatedAt: string
}

export interface Booking {
  id: string
  photographerId: string
  leadId?: string
  partnerOneName: string
  partnerTwoName: string
  email: string
  phone?: string
  partnerOneLegalName?: string
  partnerTwoLegalName?: string
  marriedSurname?: string
  mailingAddress?: string
  mailingCity?: string
  mailingState?: string
  mailingZip?: string
  weddingDate: string
  venueName: string
  venueAddress?: string
  venueLat?: number
  venueLng?: number
  packageName?: string
  packagePrice?: number
  hoursCovered?: number
  status: BookingStatus
  portalToken: string
  portalEnabled: boolean
  notes?: string
  workflowStatus?: string
  createdAt: string
  updatedAt: string
  projectId?: string
}

export interface Task {
  id: string
  bookingId: string
  photographerId: string
  title: string
  category: TaskCategory
  isAuto: boolean
  completed: boolean
  completedAt?: string
  dueDate?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ShotListGroup {
  id: string
  shotListId: string
  name: string
  sortOrder: number
  items: ShotListItem[]
}

export interface ShotListItem {
  id: string
  groupId: string
  description: string
  notes?: string
  completed: boolean
  sortOrder: number
}

export interface TimelineBlock {
  id: string
  timelineId: string
  title: string
  startTime: string           // HH:MM
  durationMinutes: number
  location?: string
  notes?: string
  sortOrder: number
}

export interface Timeline {
  id: string
  bookingId: string
  sunsetTime?: string         // HH:MM
  goldenHourTime?: string     // HH:MM
  notes?: string
  blocks: TimelineBlock[]
}

export interface Vendor {
  id: string
  bookingId: string
  role: string
  name: string
  phone?: string
  email?: string
  notes?: string
  sortOrder: number
}

export interface PackageTemplate {
  id: string
  photographerId: string
  name: string
  description?: string
  price: number
  hoursCovered?: number
  includes: string[]
  isActive: boolean
}

// ── Composite / view types ────────────────────────────────────────

// Full booking detail — everything needed for the wedding dashboard
export interface BookingDetail extends Booking {
  tasks: Task[]
  timeline?: Timeline
  vendors: Vendor[]
  shotListGroups: ShotListGroup[]
}