'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js Client-Side Error Boundary caught:', error);
  }, [error]);

  const handleResetCacheAndReload = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hk_a_app_state_v1');
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-[#9d5f2f] mx-auto flex items-center justify-center border border-amber-200 shadow-inner">
          <AlertTriangle className="w-8 h-8 text-[#9d5f2f]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-black text-stone-900">
            Terjadi Pembaruan Data Sistem
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed">
            Perangkat Anda mendeteksi perubahan struktur data atau cache lama. Silakan klik tombol di bawah untuk menyegarkan tampilan.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-500 font-mono text-left overflow-x-auto max-h-24">
            {error.message}
          </div>
        )}

        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => reset()}
            className="w-full py-3 bg-[#9d5f2f] hover:bg-[#864d23] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#9d5f2f]/20 transition-all flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Coba Muat Ulang</span>
          </button>

          <button
            onClick={handleResetCacheAndReload}
            className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-[#8c4e24] border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Segarkan & Sinkron Ulang Cache</span>
          </button>

          <button
            onClick={() => (window.location.href = '/')}
            className="w-full py-2 text-stone-500 hover:text-stone-800 text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Utama</span>
          </button>
        </div>
      </div>
    </div>
  );
}
