/**
 * Security Middleware
 */

export function securityMiddleware() {
  return function (req: any, res: any, next: any) {
    next();
  };
}
