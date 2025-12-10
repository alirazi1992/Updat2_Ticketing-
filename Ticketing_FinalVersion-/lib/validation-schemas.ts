import * as yup from "yup"
import type { CategoriesData } from "@/services/categories-types"

// Phone number validation for Iranian numbers
const validatePhoneNumber = (phone: string): boolean => {
  const iranianPhoneRegex = /^(\+98|0)?9\d{9}$/
  return iranianPhoneRegex.test(phone.replace(/\s/g, ""))
}

// Issue Selection Schema (Step 1)
export const issueSelectionSchema = (categories?: CategoriesData) =>
  yup.object({
    priority: yup.string().required("انتخاب اولویت مشکل الزامی است"),
    mainIssue: yup.string().required("انتخاب دسته اصلی مشکل الزامی است"),
    subIssue: yup.string().when("mainIssue", (mainIssue, schema: yup.StringSchema) => {
      const hasSubIssues =
        typeof mainIssue === "string" &&
        !!mainIssue &&
        !!categories?.[mainIssue] &&
        Object.keys(categories[mainIssue].subIssues || {}).length > 0

      if (hasSubIssues) {
        return schema.required("انتخاب زیر دسته الزامی است")
      }

      // If the selected category has no sub issues, treat this field as optional
      return schema.optional().nullable().transform((value) => value ?? "")
    }),
  })

// Ticket Details Schema (Step 2)
export const ticketDetailsSchema = yup.object({
  title: yup
    .string()
    .required("عنوان تیکت الزامی است")
    .min(5, "عنوان باید حداقل ۵ کاراکتر باشد")
    .max(100, "عنوان نباید بیش از ۱۰۰ کاراکتر باشد"),
  description: yup
    .string()
    .required("شرح مشکل الزامی است")
    .min(20, "شرح مشکل باید حداقل ۲۰ کاراکتر باشد")
    .max(2000, "شرح مشکل نباید بیش از ۲۰۰۰ کاراکتر باشد"),

  // Optional dynamic fields - these will be validated only if present
  deviceBrand: yup.string().optional(),
  deviceModel: yup.string().optional(),
  powerStatus: yup.string().optional(),
  lastWorking: yup.string().optional(),
  printerBrand: yup.string().optional(),
  printerType: yup.string().optional(),
  printerProblem: yup.string().optional(),
  monitorSize: yup.string().optional(),
  connectionType: yup.string().optional(),
  displayIssue: yup.string().optional(),
  operatingSystem: yup.string().optional(),
  osVersion: yup.string().optional(),
  osIssueType: yup.string().optional(),
  softwareName: yup.string().optional(),
  softwareVersion: yup.string().optional(),
  applicationIssue: yup.string().optional(),
  internetProvider: yup.string().optional(),
  connectionIssue: yup.string().optional(),
  wifiNetwork: yup.string().optional(),
  deviceType: yup.string().optional(),
  wifiIssue: yup.string().optional(),
  networkLocation: yup.string().optional(),
  emailProvider: yup.string().optional(),
  emailClient: yup.string().optional(),
  errorMessage: yup.string().optional(),
  emailAddress: yup.string().email("فرمت ایمیل صحیح نیست").optional(),
  incidentTime: yup.string().optional(),
  securitySeverity: yup.string().optional(),
  affectedData: yup.string().optional(),
  requestedSystem: yup.string().optional(),
  accessLevel: yup.string().optional(),
  accessReason: yup.string().optional(),
  urgencyLevel: yup.string().optional(),
  trainingTopic: yup.string().optional(),
  currentLevel: yup.string().optional(),
  preferredMethod: yup.string().optional(),
  equipmentType: yup.string().optional(),
  maintenanceType: yup.string().optional(),
  preferredTime: yup.string().optional(),
})

// Contact Information Schema - always required
export const contactInfoSchema = yup.object({
  clientName: yup
    .string()
    .required("نام و نام خانوادگی الزامی است")
    .min(2, "نام باید حداقل ۲ کاراکتر باشد")
    .max(50, "نام نباید بیش از ۵۰ کاراکتر باشد"),

  clientEmail: yup.string().required("ایمیل الزامی است").email("فرمت ایمیل صحیح نیست"),

  clientPhone: yup
    .string()
    .required("شماره تماس الزامی است")
    .test("phone-validation", "شماره تماس معتبر نیست", validatePhoneNumber),
})

// Update the combined schema to include contact info
export const getCombinedSchema = (step: number, categories?: CategoriesData) => {
  const baseSchema = contactInfoSchema.concat(issueSelectionSchema(categories))

  if (step === 1) {
    return baseSchema
  } else {
    return baseSchema.concat(ticketDetailsSchema)
  }
}

// Legacy schemas for backward compatibility
export const generalInfoSchema = issueSelectionSchema()

// Ticket access schema
export const ticketAccessSchema = yup.object({
  ticketId: yup
    .string()
    .required("شماره تیکت الزامی است")
    .matches(/^TK-\d{4}-\d{3}$/, "فرمت شماره تیکت صحیح نیست (مثال: TK-2024-001)"),

  email: yup.string().required("ایمیل الزامی است").email("فرمت ایمیل صحیح نیست"),

  phone: yup
    .string()
    .required("شماره تماس الزامی است")
    .test("phone-validation", "شماره تماس معتبر نیست", validatePhoneNumber),
})
