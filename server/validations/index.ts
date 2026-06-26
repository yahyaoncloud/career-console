import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const ApplicationSchema = z.object({
  company: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  status: z.enum(['Wishlist', 'Applied', 'Interviewing', 'Offered', 'Rejected']).default('Wishlist'),
  dateApplied: z.string().optional(),
  salary: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const GuestbookSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  message: z.string().min(5, "Message must be at least 5 characters").max(500, "Message too long"),
});

export const OtpRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const OtpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const validate = (schema: z.AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, errors: error.errors });
      } else {
        res.status(400).json({ success: false, error: 'Validation failed' });
      }
    }
  };
};
