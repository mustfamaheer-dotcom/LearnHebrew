import { create } from 'zustand';

interface SidebarState {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

const getInitialCollapsedState = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('engrew_sidebar_collapsed') === 'true';
};

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: getInitialCollapsedState(),
  toggleCollapsed: () =>
    set((state) => {
      const next = !state.isCollapsed;
      localStorage.setItem('engrew_sidebar_collapsed', String(next));
      return { isCollapsed: next };
    }),
  setCollapsed: (collapsed: boolean) => {
    localStorage.setItem('engrew_sidebar_collapsed', String(collapsed));
    set({ isCollapsed: collapsed });
  },
}));
