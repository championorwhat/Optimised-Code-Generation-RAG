/* app/dashboard/page.tsx */

'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/shared/Sidebar';
import { TopBar } from '@/components/shared/TopBar';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';
import { dashboardAPI, DashboardKPI } from '@/services/dashboard';
import { BarChart3, TrendingUp, Zap, Award } from 'lucide-react';
import Link from 'next/link';

const ICON_MAP: Record<string, React.ReactNode> = {
  'Pass Rate': <Award size={24} className="text-green-400" />,
  'Popular Model': <TrendingUp size={24} className="text-blue-400" />,
  'Monthly Cost': <Zap size={24} className="text-yellow-400" />,
  'Tokens Used': <BarChart3 size={24} className="text-purple-400" />,
};

function KPICard({ kpi }: { kpi: DashboardKPI }) {
  return (
    <Card variant="elevated" className="col-span-1">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-neutral-400 mb-2">{kpi.label}</p>
          <p className="text-3xl font-bold text-white">
            {kpi.value}
            {kpi.unit && <span className="text-lg ml-1">{kpi.unit}</span>}
          </p>
        </div>
        {ICON_MAP[kpi.label]}
      </div>

      {kpi.trend && (
        <div
          className={`text-xs font-semibold ${
            kpi.trend === 'up'
              ? 'text-green-400'
              : kpi.trend === 'down'
              ? 'text-red-400'
              : 'text-neutral-400'
          }`}
        >
          {kpi.trend === 'up'
            ? '↑ Up 12%'
            : kpi.trend === 'down'
            ? '↓ Down 5%'
            : '→ Stable'}
        </div>
      )}
    </Card>
  );
}

export default function DashboardPage() {
  const [kpis, setKPIs] = useState<DashboardKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardAPI.getKPIs();
        setKPIs(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen bg-neutral-900">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col">
        <TopBar title="Dashboard" showSearch />

        <main className="flex-1 p-6 overflow-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back!
            </h1>
            <p className="text-neutral-400">
              Compare and refine code from multiple AI models
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="rectangle" height={150} />
              ))
            ) : error ? (
              <div className="col-span-full p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg">
                {error}
              </div>
            ) : (
              kpis.map((kpi) => <KPICard key={kpi.label} kpi={kpi} />)
            )}
          </div>

          {/* Recent Runs */}
          <Card title="Recent Runs" subtitle="Your latest code generation runs">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      Run #{100 + i}
                    </p>
                    <p className="text-xs text-neutral-400">API endpoint generator</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-green-400">✓ Done</p>
                    <p className="text-xs text-neutral-400">45s ago</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/runs" className="block mt-4">
              <Button variant="outline" fullWidth>
                View All Runs
              </Button>
            </Link>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <Link href="/runs/new">
              <Button fullWidth size="lg" variant="primary">
                ✨ Start New Run
              </Button>
            </Link>
            <Link href="/models">
              <Button fullWidth size="lg" variant="secondary">
                ⚙️ Manage Models
              </Button>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
