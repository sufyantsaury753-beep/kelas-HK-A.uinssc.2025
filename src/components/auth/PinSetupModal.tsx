'use client';

import React, { useState } from 'react';
import { Lock, Check, Eye, EyeOff, ShieldAlert, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PinSetupModalProps {
  nim: string;
  studentName: string;
  onSuccess: (pin: string) => void;
  onCancel?: () => void;
}

export default function PinSetupModal({
  nim,
  studentName,
  onSuccess,
  onCancel,
}: PinSetupModalProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(pin)) {
      setError('PIN harus terdiri dari tepat 6 digit angka.');
      return;
    }

    if (pin !== confirmPin) {
      setError('Konfirmasi PIN tidak cocok dengan PIN yang dibuat.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#9d5f2f', '#d97706', '#10b981'],
        });
      } catch {}
      setLoading(false);
      onSuccess(pin);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#9d5f2f] to-[#753e1f] p-6 text-white text-center relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner border border-white/20">
            <Lock className="w-7 h-7 text-amber-300" />
          </div>
          <h3 className="text-lg font-bold">Aktivasi PIN Keamanan</h3>
          <p className="text-xs text-amber-100/90 mt-1">
            Selamat datang, <span className="font-semibold text-white">{studentName}</span>
          </p>
          <p className="text-[11px] text-amber-200/80 font-mono">NIM: {nim}</p>
        </div>

        {/* Body */}
        <form onSubmit={handleSavePin} className="p-6 space-y-4">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2.5">
            <Sparkles className="w-4 h-4 text-[#9d5f2f] flex-shrink-0 mt-0.5" />
            <p>
              Ini adalah login perdana Anda. Buat <strong>6-digit PIN</strong> yang mudah diingat.
              PIN ini akan digunakan setiap kali Anda login dan melakukan presensi kelas.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Inputs */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Buat 6-Digit PIN Baru
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 123456"
                className="w-full px-4 py-2.5 text-center text-lg tracking-[0.4em] font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9d5f2f] focus:border-transparent bg-stone-50/50"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Konfirmasi 6-Digit PIN
            </label>
            <input
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Ulangi PIN di atas"
              className="w-full px-4 py-2.5 text-center text-lg tracking-[0.4em] font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#9d5f2f] focus:border-transparent bg-stone-50/50"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-1/3 py-2.5 border border-stone-300 text-stone-700 hover:bg-stone-100 rounded-xl text-xs font-semibold transition-colors"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={loading || pin.length !== 6 || confirmPin.length !== 6}
              className="flex-1 py-2.5 bg-[#9d5f2f] hover:bg-[#864d23] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-[#9d5f2f]/20 transition-all flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : 'Simpan & Aktifkan PIN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
