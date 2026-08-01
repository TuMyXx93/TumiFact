import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateDTO = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      const issueArray = error?.issues || error?.errors || [];
      
      if (error instanceof ZodError || Array.isArray(issueArray)) {
        const formattedErrors: Record<string, string> = {};
        
        issueArray.forEach((err: any) => {
          const field = Array.isArray(err.path) && err.path.length > 0 ? err.path.join('.') : 'general';
          if (!formattedErrors[field]) {
            formattedErrors[field] = err.message || 'Valor inválido';
          }
        });

        return res.status(400).json({
          error: 'Validación DTO fallida',
          details: formattedErrors
        });
      }
      next(error);
    }
  };
};
