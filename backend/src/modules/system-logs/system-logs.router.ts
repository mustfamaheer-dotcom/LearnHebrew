import { Router, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authenticate, requireRoles, AuthRequest } from '../../middleware/auth';
import { Role, LogLevel, LogCategory, Prisma } from '@prisma/client';

const router = Router();

// Strictly locked to Platform Owner (SUPER_ADMIN)
router.use(authenticate, requireRoles(Role.SUPER_ADMIN));

/**
 * 1. GET /api/v1/system-logs/stats
 * Aggregate KPIs & Telemetry
 */
router.get('/stats', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalToday,
      criticalToday,
      errorToday,
      warnToday,
      infoToday,
      avgDurationRaw,
      recentCritical,
      countsByLevelRaw,
      countsByCategoryRaw,
      jobRunsToday,
      jobFailuresToday,
    ] = await Promise.all([
      prisma.systemLog.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.systemLog.count({ where: { createdAt: { gte: startOfToday }, level: LogLevel.CRITICAL } }),
      prisma.systemLog.count({ where: { createdAt: { gte: startOfToday }, level: LogLevel.ERROR } }),
      prisma.systemLog.count({ where: { createdAt: { gte: startOfToday }, level: LogLevel.WARN } }),
      prisma.systemLog.count({ where: { createdAt: { gte: startOfToday }, level: LogLevel.INFO } }),
      prisma.systemLog.aggregate({
        where: { createdAt: { gte: startOfToday }, durationMs: { not: null } },
        _avg: { durationMs: true },
      }),
      prisma.systemLog.findMany({
        where: { level: LogLevel.CRITICAL },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.systemLog.groupBy({
        by: ['level'],
        where: { createdAt: { gte: last24h } },
        _count: { id: true },
      }),
      prisma.systemLog.groupBy({
        by: ['category'],
        where: { createdAt: { gte: last24h } },
        _count: { id: true },
      }),
      prisma.systemLog.count({
        where: { createdAt: { gte: startOfToday }, category: LogCategory.JOB },
      }),
      prisma.systemLog.count({
        where: {
          createdAt: { gte: startOfToday },
          category: LogCategory.JOB,
          level: { in: [LogLevel.ERROR, LogLevel.CRITICAL] },
        },
      }),
    ]);

    const errorCountToday = criticalToday + errorToday;
    const errorRate = totalToday > 0 ? ((errorCountToday / totalToday) * 100).toFixed(2) : '0.00';
    const avgResponseMs = Math.round(avgDurationRaw._avg.durationMs || 0);

    const levelCounts: Record<string, number> = {
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0,
      CRITICAL: 0,
    };
    countsByLevelRaw.forEach((row) => {
      levelCounts[row.level] = row._count.id;
    });

    const categoryCounts: Record<string, number> = {};
    countsByCategoryRaw.forEach((row) => {
      categoryCounts[row.category] = row._count.id;
    });

    res.json({
      kpis: {
        totalToday,
        criticalToday,
        errorToday,
        warnToday,
        infoToday,
        errorRate: `${errorRate}%`,
        avgResponseMs,
        jobRunsToday,
        jobFailuresToday,
        jobStatus: jobFailuresToday === 0 ? 'HEALTHY' : 'DEGRADED',
      },
      levelCounts,
      categoryCounts,
      recentCritical,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 2. GET /api/v1/system-logs
 * Paginated log stream with robust multi-criteria filtering
 */
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
    const skip = (page - 1) * limit;

    const { level, category, search, statusCode, from, to } = req.query;

    const where: Prisma.SystemLogWhereInput = {};

    if (level && level !== 'ALL') {
      if (typeof level === 'string' && level.includes(',')) {
        where.level = { in: level.split(',') as LogLevel[] };
      } else {
        where.level = level as LogLevel;
      }
    }

    if (category && category !== 'ALL') {
      where.category = category as LogCategory;
    }

    if (statusCode) {
      where.statusCode = parseInt(statusCode as string, 10);
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) where.createdAt.lte = new Date(to as string);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      where.OR = [
        { message: { contains: term, mode: 'insensitive' } },
        { path: { contains: term, mode: 'insensitive' } },
        { errorClass: { contains: term, mode: 'insensitive' } },
        { ipAddress: { contains: term, mode: 'insensitive' } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      }),
      prisma.systemLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 3. GET /api/v1/system-logs/export
 * CSV Export of filtered records
 */
router.get('/export', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { level, category, search, from, to } = req.query;

    const where: Prisma.SystemLogWhereInput = {};
    if (level && level !== 'ALL') where.level = level as LogLevel;
    if (category && category !== 'ALL') where.category = category as LogCategory;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) where.createdAt.lte = new Date(to as string);
    }
    if (search && typeof search === 'string' && search.trim()) {
      where.OR = [
        { message: { contains: search.trim(), mode: 'insensitive' } },
        { path: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const logs = await prisma.systemLog.findMany({
      where,
      take: 2000,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true } },
      },
    });

    const headers = ['ID', 'Level', 'Category', 'Timestamp', 'Status Code', 'Method', 'Path', 'Duration (ms)', 'User', 'IP Address', 'Message'];
    const csvRows = [headers.join(',')];

    logs.forEach((log) => {
      const escape = (str?: any) => `"${String(str || '').replace(/"/g, '""')}"`;
      csvRows.push([
        escape(log.id),
        escape(log.level),
        escape(log.category),
        escape(log.createdAt.toISOString()),
        log.statusCode ?? '',
        escape(log.method),
        escape(log.path),
        log.durationMs ?? '',
        escape(log.user?.email || 'Anonymous'),
        escape(log.ipAddress),
        escape(log.message),
      ].join(','));
    });

    const filename = `engrew-system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvRows.join('\n'));
  } catch (error) {
    next(error);
  }
});

/**
 * 4. GET /api/v1/system-logs/:id
 * Single log item full detail
 */
router.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const log = await prisma.systemLog.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    if (!log) {
      return res.status(404).json({ error: 'System log entry not found' });
    }

    res.json({ log });
  } catch (error) {
    next(error);
  }
});

/**
 * 5. DELETE /api/v1/system-logs/purge
 * Safe retention cleanup (minimum 7 days)
 */
router.delete('/purge', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const days = Math.max(7, parseInt(req.body.days, 10) || 30);
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const deleteResult = await prisma.systemLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    res.json({
      message: `Successfully purged system logs older than ${days} days`,
      deletedCount: deleteResult.count,
      cutoffDate,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
