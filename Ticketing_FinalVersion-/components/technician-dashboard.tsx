"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Filter,
  Eye,
  MessageSquare,
  Clock,
  AlertCircle,
  Ticket as TicketIcon,
  Send,
  Calendar,
  CheckCircle,
} from "lucide-react";
import type { Ticket, TicketCategory, TicketPriority, TicketStatus } from "@/types";

/* ====================== TYPES ====================== */
type FilterStatus = "all" | TicketStatus;
type FilterPriority = "all" | TicketPriority;

type SummaryScope = "all" | "open" | "in-progress" | "resolved";

interface User {
  name?: string;
  email?: string;
}

interface TechnicianDashboardProps {
  tickets: Ticket[];
  onTicketUpdate: (ticketId: string, updates: Partial<Ticket>) => void;
  onTicketRespond?: (ticketId: string, message: string, status: TicketStatus) => Promise<void> | void;
  currentUser: User;
  activeSection?: "assigned" | "in-progress" | "history";
  onSectionChange?: (section: "assigned" | "in-progress" | "history") => void;
}

/* =================== LABELS / COLORS =================== */
const statusColors: Record<TicketStatus, string> = {
  open: "bg-red-100 text-red-800 border-red-200",
  "in-progress": "bg-yellow-100 text-yellow-800 border-yellow-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusLabels: Record<TicketStatus, string> = {
  open: "باز",
  "in-progress": "در حال انجام",
  resolved: "حل شده",
  closed: "بسته",
};

const priorityColors: Record<TicketPriority, string> = {
  low: "bg-blue-100 text-blue-800 border-blue-200",
  medium: "bg-orange-100 text-orange-800 border-orange-200",
  high: "bg-red-100 text-red-800 border-red-200",
  urgent: "bg-purple-100 text-purple-800 border-purple-200",
};

const priorityLabels: Record<TicketPriority, string> = {
  low: "کم",
  medium: "متوسط",
  high: "بالا",
  urgent: "فوری",
};

const categoryLabels: Record<TicketCategory, string> = {
  hardware: "سخت‌افزار",
  software: "نرم‌افزار",
  network: "شبکه",
  email: "ایمیل",
  security: "امنیت",
  access: "دسترسی",
};
const getCategoryLabel = (ticketOrId: any) => {
  const id = typeof ticketOrId === "string" ? ticketOrId : ticketOrId?.category;
  if (typeof ticketOrId === "object" && ticketOrId?.categoryLabel) {
    return ticketOrId.categoryLabel;
  }
  return categoryLabels[id as TicketCategory] ?? id;
};

/* ====================== COMPONENT ====================== */
export function TechnicianDashboard({
  tickets,
  onTicketUpdate,
  onTicketRespond,
  currentUser,
  activeSection = "assigned",
  onSectionChange,
}: TechnicianDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterPriority, setFilterPriority] = useState<FilterPriority>("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [responseStatus, setResponseStatus] = useState<TicketStatus>("open");
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [summaryDialogData, setSummaryDialogData] = useState<{
    title: string;
    description: string;
    tickets: Ticket[];
  } | null>(null);
  const [selectedScope, setSelectedScope] = useState<SummaryScope>('all');
  const cardOverrideRef = useRef<SummaryScope | null>(null);

  useEffect(() => {
    if (activeSection === "in-progress") {
      cardOverrideRef.current = null;
      setSelectedScope('in-progress');
      setFilterStatus('all');
      setFilterPriority('all');
      return;
    }
    if (activeSection === "history") {
      cardOverrideRef.current = null;
      setSelectedScope('resolved');
      setFilterStatus('all');
      setFilterPriority('all');
      return;
    }
    // assigned view
    setFilterPriority('all');
    if (cardOverrideRef.current === 'open') {
      setSelectedScope('open');
      setFilterStatus('open');
      cardOverrideRef.current = null;
    } else {
      setSelectedScope('all');
      setFilterStatus('all');
    }
  }, [activeSection]);

  const technicianTickets = tickets.filter((ticket) => {
    return ticket.assignedTechnicianEmail === currentUser?.email;
  });

  const matchesScope = (ticket: Ticket, scope: SummaryScope) => {
    switch (scope) {
      case "open":
        return ticket.status === "open";
      case "in-progress":
        return ticket.status === "in-progress";
      case "resolved":
        return ticket.status === "resolved" || ticket.status === "closed";
      case "all":
      default:
        return true;
    }
  };

  const sectionTickets = technicianTickets.filter((ticket) =>
    matchesScope(ticket, selectedScope),
  );

  const filteredTickets = sectionTickets.filter((ticket) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      ticket.title.toLowerCase().includes(q) ||
      ticket.description.toLowerCase().includes(q) ||
      ticket.id.toLowerCase().includes(q) ||
      ticket.clientName.toLowerCase().includes(q);

    const matchesStatus =
      filterStatus === "all" || ticket.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || ticket.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalTickets = technicianTickets.length;
  const openTickets = technicianTickets.filter((t) => t.status === "open").length;
  const inProgressTickets = technicianTickets.filter((t) => t.status === "in-progress").length;
  const resolvedTickets = technicianTickets.filter((t) => t.status === "resolved" || t.status === "closed").length;

  const summaryCards = [
    {
      id: "all",
      title: "کل تیکت‌های من",
      description: "نمایش تمام تیکت‌های واگذار شده",
      value: totalTickets,
      icon: TicketIcon,
      scope: "all" as SummaryScope,
      section: "assigned" as const,
      iconColor: "text-muted-foreground",
    },
    {
      id: "open",
      title: "نیاز به پاسخ",
      description: "تیکت‌های منتظر پاسخ شما",
      value: openTickets,
      icon: AlertCircle,
      scope: "open" as SummaryScope,
      section: "assigned" as const,
      iconColor: "text-red-500",
    },
    {
      id: "in-progress",
      title: "در حال انجام",
      description: "تیکت‌هایی که در حال پیگیری هستند",
      value: inProgressTickets,
      icon: Clock,
      scope: "in-progress" as SummaryScope,
      section: "in-progress" as const,
      iconColor: "text-blue-500",
    },
    {
      id: "resolved",
      title: "حل شده",
      description: "تیکت‌هایی که بسته شده‌اند",
      value: resolvedTickets,
      icon: CheckCircle,
      scope: "resolved" as SummaryScope,
      section: "history" as const,
      iconColor: "text-green-500",
    },
  ];

  const scopeToSection: Record<SummaryScope, "assigned" | "in-progress" | "history"> = {
    all: "assigned",
    open: "assigned",
    "in-progress": "in-progress",
    resolved: "history",
  };

  const handleSummaryClick = (card: (typeof summaryCards)[number]) => {
    const scope = card.scope;
    const targetSection = scopeToSection[scope];

    if (scope === "open") {
      cardOverrideRef.current = "open";
      setSelectedScope("open");
      setFilterStatus("open");
      setFilterPriority("all");
      if (onSectionChange && activeSection !== targetSection) {
        onSectionChange(targetSection);
      }
    } else {
      cardOverrideRef.current = null;
      setSelectedScope(scope);
      setFilterStatus("all");
      setFilterPriority("all");
      if (onSectionChange && activeSection !== targetSection) {
        onSectionChange(targetSection);
      }
    }

    const scopedTickets = technicianTickets.filter((ticket) =>
      matchesScope(ticket, scope),
    );

    setSummaryDialogData({
      title: card.title,
      description: card.description,
      tickets: scopedTickets,
    });
    setSummaryDialogOpen(true);
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setViewDialogOpen(true);
  };

  const handleResponseTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setResponseStatus(ticket.status ?? "open");
    setResponseMessage("");
    setResponseDialogOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedTicket) return;

    if (!responseMessage.trim()) {
      toast({
        title: "متن پاسخ خالی است",
        description: "لطفاً توضیحی برای پاسخ وارد کنید.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (onTicketRespond) {
        await onTicketRespond(selectedTicket.id, responseMessage.trim(), responseStatus);
      } else {
        onTicketUpdate(selectedTicket.id, {
          status: responseStatus,
        });
      }

      toast({
        title: "پاسخ ثبت شد",
        description: "پاسخ و وضعیت تیکت با موفقیت به‌روزرسانی شد.",
      });

      setResponseDialogOpen(false);
      setResponseMessage("");
      setSelectedTicket(null);
    } catch {
      toast({
        title: "خطا در ثبت پاسخ",
        description: "در ثبت پاسخ مشکلی پیش آمد. دوباره تلاش کنید.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 font-iran" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-right">
          <h2 className="text-2xl font-bold font-iran">پنل تکنسین</h2>
          <p className="text-muted-foreground font-iran">
            مدیریت و پاسخ‌دهی به تیکت‌های واگذار شده
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const isActive = selectedScope === card.scope;

          return (
            <Card
              key={card.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSummaryClick(card)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleSummaryClick(card);
                }
              }}
              className={`transition border-2 cursor-pointer ${
                isActive ? "border-primary shadow-md" : "border-transparent hover:border-primary/50"
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right font-iran">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right font-iran">{card.value}</div>
                <p className="text-xs text-muted-foreground text-right font-iran mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={summaryDialogOpen}
        onOpenChange={(open) => {
          setSummaryDialogOpen(open);
          if (!open) {
            setSummaryDialogData(null);
          }
        }}
      >
        {summaryDialogData && (
          <DialogContent className="max-w-3xl font-iran" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right font-iran">
                {summaryDialogData.title}
              </DialogTitle>
              {summaryDialogData.description ? (
                <DialogDescription className="text-right font-iran">
                  {summaryDialogData.description}
                </DialogDescription>
              ) : null}
            </DialogHeader>
            <div className="space-y-3">
              {summaryDialogData.tickets.length ? (
                summaryDialogData.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    role="button"
                    tabIndex={0}
                    className="border rounded-lg p-3 hover:bg-muted transition cursor-pointer"
                    onClick={() => {
                      handleViewTicket(ticket);
                      setSummaryDialogOpen(false);
                      setSummaryDialogData(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleViewTicket(ticket);
                        setSummaryDialogOpen(false);
                        setSummaryDialogData(null);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-right space-y-1">
                        <p className="font-medium font-iran">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground font-iran">
                          {ticket.clientName} - {new Date(ticket.createdAt).toLocaleDateString("fa-IR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={[statusColors[ticket.status], "font-iran"].join(" ")}>{statusLabels[ticket.status]}</Badge>
                        <Badge className={[priorityColors[ticket.priority], "font-iran"].join(" ")}>{priorityLabels[ticket.priority]}</Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-sm text-muted-foreground font-iran">
                  موردی یافت نشد
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Tickets Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right font-iran">
            تیکت‌های واگذار شده
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

            <Select
              value={filterStatus}
              onValueChange={(v: FilterStatus) => setFilterStatus(v)}
              dir="rtl"
            >
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

            <Select
              value={filterPriority}
              onValueChange={(v: FilterPriority) => setFilterPriority(v)}
              dir="rtl"
            >
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

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setFilterStatus("all");
                setFilterPriority("all");
              }}
              className="gap-2 font-iran"
            >
              <Filter className="w-4 h-4" />
              پاک کردن فیلترها
            </Button>
          </div>

          {/* Tickets Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right font-iran">
                    شماره تیکت
                  </TableHead>
                  <TableHead className="text-right font-iran">عنوان</TableHead>
                  <TableHead className="text-right font-iran">وضعیت</TableHead>
                  <TableHead className="text-right font-iran">اولویت</TableHead>
                  <TableHead className="text-right font-iran">
                    دسته‌بندی
                  </TableHead>
                  <TableHead className="text-right font-iran">
                    درخواست‌کننده
                  </TableHead>
                  <TableHead className="text-right font-iran">
                    تاریخ ایجاد
                  </TableHead>
                  <TableHead className="text-right font-iran">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm font-iran">
                        {ticket.id}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div
                          className="truncate font-iran"
                          title={ticket.title}
                        >
                          {ticket.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${statusColors[ticket.status]} font-iran`}
                        >
                          {statusLabels[ticket.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            priorityColors[ticket.priority]
                          } font-iran`}
                        >
                          {priorityLabels[ticket.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-iran">
                          {getCategoryLabel(ticket)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs font-iran">
                              {ticket.clientName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-iran">
                            {ticket.clientName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-iran">
                        {new Date(ticket.createdAt).toLocaleDateString("fa-IR")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTicket(ticket)}
                            className="gap-1 font-iran"
                          >
                            <Eye className="w-3 h-3" />
                            مشاهده
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResponseTicket(ticket)}
                            className="gap-1 font-iran"
                          >
                            <MessageSquare className="w-3 h-3" />
                            پاسخ
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 text-muted-foreground" />
                        <p className="text-muted-foreground font-iran">
                          {sectionTickets.length === 0
                            ? "هیچ تیکتی به شما واگذار نشده است"
                            : "تیکتی یافت نشد"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Ticket Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent
          className="max-w-4xl max-h-[80vh] overflow-y-auto font-iran"
          dir="rtl"
        >
          <DialogHeader>
            <DialogTitle className="text-right font-iran">
              جزئیات تیکت {selectedTicket?.id}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Header */}
              <div className="flex justify-between items-start">
                <div className="text-right space-y-2">
                  <h3 className="text-xl font-semibold font-iran">
                    {selectedTicket.title}
                  </h3>
                  <div className="flex gap-2">
                    <Badge
                      className={`${
                        statusColors[selectedTicket.status]
                      } font-iran`}
                    >
                      {statusLabels[selectedTicket.status]}
                    </Badge>
                    <Badge
                      className={`${
                        priorityColors[selectedTicket.priority]
                      } font-iran`}
                    >
                      {priorityLabels[selectedTicket.priority]}
                    </Badge>
                  </div>
                </div>
                <div className="text-left space-y-1">
                  <p className="text-sm text-muted-foreground font-iran">
                    شماره تیکت
                  </p>
                  <p className="font-mono text-lg font-iran">
                    {selectedTicket.id}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Ticket Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 font-iran">اطلاعات کلی</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-iran">
                          دسته‌بندی:
                        </span>
                        <span className="font-iran">
                          {getCategoryLabel(selectedTicket)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-iran">
                          زیر دسته:
                        </span>
                        <span className="font-iran">
                          {selectedTicket.subcategory}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-iran">
                          تاریخ ایجاد:
                        </span>
                        <span className="font-iran">
                          {new Date(
                            selectedTicket.createdAt
                          ).toLocaleDateString("fa-IR")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-iran">
                          آخرین به‌روزرسانی:
                        </span>
                        <span className="font-iran">
                          {selectedTicket.updatedAt
                            ? new Date(selectedTicket.updatedAt).toLocaleDateString("fa-IR")
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 font-iran">اطلاعات تماس</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-iran">
                          نام:
                        </span>
                        <span className="font-iran">
                          {selectedTicket.clientName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-iran">
                          ایمیل:
                        </span>
                        <span className="font-iran">
                          {selectedTicket.clientEmail}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-iran">
                          تلفن:
                        </span>
                        <span className="font-iran">
                          {selectedTicket.clientPhone}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-iran">
                          بخش:
                        </span>
                        <span className="font-iran">
                          {selectedTicket.department}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2 font-iran">شرح مشکل</h4>
                <div className="bg-muted p-4 rounded-lg text-right">
                  <p className="whitespace-pre-wrap font-iran">
                    {selectedTicket.description}
                  </p>
                </div>
              </div>

              {/* Responses */}
              {selectedTicket.responses &&
                selectedTicket.responses.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-4 flex items-center gap-2 font-iran">
                      <MessageSquare className="w-4 h-4" />
                      پاسخ‌ها و به‌روزرسانی‌ها
                    </h4>
                    <div className="space-y-4">
                      {selectedTicket.responses.map((response, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs font-iran">
                                  {response.authorName?.charAt(0) || "T"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm font-iran">
                                {response.authorName}
                              </span>
                            </div>
                            <div className="text-left">
                              <Badge
                                className={`${
                                  statusColors[response.status]
                                } mb-1 font-iran`}
                              >
                                {statusLabels[response.status]}
                              </Badge>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 font-iran">
                                <Calendar className="w-3 h-3" />
                                {new Date(
                                  response.timestamp
                                ).toLocaleDateString("fa-IR")}{" "}
                                -
                                {new Date(
                                  response.timestamp
                                ).toLocaleTimeString("fa-IR")}
                              </p>
                            </div>
                          </div>
                          <div className="bg-muted/50 p-3 rounded text-right">
                            <p className="whitespace-pre-wrap font-iran">
                              {response.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="max-w-2xl font-iran" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right font-iran">
              پاسخ به تیکت {selectedTicket?.id}
            </DialogTitle>
            <DialogDescription className="text-right font-iran">
              پاسخ خود را وارد کرده و وضعیت تیکت را به‌روزرسانی کنید
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Ticket Summary */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium font-iran">{selectedTicket?.title}</h4>
              <p className="text-sm text-muted-foreground mt-1 font-iran">
                درخواست‌کننده: {selectedTicket?.clientName}
              </p>
            </div>

            {/* Status Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium font-iran">
                وضعیت جدید تیکت
              </label>
              <Select
                value={responseStatus}
                onValueChange={(v: TicketStatus) => setResponseStatus(v)}
                dir="rtl"
              >
                <SelectTrigger className="text-right font-iran">
                  <SelectValue placeholder="انتخاب وضعیت جدید" />
                </SelectTrigger>
                <SelectContent className="font-iran">
                  <SelectItem value="open">باز</SelectItem>
                  <SelectItem value="in-progress">در حال انجام</SelectItem>
                  <SelectItem value="resolved">حل شده</SelectItem>
                  <SelectItem value="closed">بسته</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Response Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium font-iran">پیام پاسخ</label>
              <Textarea
                placeholder="پاسخ خود را اینجا بنویسید..."
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                className="min-h-[120px] text-right font-iran"
                dir="rtl"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setResponseDialogOpen(false)}
                className="font-iran"
              >
                انصراف
              </Button>
              <Button
                onClick={handleSubmitResponse}
                className="gap-2 font-iran"
              >
                <Send className="w-4 h-4" />
                ارسال پاسخ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

