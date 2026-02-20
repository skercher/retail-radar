'use client';

import { Map, List, Heart, Settings } from 'lucide-react';
import { ViewMode } from '@/types/property';

interface BottomNavProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  savedCount?: number;
}

export function BottomNav({ activeView, onViewChange, savedCount = 0 }: BottomNavProps) {
  const navItems = [
    { id: 'list' as ViewMode, icon: List, label: 'List' },
    { id: 'map' as ViewMode, icon: Map, label: 'Map' },
    { id: 'split' as ViewMode, icon: Heart, label: 'Saved', badge: savedCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-2 pb-safe z-50 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] px-3 py-2 rounded-xl transition-colors ${
                isActive
                  ? 'text-blue-500 bg-blue-500/10'
                  : 'text-zinc-400 active:text-zinc-200 active:bg-zinc-800'
              }`}
            >
              <div className="relative">
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge ? (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-xs mt-1 ${isActive ? 'font-medium' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
