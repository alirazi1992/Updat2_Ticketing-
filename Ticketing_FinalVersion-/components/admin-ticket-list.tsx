"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Filter,
  Eye,
  Download,
  Printer,
  Calendar,
  MessageSquare,
  FileText,
  User,
  Phone,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Paperclip,
  Settings,
  Mail,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

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

interface AdminTicketListProps {
  tickets: any[]
  onTicketUpdate: (ticketId: string, updates: any) => void
}

export function AdminTicketList({ tickets, onTicketUpdate }: AdminTicketListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)

  // Filter tickets based on search and filters
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.clientName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus
    const matchesPriority = filterPriority === "all" || ticket.priority === filterPriority
    const matchesCategory = filterCategory === "all" || ticket.category === filterCategory

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory
  })

  const handleViewTicket = (ticket: any) => {
    console.log("Opening ticket preview for:", ticket.id) 
    setSelectedTicket(ticket)
    setViewDialogOpen(true)
  }

  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    if (checked) {
      setSelectedTickets([...selectedTickets, ticketId])
    } else {
      setSelectedTickets(selectedTickets.filter((id) => id !== ticketId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTickets(filteredTickets.map((ticket) => ticket.id))
    } else {
      setSelectedTickets([])
    }
  }

  const handleBulkStatusUpdate = (newStatus: string) => {
    selectedTickets.forEach((ticketId) => {
      onTicketUpdate(ticketId, { status: newStatus })
    })
    setSelectedTickets([])
    toast({
      title: "به‌روزرسانی انجام شد",
      description: `وضعیت ${selectedTickets.length} تیکت به‌روزرسانی شد`,
    })
  }

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>گزارش تیکت‌ها</title>
        <style>
          body { font-family: 'IRANYekan', Tahoma, Arial, sans-serif; margin: 20px; direction: rtl; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat-box { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .status-open { background-color: #fee2e2; color: #991b1b; }
          .status-in-progress { background-color: #fef3c7; color: #92400e; }
          .status-resolved { background-color: #d1fae5; color: #065f46; }
          .status-closed { background-color: #f3f4f6; color: #374151; }
          .priority-urgent { background-color: #fce7f3; color: #be185d; }
          .priority-high { background-color: #fee2e2; color: #991b1b; }
          .priority-medium { background-color: #fed7aa; color: #c2410c; }
          .priority-low { background-color: #dbeafe; color: #1e40af; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>گزارش تیکت‌های سیستم مدیریت خدمات IT</h1>
          <p>تاریخ تولید گزارش: ${new Date().toLocaleDateString("fa-IR")}</p>
        </div>
        
        <div class="stats">
          <div class="stat-box">
            <h3>کل تیکت‌ها</h3>
            <p>${tickets.length}</p>
          </div>
          <div class="stat-box">
            <h3>باز</h3>
            <p>${tickets.filter((t) => t.status === "open").length}</p>
          </div>
          <div class="stat-box">
            <h3>در حال انجام</h3>
            <p>${tickets.filter((t) => t.status === "in-progress").length}</p>
          </div>
          <div class="stat-box">
            <h3>حل شده</h3>
            <p>${tickets.filter((t) => t.status === "resolved").length}</p>
          </div>
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
            </tr>
          </thead>
          <tbody>
            ${filteredTickets
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
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleExportCSV = () => {
    const headers = [
      "شماره تیکت",
      "عنوان",
      "وضعیت",
      "اولویت",
      "دسته‌بندی",
      "درخواست‌کننده",
      "ایمیل",
      "تکنسین",
      "تاریخ ایجاد",
      "آخرین به‌روزرسانی",
    ]

    const csvContent = [
      headers.join(","),
      ...filteredTickets.map((ticket) =>
        [
          ticket.id,
          `"${ticket.title}"`,
          statusLabels[ticket.status],
          priorityLabels[ticket.priority],
          getCategoryLabel(ticket),
          `"${ticket.clientName}"`,
          ticket.clientEmail,
          `"${ticket.assignedTechnicianName || "تعیین نشده"}"`,
          new Date(ticket.createdAt).toLocaleDateString("fa-IR"),
          new Date(ticket.updatedAt).toLocaleDateString("fa-IR"),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `tickets-report-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "فایل CSV ایجاد شد",
      description: "گزارش تیکت‌ها با موفقیت دانلود شد",
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("fa-IR"),
      time: date.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
    }
  }

  return (
    <div className="space-y-6 font-iran" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-right font-iran">مدیریت کامل تیکت‌ها</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} className="gap-2 bg-transparent font-iran">
                <Printer className="w-4 h-4" />
                چاپ گزارش
              </Button>
              <Button variant="outline" onClick={handleExportCSV} className="gap-2 bg-transparent font-iran">
                <Download className="w-4 h-4" />
                خروجی CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
                <SelectItem value="urgent">فوری</SelectItem>
                <SelectItem value="high">بالا</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="low">کم</SelectItem>
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

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setFilterStatus("all")
                setFilterPriority("all")
                setFilterCategory("all")
              }}
              className="gap-2 font-iran"
            >
              <Filter className="w-4 h-4" />
              پاک کردن فیلترها
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedTickets.length > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium font-iran">{selectedTickets.length} تیکت انتخاب شده</span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleBulkStatusUpdate("in-progress")}
                  variant="outline"
                  className="font-iran"
                >
                  در حال انجام
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleBulkStatusUpdate("resolved")}
                  variant="outline"
                  className="font-iran"
                >
                  حل شده
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleBulkStatusUpdate("closed")}
                  variant="outline"
                  className="font-iran"
                >
                  بسته
                </Button>
              </div>
            </div>
          )}

          {/* Tickets Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
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
                    const isSelected = selectedTickets.includes(ticket.id)

                    return (
                      <TableRow key={ticket.id} className={isSelected ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectTicket(ticket.id, checked as boolean)}
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
                            <div>
                              <div className="text-sm font-medium font-iran">{ticket.clientName}</div>
                              <div className="text-xs text-muted-foreground font-iran">{ticket.clientEmail}</div>
                            </div>
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
                              <span className="text-sm font-iran">{ticket.assignedTechnicianName}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground font-iran">تعیین نشده</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-iran">
                          {new Date(ticket.createdAt).toLocaleDateString("fa-IR")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTicket(ticket)}
                            className="gap-1 font-iran hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Eye className="w-3 h-3" />
                            مشاهده
                          </Button>
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

      {/* Enhanced View Ticket Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto font-iran" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right font-iran text-xl">پیش‌نمایش تیکت {selectedTicket?.id}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Header with Status */}
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
