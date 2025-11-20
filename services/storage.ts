
import { User, DailyStats, Transaction } from '../types';

const KEYS = {
  USER_DATA: 'se_user_data_v1', // Persistent Data
  IS_LOGGED_IN: 'se_is_logged_in', // Session State
  STATS: 'se_stats_v1',
  HISTORY: 'se_history_v1',
  DEVICE_ID: 'se_device_id',
};

export const getTodayString = () => new Date().toISOString().split('T')[0];

export const storage = {
  // Get the saved user data (even if logged out)
  getSavedUser: (): User | null => {
    const data = localStorage.getItem(KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  },

  // Check if currently logged in
  isLoggedIn: (): boolean => {
    return localStorage.getItem(KEYS.IS_LOGGED_IN) === 'true';
  },

  // Save user data to persistent storage
  saveUser: (user: User) => {
    localStorage.setItem(KEYS.USER_DATA, JSON.stringify(user));
  },

  // Set session to active
  setSessionActive: (isActive: boolean) => {
    if (isActive) {
      localStorage.setItem(KEYS.IS_LOGGED_IN, 'true');
    } else {
      localStorage.removeItem(KEYS.IS_LOGGED_IN);
    }
  },

  getDeviceId: (): string | null => {
    return localStorage.getItem(KEYS.DEVICE_ID);
  },

  setDeviceId: (id: string) => {
    localStorage.setItem(KEYS.DEVICE_ID, id);
  },

  getStats: (): DailyStats => {
    const data = localStorage.getItem(KEYS.STATS);
    const today = getTodayString();
    
    if (data) {
      const stats: DailyStats = JSON.parse(data);
      if (stats.date === today) return stats;
    }

    return {
      date: today,
      scratchesUsed: 0,
      spinsUsed: 0,
      coinsEarnedToday: 0,
    };
  },

  saveStats: (stats: DailyStats) => {
    localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
  },

  getHistory: (): Transaction[] => {
    const data = localStorage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : [];
  },

  addTransaction: (tx: Transaction) => {
    const history = storage.getHistory();
    localStorage.setItem(KEYS.HISTORY, JSON.stringify([tx, ...history]));
  },

  // Clear only stats for dev/reset purposes, not used in normal flow
  resetStats: () => {
    localStorage.removeItem(KEYS.STATS);
  }
};
