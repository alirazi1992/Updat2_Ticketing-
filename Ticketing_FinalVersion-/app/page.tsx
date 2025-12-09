"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderTree,
  LayoutDashboard,
  ListChecks,
  Settings2,
  Ticket as TicketIcon,
} from "lucide-react";

import { apiRequest } from "@/lib/api-client";
import type {
  ApiTicketMessageDto,
  ApiTicketResponse,
  ApiUserDto,
} from "@/lib/api-types";
import {
  mapApiMessageToResponse,
  mapApiTicketToUi,
  mapUiPriorityToApi,
  mapUiStatusToApi,
} from "@/lib/ticket-mappers";
import {
  buildTechnicianProfile,
  type TechnicianProfile,
} from "@/data/technician-profiles";
import { ClientDashboard } from "@/components/client-dashboard";
import { TechnicianDashboard } from "@/components/technician-dashboard";
import { AdminDashboard } from "@/components/admin-dashboard";
import {
  DashboardShell,
  type DashboardNavItem,
} from "@/components/dashboard-shell";
import { useAuth } from "@/lib/auth-context";
import { useCategories } from "@/services/useCategories";
import { categoryService } from "@/services/CategoryService";
import type { CategoriesData } from "@/services/categories-types";
import type { Ticket, TicketStatus } from "@/types";
import { toast } from "@/hooks/use-toast";

export default function Home() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianProfile[]>([]);
  const { categories: categoriesData, save: saveCategories } = useCategories();
  const categoriesRef = useRef<CategoriesData>(categoriesData);
  const [activeView, setActiveView] = useState<string>("");

  const getDefaultViewForRole = (role: "client" | "engineer" | "admin") => {
    switch (role) {
      case "admin":
        return "admin.tickets";
      case "engineer":
        return "engineer.assigned";
      default:
        return "client.tickets";
    }
  };

  const categoriesReady = useMemo(
    () =>
      Object.values(categoriesData).some(
        (cat) => typeof cat.backendId !== "undefined"
      ),
    [categoriesData]
  );

  useEffect(() => {
    categoriesRef.current = categoriesData;
  }, [categoriesData]);

  const loadTickets = async (
    authToken: string,
    categorySnapshot: CategoriesData
  ) => {
    try {
      const apiTickets = await apiRequest<ApiTicketResponse[]>("/api/tickets", {
        token: authToken,
      });

      const mapped = await Promise.all(
        apiTickets.map(async (apiTicket) => {
          let messages: ApiTicketMessageDto[] = [];
          try {
            messages = await apiRequest<ApiTicketMessageDto[]>(
              `/api/tickets/${apiTicket.id}/messages`,
              {
                token: authToken,
              }
            );
          } catch (error) {
            console.error("Failed to load ticket messages", {
              ticketId: apiTicket.id,
              error,
            });
          }

          return mapApiTicketToUi(
            apiTicket,
            categorySnapshot,
            messages.map(mapApiMessageToResponse)
          );
        })
      );

      setTickets(mapped);
    } catch (error) {
      console.error("Failed to load tickets", error);
      toast({
        title: "بارگذاری تیکت‌ها ناموفق بود",
        description: "اتصال یا سرور بررسی شود.",
        variant: "destructive",
      });
      setTickets([]);
    }
  };

  const loadTechnicians = async (authToken: string) => {
    try {
      const apiTechnicians = await apiRequest<ApiUserDto[]>(
        "/api/users/technicians",
        { token: authToken }
      );
      setTechnicians(apiTechnicians.map(buildTechnicianProfile));
    } catch (error) {
      console.error("Failed to load technicians", error);
      setTechnicians([]);
    }
  };

  // Redirect unauthenticated users to the login page
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!token || !user) {
      setTickets([]);
      setTechnicians([]);
      return;
    }

    void loadTickets(token, categoriesReady ? categoriesRef.current : {});

    if (user.role === "admin") {
      void loadTechnicians(token);
    } else {
      setTechnicians([]);
    }
  }, [token, user, categoriesReady]);

  // -------- Ticket handlers (single definitions) --------

  const ensureBackendCategories = async () => {
    // If we already have backend ids, skip.
    if (
      Object.values(categoriesRef.current).some(
        (cat) => typeof cat.backendId !== "undefined"
      )
    ) {
      return categoriesRef.current;
    }

    try {
      const fresh = await categoryService.list();
      categoriesRef.current = fresh;
      await saveCategories(fresh);
      return fresh;
    } catch (error) {
      console.error("Failed to hydrate categories from backend", error);
      return categoriesRef.current;
    }
  };

  const handleTicketCreate = async (draft: Ticket) => {
    if (!token) {
      throw new Error("Missing authentication token");
    }

    const catMap =
      Object.values(categoriesRef.current).some(
        (cat) => typeof cat.backendId !== "undefined"
      )
        ? categoriesRef.current
        : await ensureBackendCategories();

    const category = catMap[draft.category];
    if (!category || typeof category.backendId === "undefined") {
      console.warn("Missing category mapping for", draft.category, category);
      toast({
        title: "دسته‌بندی نامعتبر است",
        description:
          "دسته‌بندی‌ها هنوز از سرور بارگذاری نشده‌اند. چند لحظه بعد دوباره تلاش کنید.",
        variant: "destructive",
      });
      throw new Error("Category mapping not available");
    }

    try {
      const created = await apiRequest<ApiTicketResponse>("/api/tickets", {
        method: "POST",
        token,
        body: {
          title: draft.title,
          description: draft.description,
          categoryId: category.backendId,
          subcategoryId: draft.subcategory
            ? category.subIssues[draft.subcategory]?.backendId
            : undefined,
          priority: mapUiPriorityToApi(draft.priority),
        },
      });

      const ticket = mapApiTicketToUi(created, categoriesRef.current, []);
      setTickets((prev) => [ticket, ...prev]);
      await refreshTickets();
    } catch (error) {
      console.error("Failed to create ticket", error);
      toast({
        title: "ثبت تیکت ناموفق بود",
          description: "لطفا اتصال و داده‌ها را بررسی کنید.",
          variant: "destructive",
        });
    }
  };

  const refreshTickets = async () => {
    if (!token || !user) return;
    await loadTickets(token, categoriesRef.current);
  };

  const handleTicketUpdate = async (
    ticketId: string,
    updates: Partial<Ticket>
  ) => {
    if (!token) return;

    const payload: Record<string, unknown> = {};

    if (updates.status) {
      payload.status = mapUiStatusToApi(updates.status);
    }
    if (updates.priority) {
      payload.priority = mapUiPriorityToApi(updates.priority);
    }
    if (typeof updates.assignedTo !== "undefined") {
      payload.assignedToUserId = updates.assignedTo;
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    try {
      const updatedTicket = await apiRequest<ApiTicketResponse>(
        `/api/tickets/${ticketId}`,
        {
          method: "PATCH",
          token,
          body: payload,
        }
      );

      const messages = await apiRequest<ApiTicketMessageDto[]>(
        `/api/tickets/${ticketId}/messages`,
        { token }
      );
      const mapped = mapApiTicketToUi(
        updatedTicket,
        categoriesRef.current,
        messages.map(mapApiMessageToResponse)
      );

      setTickets((prev) =>
        prev.map((ticket) => (ticket.id === ticketId ? mapped : ticket))
      );
      await refreshTickets();
    } catch (error) {
      console.error("Failed to update ticket", error);
      toast({
        title: "به‌روزرسانی تیکت ناموفق بود",
        description: "لطفا مجددا تلاش کنید.",
        variant: "destructive",
      });
    }
  };

  const handleTicketResponse = async (
    ticketId: string,
    message: string,
    status: TicketStatus
  ) => {
    if (!token) return;

    try {
      await apiRequest<ApiTicketMessageDto>(
        `/api/tickets/${ticketId}/messages`,
        {
          method: "POST",
          token,
          body: {
            message,
            status: mapUiStatusToApi(status),
          },
        }
      );

      const [ticketDetails, messages] = await Promise.all([
        apiRequest<ApiTicketResponse>(`/api/tickets/${ticketId}`, { token }),
        apiRequest<ApiTicketMessageDto[]>(`/api/tickets/${ticketId}/messages`, {
          token,
        }),
      ]);

      const mapped = mapApiTicketToUi(
        ticketDetails,
        categoriesRef.current,
        messages.map(mapApiMessageToResponse)
      );
      setTickets((prev) =>
        prev.map((ticket) => (ticket.id === ticketId ? mapped : ticket))
      );
      await refreshTickets();
    } catch (error) {
      console.error("Failed to add response", error);
      toast({
        title: "ثبت پاسخ ناموفق بود",
        description: "لطفا مجددا تلاش کنید.",
        variant: "destructive",
      });
    }
  };

  // -------- Active view handling --------

  useEffect(() => {
    if (!user) {
      setActiveView("");
      return;
    }

    setActiveView((current) => {
      if (current && current.startsWith(user.role)) {
        return current;
      }
      return getDefaultViewForRole(user.role);
    });
  }, [user]);

  const handleCategoryUpdate = (updatedCategories: CategoriesData) => {
    void saveCategories(updatedCategories);
  };

  const navItems = useMemo<DashboardNavItem[]>(() => {
    if (!user) {
      return [];
    }

    if (user.role === "client") {
      const userTickets = tickets.filter(
        (ticket) => ticket.clientEmail === user.email
      );
      const newTicketCount = userTickets.filter(
        (ticket) => ticket.status === "open"
      ).length;

      return [
        {
          id: "client-overview",
          title: "داشبورد",
          icon: LayoutDashboard,
          target: "client.tickets",
        },
        {
          id: "client-tickets",
          title: "درخواست‌های من",
          icon: TicketIcon,
          children: [
            {
              id: "client-tickets-list",
              title: "همه درخواست‌ها",
              target: "client.tickets",
              badge: userTickets.length,
            },
            {
              id: "client-tickets-create",
              title: "ثبت درخواست جدید",
              target: "client.create",
              badge: newTicketCount > 0 ? "+" : undefined,
            },
          ],
        },
      ];
    }

    if (user.role === "engineer") {
      const technicianTickets = tickets.filter(
        (ticket) => ticket.assignedTechnicianEmail === user.email
      );
      const inProgressCount = technicianTickets.filter(
        (ticket) => ticket.status === "in-progress"
      ).length;
      const closedCount = technicianTickets.filter(
        (ticket) => ticket.status === "resolved" || ticket.status === "closed"
      ).length;

      return [
        {
          id: "engineer-overview",
          title: "داشبورد پشتیبان",
          icon: LayoutDashboard,
          target: "engineer.assigned",
        },
        {
          id: "engineer-tickets",
          title: "تیکت‌های محول شده",
          icon: ListChecks,
          children: [
            {
              id: "engineer-assigned",
              title: "تیکت‌های من",
              target: "engineer.assigned",
              badge: technicianTickets.length,
            },
            {
              id: "engineer-progress",
              title: "در حال رسیدگی",
              target: "engineer.in-progress",
              badge: inProgressCount,
            },
            {
              id: "engineer-history",
              title: "آرشیو / پایان یافته",
              target: "engineer.history",
              badge: closedCount,
            },
          ],
        },
      ];
    }

    const openTicketsCount = tickets.filter(
      (ticket) => ticket.status === "open"
    ).length;

    return [
      {
        id: "admin-overview",
        title: "داشبورد مدیر",
        icon: LayoutDashboard,
        target: "admin.tickets",
      },
      {
        id: "admin-tickets",
        title: "مدیریت تیکت‌ها",
        icon: TicketIcon,
        children: [
          {
            id: "admin-tickets-all",
            title: "همه تیکت‌ها",
            target: "admin.tickets",
            badge: tickets.length,
          },
          {
            id: "admin-assignment",
            title: "تخصیص تیکت‌ها",
            target: "admin.assignment",
            badge: openTicketsCount,
          },
        ],
      },
      {
        id: "admin-categories",
        title: "مدیریت دسته‌بندی‌ها",
        icon: FolderTree,
        children: [
          {
            id: "admin-categories-manage",
            title: "مدیریت دسته‌بندی‌ها",
            target: "admin.categories",
            badge: Object.keys(categoriesData).length,
          },
        ],
      },
      {
        id: "admin-automation",
        title: "تنظیمات خودکار",
        icon: Settings2,
        target: "admin.auto-settings",
      },
    ];
  }, [user, tickets, categoriesData]);

  // -------- Loading & unauthenticated states --------

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300 mx-auto" />
          <p className="text-sm text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-300 mx-auto" />
          <p className="text-sm text-slate-300">Redirecting to login...</p>
        </div>
      </div>
    );
  }
// -------- Main dashboard content --------

  const resolvedActiveView = activeView || getDefaultViewForRole(user.role);

  const dashboardContent = (() => {
    if (user.role === "client") {
      const clientSection: "tickets" | "create" =
        resolvedActiveView === "client.create" ? "create" : "tickets";

      return (
        <ClientDashboard
          tickets={tickets}
          onTicketCreate={handleTicketCreate}
          currentUser={user}
          categoriesData={categoriesData}
          activeSection={clientSection}
        />
      );
    }

    if (user.role === "engineer") {
      const engineerSection: "assigned" | "in-progress" | "history" =
        resolvedActiveView === "engineer.in-progress"
          ? "in-progress"
          : resolvedActiveView === "engineer.history"
          ? "history"
          : "assigned";

      const handleTechnicianSectionChange = (
        section: "assigned" | "in-progress" | "history"
      ) => {
        const next = `engineer.${section}`;
        setActiveView((prev) => (prev === next ? prev : next));
      };

      return (
        <TechnicianDashboard
          tickets={tickets}
          onTicketUpdate={handleTicketUpdate}
          onTicketRespond={handleTicketResponse}
          currentUser={user}
          activeSection={engineerSection}
          onSectionChange={handleTechnicianSectionChange}
        />
      );
    }

    const adminSection:
      | "tickets"
      | "assignment"
      | "categories"
      | "auto-settings" =
      resolvedActiveView === "admin.assignment"
        ? "assignment"
        : resolvedActiveView === "admin.categories"
        ? "categories"
        : resolvedActiveView === "admin.auto-settings"
        ? "auto-settings"
        : "tickets";

    return (
      <AdminDashboard
        tickets={tickets}
        onTicketUpdate={handleTicketUpdate}
        technicians={technicians}
        categoriesData={categoriesData}
        onCategoryUpdate={handleCategoryUpdate}
        activeSection={adminSection}
      />
    );
  })();

  return (
    <DashboardShell
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department ?? undefined,
        title: user.phone ?? undefined,
        avatar: user.avatar ?? undefined,
      }}
      navItems={navItems}
      activeItem={resolvedActiveView}
      onSelect={setActiveView}
    >
      {dashboardContent}
    </DashboardShell>
  );
}

