
import { User, DailyStats, Transaction } from '../types';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const KEYS = {
  USER_DATA: 'se_user_data_v1', // Persistent Data
  IS_LOGGED_IN: 'se_is_logged_in', // Session State
  STATS: 'se_stats_v1',
  HISTORY: 'se_history_v1',
  DEVICE_ID: 'se_device_id',
};

export const getTodayString = () => new Date().toISOString().split('T')[0];

export const storage = {
  // Get the saved user data (Local Cache)
  getSavedUser: (): User | null => {
    const data = localStorage.getItem(KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  },

  // Check if currently logged in locally
  isLoggedIn: (): boolean => {
    return localStorage.getItem(KEYS.IS_LOGGED_IN) === 'true';
  },

  // Save user data to persistent storage (Local + Firebase)
  saveUser: async (user: User) => {
    // 1. Save Locally
    localStorage.setItem(KEYS.USER_DATA, JSON.stringify(user));
    
    // 2. Save to Firebase (Background Sync)
    try {
      if (user.email) {
        const userRef = doc(db, "users", user.email);
        // We use setDoc with merge: true to safely update or create
        await setDoc(userRef, user, { merge: true });
      }
    } catch (error) {
      console.error("Error syncing with Firebase:", error);
    }
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
  
  // --- FIREBASE SPECIFIC METHODS ---
  
  // Sync User from Firebase (Login Logic)
  syncUserWithFirebase: async (email: string, deviceId: string, defaultBonus: number): Promise<User> => {
    const userRef = doc(db, "users", email);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // EXISTING USER: Return data from Database
      const userData = userSnap.data() as User;
      // Update local storage
      localStorage.setItem(KEYS.USER_DATA, JSON.stringify(userData));
      return userData;
    } else {
      // NEW USER: Create in Database
      const newUser: User = {
        email: email,
        deviceId: deviceId,
        coins: defaultBonus,
        isNewUser: true,
        signupDate: Date.now()
      };
      
      await setDoc(userRef, newUser);
      
      // Update local storage
      localStorage.setItem(KEYS.USER_DATA, JSON.stringify(newUser));
      return newUser;
    }
  },

  // 1. Create Withdrawal Request in "withdrawals" collection
  createWithdrawalRequest: async (user: User, tx: Transaction) => {
    try {
      // Save to withdrawals collection
      // Doc ID is the transaction ID (timestamp)
      await setDoc(doc(db, "withdrawals", tx.id), {
        ...tx,
        userEmail: user.email,
        userId: user.email, // Using email as ID for simplicity
        deviceId: user.deviceId,
        requestDate: new Date().toISOString()
      });
      console.log("Withdrawal Request Sent to Firebase");
    } catch (e) {
      console.error("Failed to send withdrawal request", e);
    }
  },

  // 2. Check Status of Pending Withdrawals
  checkPendingWithdrawals: async (history: Transaction[]): Promise<{ updated: boolean, newHistory: Transaction[] }> => {
    let hasUpdates = false;
    const updatedHistory = [...history];

    // Filter only pending withdrawals
    const pendingWithdrawals = updatedHistory.filter(tx => tx.type === 'WITHDRAW' && tx.status === 'PENDING');

    if (pendingWithdrawals.length === 0) {
      return { updated: false, newHistory: history };
    }

    // Check each pending withdrawal against Firebase
    for (const tx of pendingWithdrawals) {
      try {
        const txRef = doc(db, "withdrawals", tx.id);
        const txSnap = await getDoc(txRef);

        if (txSnap.exists()) {
          const data = txSnap.data();
          // Check if status changed in Firebase (e.g., Admin changed it to SUCCESS or FAILED)
          if (data.status && data.status !== 'PENDING') {
            
            // Update the transaction in the local array
            const index = updatedHistory.findIndex(h => h.id === tx.id);
            if (index !== -1) {
              updatedHistory[index] = { ...updatedHistory[index], status: data.status };
              hasUpdates = true;
            }
          }
        }
      } catch (e) {
        console.error("Error checking withdrawal status", e);
      }
    }

    return { updated: hasUpdates, newHistory: updatedHistory };
  }
};
