import React from 'react';
import { Navigation } from './Navbar';
import { Tab } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isAuth: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, isAuth }) => {
  return (
    <div className="bg-gray-900 min-h-screen flex justify-center">
      <div className="w-full max-w-[420px] bg-slate-950 min-h-screen relative shadow-2xl flex flex-col border-x border-slate-800">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-20 relative">
          {children}
        </main>

        {/* Bottom Navigation - Only show if authenticated */}
        {isAuth && (
          <Navigation activeTab={activeTab} onTabChange={onTabChange} />
        )}
      </div>
    </div>
  );
};