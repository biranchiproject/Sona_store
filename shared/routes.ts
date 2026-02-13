import { z } from 'zod';
import { insertAppSchema, insertUserSchema, apps, users, APP_CATEGORIES } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({
        username: z.string(), // Using email as username in passport
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  apps: {
    list: {
      method: 'GET' as const,
      path: '/api/apps' as const,
      input: z.object({
        category: z.enum(APP_CATEGORIES as unknown as [string, ...string[]]).optional(),
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof apps.$inferSelect & { developer: { name: string } }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/apps/:id' as const,
      responses: {
        200: z.custom<typeof apps.$inferSelect & { developer: { name: string } }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/apps' as const,
      input: insertAppSchema,
      responses: {
        201: z.custom<typeof apps.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/apps/:id/status' as const,
      input: z.object({ status: z.enum(["approved", "rejected", "pending"]) }),
      responses: {
        200: z.custom<typeof apps.$inferSelect>(),
        403: errorSchemas.unauthorized, // Admin only
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/apps/:id' as const,
      responses: {
        204: z.void(),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    myApps: {
      method: 'GET' as const,
      path: '/api/my-apps' as const,
      responses: {
        200: z.array(z.custom<typeof apps.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
  },
  admin: {
    stats: {
      method: 'GET' as const,
      path: '/api/admin/stats' as const,
      responses: {
        200: z.object({
          totalApps: z.number(),
          pendingApps: z.number(),
          totalUsers: z.number(),
        }),
        403: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
