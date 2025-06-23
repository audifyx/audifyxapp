import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  // App Settings
  darkMode: boolean;
  notifications: boolean;
  language: string;
  
  // Playback Settings
  autoPlay: boolean;
  highQuality: boolean;
  downloadOnWifi: boolean;
  
  // Actions
  toggleDarkMode: () => void;
  toggleNotifications: () => void;
  toggleAutoPlay: () => void;
  toggleHighQuality: () => void;
  toggleDownloadOnWifi: () => void;
  setLanguage: (language: string) => void;
  
  // Reset Settings
  resetSettings: () => void;
}

const defaultSettings = {
  darkMode: true,
  notifications: true,
  language: 'en',
  autoPlay: true,
  highQuality: false,
  downloadOnWifi: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      
      toggleNotifications: () => set((state) => ({ notifications: !state.notifications })),
      
      toggleAutoPlay: () => set((state) => ({ autoPlay: !state.autoPlay })),
      
      toggleHighQuality: () => set((state) => ({ highQuality: !state.highQuality })),
      
      toggleDownloadOnWifi: () => set((state) => ({ downloadOnWifi: !state.downloadOnWifi })),
      
      setLanguage: (language: string) => set({ language }),
      
      resetSettings: () => set(defaultSettings),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);