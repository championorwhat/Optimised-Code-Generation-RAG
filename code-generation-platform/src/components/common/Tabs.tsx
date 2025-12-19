/* src/components/common/Tabs.tsx */

import React, { useState } from 'react';
import clsx from 'clsx';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'bordered';
}

export function Tabs({
  tabs,
  defaultTab,
  onTabChange,
  variant = 'underline',
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const variantStyles = {
    underline: {
      container: 'border-b border-neutral-700 gap-4',
      tab: 'pb-4 border-b-2 border-transparent hover:border-neutral-600 transition-colors data-[active=true]:border-blue-500 data-[active=true]:text-blue-400',
      inactiveTab: 'text-neutral-400',
    },
    pills: {
      container: 'gap-2 p-1 bg-neutral-900 rounded-lg border border-neutral-700',
      tab: 'px-4 py-2 rounded transition-colors data-[active=true]:bg-neutral-800 data-[active=true]:border data-[active=true]:border-neutral-600',
      inactiveTab: 'text-neutral-400 hover:text-neutral-300',
    },
    bordered: {
      container: 'gap-2 p-1 bg-neutral-900 rounded-lg border border-neutral-700',
      tab: 'px-4 py-2 rounded transition-colors data-[active=true]:bg-blue-500 data-[active=true]:text-white',
      inactiveTab: 'text-neutral-400 hover:text-neutral-300',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div>
      <div className={clsx('flex', styles.container)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            disabled={tab.disabled}
            data-active={activeTab === tab.id}
            className={clsx(
              styles.tab,
              activeTab === tab.id ? 'text-white' : styles.inactiveTab,
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-2">
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-500 text-white rounded-full">
                  {tab.badge}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}
