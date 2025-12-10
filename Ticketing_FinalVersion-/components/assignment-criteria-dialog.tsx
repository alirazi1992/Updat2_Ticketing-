"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Target, Star, Users, Award, TrendingUp, CheckCircle, Info, Zap } from "lucide-react"

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

const priorityLabels: Record<string, string> = {
  low: "کم",
  medium: "متوسط",
  high: "بالا",
  urgent: "فوری",
}

interface AssignmentCriteriaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket?: any
  technicians?: any[]
  onAssign?: (technicianId: string) => void
}

export function AssignmentCriteriaDialog({
  open,
  onOpenChange,
  ticket,
  technicians = [],
  onAssign,
}: AssignmentCriteriaDialogProps) {
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null)

  const calculateComprehensiveScore = (technician: any, ticket: any) => {
    let score = 0
    const weights = {
      specialty: 40,
      priority: 25,
      rating: 20,
      workload: 10,
      experience: 5,
    }

    const breakdown = {
      specialty: 0,
      priority: 0,
      rating: 0,
      workload: 0,
      experience: 0,
      bonus: 0,
    }

    if (technician.specialties.includes(ticket.category)) {
      breakdown.specialty = weights.specialty
      if (technician.specialties[0] === ticket.category) {
        breakdown.specialty += 10
      }
    } else {
      breakdown.specialty = -15
    }

    const priorityScore = getPriorityScore(technician, ticket.priority)
    breakdown.priority = (priorityScore / 100) * weights.priority

    breakdown.rating = (technician.rating / 5) * weights.rating

    const workloadScore = Math.max(0, ((8 - technician.activeTickets) / 8) * 100)
    breakdown.workload = (workloadScore / 100) * weights.workload

    const experienceScore = Math.min(100, (technician.completedTickets / 100) * 100)
    breakdown.experience = (experienceScore / 100) * weights.experience

    breakdown.bonus = getBonusScore(technician, ticket)

    score = Object.values(breakdown).reduce((sum, val) => sum + val, 0)

    return {
      total: Math.round(score * 10) / 10,
      breakdown,
      reasons: getMatchReasons(technician, ticket),
    }
  }

  const getPriorityScore = (technician: any, priority: string) => {
    const priorityWeights: Record<string, { rating: number; experience: number }> = {
      urgent: { rating: 4.5, experience: 30 },
      high: { rating: 4.0, experience: 20 },
      medium: { rating: 3.5, experience: 10 },
      low: { rating: 3.0, experience: 5 },
    }

    const requirement = priorityWeights[priority] || priorityWeights.medium
    let score = 0

    if (technician.rating >= requirement.rating) {
      score += 60
    } else {
      score += (technician.rating / requirement.rating) * 60
    }

    if (technician.completedTickets >= requirement.experience) {
      score += 40
    } else {
      score += (technician.completedTickets / requirement.experience) * 40
    }

    return Math.min(100, score)
  }

  const getBonusScore = (technician: any, ticket: any) => {
    let bonus = 0

    if (technician.avgResponseTime && Number.parseFloat(technician.avgResponseTime) < 2.0) {
      bonus += 5
    }

    if (technician.rating >= 4.8 && technician.completedTickets >= 50) {
      bonus += 8
    }

    const relatedSpecialties = getRelatedSpecialties(ticket.category)
    const matchingSpecialties = technician.specialties.filter((s: string) => relatedSpecialties.includes(s))
    if (matchingSpecialties.length > 1) {
      bonus += 3
    }

    if (technician.activeTickets <= 1) {
      bonus += 5
    }

    return bonus
  }

  const getRelatedSpecialties = (category: string) => {
    const relations: Record<string, string[]> = {
      hardware: ["hardware", "network"],
      software: ["software", "access"],
      network: ["network", "hardware", "security"],
      email: ["email", "software", "security"],
      security: ["security", "network", "access"],
      access: ["access", "security", "software"],
    }
    return relations[category] || [category]
  }

  const getMatchReasons = (technician: any, ticket: any) => {
    const reasons: string[] = []

    if (technician.specialties.includes(ticket.category)) {
      reasons.push(`متخصص ${getCategoryLabel(ticket)}`)
    }

    if (technician.rating >= 4.5) {
      reasons.push("امتیاز بالا")
    }

    if (technician.activeTickets <= 2) {
      reasons.push("بار کاری کم")
    }

    if (technician.completedTickets >= 50) {
      reasons.push("تجربه بالا")
    }

    const priorityRequirements: Record<string, number> = {
      urgent: 4.5,
      high: 4.0,
      medium: 3.5,
      low: 3.0,
    }

    if (technician.rating >= priorityRequirements[ticket.priority]) {
      reasons.push(`مناسب برای اولویت ${priorityLabels[ticket.priority]}`)
    }

    return reasons
  }

  const scoredTechnicians = ticket
    ? technicians
        .map((tech) => ({
          ...tech,
          scoreData: calculateComprehensiveScore(tech, ticket),
        }))
        .sort((a, b) => b.scoreData.total - a.scoreData.total)
    : []

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "outline"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            تحلیل معیارهای تعیین تکنسین
          </DialogTitle>
        </DialogHeader>

        {ticket && (
          <div className="space-y-6">
            {/* Ticket Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">اطلاعات تیکت</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">عنوان: {ticket.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">اولویت: {priorityLabels[ticket.priority]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">دسته‌بندی: {getCategoryLabel(ticket)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">درخواست‌کننده: {ticket.clientName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scoring Criteria */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">معیارهای امتیازدهی</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">تخصص (40%)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">تطبیق تخصص تکنسین با دسته‌بندی تیکت</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="font-medium">اولویت (25%)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">توانایی تکنسین در مدیریت اولویت تیکت</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium">امتیاز (20%)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">امتیاز کلی عملکرد تکنسین</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">بار کاری (10%)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">تعداد تیکت‌های فعال تکنسین</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium">تجربه (5%)</span>
                    </div>
                    <p className="text-sm text-muted-foreground">تعداد تیکت‌های تکمیل شده</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-orange-600" />
                      <span className="font-medium">امتیاز اضافی</span>
                    </div>
                    <p className="text-sm text-muted-foreground">عوامل تشویقی اضافی</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technician Rankings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">رتبه‌بندی تکنسین‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scoredTechnicians.map((tech, index) => (
                    <div
                      key={tech.id}
                      className={`border rounded-lg p-4 transition-all cursor-pointer hover:bg-muted/50 ${
                        selectedTechnician?.id === tech.id ? "border-primary bg-primary/5" : ""
                      } ${index === 0 ? "border-green-200 bg-green-50" : ""}`}
                      onClick={() => setSelectedTechnician(tech)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="text-sm font-medium">{tech.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {index === 0 && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{tech.name}</h4>
                              {index === 0 && (
                                <Badge variant="default" className="text-xs">
                                  بهترین انتخاب
                                </Badge>
                              )}
                              <Badge
                                variant={tech.status === "available" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {tech.status === "available" ? "آزاد" : "مشغول"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                <span>{tech.rating}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{tech.activeTickets} فعال</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                <span>{tech.completedTickets} تکمیل</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="text-left">
                          <div className={`text-2xl font-bold ${getScoreColor(tech.scoreData.total)}`}>
                            {tech.scoreData.total}
                          </div>
                          <div className="text-xs text-muted-foreground">امتیاز کل</div>
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-3">
                        <div className="text-center">
                          <div className="text-sm font-medium text-blue-600">
                            {Math.round(tech.scoreData.breakdown.specialty)}
                          </div>
                          <div className="text-xs text-muted-foreground">تخصص</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-green-600">
                            {Math.round(tech.scoreData.breakdown.priority)}
                          </div>
                          <div className="text-xs text-muted-foreground">اولویت</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-yellow-600">
                            {Math.round(tech.scoreData.breakdown.rating)}
                          </div>
                          <div className="text-xs text-muted-foreground">امتیاز</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-purple-600">
                            {Math.round(tech.scoreData.breakdown.workload)}
                          </div>
                          <div className="text-xs text-muted-foreground">بار کاری</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-indigo-600">
                            {Math.round(tech.scoreData.breakdown.experience)}
                          </div>
                          <div className="text-xs text-muted-foreground">تجربه</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-orange-600">
                            {Math.round(tech.scoreData.breakdown.bonus)}
                          </div>
                          <div className="text-xs text-muted-foreground">اضافی</div>
                        </div>
                      </div>

                      {/* Match Reasons */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {tech.scoreData.reasons.map((reason: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {reason}
                          </Badge>
                        ))}
                      </div>

                      {/* Specialties */}
                      <div className="flex gap-1 flex-wrap">
                        {tech.specialties.map((specialty: string) => (
                          <Badge
                            key={specialty}
                            variant={specialty === ticket.category ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {categoryLabels[specialty]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {scoredTechnicians.length > 0 && (
                  <>
                    بهترین انتخاب: <span className="font-medium">{scoredTechnicians[0].name}</span> با امتیاز{" "}
                    <span className="font-bold text-green-600">{scoredTechnicians[0].scoreData.total}</span>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  بستن
                </Button>
                {scoredTechnicians.length > 0 && onAssign && (
                  <Button
                    onClick={() => {
                      onAssign(scoredTechnicians[0].id)
                      onOpenChange(false)
                    }}
                    className="gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    انتخاب بهترین گزینه
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
