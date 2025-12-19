import { Button } from '@/components/common/Button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-blue-400 mb-2">404</h1>
          <h2 className="text-2xl font-bold text-white mb-2">Page not found</h2>
          <p className="text-neutral-400 text-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/dashboard">
            <Button fullWidth>
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary" fullWidth>
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
