import { z } from 'zod';

export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
  correlationId: z.string().min(1).max(128).optional(),
  details: z.record(z.string(), z.string()).optional()
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
