'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('aseanresidences@firstasia.edu.ph');
  const [password, setPassword] = useState('ASRStaff2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = getSupabaseClient();
      let success = false;

      // Online Supabase Auth attempt
      if (navigator.onLine && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (!error && data?.session) {
          success = true;
        } else if (error) {
          // If Supabase returns invalid login credentials
          if (error.message.toLowerCase().includes('invalid login credentials')) {
            // Check fallback for offline/local staff verification
            if (email.trim() === 'aseanresidences@firstasia.edu.ph' && password === 'ASRStaff2026!') {
              success = true;
            } else {
              setErrorMessage('Invalid staff email or password. Please verify office credentials.');
              setIsLoading(false);
              return;
            }
          } else {
            // Network or configuration error: allow verified office credential fallback
            if (email.trim() === 'aseanresidences@firstasia.edu.ph' && password === 'ASRStaff2026!') {
              success = true;
            } else {
              setErrorMessage(error.message);
              setIsLoading(false);
              return;
            }
          }
        }
      } else {
        // Offline login verification for campus standalone use
        if (email.trim() === 'aseanresidences@firstasia.edu.ph' && password === 'ASRStaff2026!') {
          success = true;
        } else {
          setErrorMessage('Offline mode active. Use official ASR office credentials.');
          setIsLoading(false);
          return;
        }
      }

      if (success) {
        // Set persistent session cookie (7 days) for proxy/middleware route protection
        document.cookie = 'dims_staff_session=1; Path=/; max-age=604800; SameSite=Lax';
        localStorage.setItem('dims_authenticated', 'true');
        localStorage.setItem('dims_staff_email', email.trim());
        localStorage.setItem('dims_staff_name', 'Maria Joy Clemente');

        router.push('/');
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDefaultCredentials = () => {
    setEmail('aseanresidences@firstasia.edu.ph');
    setPassword('ASRStaff2026!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Container */}
      <div className="w-full max-w-md">
        {/* Brand Card */}
        <div className="bg-white border border-[#E4E4E0] rounded-2xl p-8 shadow-sm space-y-6">
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
              Dormitory & Inventory Management System · ASR School Field Campus
            </p>
          </div>

          {/* Quick Notice */}
          <div className="p-3 bg-[#F8F8F6] border border-[#E4E4E0] rounded-xl flex items-start gap-2.5 text-xs text-[#2C2C2A]">
            <CheckCircle2 className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-[#141414]">Single Shared Staff Login</p>
              <p className="text-[#8C8C8A] mt-0.5">
                All authorized ASR staff representatives sign in with the official office credentials.
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
                  className="input-minimal !pl-10 !pr-3 transition-all"
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
                  className="input-minimal !pl-10 !pr-10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C8C8A] hover:text-[#141414] transition-colors p-1 flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-lg shadow-sm transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
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

          {/* Quick-fill button */}
          <div className="pt-2 border-t border-[#E4E4E0] text-center">
            <button
              type="button"
              onClick={fillDefaultCredentials}
              className="text-xs text-[#4F46E5] hover:text-[#4338CA] font-medium transition-colors cursor-pointer"
            >
              Autofill Staff Office Account
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center space-y-1 text-xs text-[#8C8C8A]">
          <p>DIMS · First Asia Institute of Technology and Humanities</p>
          <p className="text-[11px]">Protected under ASR Campus Data Privacy Policies</p>
        </div>
      </div>
    </div>
  );
}
