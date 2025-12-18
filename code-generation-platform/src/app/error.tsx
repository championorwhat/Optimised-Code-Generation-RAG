'use client';

import { useEffect } from 'react';
import { Button } from '@/components/common/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-red-400 mb-2">⚠️</h1>
          <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-neutral-400 text-sm">{error.message}</p>
        </div>

        <div className="space-y-3">
          <Button onClick={() => reset()} fullWidth>
            Try again
          </Button>
          <a href="/dashboard" className="block">
            <Button variant="secondary" fullWidth>
              Go to Dashboard
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
