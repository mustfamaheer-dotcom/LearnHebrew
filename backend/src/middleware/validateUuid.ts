import { Request, Response, NextFunction } from 'express';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates that specific route parameters conform to standard UUID v4/v5 format.
 * Prevents SQL injection probes, path traversal strings, and malformed database queries.
 */
export function validateUuidParam(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName];
    if (value && !UUID_REGEX.test(value)) {
      return res.status(400).json({
        error: `Invalid identifier format for '${paramName}'. Must be a valid UUID.`,
      });
    }
    next();
  };
}
