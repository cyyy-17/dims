'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col items-center justify-center p-6 text-[#141414]">
      <div className="w-full max-w-md bg-white border border-[#E4E4E0] rounded-2xl p-8 shadow-sm text-center">
        {/* Warning Icon Badge */}
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#DC2626]">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <span className="text-[11px] font-semibold text-[#8C8C8A] uppercase tracking-wider font-mono">
          System Notice · ASR DIMS
        </span>
        <h1 className="text-xl font-bold text-[#141414] mt-1 mb-2">
          An Unexpected Error Occurred
        </h1>
        <p className="text-xs text-[#555552] leading-relaxed mb-6">
          The application encountered an unhandled issue. Your local data remains safely cached. You can retry the operation or return to the overview.
        </p>

        {error?.digest && (
          <div className="mb-6 p-2.5 rounded-lg bg-[#F8F8F6] border border-[#E4E4E0] text-[11px] font-mono text-[#8C8C8A] break-all">
            Digest: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>

      <p className="mt-8 text-[11px] text-[#8C8C8A]">
        ASEAN Student Residences (ASR) · First Asia Institute of Technology and Humanities
      </p>
    </div>
  );
}
