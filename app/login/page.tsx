'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid staff credentials.');
        return;
      }

      // Session cookie is set HttpOnly by the server route.
      // Store local display properties for client UI convenience
      localStorage.setItem('dims_authenticated', 'true');
      localStorage.setItem('dims_staff_email', email.trim());

      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred during login'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* LEFT PANEL: Branding & Feature Overview (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-[#4F46E5] via-[#6366F1] to-[#818CF8] flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-28 translate-x-28 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/5 translate-y-36 -translate-x-36 pointer-events-none" />

        {/* Top: Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">DIMS</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono uppercase tracking-wider">
              ASR
            </span>
          </div>
        </div>

        {/* Center: System Title & Features */}
        <div className="relative z-10 space-y-6 my-auto py-8">
          <div className="space-y-3">
            <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">
              Institutional Operations Platform
            </span>
            <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
              Dormitory &amp;<br />Inventory<br />Management
            </h2>
            <p className="text-white/80 text-sm leading-relaxed max-w-sm">
              Unified control center for resident management, physical assets custody, and campus communications at ASR Field Campus.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-2.5 pt-2">
            {[
              'Real-time bed slot occupancy tracking',
              'Inventory custody & asset ledger tracking',
              'Integrated email announcement dispatch',
              'Immutable audit trail and reporting',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-white/90 text-xs">
                <CheckCircle2 className="w-4 h-4 text-white/70 shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Institution */}
        <div className="relative z-10 border-t border-white/10 pt-4">
          <p className="text-white/60 text-xs">
            First Asia Institute of Technology and Humanities
          </p>
          <p className="text-white/40 text-[11px] mt-0.5">
            ASEAN Student Residences · All Rights Reserved
          </p>
        </div>
      </div>

      {/* RIGHT PANEL: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 bg-[#F8F8F6]">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Brand Card */}
          <div className="bg-white border border-[#E4E4E0] rounded-2xl p-8 shadow-xs space-y-6">
            {/* Logo & Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-xs font-semibold tracking-wide uppercase">
                <Shield className="w-3.5 h-3.5" />
                <span>ASEAN Student Residences</span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-[#141414]">
                DIMS Staff Portal
              </h1>
              <p className="text-xs text-[#8C8C8A] max-w-xs mx-auto">
                Dormitory &amp; Inventory Management System · ASR School Field Campus
              </p>
            </div>

            {/* Quick Notice */}
            <div className="p-3 bg-[#F8F8F6] border border-[#E4E4E0] rounded-xl flex items-start gap-2.5 text-xs text-[#2C2C2A]">
              <CheckCircle2 className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-[#141414]">Single Shared Staff Login</p>
                <p className="text-[#8C8C8A] mt-0.5">
                  All authorized ASR staff representatives sign in with official office credentials.
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl flex items-center gap-2 text-xs text-[#DC2626]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#141414]">
                  Staff Office Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C8C8A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aseanresidences@firstasia.edu.ph"
                    className="input-minimal pl-10! pr-3! transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-[#141414]">
                    Office Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C8C8A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="input-minimal pl-10! pr-10! transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C8C8A] hover:text-[#141414] transition-colors p-1 flex items-center justify-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-lg shadow-xs transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <span>Sign In to DIMS</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer info */}
          <div className="mt-6 text-center space-y-1 text-xs text-[#8C8C8A]">
            <p>DIMS · First Asia Institute of Technology and Humanities</p>
            <p className="text-[11px]">Protected under ASR Campus Data Privacy Policies</p>
          </div>
        </div>
      </div>
    </div>
  );
}
