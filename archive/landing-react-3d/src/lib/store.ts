import { create } from 'zustand';

export interface ShortenedLink {
  id: string;
  slug: string;
  url: string;
  dest: string;
  createdAt: number;
}

interface AppState {
  activeTab: 'link' | 'qr' | 'bulk';
  setActiveTab: (tab: 'link' | 'qr' | 'bulk') => void;
  recentLinks: ShortenedLink[];
  addRecentLink: (link: ShortenedLink) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  webglAvailable: boolean;
  setWebglAvailable: (avail: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'link',
  setActiveTab: (tab) => set({ activeTab: tab }),
  recentLinks: [],
  addRecentLink: (link) =>
    set((state) => ({ recentLinks: [link, ...state.recentLinks.slice(0, 4)] })),
  isMobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  webglAvailable: true,
  setWebglAvailable: (avail) => set({ webglAvailable: avail }),
}));
