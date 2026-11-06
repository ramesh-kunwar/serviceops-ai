import { z } from 'zod';

export const createServiceRequestSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, 'Customer name is required')
    .max(100, 'Customer name must be at most 100 characters'),

  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(120, 'Title must be at most 120 characters'),

  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(2000, 'Description be at most 2000 characters'),
});

export type CreateServiceRequestInput = z.infer<
  typeof createServiceRequestSchema
>;
