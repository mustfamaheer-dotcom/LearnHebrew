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

import { errorHandler } from './middleware/errorHandler';

export const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Let frontend handle CSP in SPA mode
    crossOriginEmbedderPolicy: false,
  })
);

// Compression
app.use(compression());

// CORS
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
      } else {
        callback(null, true); // Dev convenience
      }
    },
    credentials: true,
  })
);

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

// Global Error Handler
app.use(errorHandler);

