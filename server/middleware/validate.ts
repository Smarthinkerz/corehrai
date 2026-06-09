import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors.map(e => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}

export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid parameters",
          details: error.errors.map(e => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),
});
