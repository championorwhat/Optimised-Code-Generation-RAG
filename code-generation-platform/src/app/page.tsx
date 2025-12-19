'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard on mount
    router.push('/dashboard');
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center animate-pulse">
            <div className="text-white font-bold text-xl">CG</div>
          </div>
        </div>
        <p className="text-neutral-400 text-sm">Loading CodeGen Platform...</p>
      </div>
    </div>
  );
}