import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  searchQuery: string;
  isUploadModalOpen: boolean;
  isLoginModalOpen: boolean;
  isRegisterModalOpen: boolean;
  toast: {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isVisible: boolean;
  } | null;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setSearchQuery: (query: string) => void;
  setUploadModalOpen: (open: boolean) => void;
  setLoginModalOpen: (open: boolean) => void;
  setRegisterModalOpen: (open: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  hideToast: () => void;
  closeAllModals: () => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  sidebarOpen: false,
  theme: 'dark', // Default to dark theme for YouTube-like experience
  searchQuery: '',
  isUploadModalOpen: false,
  isLoginModalOpen: false,
  isRegisterModalOpen: false,
  toast: null,

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  })),
  setTheme: (theme) => set({ theme }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setUploadModalOpen: (open) => set({ isUploadModalOpen: open }),
  setLoginModalOpen: (open) => set({ isLoginModalOpen: open }),
  setRegisterModalOpen: (open) => set({ isRegisterModalOpen: open }),
  
  showToast: (message, type = 'info') => set({
    toast: {
      message,
      type,
      isVisible: true,
    }
  }),
  
  hideToast: () => set({ toast: null }),
  
  closeAllModals: () => set({
    isUploadModalOpen: false,
    isLoginModalOpen: false,
    isRegisterModalOpen: false,
  }),
})); 