import React from 'react';
import { AppRoute, NavItem } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: AppRoute.HOME,
    label: '资产全景',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
    ),
  },
  {
    id: AppRoute.PLAN,
    label: '目标规划',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
    ),
  },
];

export const Layout: React.FC<LayoutProps> = ({ children, activeRoute, onNavigate }) => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Main Content Area - Native Scroll */}
      <main className="flex-1 w-full max-w-md mx-auto">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                  isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};