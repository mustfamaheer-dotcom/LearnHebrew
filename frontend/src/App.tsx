import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/common/Navbar';
import { ToastContainer } from './components/common/ToastContainer';
import { ConfirmDialogContainer } from './components/common/ConfirmDialogContainer';
import { ProfileSettingsModal } from './components/common/ProfileSettingsModal';
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PageLoader } from './components/common/PageLoader';
import { EnterpriseQuickAccessFloatingBar } from './components/common/EnterpriseQuickAccessFloatingBar';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// Lazy loaded routes with resilient named + default fallback
const resolveRoute = (m: any, name: string) => {
  const component = m.default || m[name];
  if (!component) {
    console.error(`[App] Failed to load route component "${name}". Available exports:`, Object.keys(m));
  }
  return { default: component };
};

const LandingPage = React.lazy(() =>
  import('./pages/LandingPage').then((m) => resolveRoute(m, 'LandingPage'))
);
const LoginPage = React.lazy(() =>
  import('./pages/LoginPage').then((m) => resolveRoute(m, 'LoginPage'))
);
const StudentDashboard = React.lazy(() =>
  import('./pages/student/StudentDashboard').then((m) => resolveRoute(m, 'StudentDashboard'))
);
const TeacherDashboard = React.lazy(() =>
  import('./pages/teacher/TeacherDashboard').then((m) => resolveRoute(m, 'TeacherDashboard'))
);
const AdminDashboard = React.lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => resolveRoute(m, 'AdminDashboard'))
);
const SalesDashboard = React.lazy(() =>
  import('./pages/sales/SalesDashboard').then((m) => resolveRoute(m, 'SalesDashboard'))
);
const CSDashboard = React.lazy(() =>
  import('./pages/cs/CSDashboard').then((m) => resolveRoute(m, 'CSDashboard'))
);
const ReviewRedirectPage = React.lazy(() =>
  import('./pages/shared/ReviewRedirectPage').then((m) => resolveRoute(m, 'ReviewRedirectPage'))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  const language = useAuthStore((state) => state.language);
  const theme = useThemeStore((state) => state.theme);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (window.location.pathname === '/' || !useAuthStore.getState().user) {
          return;
        }
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    const handleCustomOpen = () => {
      if (window.location.pathname === '/' || !useAuthStore.getState().user) return;
      setIsCommandPaletteOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('engrew:open-command-palette', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('engrew:open-command-palette', handleCustomOpen);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen w-full max-w-full overflow-x-clip bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
          <Navbar />
          <main className="flex-1 w-full max-w-full overflow-x-clip">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/review/:token" element={<ReviewRedirectPage />} />

                {/* Student Routes */}
                <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
                  <Route path="/student" element={<StudentDashboard />} />
                  <Route path="/student/games" element={<StudentDashboard />} />
                  <Route path="/student/leaderboard" element={<StudentDashboard />} />
                </Route>

                {/* Teacher Routes */}
                <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
                  <Route path="/teacher" element={<TeacherDashboard />} />
                </Route>

                {/* Sales Routes */}
                <Route element={<ProtectedRoute allowedRoles={['SALES', 'ADMIN', 'SUPER_ADMIN']} />}>
                  <Route path="/sales" element={<SalesDashboard />} />
                </Route>

                {/* CS Routes */}
                <Route element={<ProtectedRoute allowedRoles={['CS', 'ADMIN', 'SUPER_ADMIN']} />}>
                  <Route path="/cs" element={<CSDashboard />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminDashboard />} />
                  <Route path="/admin/packages" element={<AdminDashboard />} />
                </Route>

                {/* Catch all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
          <EnterpriseQuickAccessFloatingBar />
          <CommandPaletteModal
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
          />
          <ProfileSettingsModal />
          <ToastContainer />
          <ConfirmDialogContainer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
export default App;
