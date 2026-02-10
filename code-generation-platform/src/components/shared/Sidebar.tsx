/* src/components/shared/Sidebar.tsx */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  Menu,
  X,
  LayoutDashboard,
  Plus,
  Cpu,
  CheckSquare,
  History,
  Settings,
  Zap,
} from 'lucide-react';

const MENU_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  { 
    id: 'egrr-pipeline', 
    label: 'EGRR Pipeline', 
    href: '/egrr', 
    icon: Zap,
    highlight: true,
  },
  { id: 'new-run', label: 'New Run', href: '/runs/new', icon: Plus },
  { id: 'models', label: 'Models', href: '/models', icon: Cpu },
  {
    id: 'tests',
    label: 'Test Suites',
    href: '/test-suites',
    icon: CheckSquare,
  },
  { id: 'history', label: 'Run History', href: '/runs', icon: History },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden fixed top-4 left-4 z-50 p-2 bg-neutral-800 border border-neutral-700 rounded-lg md:hidden"
      >
        {collapsed ? <Menu size={20} /> : <X size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen bg-neutral-900 border-r border-neutral-800 transition-all duration-300 z-40 hidden md:flex md:flex-col',
          !collapsed ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-neutral-800">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex-center font-bold text-white text-sm">
              CG
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-white">CodeGen</span>
            )}
          </Link>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href) && 
              // Special handling to not match /runs/egrr when on /runs
              !(item.href === '/runs' && pathname.includes('/runs/'));
            const isHighlight = 'highlight' in item && item.highlight;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                  isActive
                    ? 'bg-blue-500 text-white'
                    : isHighlight && !isActive
                    ? 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} className={clsx("shrink-0", isHighlight && !isActive && "text-yellow-400")} />
                {!collapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
                {!collapsed && isHighlight && !isActive && (
                  <span className="ml-auto text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                    NEW
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setCollapsed(false)}
        />
      )}
    </>
  );
}
