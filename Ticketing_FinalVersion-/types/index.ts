export type TicketStatus = "open" | "in-progress" | "resolved" | "closed"
export type TicketPriority = "low" | "medium" | "high" | "urgent"
export type TicketCategory = string

export interface TicketResponse {
  id?: string
  authorName: string
  authorEmail: string
  message: string
  status: TicketStatus
  timestamp: string
}

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: TicketCategory
  categoryLabel?: string
  categoryId?: number
  subcategory?: string | null
  subcategoryLabel?: string | null
  subcategoryId?: number | null
  clientName: string
  clientEmail: string
  clientPhone?: string | null
  department?: string | null
  clientId?: string
  createdAt: string
  updatedAt?: string | null
  dueDate?: string | null
  assignedTo?: string | null
  assignedTechnicianName?: string | null
  assignedTechnicianEmail?: string | null
  assignedTechnicianPhone?: string | null
  responses?: TicketResponse[]
  attachments?: Array<Record<string, unknown>>
  dynamicFields?: Record<string, unknown>
  lastResponseBy?: string | null
  lastResponseAt?: string | null
  [key: string]: unknown
}

export type UserRole = "client" | "engineer" | "admin"
