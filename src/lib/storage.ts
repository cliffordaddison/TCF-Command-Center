import { UserProfile, UserProgress } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'tcf_profile',
  PROGRESS: 'tcf_progress'
};

export const storage = {
  getProfile: (): UserProfile | null => {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  },

  saveProfile: (profile: UserProfile) => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  getProgress: (): UserProgress[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return data ? JSON.parse(data) : [];
  },

  saveProgress: (progress: UserProgress[]) => {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  },

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
  }
};
