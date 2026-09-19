import React from 'react';
import Link from 'next/link';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col items-center justify-center p-6 text-[#141414]">
      <div className="w-full max-w-md bg-white border border-[#E4E4E0] rounded-2xl p-8 shadow-sm text-center">
        {/* 404 Compass Icon Badge */}
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4F46E5]">
          <Compass className="w-7 h-7" />
        </div>

        <span className="text-[11px] font-semibold text-[#4F46E5] uppercase tracking-wider font-mono">
          404 · Page Not Found
        </span>
        <h1 className="text-xl font-bold text-[#141414] mt-1 mb-2">
          Requested Record or View Missing
        </h1>
        <p className="text-xs text-[#555552] leading-relaxed mb-6">
          The view, room profile, or inventory record you navigated to does not exist or may have been relocated.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
          <Link href="/dormitory/rooms" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Rooms & Beds</span>
            </Button>
          </Link>
        </div>
      </div>

      <p className="mt-8 text-[11px] text-[#8C8C8A]">
        DIMS · ASEAN Student Residences (ASR) · FAITH Colleges
      </p>
    </div>
  );
}
