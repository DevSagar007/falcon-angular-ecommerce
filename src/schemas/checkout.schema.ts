import { z } from "zod";

/** Bangladeshi mobile numbers: 01XXXXXXXXX, optionally prefixed with +880/880; spaces and dashes allowed. */
const BD_MOBILE = /^(?:\+?880|0)1[3-9]\d{8}$/;

const text = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

export const checkoutSchema = z.object({
  fullName: text("Full name", 2, 80),
  email: z.string().trim().min(1, "Email is required").max(254, "Email is too long").pipe(z.email("Enter a valid email address")),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine((value) => BD_MOBILE.test(value.replace(/[\s-]/g, "")), "Enter a valid Bangladeshi mobile number, e.g. 01712-345678"),
  address: text("Address", 5, 200),
  city: text("City", 2, 60),
  postalCode: z.string().trim().min(1, "Postal code is required").regex(/^\d{4}$/, "Enter a 4-digit postal code"),
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;

export const orderLinesSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(64),
      quantity: z.number().int().min(1).max(999),
      price: z.number().nonnegative(),
    }),
  )
  .min(1, "Your cart is empty")
  .max(100);

export type OrderLine = z.infer<typeof orderLinesSchema>[number];
