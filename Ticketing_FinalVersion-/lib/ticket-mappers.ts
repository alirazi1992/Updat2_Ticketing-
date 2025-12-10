import type { ApiTicketMessageDto, ApiTicketPriority, ApiTicketResponse, ApiTicketStatus } from "@/lib/api-types"
import type { CategoriesData } from "@/services/categories-types"
import type { Ticket, TicketPriority, TicketResponse, TicketStatus } from "@/types"

const statusFromApi: Record<ApiTicketStatus, TicketStatus> = {
  New: "open",
  InProgress: "in-progress",
  WaitingForClient: "in-progress",
  Resolved: "resolved",
  Closed: "closed",
}

const statusToApi: Record<TicketStatus, ApiTicketStatus> = {
  "in-progress": "InProgress",
  open: "New",
  resolved: "Resolved",
  closed: "Closed",
}

const priorityFromApi: Record<ApiTicketPriority, TicketPriority> = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Critical: "urgent",
}

const priorityToApi: Record<TicketPriority, ApiTicketPriority> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Critical",
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "category"

export const mapApiStatusToUi = (status: ApiTicketStatus): TicketStatus => statusFromApi[status] ?? "open"

export const mapUiStatusToApi = (status: TicketStatus): ApiTicketStatus => statusToApi[status] ?? "InProgress"

export const mapApiPriorityToUi = (priority: ApiTicketPriority): TicketPriority => priorityFromApi[priority] ?? "medium"

export const mapUiPriorityToApi = (priority: TicketPriority): ApiTicketPriority => priorityToApi[priority] ?? "Medium"

export const mapApiMessageToResponse = (message: ApiTicketMessageDto): TicketResponse => ({
  id: message.id,
  authorName: message.authorName,
  authorEmail: message.authorEmail,
  status: message.status ? mapApiStatusToUi(message.status) : "in-progress",
  message: message.message,
  timestamp: message.createdAt,
})

export const mapApiTicketToUi = (
  ticket: ApiTicketResponse,
  categories: CategoriesData,
  responses: TicketResponse[] = [],
): Ticket => {
  const categoryEntry = Object.entries(categories).find(([, cat]) => cat.backendId === ticket.categoryId)
  const categorySlug = categoryEntry?.[0] ?? slugify(ticket.categoryName)
  const subcategoryEntry = categoryEntry?.[1].subIssues
    ? Object.entries(categoryEntry[1].subIssues).find(([, sub]) => sub.backendId === ticket.subcategoryId)
    : undefined
  const subcategorySlug = subcategoryEntry?.[0] ?? (ticket.subcategoryName ? slugify(ticket.subcategoryName) : null)

  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    status: mapApiStatusToUi(ticket.status),
    priority: mapApiPriorityToUi(ticket.priority),
    category: categorySlug,
    categoryLabel: categoryEntry?.[1].label ?? ticket.categoryName,
    categoryId: ticket.categoryId,
    subcategory: subcategorySlug,
    subcategoryLabel: subcategoryEntry?.[1].label ?? ticket.subcategoryName ?? null,
    subcategoryId: ticket.subcategoryId ?? null,
    clientId: ticket.createdByUserId,
    clientName: ticket.createdByName,
    clientEmail: ticket.createdByEmail,
    clientPhone: ticket.createdByPhoneNumber ?? null,
    department: ticket.createdByDepartment ?? null,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt ?? null,
    dueDate: ticket.dueDate ?? null,
    assignedTo: ticket.assignedToUserId ?? null,
    assignedTechnicianName: ticket.assignedToName ?? null,
    assignedTechnicianEmail: ticket.assignedToEmail ?? null,
    assignedTechnicianPhone: ticket.assignedToPhoneNumber ?? null,
    responses,
  }
}
