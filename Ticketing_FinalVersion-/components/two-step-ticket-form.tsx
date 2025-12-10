"use client"

import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Controller } from "react-hook-form"
import { toast } from "@/hooks/use-toast"
import { ChevronLeft, ChevronRight, CheckCircle, FolderOpen, FileText } from "lucide-react"

import { TicketFormStep1 } from "@/components/ticket-form-step1"
import { TicketFormStep2 } from "@/components/ticket-form-step2"
import { getCombinedSchema } from "@/lib/validation-schemas"
import { useAuth } from "@/lib/auth-context"
import type { UploadedFile } from "@/lib/file-upload"

const priorityLabels: Record<string, string> = {
  low: "کم",
  medium: "متوسط",
  high: "بالا",
  urgent: "فوری",
}

interface TwoStepTicketFormProps {
  onClose: () => void
  onSubmit: (data: any) => Promise<void> | void
  categoriesData: any
}

export function TwoStepTicketForm({ onClose, onSubmit, categoriesData }: TwoStepTicketFormProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const activeSchema = useMemo(() => getCombinedSchema(currentStep, categoriesData), [currentStep, categoriesData])

  const {
    control,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: yupResolver(activeSchema),
    defaultValues: {
      clientName: user?.name || "",
      clientEmail: user?.email || "",
      clientPhone: user?.phone || "",
      priority: "",
      mainIssue: "",
      subIssue: "",
      title: "",
      description: "",
      deviceBrand: "",
      deviceModel: "",
      powerStatus: "",
      lastWorking: "",
      printerBrand: "",
      printerType: "",
      printerProblem: "",
      monitorSize: "",
      connectionType: "",
      displayIssue: "",
      operatingSystem: "",
      osVersion: "",
      osIssueType: "",
      softwareName: "",
      softwareVersion: "",
      applicationIssue: "",
      internetProvider: "",
      connectionIssue: "",
      wifiNetwork: "",
      deviceType: "",
      wifiIssue: "",
      networkLocation: "",
      emailProvider: "",
      emailClient: "",
      errorMessage: "",
      emailAddress: "",
      incidentTime: "",
      securitySeverity: "",
      affectedData: "",
      requestedSystem: "",
      accessLevel: "",
      accessReason: "",
      urgencyLevel: "",
      trainingTopic: "",
      currentLevel: "",
      preferredMethod: "",
      equipmentType: "",
      maintenanceType: "",
      preferredTime: "",
    },
  })

  const watchedValues = watch()

  const handleNext = async () => {
    const isValid = await trigger()
    if (isValid) {
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    setCurrentStep(1)
  }

  const handleFormSubmit = async (data: any) => {
    if (isSaving) return

    const selectedCategory = categoriesData?.[data.mainIssue]
    const selectedSubcategory =
      data.mainIssue && data.subIssue
        ? categoriesData?.[data.mainIssue]?.subIssues?.[data.subIssue]
        : null

    if (!selectedCategory?.backendId) {
      toast({
        title: "دسته‌بندی آماده نیست",
        description: "دسته‌بندی‌ها هنوز از سرور دریافت نشده‌اند. چند لحظه بعد دوباره تلاش کنید.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSaving(true)

      const dynEntries = Object.entries(data)
        .filter(([k, v]) => k.startsWith("dyn_") && v !== undefined && v !== "")
        .map(([k, v]) => [k.replace(/^dyn_/, ""), v])

      const ticketData = {
        title: data.title,
        description: data.description,
        status: "open",
        priority: data.priority,
        category: data.mainIssue,
        subcategory: data.subIssue,
        clientName: user?.name || "",
        clientEmail: user?.email || "",
        clientPhone: user?.phone || "",
        createdAt: new Date().toISOString(),
        attachments: attachedFiles,
        dynamicFields: {
          ...Object.fromEntries(dynEntries),
          ...Object.fromEntries(
            Object.entries(data).filter(
              ([key, value]) =>
                value &&
                !key.startsWith("dyn_") &&
                ![
                  "title",
                  "description",
                  "priority",
                  "mainIssue",
                  "subIssue",
                  "clientName",
                  "clientEmail",
                  "clientPhone",
                ].includes(key),
            ),
          ),
        },
      }

      if (data.subIssue && !selectedSubcategory?.backendId) {
        ticketData.dynamicFields = {
          ...ticketData.dynamicFields,
          localSubIssue: selectedSubcategory?.label ?? data.subIssue,
        }
      }

      await onSubmit(ticketData)

      toast({
        title: "تیکت با موفقیت ثبت شد",
        description: "در حال بروزرسانی فهرست تیکت‌ها...",
      })

      onClose()
    } catch (error) {
      toast({
        title: "خطا در ثبت تیکت",
        description: "لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const renderContactInfo = () => null

  const renderSummary = () => (
    <Card className="rounded-xl border border-amber-200/70 bg-amber-50 shadow-sm">
      <CardHeader className="pb-3 border-b border-amber-200/60">
        <CardTitle className="text-right font-iran">
          <span className="inline-flex items-center justify-end gap-2">
            <CheckCircle className="w-5 h-5" />
            خلاصه انتخاب‌های شما
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        <div className="space-y-2">
          <h4 className="font-medium text-right flex items-center gap-2 font-iran">
            <FolderOpen className="w-4 h-4" />
            اطلاعات مشکل
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">اولویت</span>
              <Badge variant="outline" className="text-xs font-iran">
                {watchedValues.priority ? priorityLabels[watchedValues.priority] : "انتخاب نشده"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">دسته‌بندی اصلی</span>
              <span className="font-iran">
                {watchedValues.mainIssue && categoriesData[watchedValues.mainIssue]
                  ? categoriesData[watchedValues.mainIssue].label
                  : "انتخاب نشده"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">زیر دسته</span>
              <span className="font-iran">
                {watchedValues.mainIssue &&
                watchedValues.subIssue &&
                categoriesData[watchedValues.mainIssue]?.subIssues[watchedValues.subIssue]
                  ? categoriesData[watchedValues.mainIssue].subIssues[watchedValues.subIssue].label
                  : "انتخاب نشده"}
              </span>
            </div>
          </div>
        </div>

        {currentStep === 2 && watchedValues.title ? (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-right flex items-center gap-2 font-iran">
                <FileText className="w-4 h-4" />
                عنوان و شرح مشکل
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">عنوان</span>
                  <span className="font-medium text-right max-w-xs font-iran">{watchedValues.title}</span>
                </div>
                {watchedValues.description && (
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground">شرح مشکل</span>
                    <span className="text-right max-w-xs font-iran line-clamp-3">{watchedValues.description}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}

        {attachedFiles.length > 0 ? (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-right font-iran">فایل‌های پیوست شده</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="text-right font-iran">• {file.name}</div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6" dir="rtl">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4 space-x-reverse">
        <div className={`flex items-center ${currentStep >= 1 ? "text-primary" : "text-muted-foreground"}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              currentStep >= 1 ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
            }`}
          >
            {currentStep > 1 ? <CheckCircle className="w-4 h-4" /> : "1"}
          </div>
          <span className="mr-2 text-sm font-medium">انتخاب مشکل</span>
        </div>

        <div className={`w-12 h-0.5 ${currentStep >= 2 ? "bg-primary" : "bg-muted-foreground"}`} />

        <div className={`flex items-center ${currentStep >= 2 ? "text-primary" : "text-muted-foreground"}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              currentStep >= 2 ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
            }`}
          >
            2
          </div>
          <span className="mr-2 text-sm font-medium">جزئیات تیکت</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid gap-6 mt-6 lg:grid-cols-[320px_1fr]">
          <div className="lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            {renderSummary()}
          </div>

          <div className="space-y-6">
            {currentStep === 1 && <TicketFormStep1 control={control} errors={errors} categoriesData={categoriesData} />}

            {currentStep === 2 && (
              <TicketFormStep2
                control={control}
                errors={errors}
                selectedIssue={watchedValues.mainIssue}
                selectedSubIssue={watchedValues.subIssue}
                categoriesData={categoriesData}
                attachedFiles={attachedFiles}
                onFilesChange={setAttachedFiles}
              />
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            {currentStep === 2 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                <ChevronRight className="w-4 h-4 ml-1" />
                مرحله قبل
              </Button>
            )}
          </div>

          <div>
            {currentStep === 1 ? (
              <Button type="button" onClick={handleNext}>
                مرحله بعد
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting || isSaving}>
                {isSubmitting || isSaving ? "در حال ثبت..." : "ثبت تیکت"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
