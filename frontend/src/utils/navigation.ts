/**
 * Resolves the primary dashboard route for a given user role.
 */
export function getUserDashboardPath(role?: string | null): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/admin';
    case 'TEACHER':
      return '/teacher';
    case 'SALES':
      return '/sales';
    case 'CS':
      return '/cs';
    case 'STUDENT':
    default:
      return '/student';
  }
}

/**
 * Returns localized label for the user dashboard button.
 */
export function getDashboardButtonLabel(role?: string | null, lang: 'he' | 'en' | 'ar' = 'he'): string {
  const isSuperAdminOrAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const isTeacher = role === 'TEACHER';

  if (lang === 'he') {
    if (isSuperAdminOrAdmin) return 'מעבר לניהול המערכת';
    if (isTeacher) return 'מעבר לאזור המורה';
    return 'מעבר ללוח הבקרה שלי';
  }

  if (lang === 'ar') {
    if (isSuperAdminOrAdmin) return 'لوحة إدارة المنصة';
    if (isTeacher) return 'لوحة تحكم المعلم';
    return 'لوحة التحكم الخاصة بي';
  }

  // English fallback
  if (isSuperAdminOrAdmin) return 'Admin Control Hub';
  if (isTeacher) return 'Teacher Portal';
  return 'My Dashboard';
}
