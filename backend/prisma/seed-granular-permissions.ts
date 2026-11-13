import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DETAILED_PERMISSIONS = [
  // 1. Users & Accounts
  { code: 'users:view', group: 'Users', description: 'View user accounts, contact details, and role assignments' },
  { code: 'users:create', group: 'Users', description: 'Create new student, teacher, or administrative accounts' },
  { code: 'users:edit', group: 'Users', description: 'Modify user profiles, email addresses, phone numbers, and statuses' },
  { code: 'users:delete', group: 'Users', description: 'Deactivate, archive, or soft-delete user accounts' },
  { code: 'users:reset_password', group: 'Users', description: 'Trigger password reset links and manage user credentials' },
  { code: 'users:export_csv', group: 'Users', description: 'Export full user directory and contact databases to CSV' },

  // 2. Students & Academics
  { code: 'students:view_balance', group: 'Students', description: 'View student session balances, bundle validity, and points' },
  { code: 'students:adjust_balance', group: 'Students', description: 'Manually credit or deduct session allowances and bonus points' },
  { code: 'students:set_level', group: 'Students', description: 'Promote or adjust student academic proficiency tier' },
  { code: 'students:view_progress', group: 'Students', description: 'Inspect grammar notes, homework submissions, and learning telemetry' },
  { code: 'students:edit_notes', group: 'Students', description: 'Record confidential academic notes and internal guidance on student file' },

  // 3. Teachers & Instructors
  { code: 'teachers:view_all', group: 'Teachers', description: 'View all instructor profiles, hourly rates, and bios' },
  { code: 'teachers:manage_slots', group: 'Teachers', description: 'Configure, open, or close teacher calendar availability slots' },
  { code: 'teachers:assign_students', group: 'Teachers', description: 'Assign dedicated teachers to specific students' },
  { code: 'teachers:view_payouts', group: 'Teachers', description: 'View teacher earnings calculations and completed lesson compensation' },

  // 4. Lessons & Scheduling
  { code: 'lessons:view_all', group: 'Lessons', description: 'View full schedule of live, upcoming, and past lessons across academy' },
  { code: 'lessons:book', group: 'Lessons', description: 'Book private 1-on-1 sessions on behalf of students' },
  { code: 'lessons:cancel', group: 'Lessons', description: 'Cancel scheduled lessons with automated session balance return' },
  { code: 'lessons:reschedule', group: 'Lessons', description: 'Reschedule lesson times without balance deduction penalty' },
  { code: 'lessons:mark_attendance', group: 'Lessons', description: 'Record student attendance (Attended, Late, No-Show) and notes' },
  { code: 'lessons:join_zoom', group: 'Lessons', description: 'Access host and teacher Zoom video classroom meeting links' },
  { code: 'lessons:view_recordings', group: 'Lessons', description: 'Access Google Drive / Zoom cloud lesson recordings' },

  // 5. Packages & Offers
  { code: 'packages:view', group: 'Packages', description: 'Browse session packages catalog and pricing structures' },
  { code: 'packages:create', group: 'Packages', description: 'Design new learning bundles with session duration allocations' },
  { code: 'packages:edit', group: 'Packages', description: 'Modify pricing, discounts, popularity badge, and descriptions' },
  { code: 'packages:delete', group: 'Packages', description: 'Permanently remove or archive learning packages' },
  { code: 'packages:assign', group: 'Packages', description: 'Directly allocate package quotas to student accounts' },

  // 6. Payments & Financials
  { code: 'payments:view_all', group: 'Payments', description: 'View complete transaction ledger and proof-of-payment receipts' },
  { code: 'payments:create', group: 'Payments', description: 'Upload payment receipts or record manual bank transfers' },
  { code: 'payments:approve', group: 'Payments', description: 'Validate WebP transfer receipts and instantly credit student packages' },
  { code: 'payments:reject', group: 'Payments', description: 'Decline invalid or duplicate payment submissions with reason' },
  { code: 'payments:refund', group: 'Payments', description: 'Process order cancellations and credit balance rollbacks' },
  { code: 'payments:export_receipts', group: 'Payments', description: 'Export tax records, revenue reports, and receipt archives' },

  // 7. Curriculum & Levels
  { code: 'levels:view', group: 'Curriculum', description: 'View CEFR levels, syllabus topics, and curriculum progression' },
  { code: 'levels:create', group: 'Curriculum', description: 'Create new proficiency levels and academic milestones' },
  { code: 'levels:edit', group: 'Curriculum', description: 'Edit level competencies, vocabulary targets, and syllabus' },
  { code: 'levels:delete', group: 'Curriculum', description: 'Delete or archive deprecated curriculum levels' },

  // 8. Exams & Progression
  { code: 'exams:view', group: 'Exams', description: 'View assessment tests, question banks, and student scores' },
  { code: 'exams:create', group: 'Exams', description: 'Author level advancement exams and import questions via CSV' },
  { code: 'exams:open_for_student', group: 'Exams', description: 'Authorize and unlock exam progression attempt for a student' },
  { code: 'exams:reset_attempt', group: 'Exams', description: 'Reset student exam submissions to permit a retake' },
  { code: 'exams:grade_manually', group: 'Exams', description: 'Review essay questions, assign manual marks, and submit feedback' },

  // 9. Gamification & Rewards
  { code: 'games:view', group: 'Rewards', description: 'View custom Hebrew educational mini-games and vocabulary drills' },
  { code: 'games:create', group: 'Rewards', description: 'Author new vocabulary memory match and phrase builder games' },
  { code: 'games:unlock_for_student', group: 'Rewards', description: 'Manually unlock bonus games and challenge stages for students' },
  { code: 'points:manage_rules', group: 'Rewards', description: 'Configure points per lesson, attendance streaks, and reward rules' },
  { code: 'points:manual_award', group: 'Rewards', description: 'Grant custom reward points and honorary achievements' },

  // 10. Reviews & Ratings
  { code: 'reviews:manage_links', group: 'Reviews', description: 'Generate single-use time-limited instructor feedback links' },
  { code: 'reviews:publish', group: 'Reviews', description: 'Approve student reviews for public landing page showcase' },
  { code: 'reviews:delete', group: 'Reviews', description: 'Remove or moderate inappropriate reviews and ratings' },

  // 11. Surveys & Quality
  { code: 'surveys:create', group: 'Surveys', description: 'Design and dispatch student satisfaction and retention surveys' },
  { code: 'surveys:view_analytics', group: 'Surveys', description: 'Analyze student sentiment, NPS scores, and feedback trends' },

  // 12. Notifications & Messaging
  { code: 'notifications:send_manual', group: 'Notifications', description: 'Send targeted broadcasts, push alerts, and in-app messages' },
  { code: 'reminders:trigger_engine', group: 'Notifications', description: 'Trigger automated lesson WhatsApp/SMS/Email reminder engine' },

  // 13. System Governance & RBAC
  { code: 'roles:manage', group: 'Security', description: 'Configure granular permission matrix and define custom roles' },
  { code: 'settings:manage', group: 'Security', description: 'Configure core academy settings, integrations, and session types' },
  { code: 'audit:view_logs', group: 'Security', description: 'Inspect immutable administrative security and audit logs' },
  { code: 'languages:manage', group: 'Security', description: 'Configure supported platform languages and translation strings' },
];

async function main() {
  console.log(`Starting granular permissions seed (${DETAILED_PERMISSIONS.length} permissions)...`);

  const permMap: Record<string, string> = {};

  for (const perm of DETAILED_PERMISSIONS) {
    const upserted = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        group: perm.group,
        description: perm.description,
      },
      create: {
        code: perm.code,
        group: perm.group,
        description: perm.description,
      },
    });
    permMap[perm.code] = upserted.id;
  }

  console.log(`Upserted ${Object.keys(permMap).length} permissions successfully.`);

  // Ensure SUPER_ADMIN and ADMIN have ALL permissions
  const adminRoles = await prisma.roleDefinition.findMany({
    where: { name: { in: ['SUPER_ADMIN', 'ADMIN'] } },
  });

  for (const role of adminRoles) {
    console.log(`Granting all permissions to role: ${role.name}...`);
    const existingRolePerms = await prisma.rolePermission.findMany({
      where: { roleId: role.id },
      select: { permissionId: true },
    });
    const existingPermIds = new Set(existingRolePerms.map((rp) => rp.permissionId));

    const toCreate = Object.values(permMap)
      .filter((pId) => !existingPermIds.has(pId))
      .map((pId) => ({
        roleId: role.id,
        permissionId: pId,
        granted: true,
      }));

    if (toCreate.length > 0) {
      await prisma.rolePermission.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
      console.log(`Added ${toCreate.length} new permissions to ${role.name}`);
    }
  }

  console.log('Granular permissions migration complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
