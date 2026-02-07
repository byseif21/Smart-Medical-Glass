import { z } from 'zod';

/**
 * Zod Schemas for Frontend Validation
 * Combines Validation (Checking) and Transformation (Sanitization)
 */

// --- Base Field Schemas ---

const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .transform((val) => val.trim().replace(/\s+/g, ' ')); // "  John   Doe " -> "John Doe"

const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .trim()
  .toLowerCase()
  .email('Please enter a valid email address'); // "User@Email.com" -> "user@email.com"

const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .transform((val) => val.trim().replace(/[\s\-().]/g, '')) // remove format chars
  .refine((val) => /^\+?[\d]+$/.test(val), {
    message: 'Phone number must contain only digits (optional + at start)',
  })
  .refine((val) => val.length >= 8 && val.length <= 15, {
    message: 'Phone number length must be between 8 and 15 digits',
  });

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine((val) => /\d/.test(val), 'Password must contain at least one number')
  .refine((val) => /[a-zA-Z]/.test(val), 'Password must contain at least one letter');

const textSchema = z
  .string()
  .min(1, 'This field is required')
  .transform((val) => val.trim());

// --- Form Schemas ---

/**
 * Schema for User Registration
 */
export const registrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  date_of_birth: textSchema,
  gender: textSchema,
  nationality: textSchema.optional().or(z.literal('')),
  id_number: textSchema.optional().or(z.literal('')),
});

/**
 * Schema for Login (Just Sanitization mostly)
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Schema for Change Password
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

/**
 * Schema for External Contact
 */
export const externalContactSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  address: z
    .string()
    .max(200, 'Address must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  relationship: z.string().min(1, 'Relationship is required'),
});

/**
 * Schema for Profile Update (Main Info)
 */
export const profileUpdateSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  date_of_birth: textSchema,
  gender: textSchema,
  nationality: textSchema.optional().or(z.literal('')),
  id_number: textSchema.optional().or(z.literal('')),
});

// --- Helper Functions ---

/**
 * Validates data against a Zod schema.
 * Returns { isValid, data, errors }
 * - data: The sanitized/transformed data (if valid)
 * - errors: An object of error messages { fieldName: message }
 */
export const validateWithSchema = (schema, data) => {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      isValid: true,
      data: result.data,
      errors: {},
    };
  } else {
    // convert Zod errors to a simple key-value map
    const errors = {};

    // flatten() to get field-specific errors
    if (result.error && typeof result.error.flatten === 'function') {
      const flattened = result.error.flatten();
      Object.entries(flattened.fieldErrors).forEach(([field, msgs]) => {
        if (msgs && msgs.length > 0) {
          errors[field] = msgs[0];
        }
      });
    } else {
      // should not happen with Zod, but good as a safety net
      errors['general'] = 'Validation failed';
    }

    return {
      isValid: false,
      data: null,
      errors,
    };
  }
};

/**
 * Standalone export for quick field validation if needed
 */
export const normalizeEmail = (email) => {
  try {
    return emailSchema.parse(email);
  } catch {
    return email.trim().toLowerCase(); // fallback if invalid
  }
};
