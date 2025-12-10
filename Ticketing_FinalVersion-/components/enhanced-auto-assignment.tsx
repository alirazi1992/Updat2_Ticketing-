"use client"

import { useState } from "react"
import type { TechnicianProfile } from "@/data/technician-profiles"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import {
  Settings,
  Zap,
  Users,
  Target,
  CheckCircle,
  Info,
  Brain,
  Award,
  TrendingUp,
  Activity,
  BarChart3,
  Lightbulb,
  AlertTriangle,
  Play,
} from "lucide-react"

interface AssignmentCriteria {
  expertise: number // 0-100
  availability: number // 0-100
  workload: number // 0-100
  performance: number // 0-100
  responseTime: number // 0-100
  priority: number // 0-100
  experience: number // 0-100
  customerRating: number // 0-100
}

type AssignmentScoreMap = Record<keyof AssignmentCriteria, number>

interface AssignmentRule {
  id: string
  name: string
  enabled: boolean
  criteria: AssignmentCriteria
  conditions: {
    ticketPriority?: string[]
    ticketCategory?: string[]
    timeOfDay?: string[]
    dayOfWeek?: string[]
  }
  description: string
}

const mockTechnicians = [
  {
    id: "tech-001",
    name: "علی احمدی",
    email: "ali@company.com",
    specialties: ["network", "hardware", "security"],
    primarySpecialty: "network",
    rating: 4.8,
    activeTickets: 3,
    completedTickets: 145,
    status: "available",
    avgResponseTime: 1.2, // hours
    avgResolutionTime: 4.5, // hours
    customerSatisfaction: 4.9,
    workingHours: { start: 8, end: 17 },
    timezone: "Asia/Tehran",
    certifications: ["CCNA", "CompTIA Network+"],
    languages: ["فارسی", "انگلیسی"],
    lastActive: new Date(),
    performanceScore: 92,
    efficiency: 88,
    escalationRate: 5, // percentage
  },
  {
    id: "tech-002",
    name: "سارا محمدی",
    email: "sara@company.com",
    specialties: ["software", "security", "access"],
    primarySpecialty: "software",
    rating: 4.9,
    activeTickets: 2,
    completedTickets: 198,
    status: "available",
    avgResponseTime: 0.8,
    avgResolutionTime: 3.2,
    customerSatisfaction: 4.95,
    workingHours: { start: 9, end: 18 },
    timezone: "Asia/Tehran",
    certifications: ["CISSP", "CEH"],
    languages: ["فارسی", "انگلیسی", "آلمانی"],
    lastActive: new Date(),
    performanceScore: 96,
    efficiency: 94,
    escalationRate: 2,
  },
  {
    id: "tech-003",
    name: "حسن رضایی",
    email: "hassan@company.com",
    specialties: ["hardware", "email", "network"],
    primarySpecialty: "hardware",
    rating: 4.7,
    activeTickets: 5,
    completedTickets: 89,
    status: "busy",
    avgResponseTime: 2.1,
    avgResolutionTime: 6.8,
    customerSatisfaction: 4.6,
    workingHours: { start: 8, end: 16 },
    timezone: "Asia/Tehran",
    certifications: ["CompTIA A+", "ITIL"],
    languages: ["فارسی"],
    lastActive: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    performanceScore: 78,
    efficiency: 72,
    escalationRate: 12,
  },
  {
    id: "tech-004",
    name: "مریم کریمی",
    email: "maryam@company.com",
    specialties: ["software", "access", "email"],
    primarySpecialty: "access",
    rating: 4.6,
    activeTickets: 1,
    completedTickets: 67,
    status: "available",
    avgResponseTime: 1.5,
    avgResolutionTime: 5.1,
    customerSatisfaction: 4.7,
    workingHours: { start: 10, end: 19 },
    timezone: "Asia/Tehran",
    certifications: ["Microsoft 365", "Azure AD"],
    languages: ["فارسی", "انگلیسی"],
    lastActive: new Date(),
    performanceScore: 84,
    efficiency: 81,
    escalationRate: 8,
  },
]

const defaultRules: AssignmentRule[] = [
  {
    id: "urgent-expert",
    name: "تیکت‌های فوری - متخصص",
    enabled: true,
    criteria: {
      expertise: 90,
      availability: 80,
      workload: 70,
      performance: 85,
      responseTime: 95,
      priority: 100,
      experience: 80,
      customerRating: 85,
    },
    conditions: {
      ticketPriority: ["urgent"],
      ticketCategory: ["all"],
    },
    description: "برای تیکت‌های فوری، بهترین متخصص با کمترین زمان پاسخ انتخاب می‌شود",
  },
  {
    id: "balanced-assignment",
    name: "تعادل بار کاری",
    enabled: true,
    criteria: {
      expertise: 70,
      availability: 90,
      workload: 95,
      performance: 75,
      responseTime: 70,
      priority: 60,
      experience: 65,
      customerRating: 70,
    },
    conditions: {
      ticketPriority: ["medium", "low"],
      ticketCategory: ["all"],
    },
    description: "توزیع متعادل تیکت‌ها بین تکنسین‌ها با در نظر گیری بار کاری",
  },
  {
    id: "specialty-match",
    name: "تطبیق تخصصی",
    enabled: true,
    criteria: {
      expertise: 100,
      availability: 60,
      workload: 50,
      performance: 80,
      responseTime: 60,
      priority: 70,
      experience: 85,
      customerRating: 75,
    },
    conditions: {
      ticketCategory: ["hardware", "software", "network", "security"],
    },
    description: "اولویت با تطبیق دقیق تخصص تکنسین با نوع مشکل",
  },
]

const priorityLabels: Record<string, string> = {
  urgent: "فوری",
  high: "بالا",
  medium: "متوسط",
  low: "کم",
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

interface EnhancedAutoAssignmentProps {
  tickets: any[]
  technicians: TechnicianProfile[]
  onTicketUpdate: (ticketId: string, updates: any) => void
}

export function EnhancedAutoAssignment({
  tickets,
  technicians: technicianOptions,
  onTicketUpdate,
}: EnhancedAutoAssignmentProps) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [rules, setRules] = useState<AssignmentRule[]>(defaultRules)
  const [selectedRule, setSelectedRule] = useState<AssignmentRule | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [simulationDialogOpen, setSimulationDialogOpen] = useState(false)
  const [simulationResults, setSimulationResults] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("rules")
  const technicians = technicianOptions && technicianOptions.length > 0 ? technicianOptions : mockTechnicians

  const calculateAssignmentScore = (technician: any, ticket: any, rule: AssignmentRule) => {
    const scores: AssignmentScoreMap = {
      expertise: calculateExpertiseScore(technician, ticket),
      availability: calculateAvailabilityScore(technician),
      workload: calculateWorkloadScore(technician),
      performance: calculatePerformanceScore(technician),
      responseTime: calculateResponseTimeScore(technician),
      priority: calculatePriorityScore(technician, ticket),
      experience: calculateExperienceScore(technician),
      customerRating: calculateCustomerRatingScore(technician),
    }

    let totalScore = 0
    let totalWeight = 0

    const criteriaEntries = Object.entries(rule.criteria) as Array<[keyof AssignmentCriteria, number]>

    criteriaEntries.forEach(([criterion, weight]) => {
      if (weight > 0) {
        totalScore += (scores[criterion] * weight) / 100
        totalWeight += weight
      }
    })

    const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0

    return {
      total: Math.round(finalScore * 10) / 10,
      breakdown: scores,
      reasons: generateAssignmentReasons(technician, ticket, scores),
    }
  }

  const calculateExpertiseScore = (technician: any, ticket: any) => {
    let score = 0

    if (technician.primarySpecialty === ticket.category) {
      score += 50
    }

    if (technician.specialties.includes(ticket.category)) {
      score += 30
    }

    const relatedSpecialties = getRelatedSpecialties(ticket.category)
    const matchingRelated = technician.specialties.filter((s: string) => relatedSpecialties.includes(s))
    score += matchingRelated.length * 5

    score += technician.certifications.length * 2

    return Math.min(100, score)
  }

  const calculateAvailabilityScore = (technician: any) => {
    if (technician.status === "available") return 100
    if (technician.status === "busy") return 30
    return 0
  }

  const calculateWorkloadScore = (technician: any) => {
    const maxTickets = 8
    const workloadRatio = technician.activeTickets / maxTickets
    return Math.max(0, (1 - workloadRatio) * 100)
  }

  const calculatePerformanceScore = (technician: any) => {
    return technician.performanceScore || 0
  }

  const calculateResponseTimeScore = (technician: any) => {
    const maxResponseTime = 4 // hours
    const score = Math.max(0, (maxResponseTime - technician.avgResponseTime) / maxResponseTime) * 100
    return Math.min(100, score)
  }

  const calculatePriorityScore = (technician: any, ticket: any) => {
    const priorityRequirements: Record<string, { minRating: number; minExperience: number }> = {
      urgent: { minRating: 4.5, minExperience: 50 },
      high: { minRating: 4.0, minExperience: 30 },
      medium: { minRating: 3.5, minExperience: 20 },
      low: { minRating: 3.0, minExperience: 10 },
    }

    const requirement = priorityRequirements[ticket.priority] || priorityRequirements.medium
    let score = 0

    if (technician.rating >= requirement.minRating) {
      score += 60
    } else {
      score += (technician.rating / requirement.minRating) * 60
    }

    if (technician.completedTickets >= requirement.minExperience) {
      score += 40
    } else {
      score += (technician.completedTickets / requirement.minExperience) * 40
    }

    return Math.min(100, score)
  }

  const calculateExperienceScore = (technician: any) => {
    const maxExperience = 200
    return Math.min(100, (technician.completedTickets / maxExperience) * 100)
  }

  const calculateCustomerRatingScore = (technician: any) => {
    return (technician.customerSatisfaction / 5) * 100
  }

  const getRelatedSpecialties = (category: string) => {
    const relations: Record<string, string[]> = {
      hardware: ["network", "email"],
      software: ["access", "security"],
      network: ["hardware", "security"],
      email: ["software", "security"],
      security: ["network", "access"],
      access: ["software", "security"],
    }
    return relations[category] || []
  }

  const generateAssignmentReasons = (technician: any, ticket: any, scores: AssignmentScoreMap) => {
    const reasons: string[] = []

    if (scores.expertise > 80) {
      reasons.push(`متخصص ${getCategoryLabel(ticket)}`)
    }

    if (scores.availability === 100) {
      reasons.push("در دسترس")
    }

    if (scores.workload > 70) {
      reasons.push("بار کاری مناسب")
    }

    if (scores.performance > 85) {
      reasons.push("عملکرد عالی")
    }

    if (scores.responseTime > 80) {
      reasons.push("پاسخ‌دهی سریع")
    }

    if (scores.customerRating > 90) {
      reasons.push("رضایت بالای مشتری")
    }

    return reasons
  }

  const findBestTechnician = (ticket: any) => {
    const applicableRules = rules.filter((rule) => {
      if (!rule.enabled) return false

      if (rule.conditions.ticketPriority && !rule.conditions.ticketPriority.includes(ticket.priority)) {
        return false
      }

      if (
        rule.conditions.ticketCategory &&
        !rule.conditions.ticketCategory.includes("all") &&
        !rule.conditions.ticketCategory.includes(ticket.category)
      ) {
        return false
      }

      return true
    })

    if (applicableRules.length === 0) {
      return null
    }

    const rule = applicableRules[0]

    const scoredTechnicians = technicians
      .map((tech) => ({
        ...tech,
        assignmentData: calculateAssignmentScore(tech, ticket, rule),
        rule: rule.name,
      }))
      .sort((a, b) => b.assignmentData.total - a.assignmentData.total)

    return scoredTechnicians[0] || null
  }

  const runSimulation = () => {
    const unassignedTickets = tickets.filter((ticket) => !ticket.assignedTo).slice(0, 10) // Limit to 10 for demo

    const results = unassignedTickets.map((ticket) => {
      const bestTech = findBestTechnician(ticket)
      return {
        ticket,
        recommendedTechnician: bestTech,
        confidence: bestTech ? Math.min(100, bestTech.assignmentData.total) : 0,
      }
    })

    setSimulationResults(results)
    setSimulationDialogOpen(true)
  }

  const autoAssignTicket = (ticket: any) => {
    const bestTech = findBestTechnician(ticket)

    if (bestTech) {
      onTicketUpdate(ticket.id, {
        assignedTo: bestTech.id,
        assignedTechnicianName: bestTech.name,
        status: ticket.status === "open" ? "in-progress" : ticket.status,
      })

      toast({
        title: "تکنسین به صورت هوشمند تعیین شد",
        description: `تیکت ${ticket.id} به ${bestTech.name} واگذار شد (امتیاز: ${bestTech.assignmentData.total}) - قانون: ${bestTech.rule}`,
      })
    } else {
      toast({
        title: "خطا در تعیین خودکار",
        description: "تکنسین مناسبی بر اساس قوانین تعریف شده یافت نشد",
        variant: "destructive",
      })
    }
  }

  const handleRuleEdit = (rule: AssignmentRule) => {
    setSelectedRule({ ...rule })
    setEditDialogOpen(true)
  }

  const handleRuleSave = () => {
    if (selectedRule) {
      const updatedRules = rules.map((rule) => (rule.id === selectedRule.id ? selectedRule : rule))
      setRules(updatedRules)
      setEditDialogOpen(false)
      setSelectedRule(null)

      toast({
        title: "قانون به‌روزرسانی شد",
        description: "تنظیمات تعیین هوشمند ذخیره شد",
      })
    }
  }

  const toggleRule = (ruleId: string) => {
    setRules(rules.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule)))
  }

  return (
    <div className="space-y-6" dir="rtl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              سیستم تعیین هوشمند تکنسین
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch checked={isEnabled} onCheckedChange={setIsEnabled} id="smart-assignment" />
                <Label htmlFor="smart-assignment" className="text-sm font-medium">
                  فعال‌سازی سیستم هوشمند
                </Label>
              </div>
              {isEnabled && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {rules.filter((r) => r.enabled).length} قانون فعال
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!isEnabled ? (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-muted-foreground mb-2">سیستم هوشمند غیرفعال است</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                سیستم تعیین هوشمند تکنسین با استفاده از الگوریتم‌های پیشرفته و معیارهای چندگانه، بهترین تکنسین را برای هر
                تیکت انتخاب می‌کند
              </p>
              <Button onClick={() => setIsEnabled(true)} className="gap-2">
                <Zap className="w-4 h-4" />
                فعال‌سازی سیستم هوشمند
              </Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="rules">قوانین تعیین</TabsTrigger>
                <TabsTrigger value="criteria">معیارهای ارزیابی</TabsTrigger>
                <TabsTrigger value="simulation">شبیه‌سازی</TabsTrigger>
                <TabsTrigger value="analytics">تحلیل عملکرد</TabsTrigger>
              </TabsList>

              <TabsContent value="rules" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">قوانین تعیین هوشمند</h4>
                  <Button onClick={runSimulation} variant="outline" className="gap-2 bg-transparent">
                    <Play className="w-4 h-4" />
                    شبیه‌سازی
                  </Button>
                </div>

                <div className="space-y-3">
                  {rules.map((rule, index) => (
                    <div
                      key={rule.id}
                      className={`border rounded-lg p-4 transition-all ${
                        rule.enabled ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                              <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} size="sm" />
                            </div>
                            <h5 className="font-medium">{rule.name}</h5>
                            {rule.enabled && (
                              <Badge variant="default" className="text-xs">
                                فعال
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {Object.entries(rule.criteria)
                              .filter(([_, weight]) => weight > 0)
                              .slice(0, 4)
                              .map(([criterion, weight]) => (
                                <div key={criterion} className="flex items-center gap-2 text-xs">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <span>
                                    {criterion === "expertise"
                                      ? "تخصص"
                                      : criterion === "availability"
                                        ? "در دسترس بودن"
                                        : criterion === "workload"
                                          ? "بار کاری"
                                          : criterion === "performance"
                                            ? "عملکرد"
                                            : criterion === "responseTime"
                                              ? "زمان پاسخ"
                                              : criterion === "priority"
                                                ? "اولویت"
                                                : criterion === "experience"
                                                  ? "تجربه"
                                                  : "رضایت مشتری"}
                                    : {weight}%
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>

                        <Button variant="ghost" size="sm" onClick={() => handleRuleEdit(rule)} className="gap-1">
                          <Settings className="w-3 h-3" />
                          ویرایش
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="criteria" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        معیارهای اصلی
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">تخصص و مهارت</span>
                          </div>
                          <span className="text-xs text-muted-foreground">40%</span>
                        </div>
                        <Progress value={40} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          تطبیق تخصص تکنسین با نوع مشکل، گواهینامه‌ها و تجربه در حوزه مربوطه
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">در دسترس بودن</span>
                          </div>
                          <span className="text-xs text-muted-foreground">25%</span>
                        </div>
                        <Progress value={25} className="h-2" />
                        <p className="text-xs text-muted-foreground">وضعیت فعلی تکنسین و ساعات کاری</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium">بار کاری</span>
                          </div>
                          <span className="text-xs text-muted-foreground">20%</span>
                        </div>
                        <Progress value={20} className="h-2" />
                        <p className="text-xs text-muted-foreground">تعداد تیکت‌های فعال و توزیع متعادل کار</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium">عملکرد</span>
                          </div>
                          <span className="text-xs text-muted-foreground">15%</span>
                        </div>
                        <Progress value={15} className="h-2" />
                        <p className="text-xs text-muted-foreground">امتیاز عملکرد کلی و نرخ حل مشکل</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        آمار تکنسین‌ها
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {technicians.map((tech) => (
                          <div key={tech.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="text-xs">{tech.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">{tech.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {tech.specialties
                                    .slice(0, 2)
                                    .map((s) => getCategoryLabel(s))
                                    .join("، ")}
                                </div>
                              </div>
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-medium">{tech.performanceScore}</div>
                              <div className="text-xs text-muted-foreground">امتیاز کل</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="simulation" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">شبیه‌سازی تعیین خودکار</h4>
                  <div className="flex gap-2">
                    <Button onClick={runSimulation} variant="outline" className="gap-2 bg-transparent">
                      <Play className="w-4 h-4" />
                      اجرای شبیه‌سازی
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">شبیه‌سازی تعیین تکنسین</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        برای مشاهده نحوه عملکرد سیستم هوشمند، شبیه‌سازی را اجرا کنید
                      </p>
                      <Button onClick={runSimulation} className="gap-2">
                        <Play className="w-4 h-4" />
                        شروع شبیه‌سازی
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">94%</div>
                        <div className="text-sm text-muted-foreground">نرخ موفقیت</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">1.8s</div>
                        <div className="text-sm text-muted-foreground">زمان تعیین</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">4.7</div>
                        <div className="text-sm text-muted-foreground">رضایت مشتری</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">ویرایش قانون تعیین هوشمند</DialogTitle>
          </DialogHeader>
          {selectedRule && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">نام قانون</Label>
                  <input
                    type="text"
                    value={selectedRule.name}
                    onChange={(e) => setSelectedRule({ ...selectedRule, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-right"
                    dir="rtl"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">توضیحات</Label>
                  <input
                    type="text"
                    value={selectedRule.description}
                    onChange={(e) => setSelectedRule({ ...selectedRule, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md text-right"
                    dir="rtl"
                  />
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-4">وزن معیارهای ارزیابی</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(selectedRule.criteria).map(([criterion, weight]) => (
                    <div key={criterion}>
                      <Label className="text-sm font-medium mb-3 block">
                        {criterion === "expertise"
                          ? "تخصص و مهارت"
                          : criterion === "availability"
                            ? "در دسترس بودن"
                            : criterion === "workload"
                              ? "بار کاری"
                              : criterion === "performance"
                                ? "عملکرد"
                                : criterion === "responseTime"
                                  ? "زمان پاسخ"
                                  : criterion === "priority"
                                    ? "مدیریت اولویت"
                                    : criterion === "experience"
                                      ? "تجربه"
                                      : "رضایت مشتری"}
                        : {weight}%
                      </Label>
                      <Slider
                        value={[weight]}
                        onValueChange={([value]) =>
                          setSelectedRule({
                            ...selectedRule,
                            criteria: { ...selectedRule.criteria, [criterion]: value },
                          })
                        }
                        max={100}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  انصراف
                </Button>
                <Button onClick={handleRuleSave} className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  ذخیره تغییرات
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={simulationDialogOpen} onOpenChange={setSimulationDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">نتایج شبیه‌سازی تعیین هوشمند</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {simulationResults.length > 0 ? (
              <div className="space-y-3">
                {simulationResults.map(({ ticket, recommendedTechnician, confidence }, index) => (
                  <div
                    key={ticket.id}
                    className={`p-4 border rounded-lg ${
                      confidence > 80
                        ? "bg-green-50 border-green-200"
                        : confidence > 60
                          ? "bg-blue-50 border-blue-200"
                          : "bg-orange-50 border-orange-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{ticket.title}</span>
                          <Badge variant="outline">{priorityLabels[ticket.priority]}</Badge>
                          <Badge variant="outline">{getCategoryLabel(ticket)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">درخواست‌کننده: {ticket.clientName}</p>
                      </div>

                      <div className="text-left">
                        {recommendedTechnician ? (
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium text-sm">{recommendedTechnician.name}</div>
                              <div className="text-xs text-muted-foreground">
                                امتیاز: {recommendedTechnician.assignmentData.total}
                              </div>
                              <div className="text-xs text-muted-foreground">قانون: {recommendedTechnician.rule}</div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`text-lg font-bold ${confidence > 80 ? "text-green-600" : confidence > 60 ? "text-blue-600" : "text-orange-600"}`}
                              >
                                {confidence}%
                              </div>
                              <div className="text-xs text-muted-foreground">اطمینان</div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm">تکنسین مناسب یافت نشد</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {recommendedTechnician && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex gap-2 flex-wrap">
                          {recommendedTechnician.assignmentData.reasons.map((reason: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">هیچ نتیجه‌ای برای نمایش وجود ندارد</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setSimulationDialogOpen(false)}>
                بستن
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
