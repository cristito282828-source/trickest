import { z } from "zod";
import { NextResponse } from "next/server";

// ==================== AUTH SCHEMAS ====================

export const registerSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(255, "Email is too long")
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character (@$!%*?&)"),
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .trim()
    .optional(),
});

export const loginSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, "Password is required"),
});

export const setPasswordSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character (@$!%*?&)"),
});

// ==================== SUBMISSION SCHEMAS ====================

export const submitTrickSchema = z.object({
  challengeId: z.string()
    .min(1, "Challenge ID is required")
    .regex(/^\d+$/, "Challenge ID must be a number"),
  videoUrl: z.string()
    .min(1, "Video URL is required")
    .url("Invalid URL")
    .refine(
      (url) => {
        return url.includes('youtube.com') || url.includes('youtu.be');
      },
      "URL must be from YouTube"
    ),
});

export const evaluateSubmissionSchema = z.object({
  submissionId: z.string()
    .min(1, "Submission ID is required")
    .regex(/^\d+$/, "Submission ID must be a number"),
  status: z.enum(['approved', 'rejected']),
  score: z.number()
    .int("Score must be an integer")
    .min(0, "Minimum score is 0")
    .max(100, "Maximum score is 100")
    .optional(),
  feedback: z.string()
    .max(1000, "Feedback cannot exceed 1000 characters")
    .optional(),
  evaluatedBy: z.string().email().optional(),
}).refine(
  (data) => {
    // If approved, must have score
    if (data.status === 'approved' && data.score === undefined) {
      return false;
    }
    return true;
  },
  {
    message: "Score is required when the submission is approved",
    path: ["score"],
  }
);

// ==================== ORDER SCHEMAS ====================

const orderItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  productName: z.string().min(1, "Product name is required").max(200),
  productPrice: z.string().min(1, "Product price is required").max(50),
  productImage: z.string().url("Invalid product image URL").optional().or(z.literal("")),
  productSlug: z.string().min(1, "Product slug is required").max(200),
  quantity: z.number().int("Quantity must be an integer").min(1, "Minimum quantity is 1").max(99, "Maximum quantity is 99"),
});

export const createOrderSchema = z.object({
  // Customer info
  customerName: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
  customerEmail: z.string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
  customerPhone: z.string()
    .min(7, "Phone must be at least 7 characters")
    .max(20, "Phone cannot exceed 20 characters")
    .trim(),

  // Shipping (texto libre)
  shippingAddress: z.string()
    .min(5, "Address must be at least 5 characters")
    .max(300, "Address cannot exceed 300 characters")
    .trim(),
  shippingCity: z.string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City cannot exceed 100 characters")
    .trim(),
  shippingNotes: z.string()
    .max(500, "Notes cannot exceed 500 characters")
    .optional(),

  // Items
  items: z.array(orderItemSchema)
    .min(1, "Cart cannot be empty")
    .max(50, "Cannot order more than 50 different products at once"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  shippingGuideUrl: z.string().url().optional(),
});

// ==================== TEAM SCHEMAS ====================

export const createTeamSchema = z.object({
  name: z.string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name cannot exceed 50 characters")
    .trim()
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_]+$/, "Name contains invalid characters"),
  description: z.string()
    .max(500, "Description cannot exceed 500 characters")
    .trim()
    .optional(),
  logo: z.string().url("Invalid logo URL").optional(),
});

export const joinTeamSchema = z.object({
  teamId: z.string()
    .min(1, "Team ID is required")
    .regex(/^\d+$/, "Team ID must be a number"),
});

// ==================== USER PROFILE SCHEMAS ====================

export const updateGeneralInfoSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .trim()
    .optional(),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores")
    .toLowerCase()
    .trim()
    .optional(),
  phone: z.string()
    .regex(/^[+]?[\d\s\-()]+$/, "Invalid phone format")
    .optional(),
  departamento: z.string().trim().optional(),
  ciudad: z.string().trim().optional(),
});

export const updateSocialMediaSchema = z.object({
  facebook: z.string().url("Invalid Facebook URL").or(z.literal("")).optional(),
  instagram: z.string().url("Invalid Instagram URL").or(z.literal("")).optional(),
  twitter: z.string().url("Invalid Twitter/X URL").or(z.literal("")).optional(),
  tiktok: z.string().url("Invalid TikTok URL").or(z.literal("")).optional(),
});

// ==================== SPOT SCHEMAS ====================

export const createSpotSchema = z.object({
  name: z.string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name is too long")
    .trim(),
  description: z.string()
    .max(500, "Description cannot exceed 500 characters")
    .trim()
    .optional(),
  latitude: z.number()
    .min(-90, "Invalid latitude")
    .max(90, "Invalid latitude"),
  longitude: z.number()
    .min(-180, "Invalid longitude")
    .max(180, "Invalid longitude"),
  type: z.enum(["street", "park", "plaza", "other"]),
});

// ==================== API RESPONSE TYPES ====================

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ==================== VALIDATION ERROR TYPES ====================

export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Validates request body against a Zod schema
 * @throws ValidationError with field name and message
 */
export async function validateRequest<T>(
  schema: z.ZodSchema<T>,
  body: any
): Promise<T> {
  try {
    return await schema.parseAsync(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues;
      const firstError = issues[0];
      const field = firstError.path.join('.');
      throw new ValidationError(
        field,
        firstError.message,
        issues
      );
    }
    throw error;
  }
}

/**
 * Creates a standardized success response
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  }, { status });
}

/**
 * Creates a standardized error response
 */
export function errorResponse(
  code: string,
  message: string,
  status = 500,
  details?: any
) {
  return NextResponse.json({
    success: false,
    error: { code, message, details },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    },
  }, { status });
}

/**
 * Handles validation errors and returns appropriate response
 */
export function handleValidationError(error: unknown): Response {
  console.error('Validation error:', error);

  if (error instanceof ValidationError) {
    return errorResponse(
      'VALIDATION_ERROR',
      error.message,
      400,
      process.env.NODE_ENV === 'development' ? { field: error.field } : undefined
    );
  }

  if (error instanceof z.ZodError) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Invalid data',
      400,
      process.env.NODE_ENV === 'development' ? error.issues : undefined
    );
  }

  return errorResponse(
    'INTERNAL_ERROR',
    'Error processing request',
    500
  );
}
