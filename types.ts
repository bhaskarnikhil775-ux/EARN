export interface User {
  email: string;
  deviceId: string;
  coins: number;
  isNewUser: boolean;
  signupDate: number;
  lastCheckIn?: string; // ISO Date String YYYY-MM-DD
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  scratchesUsed: number;
  spinsUsed: number;
  coinsEarnedToday: number;
}

export interface Transaction {
  id: string;
  type: 'EARN' | 'WITHDRAW' | 'BONUS';
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  title: string;
  timestamp: number;
  details?: string;
}

export enum Tab {
  HOME = 'HOME',
  WALLET = 'WALLET',
  HISTORY = 'HISTORY',
  PROFILE = 'PROFILE',
}

export enum View {
  MAIN = 'MAIN',
  SCRATCH = 'SCRATCH',
  SPIN = 'SPIN',
}