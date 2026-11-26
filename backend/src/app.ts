import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';

import authRouter from './modules/auth/auth.router';
import usersRouter from './modules/users/users.router';
import studentsRouter from './modules/students/students.router';
import teachersRouter from './modules/teachers/teachers.router';
import packagesRouter from './modules/packages/packages.router';
import lessonsRouter from './modules/lessons/lessons.router';
import homeworkRouter from './modules/homework/homework.router';
import feedbackRouter from './modules/feedback/feedback.router';
import gamesRouter from './modules/games/games.router';
import notificationsRouter from './modules/notifications/notifications.router';
import analyticsRouter from './modules/analytics/analytics.router';
import settingsRouter from './modules/settings/settings.router';
import recordedSessionsRouter from './modules/recorded-sessions/recorded-sessions.router';
import systemLogsRouter from './modules/system-logs/system-logs.router';

// 2026 Enterprise Feature Routers
import levelsRouter from './modules/levels/levels.router';
import languagesRouter from './modules/languages/languages.router';
import sessionTypesRouter from './modules/session-types/session-types.router';
import rolesRouter from './modules/roles/roles.router';
import paymentsRouter from './modules/payments/payments.router';
import levelExamsRouter from './modules/level-exams/level-exams.router';
import reviewLinksRouter from './modules/review-links/review-links.router';
import pointRulesRouter from './modules/point-rules/point-rules.router';
import placementTestRouter from './modules/placement-test/placement-test.router';
import storeRouter from './modules/store/store.router';
import shortsRouter from './modules/shorts/shorts.router';

import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';

export const app = express();

// Disable X-Powered-By header to obscure underlying technology stack
app.disable('x-powered-by');

const isProd = process.env.NODE_ENV === 'production';

// Security Headers (OWASP Hardening)
app.use(
  helmet({
    contentSecurityPolicy: isProd
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
            connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:3000', 'https:'],
            mediaSrc: ["'self'", 'data:', 'blob:', 'https:'],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'self'"],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'sameorigin' },
    noSniff: true,
    xssFilter: true,
    hsts: isProd
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  })
);

app.use(compression({
  threshold: 1024,
}));

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'https://engrew.com',
  'http://engrew.com',
  'https://www.engrew.com',
  'http://www.engrew.com',
  'https://placementtest.engrew.com',
  'http://placementtest.engrew.com',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const isAllowedOrigin = (origin: string): boolean => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (
    origin.endsWith('.engrew.com') ||
    origin === 'https://engrew.com' ||
    origin === 'http://engrew.com'
  ) {
    return true;
  }
  if (!isProd) {
    // Allow local LAN IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x) on any port in development
    if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return true;
    }
    return true;
  }
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin || '')) {
        callback(null, true);
      } else {
        callback(new Error('Cross-Origin Request Blocked by CORS Security Policy'));
      }
    },
    credentials: true,
    maxAge: 86400,
  })
);

app.use('/api/', apiLimiter);

// Payload size limiting to prevent JSON buffer exhaustion DoS
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Prototype Pollution Defense: Strips forbidden object keys (__proto__, constructor, prototype)
function sanitizePrototypePollution(obj: any): void {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      delete obj[key];
      continue;
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizePrototypePollution(obj[key]);
    }
  }
}

app.use((req, res, next) => {
  if (req.body) sanitizePrototypePollution(req.body);
  if (req.query) sanitizePrototypePollution(req.query);
  if (req.params) sanitizePrototypePollution(req.params);
  next();
});

// Normalize Vercel Serverless Rewrites
app.use((req, res, next) => {
  if (req.headers && req.headers['x-matched-path']) {
    req.url = req.headers['x-matched-path'] as string;
  } else if (req.url.startsWith('/backend/api/index')) {
    req.url = req.url.replace('/backend/api/index', '') || '/';
  } else if (req.url.startsWith('/api/index')) {
    req.url = req.url.replace('/api/index', '') || '/';
  }
  next();
});

// Static Uploads Serving (Avatars, Screenshots, WebP)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(requestLogger);

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Engrew Academy Backend API',
    database: 'Supabase PostgreSQL',
    version: '2.5.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'LearnHebrew API', timestamp: new Date().toISOString() });
});

// Existing Core API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/students', studentsRouter);
app.use('/api/v1/teachers', teachersRouter);
app.use('/api/v1/packages', packagesRouter);
app.use('/api/v1/lessons', lessonsRouter);
app.use('/api/v1/homework', homeworkRouter);
app.use('/api/v1/feedback', feedbackRouter);
app.use('/api/v1/games', gamesRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/recorded-sessions', recordedSessionsRouter);
app.use('/api/v1/system-logs', systemLogsRouter);

// New Feature Routers
app.use('/api/v1/levels', levelsRouter);
app.use('/api/v1/languages', languagesRouter);
app.use('/api/v1/session-types', sessionTypesRouter);
app.use('/api/v1/roles', rolesRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/level-exams', levelExamsRouter);
app.use('/api/v1/review-links', reviewLinksRouter);
app.use('/api/v1/point-rules', pointRulesRouter);
app.use('/api/v1/placement-test', placementTestRouter);
app.use('/api/v1/store', storeRouter);
app.use('/api/v1/shorts', shortsRouter);

app.use(errorHandler);

export default app;
