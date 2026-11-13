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

import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';

export const app = express();

// Security Headers (OWASP Hardening)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: { action: 'sameorigin' },
    noSniff: true,
    xssFilter: true,
    hsts:
      process.env.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
  })
);

app.use(compression());

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Cross-Origin Request Blocked by CORS Security Policy'));
      }
    },
    credentials: true,
  })
);

app.use('/api/', apiLimiter);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Static Uploads Serving (Avatars, Screenshots, WebP)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(requestLogger);

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

app.use(errorHandler);
