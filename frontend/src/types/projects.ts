// ── Project types ─────────────────────────────────────────────────

export type ProjectStatus = 'inquiry' | 'booked' | 'post_production' | 'completed' | 'archived'

export type ProjectType =
  | 'wedding'
  | 'engagement'
  | 'family'
  | 'maternity'
  | 'custom'

export type SessionType =
  | 'engagement'
  | 'family'
  | 'maternity'
  | 'custom'

export type CallType =
  | 'phone'
  | 'google_meet'
  | 'zoom'
  | 'facetime'
  | 'other'

export interface Project {
  id: string
  name: string
  type: ProjectType
  customType?: string
  status: ProjectStatus
  clientOneName: string
  clientTwoName?: string
  email?: string
  phone?: string
  bookingId?: string
  leadId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  projectId: string
  type: SessionType
  customType?: string
  date: string
  time: string
  duration: string
  location: string
  secondShooter?: string
  price?: number
  deliveryDeadline?: string
  notes?: string
  createdAt: string
}

export interface ProjectCall {
  id: string
  projectId: string
  type: CallType
  date: string
  time: string
  duration: string
  notes?: string
  outcome?: string
  createdAt: string
}