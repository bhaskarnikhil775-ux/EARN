import React from 'react';
import { Home, Wallet, History, User } from 'lucide-react';
import { Tab } from '../types';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: Tab.HOME, icon: Home, label: 'Home' },
    { id: Tab.WALLET, icon: Wallet, label: 'Wallet' },
    { id: Tab.HISTORY, icon: History, label: 'History' },
    { id: Tab.PROFILE, icon: User, label: 'Profile' },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 h-16 flex items-center justify-around px-2 z-40">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center w-16 transition-all duration-300 ${
              isActive ? 'text-yellow-400 -translate-y-1' : 'text-slate-500'
            }`}
          >
            <div className={`p-1 rounded-full transition-all ${isActive ? 'bg-yellow-400/10' : ''}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
            </div>
            <span className={`text-[10px] mt-1 font-medium ${isActive ? 'opacity-100' : 'opacity-70'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};