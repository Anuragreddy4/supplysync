import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { errorResponse } from '../utils/responseEnvelope.js';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json(errorResponse('VALIDATION_ERROR', error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')));
      } else {
        res.status(400).json(errorResponse('VALIDATION_ERROR', 'Invalid request data'));
      }
    }
  };
};
