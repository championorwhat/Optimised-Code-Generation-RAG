/* src/components/shared/TopBar.tsx */

'use client';

import { Search, Bell, User } from 'lucide-react';
import Link from 'next/link';

interface TopBarProps {
  title?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

export function TopBar({ title = 'CodeGen Platform', showSearch }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-neutral-900 border-b border-neutral-800 backdrop-blur-sm">
      <div className="flex items-center justify-between h-16 px-6 md:ml-64">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1">
          <h1 className="text-lg font-semibold text-white">{title}</h1>

          {showSearch && (
            <div className="hidden sm:flex items-center gap-2 flex-1 max-w-xs ml-auto">
              <Search size={18} className="text-neutral-500" />
              <input
                type="text"
                placeholder="Search..."
                className="input-base flex-1"
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 ml-auto">
          <button className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <Bell size={20} className="text-neutral-400" />
          </button>

          <button className="p-2 hover:bg-neutral-800 rounded-lg transition-colors">
            <User size={20} className="text-neutral-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
