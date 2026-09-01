import React from 'react';
import { AttendanceStatus, UserRole } from '@/lib/types';
import { CheckCircle2, AlertCircle, Clock, XCircle, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  switch (status) {
    case 'HADIR':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Hadir</span>
        </span>
      );
    case 'IZIN':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>Izin</span>
        </span>
      );
    case 'SAKIT':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Sakit</span>
        </span>
      );
    case 'ALPA':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Alpa</span>
        </span>
      );
    default:
      return null;
  }
}

export function RoleBadge({ role }: { role: UserRole }) {
  switch (role) {
    case 'ADMIN':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold bg-stone-900 text-amber-400 border border-stone-700">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Administrator</span>
        </span>
      );
    case 'PJ':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold bg-[#9d5f2f] text-white border border-[#804b20]">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Penanggung Jawab (PJ)</span>
        </span>
      );
    case 'MAHASISWA':
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-300">
          <UserCheck className="w-3.5 h-3.5 text-[#9d5f2f]" />
          <span>Mahasiswa HK A</span>
        </span>
      );
    default:
      return null;
  }
}
