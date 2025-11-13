'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Orders page error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="mt-2 text-muted-foreground">
          {error.message || 'Failed to load orders from ERP system'}
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
