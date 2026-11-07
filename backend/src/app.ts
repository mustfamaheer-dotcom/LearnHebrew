import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

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

import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';

export const app = express();

// Security Headers (OWASP Hardening)
app.use(
  helmet({
    contentSecurityPolicy: false, // SPA handles CSP
    crossOriginEmbedderPolicy: false,
    frameguard: { action: 'sameorigin' }, // Anti-clickjacking
    noSniff: true, // Prevent MIME sniffing
    xssFilter: true, // Cross-site scripting filter
    hsts:
      process.env.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
  })
);

// Compression
app.use(compression());

// CORS Whitelisting
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests or verified origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else if (process.env.NODE_ENV !== 'production') {
        callback(null, true); // Dev convenience only
      } else {
        callback(new Error('Cross-Origin Request Blocked by CORS Security Policy'));
      }
    },
    credentials: true,
  })
);

// Global API Rate Limiter
app.use('/api/', apiLimiter);

// Parsers with strict anti-DoS payload size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// HTTP Request & Telemetry Logger
app.use(requestLogger);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'LearnHebrew API', timestamp: new Date().toISOString() });
});

// API Routes
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

// Global Error Handler
app.use(errorHandler);

