
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { AdOverlay } from './components/AdOverlay';
import { ScratchCard } from './components/ScratchCard';
import { SpinWheel } from './components/SpinWheel';
import { storage, getTodayString } from './services/storage';
import { User, Tab, View, DailyStats, Transaction } from './types';
import { APP_CONSTANTS, WITHDRAWAL_OPTIONS, WITHDRAWAL_TYPES, LEGAL_CONTENT, LOGO_URLS } from './constants';
import { auth, googleProvider } from './firebaseConfig';
import { signInWithPopup } from 'firebase/auth';
import { 
  Coins, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  Copy, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  User as UserIcon,
  Shield,
  FileText,
  HelpCircle,
  Mail,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Toast = ({ message, type = 'success' }: { message: string, type?: 'success' | 'error' | 'info' }) => (
  <motion.div 
    initial={{ opacity: 0, y: -50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
    className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 w-max max-w-[90%]
      ${type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-800 text-white border border-yellow-500/30'}`}
  >
    {type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} className="text-yellow-400"/>}
    <span className="text-sm font-medium">{message}</span>
  </motion.div>
);

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginErrorCount, setLoginErrorCount] = useState(0);
  
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [activeView, setActiveView] = useState<View>(View.MAIN);
  
  const [stats, setStats] = useState<DailyStats>(storage.getStats());
  
  // Independent Cooldowns
  const [scratchCooldown, setScratchCooldown] = useState(0);
  const [spinCooldown, setSpinCooldown] = useState(0);
  
  const [showAd, setShowAd] = useState(false);
  const [pendingReward, setPendingReward] = useState<number | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);
  
  // Withdrawal Flow States
  const [selectedOption, setSelectedOption] = useState<typeof WITHDRAWAL_OPTIONS[0] | null>(null);
  const [withdrawalStep, setWithdrawalStep] = useState<'NONE' | 'INSUFFICIENT' | 'INPUT' | 'CONFIRM'>('NONE');
  const [withdrawalInput, setWithdrawalInput] = useState('');
  const [infoModal, setInfoModal] = useState<{title: string, content: string} | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(() => {
    // Check session status on load
    const isLoggedIn = storage.isLoggedIn();
    const savedUser = storage.getSavedUser();
    
    if (isLoggedIn && savedUser) {
      setUser(savedUser);
    }
    setStats(storage.getStats());
    setIsLoading(false);
  }, []);

  // Timer Logic for independent cooldowns
  useEffect(() => {
    const interval = setInterval(() => {
      setScratchCooldown(prev => Math.max(0, prev - 1000));
      setSpinCooldown(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- MANUAL CONTROL SYNC LOGIC ---
  useEffect(() => {
    if (!user) return;

    const checkStatus = async () => {
      const history = storage.getHistory();
      const hasPending = history.some(tx => tx.type === 'WITHDRAW' && tx.status === 'PENDING');
      
      if (hasPending) {
        const { updated, newHistory } = await storage.checkPendingWithdrawals(history);
        
        if (updated) {
           localStorage.setItem('se_history_v1', JSON.stringify(newHistory));
           
           // Check for REJECTED transactions to refund coins
           const rejectedTxs = newHistory.filter(tx => 
             tx.status === 'FAILED' && 
             !history.find(h => h.id === tx.id && h.status === 'FAILED')
           );

           if (rejectedTxs.length > 0) {
             let totalRefund = 0;
             rejectedTxs.forEach(tx => {
               let coinsToRefund = 900;
               if (tx.amount === 15) coinsToRefund = tx.title.includes('UPI') ? 900 : 1500;
               if (tx.amount === 50) coinsToRefund = tx.title.includes('UPI') ? 4500 : 7500;
               if (tx.amount === 100) coinsToRefund = 9000;
               totalRefund += coinsToRefund;
             });

             const bonusCoins = 50;
             totalRefund += bonusCoins;

             const bonusTx: Transaction = {
                id: Date.now().toString(),
                type: 'BONUS',
                amount: bonusCoins,
                status: 'SUCCESS',
                title: 'Refund Bonus',
                timestamp: Date.now(),
                details: 'Compensation for failed withdrawal'
             };
             
             const finalHistory = [bonusTx, ...newHistory];
             localStorage.setItem('se_history_v1', JSON.stringify(finalHistory));

             const currentUser = storage.getSavedUser();
             if (currentUser) {
                const newBalance = currentUser.coins + totalRefund;
                const updatedUser = { ...currentUser, coins: newBalance };
                storage.saveUser(updatedUser);
                setUser(updatedUser);
                showToast(`Withdrawal Rejected. Coins Refunded + 50 Bonus!`, 'info');
             } else {
                setHistoryVersion(prev => prev + 1);
             }
           } else {
             setHistoryVersion(prev => prev + 1);
             showToast("Withdrawal Status Updated!", 'success');
           }
        }
      }
    };

    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [user, historyVersion]);

  const showToast = (msg: string, type: 'success'|'error'|'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLoginClick = async () => {
     setIsSigningIn(true);
     
     try {
       // 1. Trigger Google Popup
       const result = await signInWithPopup(auth, googleProvider);
       const googleUser = result.user;

       if (googleUser && googleUser.email) {
          const deviceId = storage.getDeviceId() || "dev_" + Math.random().toString(36).substr(2, 9);
          if (!storage.getDeviceId()) {
            storage.setDeviceId(deviceId);
          }

          const appUser = await storage.syncUserWithFirebase(
            googleUser.email, 
            deviceId, 
            APP_CONSTANTS.SIGNUP_BONUS
          );

          storage.setSessionActive(true);
          setUser(appUser);
          
          if (appUser.isNewUser) {
             storage.addTransaction({
                id: Date.now().toString(),
                type: 'BONUS',
                amount: APP_CONSTANTS.SIGNUP_BONUS,
                status: 'SUCCESS',
                title: 'Signup Bonus',
                timestamp: Date.now()
              });
             showToast("Congratulations 🎉 You got 50 coins.");
          } else {
             showToast("Welcome back!");
          }
       }
     } catch (error: any) {
       console.error("Login Failed:", error);
       setLoginErrorCount(prev => prev + 1);
       
       // Only alert if it's a real error (not popup closed by user)
       if (error.code !== 'auth/popup-closed-by-user') {
          // alert(`Login Failed: ${error.message}`);
          console.log("Popup blocked or closed");
       }
     } finally {
       setIsSigningIn(false);
     }
  };

  // Fallback Login for Preview Environment where real Google Login is blocked
  const handleDevLogin = () => {
    const devEmail = `demo${Math.floor(Math.random() * 1000)}@test.com`;
    const deviceId = "dev_preview_" + Math.random();
    
    const devUser: User = {
      email: devEmail,
      deviceId: deviceId,
      coins: APP_CONSTANTS.SIGNUP_BONUS,
      isNewUser: true,
      signupDate: Date.now()
    };
    
    storage.setDeviceId(deviceId);
    storage.saveUser(devUser);
    storage.setSessionActive(true);
    setUser(devUser);
    showToast("Preview Mode: Logged in as Demo User");
  };

  const handleLogout = () => {
    storage.setSessionActive(false);
    setUser(null);
    setActiveTab(Tab.HOME);
  };

  const handleTaskComplete = (type: 'SCRATCH' | 'SPIN') => {
    setShowAd(true);
    setPendingReward(APP_CONSTANTS.REWARD_PER_TASK);
  };

  const onAdClose = () => {
    setShowAd(false);
    
    if (pendingReward && user) {
      
      // Normal Tasks
      if (activeView === View.SCRATCH) {
        setScratchCooldown(APP_CONSTANTS.COOLDOWN_MS);
      } else if (activeView === View.SPIN) {
        setSpinCooldown(APP_CONSTANTS.COOLDOWN_MS);
      }

      const currentStats = storage.getStats();
      
      if (activeView === View.SCRATCH && currentStats.scratchesUsed >= APP_CONSTANTS.DAILY_SCRATCH_LIMIT) return;
      if (activeView === View.SPIN && currentStats.spinsUsed >= APP_CONSTANTS.DAILY_SPIN_LIMIT) return;
      if (currentStats.coinsEarnedToday >= APP_CONSTANTS.DAILY_EARN_LIMIT) return;

      const updatedStats = {
        ...currentStats,
        scratchesUsed: activeView === View.SCRATCH ? currentStats.scratchesUsed + 1 : currentStats.scratchesUsed,
        spinsUsed: activeView === View.SPIN ? currentStats.spinsUsed + 1 : currentStats.spinsUsed,
        coinsEarnedToday: currentStats.coinsEarnedToday + pendingReward
      };
      
      const updatedUser = { ...user, coins: user.coins + pendingReward };
      
      storage.saveStats(updatedStats);
      storage.saveUser(updatedUser);
      
      storage.addTransaction({
        id: Date.now().toString(),
        type: 'EARN',
        amount: pendingReward,
        status: 'SUCCESS',
        title: activeView === View.SCRATCH ? 'Scratch Card Reward' : 'Spin Wheel Reward',
        timestamp: Date.now()
      });

      setStats(updatedStats);
      setUser(updatedUser);
      showToast(`Coin Added Successfully`, 'success');
      setPendingReward(null);
      return;
    }

    if (withdrawalStep === 'CONFIRM' && selectedOption && user) {
      executeWithdrawal();
    }
  };
  
  const handleOptionClick = (option: typeof WITHDRAWAL_OPTIONS[0]) => {
    if (!user) return;
    setSelectedOption(option);
    setWithdrawalInput('');
    setWithdrawalStep('INPUT');
  };

  const handleInputNext = () => {
    if (!withdrawalInput || withdrawalInput.length < 5) {
      showToast('Please enter a valid Payment Address', 'error');
      return;
    }
    if (user && selectedOption && user.coins < selectedOption.coins) {
      setWithdrawalStep('INSUFFICIENT');
      return;
    }
    setWithdrawalStep('CONFIRM');
  };

  const executeWithdrawal = async () => {
      if(!user || !selectedOption) return;
      
      const updatedUser = { ...user, coins: user.coins - selectedOption.coins };
      await storage.saveUser(updatedUser);
      setUser(updatedUser);
      
      const tx: Transaction = {
          id: Date.now().toString(),
          type: 'WITHDRAW',
          amount: selectedOption.amount,
          status: 'PENDING',
          title: `Withdraw to ${selectedOption.type === WITHDRAWAL_TYPES.UPI ? 'UPI' : 'Google Play'}`,
          details: withdrawalInput,
          timestamp: Date.now(),
      };

      storage.addTransaction(tx);
      await storage.createWithdrawalRequest(updatedUser, tx);

      setWithdrawalStep('NONE');
      setSelectedOption(null);
      setWithdrawalInput('');
      
      setActiveTab(Tab.HISTORY);
      showToast("Withdrawal Request Submitted!", 'success');
  };

  const currentActiveCooldown = activeView === View.SCRATCH ? scratchCooldown : spinCooldown;
  const referralLink = user ? `${window.location.origin}/?ref=${user.email.split('@')[0]}` : '';

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-yellow-500"><Coins className="animate-bounce w-12 h-12"/></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-yellow-500/10 rounded-[50%] blur-3xl" />
        
        <div className="z-10 text-center space-y-8 w-full max-w-xs">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl mx-auto shadow-lg shadow-orange-500/20 flex items-center justify-center">
            <Coins className="text-white w-12 h-12" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Scratch Earn</h1>
            <p className="text-slate-400">Daily Scratch, Spin & Win Real Cash</p>
          </div>

          <button 
            onClick={handleLoginClick}
            disabled={isSigningIn}
            className="w-full bg-white hover:bg-gray-100 text-slate-900 font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            {isSigningIn ? (
               <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Connecting Securely...</span>
            ) : (
              <>
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="G" />
                Continue with Google
              </>
            )}
          </button>

          {/* Fallback Login for Preview/Dev Mode */}
          {loginErrorCount > 0 && (
             <button onClick={handleDevLogin} className="text-yellow-500 text-sm underline mt-2">
               Dev Login (Test Mode)
             </button>
          )}
          
          <p className="text-xs text-slate-600 mt-8">By continuing, you agree to our Terms & Privacy Policy</p>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} isAuth={!!user}>
      <AdOverlay isOpen={showAd} onClose={onAdClose} />
      <AnimatePresence>
        {toast && <Toast message={toast.msg} type={toast.type} />}
      </AnimatePresence>

      {activeTab === Tab.HOME && activeView === View.MAIN && (
        <div className="p-5 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-white">Hello, User 👋</h1>
              <p className="text-slate-400 text-xs">Welcome back</p>
            </div>
            <div className="bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 flex items-center gap-2">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-yellow-400 font-bold">{user.coins}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setActiveView(View.SCRATCH)}
              className="bg-gradient-to-br from-purple-600 to-blue-600 p-4 rounded-2xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
              <div className="relative z-10 text-left">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
                  <span className="text-2xl">🎰</span>
                </div>
                <h3 className="font-bold text-white">Scratch Card</h3>
                <p className="text-blue-200 text-xs mt-1">{Math.max(0, APP_CONSTANTS.DAILY_SCRATCH_LIMIT - stats.scratchesUsed)} Left</p>
              </div>
            </button>

            <button 
              onClick={() => setActiveView(View.SPIN)}
              className="bg-gradient-to-br from-orange-500 to-red-500 p-4 rounded-2xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors" />
               <div className="relative z-10 text-left">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
                  <span className="text-2xl">🎡</span>
                </div>
                <h3 className="font-bold text-white">Spin Wheel</h3>
                <p className="text-orange-200 text-xs mt-1">{Math.max(0, APP_CONSTANTS.DAILY_SPIN_LIMIT - stats.spinsUsed)} Left</p>
              </div>
            </button>
          </div>

          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <UserIcon className="text-yellow-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold">Refer & Earn</h3>
                <p className="text-slate-400 text-xs">Get {APP_CONSTANTS.REFERRAL_BONUS} coins per friend</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="bg-slate-900 flex-1 rounded px-3 py-2 text-xs text-slate-400 truncate font-mono select-all">
                {referralLink}
              </div>
              <button 
                onClick={() => {
                    navigator.clipboard.writeText(referralLink);
                    showToast("Referral Link Copied!");
                }}
                className="bg-yellow-500 text-slate-900 px-3 py-2 rounded font-bold text-xs hover:bg-yellow-400"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          <div className="flex justify-center mt-4">
             <a href={APP_CONSTANTS.TELEGRAM_LINK} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors text-sm">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                  <Send size={14} className="-ml-0.5 mt-0.5" /> 
                </div>
                <span>Join Telegram Support</span>
             </a>
          </div>
        </div>
      )}

      {activeTab === Tab.HOME && (activeView === View.SCRATCH || activeView === View.SPIN) && (
        <div className="h-full flex flex-col">
          <div className="p-4 flex items-center gap-4">
             <button onClick={() => setActiveView(View.MAIN)} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700">
               <ChevronLeft />
             </button>
             <h2 className="text-xl font-bold text-white">
               {activeView === View.SCRATCH ? 'Scratch & Win' : 'Spin Wheel'}
             </h2>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            {activeView === View.SCRATCH && (
              <ScratchCard 
                prizeValue={APP_CONSTANTS.REWARD_PER_TASK}
                onComplete={() => handleTaskComplete('SCRATCH')}
                disabled={scratchCooldown > 0 || stats.scratchesUsed >= APP_CONSTANTS.DAILY_SCRATCH_LIMIT}
                cooldown={scratchCooldown}
              />
            )}
            {activeView === View.SPIN && (
              <SpinWheel 
                onComplete={() => handleTaskComplete('SPIN')}
                disabled={spinCooldown > 0 || stats.spinsUsed >= APP_CONSTANTS.DAILY_SPIN_LIMIT}
                cooldown={spinCooldown}
              />
            )}
            
            <div className="mt-8 text-center text-slate-400 text-sm">
               <p>Daily Limit: <span className="text-white font-bold">
                  {activeView === View.SCRATCH 
                    ? `${stats.scratchesUsed}/${APP_CONSTANTS.DAILY_SCRATCH_LIMIT}` 
                    : `${stats.spinsUsed}/${APP_CONSTANTS.DAILY_SPIN_LIMIT}`}
               </span></p>
               {currentActiveCooldown > 0 && <p className="text-yellow-500 mt-2 font-mono animate-pulse">Next turn in {Math.ceil(currentActiveCooldown/1000)}s</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === Tab.WALLET && (
        <div className="p-5 pb-24">
           <h2 className="text-2xl font-bold text-white mb-6">Wallet</h2>
           
           <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700 text-center mb-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Coins size={100} className="text-white"/>
             </div>
             <span className="text-slate-400 text-sm relative z-10">Current Balance</span>
             <div className="text-4xl font-black text-yellow-400 mt-2 flex justify-center items-center gap-2 relative z-10">
               <Coins className="w-8 h-8" /> {user.coins}
             </div>
             <span className="text-slate-500 text-xs block mt-2 relative z-10">Redeem your coins for Cash</span>
           </div>

           <h3 className="text-white font-bold mb-4">Withdraw Methods</h3>
           <div className="space-y-4">
             <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-white p-1 rounded">
                    <img src={LOGO_URLS.UPI} alt="UPI Logo" className="w-8 h-5 object-contain" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">BHIM UPI</h4>
                </div>
                <div className="grid gap-3">
                    {WITHDRAWAL_OPTIONS.filter(o => o.type === WITHDRAWAL_TYPES.UPI).map((opt) => (
                        <button 
                            key={opt.id}
                            onClick={() => handleOptionClick(opt)}
                            className="bg-slate-800 hover:bg-slate-750 p-3 rounded-xl border border-slate-700 flex justify-between items-center group transition-all active:scale-95"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-xl p-1.5 flex items-center justify-center overflow-hidden shrink-0">
                                    <img src={opt.icon} alt="UPI" className="w-full h-full object-contain" />
                                </div>
                                <div className="text-left">
                                    <p className="text-white font-bold text-sm">{opt.label}</p>
                                    <p className="text-yellow-500 text-xs font-mono">{opt.coins} Coins</p>
                                </div>
                            </div>
                            <div className="bg-slate-700 px-3 py-1 rounded text-xs text-white font-medium">Redeem</div>
                        </button>
                    ))}
                </div>
             </div>

             <div className="mt-6">
                <div className="flex items-center gap-2 mb-3">
                   <div className="bg-white p-1 rounded">
                     <img src={LOGO_URLS.PLAY} alt="Play Logo" className="w-6 h-6 object-contain" />
                   </div>
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Google Play</h4>
                </div>
                <div className="grid gap-3">
                    {WITHDRAWAL_OPTIONS.filter(o => o.type === WITHDRAWAL_TYPES.GIFT_CARD).map((opt) => (
                        <button 
                            key={opt.id}
                            onClick={() => handleOptionClick(opt)}
                            className="bg-slate-800 hover:bg-slate-750 p-3 rounded-xl border border-slate-700 flex justify-between items-center group transition-all active:scale-95"
                        >
                             <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-xl p-2 flex items-center justify-center overflow-hidden shrink-0">
                                    <img src={opt.icon} alt="Play Store" className="w-full h-full object-contain" />
                                </div>
                                <div className="text-left">
                                    <p className="text-white font-bold text-sm">{opt.label}</p>
                                    <p className="text-yellow-500 text-xs font-mono">{opt.coins} Coins</p>
                                </div>
                            </div>
                            <div className="bg-slate-700 px-3 py-1 rounded text-xs text-white font-medium">Redeem</div>
                        </button>
                    ))}
                </div>
             </div>
           </div>
        </div>
      )}

      {activeTab === Tab.HISTORY && (
        <div className="p-5 pb-24">
           <h2 className="text-2xl font-bold text-white mb-6">Transactions</h2>
           <div className="space-y-3">
             {storage.getHistory().map((tx) => (
               <div key={tx.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${tx.type === 'WITHDRAW' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                      {tx.type === 'WITHDRAW' ? <Coins className="w-4 h-4 rotate-180" /> : <Coins className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{tx.title}</p>
                      <p className="text-slate-500 text-[10px]">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                      {tx.details && <p className="text-xs text-slate-400 mt-0.5">{tx.details}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold block ${tx.type === 'WITHDRAW' ? 'text-red-400' : 'text-green-400'}`}>
                        {tx.type === 'WITHDRAW' ? '-' : '+'}{tx.amount}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${tx.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500' : tx.status === 'FAILED' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                        {tx.status}
                    </span>
                  </div>
               </div>
             ))}
             {storage.getHistory().length === 0 && (
               <div className="text-center text-slate-500 mt-10">No transactions yet.</div>
             )}
           </div>
        </div>
      )}

      {activeTab === Tab.PROFILE && (
        <div className="p-5 pb-24">
           <div className="text-center mb-8 mt-4">
             <div className="w-20 h-20 bg-slate-800 border-2 border-slate-700 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl shadow-xl">
               <span className="text-2xl font-bold text-slate-400">{user.email.charAt(0).toUpperCase()}</span>
             </div>
             <h2 className="text-white font-bold truncate px-4">{user.email}</h2>
             <p className="text-slate-500 text-xs font-mono mt-1">ID: {user.deviceId}</p>
           </div>

           <div className="space-y-3">
              <div className="bg-slate-800 p-4 rounded-xl flex justify-between border border-slate-700 mb-6">
                <span className="text-slate-300 text-sm">Coins Earned Today</span>
                <span className="text-yellow-400 font-bold">{stats.coinsEarnedToday}</span>
              </div>
              
              <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider ml-1">Info & Support</h4>
              
              <button onClick={() => setInfoModal({title: 'Terms & Conditions', content: LEGAL_CONTENT.TERMS})} className="w-full bg-slate-800 p-4 rounded-xl flex items-center justify-between text-slate-200 text-sm hover:bg-slate-750">
                 <div className="flex items-center gap-3"><FileText size={18} className="text-slate-400"/> Terms & Conditions</div>
                 <ChevronRight size={16} className="text-slate-500" />
              </button>

              <button onClick={() => setInfoModal({title: 'Privacy Policy', content: LEGAL_CONTENT.PRIVACY})} className="w-full bg-slate-800 p-4 rounded-xl flex items-center justify-between text-slate-200 text-sm hover:bg-slate-750">
                 <div className="flex items-center gap-3"><Shield size={18} className="text-slate-400"/> Privacy Policy</div>
                 <ChevronRight size={16} className="text-slate-500" />
              </button>

              <button onClick={() => setInfoModal({title: 'FAQs', content: LEGAL_CONTENT.FAQ})} className="w-full bg-slate-800 p-4 rounded-xl flex items-center justify-between text-slate-200 text-sm hover:bg-slate-750">
                 <div className="flex items-center gap-3"><HelpCircle size={18} className="text-slate-400"/> FAQs</div>
                 <ChevronRight size={16} className="text-slate-500" />
              </button>

              <a href={APP_CONSTANTS.TELEGRAM_LINK} target="_blank" rel="noreferrer" className="w-full bg-[#229ED9]/10 border border-[#229ED9]/30 p-4 rounded-xl flex items-center justify-between text-[#229ED9] text-sm hover:bg-[#229ED9]/20 mt-4">
                 <div className="flex items-center gap-3"><Send size={18} /> Contact Support (Telegram)</div>
                 <ChevronRight size={16} />
              </a>

              <a href={`mailto:${APP_CONSTANTS.EMAIL_SUPPORT}`} className="w-full bg-slate-800 p-4 rounded-xl flex items-center justify-between text-slate-200 text-sm hover:bg-slate-750">
                 <div className="flex items-center gap-3"><Mail size={18} className="text-slate-400"/> Email Support</div>
                 <ChevronRight size={16} className="text-slate-500" />
              </a>

              <button onClick={handleLogout} className="w-full text-red-500 p-4 rounded-xl flex items-center justify-center gap-2 mt-4 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all">
                <LogOut size={18} /> Logout
              </button>
           </div>
        </div>
      )}

      <AnimatePresence>
        {withdrawalStep === 'INSUFFICIENT' && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 w-full max-w-xs p-6 rounded-2xl border border-red-500/30 text-center"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Not Enough Coins</h3>
              <p className="text-slate-400 text-sm mb-6">
                You need <span className="text-yellow-400 font-bold">{selectedOption?.coins} coins</span> to redeem this reward.
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setWithdrawalStep('NONE');
                    setSelectedOption(null);
                    setActiveTab(Tab.HOME);
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold shadow-lg animate-pulse"
                >
                  Earn More Coins
                </button>
                <button 
                  onClick={() => {
                    setWithdrawalStep('NONE');
                    setSelectedOption(null);
                  }}
                  className="w-full py-3 rounded-xl bg-slate-800 text-slate-400 font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {withdrawalStep === 'INPUT' && selectedOption && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-slate-900 w-full max-w-xs p-6 rounded-2xl border border-slate-700"
            >
              <h3 className="text-xl font-bold text-white mb-2">Redeem {selectedOption.label}</h3>
              <p className="text-slate-400 text-xs mb-4">Enter your details correctly. We are not responsible for wrong inputs.</p>
              
              <div className="mb-6">
                <label className="text-slate-400 text-xs block mb-1 font-bold uppercase tracking-wider">
                   Payment Address
                </label>
                <input 
                  type="text" 
                  value={withdrawalInput}
                  placeholder="Enter Payment Address (UPI/Email)"
                  className="w-full bg-slate-800 text-white p-3 rounded-lg border border-slate-700 focus:border-yellow-500 outline-none"
                  onChange={(e) => setWithdrawalInput(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => { setWithdrawalStep('NONE'); setSelectedOption(null); }}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleInputNext}
                  className="flex-1 py-3 rounded-xl bg-yellow-500 text-black font-bold"
                >
                  Next
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {withdrawalStep === 'CONFIRM' && selectedOption && (
           <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-slate-900 w-full max-w-xs p-6 rounded-2xl border border-yellow-500/50 text-center"
            >
              <h3 className="text-lg font-bold text-white mb-4">Confirm Details</h3>
              
              <div className="bg-slate-800 p-3 rounded-lg mb-4 text-left">
                <p className="text-slate-500 text-xs">Withdraw Method</p>
                <p className="text-white font-medium">{selectedOption.label}</p>
                <div className="h-px bg-slate-700 my-2"/>
                <p className="text-slate-500 text-xs">Payment Address</p>
                <p className="text-yellow-400 font-mono font-bold break-all">{withdrawalInput}</p>
              </div>

              <p className="text-slate-400 text-xs mb-6">
                Is this information correct? Coins will be deducted immediately.
              </p>

              <div className="flex gap-3">
                <button 
                  onClick={() => setWithdrawalStep('INPUT')}
                  className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold flex items-center justify-center gap-2"
                >
                   <Eye size={14} /> Check
                </button>
                <button 
                  onClick={() => setShowAd(true)}
                  className="flex-1 py-3 rounded-xl bg-yellow-500 text-black font-bold flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {infoModal && (
           <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
             <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-slate-900 w-full max-w-md p-6 rounded-2xl border border-slate-700 max-h-[80vh] overflow-y-auto no-scrollbar"
             >
                <h3 className="text-xl font-bold text-white mb-4 sticky top-0 bg-slate-900 py-2">{infoModal.title}</h3>
                <div className="text-slate-300 text-sm whitespace-pre-line leading-relaxed pb-4">
                    {infoModal.content}
                </div>
                <button 
                  onClick={() => setInfoModal(null)}
                  className="w-full mt-2 bg-slate-800 py-3 rounded-xl text-white font-bold sticky bottom-0 shadow-xl border-t border-slate-700"
                >
                  Close
                </button>
             </motion.div>
           </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default App;