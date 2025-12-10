"use client"

import React from "react"

import { useState, useEffect } from "react"
import type { TechnicianProfile } from "@/data/technician-profiles"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import {
  Printer,
  UserPlus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Users,
  Clock,
  Star,
  TrendingUp,
  Zap,
  FileText,
  User,
  Phone,
  Calendar,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle,
  Paperclip,
  Settings,
  Mail,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { TicketCalendarOverview } from "./ticket-calendar-overview"

const statusColors: Record<string, string> = {
  open: "bg-red-100 text-red-800 border-red-200",
  "in-progress": "bg-yellow-100 text-yellow-800 border-yellow-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200",
}

const statusLabels: Record<string, string> = {
  open: "باز",
  "in-progress": "در حال انجام",
  resolved: "حل شده",
  closed: "بسته",
}

const statusIcons: Record<string, LucideIcon> = {
  open: AlertCircle,
  "in-progress": Clock,
  resolved: CheckCircle,
  closed: XCircle,
}

const priorityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800 border-blue-200",
  medium: "bg-orange-100 text-orange-800 border-orange-200",
  high: "bg-red-100 text-red-800 border-red-200",
  urgent: "bg-purple-100 text-purple-800 border-purple-200",
}

const priorityLabels: Record<string, string> = {
  low: "کم",
  medium: "متوسط",
  high: "بالا",
  urgent: "فوری",
}

const categoryLabels: Record<string, string> = {
  hardware: "سخت‌افزار",
  software: "نرم‌افزار",
  network: "شبکه",
  email: "ایمیل",
  security: "امنیت",
  access: "دسترسی",
}
const getCategoryLabel = (ticketOrId: any) => {
  const id = typeof ticketOrId === "string" ? ticketOrId : ticketOrId?.category
  if (typeof ticketOrId === "object" && ticketOrId?.categoryLabel) {
    return ticketOrId.categoryLabel
  }
  return categoryLabels[id] ?? id
}

const initialTechnicians = [
  {
    id: "tech-001",
    name: "علی احمدی",
    email: "ali@company.com",
    specialties: ["hardware", "network"],
    activeTickets: 3,
    status: "available",
    rating: 4.8,
    completedTickets: 45,
    avgResponseTime: "2.1 ساعت",
    expertise: ["تعمیر سخت‌افزار", "پیکربندی شبکه", "نصب تجهیزات"],
  },
  {
    id: "tech-002",
    name: "سارا محمدی",
    email: "sara@company.com",
    specialties: ["software", "email"],
    activeTickets: 2,
    status: "available",
    rating: 4.9,
    completedTickets: 62,
    avgResponseTime: "1.8 ساعت",
    expertise: ["نصب نرم‌افزار", "پیکربندی ایمیل", "رفع مشکلات نرم‌افزاری"],
  },
  {
    id: "tech-003",
    name: "حسن رضایی",
    email: "hassan@company.com",
    specialties: ["security", "access"],
    activeTickets: 1,
    status: "available",
    rating: 4.7,
    completedTickets: 38,
    avgResponseTime: "3.2 ساعت",
    expertise: ["امنیت سایبری", "مدیریت دسترسی", "پیکربندی فایروال"],
  },
  {
    id: "tech-004",
    name: "فاطمه کریمی",
    email: "fateme@company.com",
    specialties: ["hardware", "software"],
    activeTickets: 5,
    status: "busy",
    rating: 4.6,
    completedTickets: 51,
    avgResponseTime: "2.5 ساعت",
    expertise: ["تعمیر رایانه", "نصب سیستم عامل", "بهینه‌سازی عملکرد"],
  },
  {
    id: "tech-005",
    name: "محمد نوری",
    email: "mohammad@company.com",
    specialties: ["network", "email", "security"],
    activeTickets: 2,
    status: "available",
    rating: 4.9,
    completedTickets: 73,
    avgResponseTime: "1.5 ساعت",
    expertise: ["مدیریت شبکه", "امنیت ایمیل", "پیکربندی سرور"],
  },
]

interface AdminTicketManagementProps {
  tickets: any[]
  technicians: TechnicianProfile[]
  onTicketUpdate: (ticketId: string, updates: any) => void
}

export function AdminTicketManagement({ tickets, technicians: technicianOptions, onTicketUpdate }: AdminTicketManagementProps) {
  const [technicians, setTechnicians] = useState(
    technicianOptions && technicianOptions.length > 0 ? technicianOptions : [],
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterTechnician, setFilterTechnician] = useState("all")
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [bulkAssignDialogOpen, setBulkAssignDialogOpen] = useState(false)
  const [selectedTicketForAssign, setSelectedTicketForAssign] = useState<any>(null)
  const [technicianFilter, setTechnicianFilter] = useState("all") 
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  useEffect(() => {
    if (technicianOptions && technicianOptions.length > 0) {
      setTechnicians(technicianOptions)
    }
  }, [technicianOptions])

  useEffect(() => {
    setTechnicians((prev) =>
      prev.map((tech) => {
        const assignedTickets = tickets.filter(
          (ticket) => ticket.assignedTo === tech.id && (ticket.status === "open" || ticket.status === "in-progress"),
        )

        return {
          ...tech,
          activeTickets: assignedTickets.length,
          status: assignedTickets.length >= 5 ? "busy" : "available",
        }
      }),
    )
  }, [tickets])

  
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.clientName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus
    const matchesPriority = filterPriority === "all" || ticket.priority === filterPriority
    const matchesCategory = filterCategory === "all" || ticket.category === filterCategory
    const matchesTechnician =
      filterTechnician === "all" ||
      (filterTechnician === "unassigned" && !ticket.assignedTo) ||
      ticket.assignedTo === filterTechnician

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesTechnician
  })

  
  const handleViewTicket = (ticket: any) => {
    console.log("Opening ticket preview for:", ticket.id)
    setSelectedTicket(ticket)
    setViewDialogOpen(true)
  }

  
  const getRecommendedTechnicians = (ticket: any) => {
    return technicians
      .filter((tech) => tech.specialties.includes(ticket.category))
      .sort((a, b) => {
        
        if (a.status !== b.status) {
          return a.status === "available" ? -1 : 1
        }
        if (a.rating !== b.rating) {
          return b.rating - a.rating
        }
        return a.activeTickets - b.activeTickets
      })
  }

  const getFilteredTechnicians = (ticket?: any) => {
    let filteredTechs = technicians

    if (ticket && technicianFilter === "recommended") {
      filteredTechs = getRecommendedTechnicians(ticket)
    } else if (technicianFilter === "available") {
      filteredTechs = technicians.filter((tech) => tech.status === "available")
    } else if (technicianFilter === "busy") {
      filteredTechs = technicians.filter((tech) => tech.status === "busy")
    } else if (technicianFilter !== "all") {
      filteredTechs = technicians.filter((tech) => tech.specialties.includes(technicianFilter))
    }

    return filteredTechs.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "available" ? -1 : 1
      }
      
      if (a.rating !== b.rating) {
        return b.rating - a.rating
      }
      
      return a.activeTickets - b.activeTickets
    })
  }

  const handleTicketSelect = (ticketId: string) => {
    setSelectedTickets((prev) => (prev.includes(ticketId) ? prev.filter((id) => id !== ticketId) : [...prev, ticketId]))
  }

  const handleSelectAll = () => {
    if (selectedTickets.length === filteredTickets.length) {
      setSelectedTickets([])
    } else {
      setSelectedTickets(filteredTickets.map((ticket) => ticket.id))
    }
  }

  const handleAssignTechnician = (ticketId: string, technicianId: string) => {
    const technician = technicians.find((tech) => tech.id === technicianId)
    if (technician) {
      onTicketUpdate(ticketId, {
        assignedTo: technicianId,
        assignedTechnicianName: technician.name,
        status: "in-progress",
      })

      toast({
        title: "تکنسین تعیین شد",
        description: `تیکت ${ticketId} به ${technician.name} واگذار شد`,
      })
    }
    setAssignDialogOpen(false)
    setSelectedTicketForAssign(null)
  }

  const handleBulkAssign = (technicianId: string) => {
    const technician = technicians.find((tech) => tech.id === technicianId)
    if (technician) {
      selectedTickets.forEach((ticketId) => {
        onTicketUpdate(ticketId, {
          assignedTo: technicianId,
          assignedTechnicianName: technician.name,
          status: "in-progress",
        })
      })

      toast({
        title: "تکنسین تعیین شد",
        description: `${selectedTickets.length} تیکت به ${technician.name} واگذار شد`,
      })

      setSelectedTickets([])
      setBulkAssignDialogOpen(false)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      const ticketsToPrint =
        selectedTickets.length > 0
          ? filteredTickets.filter((ticket) => selectedTickets.includes(ticket.id))
          : filteredTickets

      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <title>گزارش تیکت‌ها</title>
          <meta charset="utf-8">
          <style>
            body { font-family: 'IRANYekan', 'Tahoma', Arial, sans-serif; direction: rtl; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .header { text-align: center; margin-bottom: 30px; }
            .status-open { background-color: #fee2e2; color: #991b1b; }
            .status-in-progress { background-color: #fef3c7; color: #92400e; }
            .status-resolved { background-color: #d1fae5; color: #065f46; }
            .status-closed { background-color: #f3f4f6; color: #374151; }
            .priority-low { background-color: #dbeafe; color: #1e40af; }
            .priority-medium { background-color: #fed7aa; color: #c2410c; }
            .priority-high { background-color: #fecaca; color: #dc2626; }
            .priority-urgent { background-color: #e9d5ff; color: #7c3aed; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>گزارش تیکت‌های سیستم مدیریت خدمات IT</h1>
            <p>تاریخ تولید گزارش: ${new Date().toLocaleDateString("fa-IR")}</p>
            <p>تعداد تیکت‌ها: ${ticketsToPrint.length}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>شماره تیکت</th>
                <th>عنوان</th>
                <th>وضعیت</th>
                <th>اولویت</th>
                <th>دسته‌بندی</th>
                <th>درخواست‌کننده</th>
                <th>تکنسین</th>
                <th>تاریخ ایجاد</th>
                <th>آخرین به‌روزرسانی</th>
              </tr>
            </thead>
            <tbody>
              ${ticketsToPrint
                .map(
                  (ticket) => `
                <tr>
                  <td>${ticket.id}</td>
                  <td>${ticket.title}</td>
                  <td class="status-${ticket.status}">${statusLabels[ticket.status]}</td>
                  <td class="priority-${ticket.priority}">${priorityLabels[ticket.priority]}</td>
                  <td>${getCategoryLabel(ticket)}</td>
                  <td>${ticket.clientName}</td>
                  <td>${ticket.assignedTechnicianName || "تعیین نشده"}</td>
                  <td>${new Date(ticket.createdAt).toLocaleDateString("fa-IR")}</td>
                  <td>${new Date(ticket.updatedAt).toLocaleDateString("fa-IR")}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; font-size: 12px; color: #666;">
            <p>این گزارش توسط سیستم مدیریت خدمات IT تولید شده است.</p>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleExportCSV = () => {
    const ticketsToExport =
      selectedTickets.length > 0
        ? filteredTickets.filter((ticket) => selectedTickets.includes(ticket.id))
        : filteredTickets

    const csvContent = [
      [
        "شماره تیکت",
        "عنوان",
        "وضعیت",
        "اولویت",
        "دسته‌بندی",
        "درخواست‌کننده",
        "تکنسین",
        "تاریخ ایجاد",
        "آخرین به‌روزرسانی",
      ],
      ...ticketsToExport.map((ticket) => [
        ticket.id,
        ticket.title,
        statusLabels[ticket.status],
        priorityLabels[ticket.priority],
        getCategoryLabel(ticket),
        ticket.clientName,
        ticket.assignedTechnicianName || "تعیین نشده",
        new Date(ticket.createdAt).toLocaleDateString("fa-IR"),
        new Date(ticket.updatedAt).toLocaleDateString("fa-IR"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `tickets-report-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getAutomaticAssignment = (ticket: any, technicians: any[]) => {
    const availableTechnicians = technicians.filter((tech) => tech.status === "available")

    if (availableTechnicians.length === 0) {
      return null
    }

    const specialtyMatches = availableTechnicians.filter((tech) => tech.specialties.includes(ticket.category))

    const candidateTechnicians = specialtyMatches.length > 0 ? specialtyMatches : availableTechnicians

    return candidateTechnicians.sort((a, b) => {
      if (a.rating !== b.rating) return b.rating - a.rating
      if (a.activeTickets !== b.activeTickets) return a.activeTickets - b.activeTickets
      return b.completedTickets - a.completedTickets
    })[0]
  }

  // Handle automatic assignment for single ticket
  const handleAutoAssign = (ticket: any) => {
    const recommendedTech = getAutomaticAssignment(ticket, technicians)

    if (recommendedTech) {
      onTicketUpdate(ticket.id, {
        assignedTo: recommendedTech.id,
        assignedTechnicianName: recommendedTech.name,
        status: ticket.status === "open" ? "in-progress" : ticket.status,
      })

      toast({
        title: "تکنسین به صورت خودکار تعیین شد",
        description: `تیکت ${ticket.id} به ${recommendedTech.name} واگذار شد`,
      })
    } else {
      toast({
        title: "خطا در تعیین خودکار",
        description: "تکنسین مناسبی برای این تیکت یافت نشد",
        variant: "destructive",
      })
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("fa-IR"),
      time: date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const TechnicianCard = ({ technician, ticket, onAssign, showRecommended = false }: any) => (
    <div
      className={`p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all font-iran ${
        showRecommended ? "border-primary bg-primary/5" : ""
      }`}
      onClick={() => onAssign(technician.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="text-sm font-medium font-iran">{technician.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <p className="font-medium font-iran">{technician.name}</p>
              {showRecommended && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
            </div>
            <p className="text-sm text-muted-foreground font-iran">{technician.email}</p>
          </div>
        </div>
        <div className="text-left">
          <Badge variant={technician.status === "available" ? "default" : "secondary"} className="mb-1 font-iran">
            {technician.status === "available" ? "آزاد" : "مشغول"}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="w-3 h-3 fill-current text-yellow-500" />
            <span className="font-iran">{technician.rating}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-1 flex-wrap">
          {technician.specialties.map((specialty: string) => (
            <Badge key={specialty} variant="outline" className="text-xs font-iran">
              {categoryLabels[specialty]}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span className="font-iran">{technician.activeTickets} تیکت فعال</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span className="font-iran">{technician.completedTickets} تکمیل شده</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <span className="font-iran">میانگین پاسخ: {technician.avgResponseTime}</span>
        </div>

        {technician.expertise && (
          <div className="text-xs">
            <p className="text-muted-foreground mb-1 font-iran">تخصص‌ها:</p>
            <p className="text-right font-iran">{technician.expertise.join("، ")}</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6 font-iran" dir="rtl">
      <TicketCalendarOverview tickets={tickets} />
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-right font-iran">مدیریت کامل تیکت‌ها</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2 bg-transparent font-iran"
                disabled={filteredTickets.length === 0}
              >
                <Printer className="w-4 h-4" />
                چاپ {selectedTickets.length > 0 && `(${selectedTickets.length})`}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="gap-2 bg-transparent font-iran"
                disabled={filteredTickets.length === 0}
              >
                <Download className="w-4 h-4" />
                خروجی CSV
              </Button>
              {selectedTickets.length > 0 && (
                <Dialog open={bulkAssignDialogOpen} onOpenChange={setBulkAssignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2 font-iran">
                      <UserPlus className="w-4 h-4" />
                      تعیین تکنسین ({selectedTickets.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto font-iran" dir="rtl">
                    <DialogHeader>
                      <DialogTitle className="text-right font-iran">
                        تعیین تکنسین برای {selectedTickets.length} تیکت انتخابی
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Technician Filter */}
                      <div className="flex gap-2">
                        <Select value={technicianFilter} onValueChange={setTechnicianFilter} dir="rtl">
                          <SelectTrigger className="w-48 text-right font-iran">
                            <SelectValue placeholder="فیلتر تکنسین‌ها" />
                          </SelectTrigger>
                          <SelectContent className="font-iran">
                            <SelectItem value="all">همه تکنسین‌ها</SelectItem>
                            <SelectItem value="available">آزاد</SelectItem>
                            <SelectItem value="busy">مشغول</SelectItem>
                            <SelectItem value="hardware">متخصص سخت‌افزار</SelectItem>
                            <SelectItem value="software">متخصص نرم‌افزار</SelectItem>
                            <SelectItem value="network">متخصص شبکه</SelectItem>
                            <SelectItem value="email">متخصص ایمیل</SelectItem>
                            <SelectItem value="security">متخصص امنیت</SelectItem>
                            <SelectItem value="access">متخصص دسترسی</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getFilteredTechnicians().map((technician) => (
                          <TechnicianCard key={technician.id} technician={technician} onAssign={handleBulkAssign} />
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="جستجو در تیکت‌ها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-right font-iran"
                dir="rtl"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus} dir="rtl">
              <SelectTrigger className="text-right font-iran">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent className="font-iran">
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="open">باز</SelectItem>
                <SelectItem value="in-progress">در حال انجام</SelectItem>
                <SelectItem value="resolved">حل شده</SelectItem>
                <SelectItem value="closed">بسته</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority} dir="rtl">
              <SelectTrigger className="text-right font-iran">
                <SelectValue placeholder="اولویت" />
              </SelectTrigger>
              <SelectContent className="font-iran">
                <SelectItem value="all">همه اولویت‌ها</SelectItem>
                <SelectItem value="low">کم</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="high">بالا</SelectItem>
                <SelectItem value="urgent">فوری</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory} dir="rtl">
              <SelectTrigger className="text-right font-iran">
                <SelectValue placeholder="دسته‌بندی" />
              </SelectTrigger>
              <SelectContent className="font-iran">
                <SelectItem value="all">همه دسته‌ها</SelectItem>
                <SelectItem value="hardware">سخت‌افزار</SelectItem>
                <SelectItem value="software">نرم‌افزار</SelectItem>
                <SelectItem value="network">شبکه</SelectItem>
                <SelectItem value="email">ایمیل</SelectItem>
                <SelectItem value="security">امنیت</SelectItem>
                <SelectItem value="access">دسترسی</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTechnician} onValueChange={setFilterTechnician} dir="rtl">
              <SelectTrigger className="text-right font-iran">
                <SelectValue placeholder="تکنسین" />
              </SelectTrigger>
              <SelectContent className="font-iran">
                <SelectItem value="all">همه تکنسین‌ها</SelectItem>
                <SelectItem value="unassigned">تعیین نشده</SelectItem>
                {technicians.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id}>
                    {tech.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setFilterStatus("all")
                setFilterPriority("all")
                setFilterCategory("all")
                setFilterTechnician("all")
              }}
              className="gap-2 font-iran"
            >
              <Filter className="w-4 h-4" />
              پاک کردن فیلترها
            </Button>
          </div>

          {/* Results Summary */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground text-right font-iran">
              نمایش {filteredTickets.length} از {tickets.length} تیکت
              {selectedTickets.length > 0 && ` - ${selectedTickets.length} انتخاب شده`}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                onChange={handleSelectAll}
                className="rounded"
              />
              <Label className="text-sm font-iran">انتخاب همه</Label>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">انتخاب</TableHead>
                  <TableHead className="text-right font-iran">شماره تیکت</TableHead>
                  <TableHead className="text-right font-iran">عنوان</TableHead>
                  <TableHead className="text-right font-iran">وضعیت</TableHead>
                  <TableHead className="text-right font-iran">اولویت</TableHead>
                  <TableHead className="text-right font-iran">دسته‌بندی</TableHead>
                  <TableHead className="text-right font-iran">درخواست‌کننده</TableHead>
                  <TableHead className="text-right font-iran">تکنسین</TableHead>
                  <TableHead className="text-right font-iran">تاریخ ایجاد</TableHead>
                  <TableHead className="text-right font-iran">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => {
                    const assignedTech = technicians.find((tech) => tech.id === ticket.assignedTo)

                    return (
                      <TableRow key={ticket.id}>
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={selectedTickets.includes(ticket.id)}
                            onChange={() => handleTicketSelect(ticket.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm font-iran">{ticket.id}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate font-iran" title={ticket.title}>
                            {ticket.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[ticket.status]} font-iran`}>
                            {statusLabels[ticket.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${priorityColors[ticket.priority]} font-iran`}>
                            {priorityLabels[ticket.priority]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-iran">{getCategoryLabel(ticket)}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs font-iran">
                                {ticket.clientName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-iran">{ticket.clientName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {ticket.assignedTechnicianName ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs font-iran">
                                  {ticket.assignedTechnicianName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="text-sm font-iran">{ticket.assignedTechnicianName}</span>
                                {assignedTech && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Badge
                                      variant={assignedTech.status === "available" ? "default" : "secondary"}
                                      className="text-xs font-iran"
                                    >
                                      {assignedTech.status === "available" ? "آزاد" : "مشغول"}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTicketForAssign(ticket)
                                  setTechnicianFilter("recommended")
                                  setAssignDialogOpen(true)
                                }}
                                className="gap-1 font-iran"
                              >
                                <UserPlus className="w-3 h-3" />
                                دستی
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAutoAssign(ticket)}
                                className="gap-1 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300 font-iran"
                              >
                                <Zap className="w-3 h-3" />
                                خودکار
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-iran">
                          {new Date(ticket.createdAt).toLocaleDateString("fa-IR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 font-iran hover:bg-blue-50 hover:text-blue-600"
                              onClick={() => handleViewTicket(ticket)}
                            >
                              <Eye className="w-3 h-3" />
                              مشاهده
                            </Button>
                            {ticket.assignedTechnicianName && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 font-iran"
                                onClick={() => {
                                  setSelectedTicketForAssign(ticket)
                                  setTechnicianFilter("all")
                                  setAssignDialogOpen(true)
                                }}
                              >
                                <Edit className="w-3 h-3" />
                                تغییر
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 text-muted-foreground" />
                        <p className="text-muted-foreground font-iran">تیکتی یافت نشد</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Individual Assign Technician Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto font-iran" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right font-iran">
              تعیین تکنسین برای تیکت {selectedTicketForAssign?.id}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Ticket Info */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div className="text-right">
                  <h4 className="font-medium font-iran">{selectedTicketForAssign?.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1 font-iran">
                    دسته‌بندی: {selectedTicketForAssign && getCategoryLabel(selectedTicketForAssign)} | اولویت:{" "}
                    {selectedTicketForAssign && priorityLabels[selectedTicketForAssign.priority]}
                  </p>
                </div>
                <Badge className={selectedTicketForAssign && priorityColors[selectedTicketForAssign.priority]}>
                  {selectedTicketForAssign && priorityLabels[selectedTicketForAssign.priority]}
                </Badge>
              </div>
            </div>

            {/* Technician Filter */}
            <div className="flex gap-2 items-center">
              <Label className="text-sm font-medium font-iran">فیلتر تکنسین‌ها:</Label>
              <Select value={technicianFilter} onValueChange={setTechnicianFilter} dir="rtl">
                <SelectTrigger className="w-48 text-right font-iran">
                  <SelectValue placeholder="فیلتر تکنسین‌ها" />
                </SelectTrigger>
                <SelectContent className="font-iran">
                  <SelectItem value="recommended">پیشنهادی</SelectItem>
                  <SelectItem value="all">همه تکنسین‌ها</SelectItem>
                  <SelectItem value="available">آزاد</SelectItem>
                  <SelectItem value="busy">مشغول</SelectItem>
                  <Separator />
                  <SelectItem value="hardware">متخصص سخت‌افزار</SelectItem>
                  <SelectItem value="software">متخصص نرم‌افزار</SelectItem>
                  <SelectItem value="network">متخصص شبکه</SelectItem>
                  <SelectItem value="email">متخصص ایمیل</SelectItem>
                  <SelectItem value="security">متخصص امنیت</SelectItem>
                  <SelectItem value="access">متخصص دسترسی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recommended Technicians */}
            {technicianFilter === "recommended" && selectedTicketForAssign && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <h4 className="font-medium text-right font-iran">تکنسین‌های پیشنهادی برای این تیکت</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getRecommendedTechnicians(selectedTicketForAssign).map((technician, index) => (
                    <TechnicianCard
                      key={technician.id}
                      technician={technician}
                      ticket={selectedTicketForAssign}
                      onAssign={(techId: string) => handleAssignTechnician(selectedTicketForAssign.id, techId)}
                      showRecommended={index < 2} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Technicians */}
            {technicianFilter !== "recommended" && (
              <div className="space-y-3">
                <h4 className="font-medium text-right font-iran">
                  {technicianFilter === "all"
                    ? "همه تکنسین‌ها"
                    : technicianFilter === "available"
                      ? "تکنسین‌های آزاد"
                      : technicianFilter === "busy"
                        ? "تکنسین‌های مشغول"
                        : `متخصصان ${categoryLabels[technicianFilter] || technicianFilter}`}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getFilteredTechnicians(selectedTicketForAssign).map((technician) => (
                    <TechnicianCard
                      key={technician.id}
                      technician={technician}
                      ticket={selectedTicketForAssign}
                      onAssign={(techId: string) => handleAssignTechnician(selectedTicketForAssign.id, techId)}
                    />
                  ))}
                </div>
              </div>
            )}

            {getFilteredTechnicians(selectedTicketForAssign).length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground font-iran">تکنسینی یافت نشد</h3>
                <p className="text-sm text-muted-foreground mt-1 font-iran">
                  فیلتر خود را تغییر دهید یا تکنسین جدیدی اضافه کنید
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto font-iran" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right font-iran text-xl">پیش‌نمایش تیکت {selectedTicket?.id}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6">
              {}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-right space-y-3">
                    <h2 className="text-2xl font-bold font-iran text-gray-900">{selectedTicket.title}</h2>
                    <div className="flex gap-3 items-center">
                      <Badge className={`${statusColors[selectedTicket.status]} font-iran text-sm px-3 py-1`}>
                        {React.createElement(statusIcons[selectedTicket.status], { className: "w-4 h-4 ml-1" })}
                        {statusLabels[selectedTicket.status]}
                      </Badge>
                      <Badge className={`${priorityColors[selectedTicket.priority]} font-iran text-sm px-3 py-1`}>
                        {priorityLabels[selectedTicket.priority]}
                      </Badge>
                      <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border">
                        <span className="text-sm font-iran">{getCategoryLabel(selectedTicket)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left bg-white p-4 rounded-lg border shadow-sm">
                    <p className="text-sm text-muted-foreground font-iran mb-1">شماره تیکت</p>
                    <p className="font-mono text-2xl font-bold text-blue-600">{selectedTicket.id}</p>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Ticket Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Description */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-right font-iran">
                        <FileText className="w-5 h-5 text-blue-600" />
                        شرح مشکل
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 border rounded-lg p-4">
                        <p className="whitespace-pre-wrap text-right font-iran leading-relaxed">
                          {selectedTicket.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dynamic Fields */}
                  {selectedTicket.dynamicFields && Object.keys(selectedTicket.dynamicFields).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-right font-iran">
                          <FileText className="w-5 h-5 text-green-600" />
                          اطلاعات تکمیلی
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(selectedTicket.dynamicFields).map(([key, value]) => (
                            <div key={key} className="bg-gray-50 border rounded-lg p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground font-iran">{key}:</span>
                                <span className="text-sm font-medium font-iran text-right">{value as string}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Attachments */}
                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-right font-iran">
                          <Paperclip className="w-5 h-5 text-purple-600" />
                          فایل‌های پیوست
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedTicket.attachments.map((file: any, index: number) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg">
                              <Paperclip className="w-4 h-4 text-gray-500" />
                              <div className="flex-1 text-right">
                                <p className="text-sm font-medium font-iran">{file.name}</p>
                                <p className="text-xs text-muted-foreground font-iran">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Responses and Updates */}
                  {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-right font-iran">
                          <MessageSquare className="w-5 h-5 text-orange-600" />
                          پاسخ‌ها و به‌روزرسانی‌ها ({selectedTicket.responses.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedTicket.responses.map((response: any, index: number) => {
                            const responseDateTime = formatDateTime(response.timestamp)
                            const StatusIcon = statusIcons[response.status]

                            return (
                              <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="w-8 h-8">
                                      <AvatarFallback className="text-sm font-iran">
                                        {response.authorName?.charAt(0) || "T"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="text-right">
                                      <p className="font-medium text-sm font-iran">{response.authorName}</p>
                                      <p className="text-xs text-muted-foreground font-iran">تکنسین</p>
                                    </div>
                                  </div>
                                  <div className="text-left space-y-2">
                                    <Badge className={`${statusColors[response.status]} font-iran text-xs`}>
                                      <StatusIcon className="w-3 h-3 ml-1" />
                                      {statusLabels[response.status]}
                                    </Badge>
                                    <div className="text-xs text-muted-foreground font-iran">
                                      <div className="flex items-center gap-1 justify-end">
                                        <Calendar className="w-3 h-3" />
                                        <span>{responseDateTime.date}</span>
                                      </div>
                                      <div className="flex items-center gap-1 justify-end mt-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{responseDateTime.time}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <p className="whitespace-pre-wrap text-right font-iran text-sm leading-relaxed">
                                    {response.message}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column - Sidebar Info */}
                <div className="space-y-6">
                  {/* Ticket Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-right font-iran">
                        <FileText className="w-5 h-5 text-blue-600" />
                        اطلاعات تیکت
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-muted-foreground font-iran">دسته‌بندی:</span>
                          <span className="text-sm font-medium font-iran">
                            {getCategoryLabel(selectedTicket)}
                          </span>
                        </div>

                        {selectedTicket.subcategory && (
                          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm text-muted-foreground font-iran">زیر دسته:</span>
                            <span className="text-sm font-medium font-iran">{selectedTicket.subcategory}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-muted-foreground font-iran">تاریخ ایجاد:</span>
                          <span className="text-sm font-medium font-iran">
                            {formatDateTime(selectedTicket.createdAt).date}
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-muted-foreground font-iran">زمان ایجاد:</span>
                          <span className="text-sm font-medium font-iran">
                            {formatDateTime(selectedTicket.createdAt).time}
                          </span>
                        </div>

                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm text-muted-foreground font-iran">آخرین به‌روزرسانی:</span>
                          <span className="text-sm font-medium font-iran">
                            {formatDateTime(selectedTicket.updatedAt).date}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Client Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-right font-iran">
                        <User className="w-5 h-5 text-green-600" />
                        اطلاعات درخواست‌کننده
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="font-iran bg-green-100 text-green-700">
                              {selectedTicket.clientName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-right flex-1">
                            <p className="font-medium font-iran">{selectedTicket.clientName}</p>
                            <p className="text-sm text-muted-foreground font-iran">درخواست‌کننده</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm text-muted-foreground font-iran">ایمیل:</span>
                            <span className="text-sm font-medium font-iran">{selectedTicket.clientEmail}</span>
                          </div>

                          {selectedTicket.clientPhone && (
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm text-muted-foreground font-iran">تلفن:</span>
                              <span className="text-sm font-medium font-iran">{selectedTicket.clientPhone}</span>
                            </div>
                          )}

                          {selectedTicket.department && (
                            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="text-sm text-muted-foreground font-iran">بخش:</span>
                              <span className="text-sm font-medium font-iran">{selectedTicket.department}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Assigned Technician */}
                  {selectedTicket.assignedTechnicianName && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-right font-iran">
                          <User className="w-5 h-5 text-purple-600" />
                          تکنسین مسئول
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="font-iran bg-purple-100 text-purple-700">
                              {selectedTicket.assignedTechnicianName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-right flex-1">
                            <p className="font-medium font-iran">{selectedTicket.assignedTechnicianName}</p>
                            <p className="text-sm text-muted-foreground font-iran">تکنسین مسئول</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-right font-iran">
                        <Settings className="w-5 h-5 text-gray-600" />
                        عملیات سریع
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2 font-iran bg-transparent"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedTicket.id)
                            toast({
                              title: "کپی شد",
                              description: "شماره تیکت در کلیپ‌بورد کپی شد",
                            })
                          }}
                        >
                          <FileText className="w-4 h-4" />
                          کپی شماره تیکت
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2 font-iran bg-transparent"
                          onClick={() => {
                            const mailtoLink = `mailto:${selectedTicket.clientEmail}?subject=پاسخ به تیکت ${selectedTicket.id}&body=سلام ${selectedTicket.clientName}،%0A%0Aدر خصوص تیکت ${selectedTicket.id} با عنوان "${selectedTicket.title}"%0A%0A`
                            window.open(mailtoLink)
                          }}
                        >
                          <Mail className="w-4 h-4" />
                          ارسال ایمیل به کاربر
                        </Button>

                        {selectedTicket.clientPhone && (
                          <Button
                            variant="outline"
                            className="w-full justify-start gap-2 font-iran bg-transparent"
                            onClick={() => {
                              window.open(`tel:${selectedTicket.clientPhone}`)
                            }}
                          >
                            <Phone className="w-4 h-4" />
                            تماس با کاربر
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

