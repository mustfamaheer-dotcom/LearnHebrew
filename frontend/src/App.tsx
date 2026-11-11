import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './components/common/Navbar';
import { ToastContainer } from './components/common/ToastContainer';
import { ProfileSettingsModal } from './components/common/ProfileSettingsModal';
import { CommandPaletteModal } from './components/common/CommandPaletteModal';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PageLoader } from './components/common/PageLoader';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// Dynamic lazy-loaded route chunks for instant page delivery & performance
const LandingPage = React.lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const LoginPage = React.lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const StudentDashboard = React.lazy(() =>
  import('./pages/student/StudentDashboard').then((m) => ({ default: m.StudentDashboard }))
);
const TeacherDashboard = React.lazy(() =>
  import('./pages/teacher/TeacherDashboard').then((m) => ({ default: m.TeacherDashboard }))
);
const AdminDashboard = React.lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
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

  // Global Command Palette (⌘+K / Ctrl+K) & Custom Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    const handleCustomOpen = () => setIsCommandPaletteOpen(true);

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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />

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
          <CommandPaletteModal
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
          />
          <ProfileSettingsModal />
          <ToastContainer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
export default App;
