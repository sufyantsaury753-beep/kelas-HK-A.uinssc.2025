import React from 'react';
import Image from 'next/image';
import { MonitorPlay, Smartphone, CheckCircle, UploadCloud, Users, ArrowRight } from 'lucide-react';

export default function PosterPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden flex flex-col items-center justify-center p-8 font-sans selection:bg-amber-500/30">
      
      {/* Background Gradient & Glow Effects */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#b45309] rounded-full mix-blend-screen filter blur-[150px] opacity-20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#9333ea] rounded-full mix-blend-screen filter blur-[150px] opacity-20"></div>
        <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] bg-[#fbbf24] rounded-full mix-blend-screen filter blur-[120px] opacity-10"></div>
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="z-10 w-full max-w-6xl flex flex-col items-center mt-10">
        
        {/* Title Section */}
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-amber-500 tracking-tighter drop-shadow-2xl">
            PORTAL KELAS HK A
          </h1>
          <p className="text-2xl text-amber-200/80 font-medium tracking-wide">
            Sistem Presensi Digital & Repositori Akademik
          </p>
        </div>

        {/* Mockups Container */}
        <div className="relative w-full h-[650px] flex items-center justify-center mt-10">
          
          {/* Laptop Mockup (Center/Right) */}
          <div className="absolute right-10 top-0 w-[750px] transform hover:scale-105 transition-transform duration-700 z-10">
            {/* Glowing border effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-purple-600 rounded-3xl blur opacity-30"></div>
            <div className="relative bg-stone-900 rounded-2xl p-2 shadow-2xl border border-stone-800">
              <div className="bg-black rounded-xl overflow-hidden border border-stone-800 shadow-inner relative aspect-[16/10]">
                {/* Navbar mockup */}
                <div className="w-full h-6 bg-stone-950 border-b border-stone-800 flex items-center px-3 space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                  <div className="ml-4 bg-stone-900 border border-stone-700 text-stone-500 text-[10px] px-2 py-0.5 rounded-md flex-1 text-center">kelas-hk-a-uinssc-2025.vercel.app</div>
                  <div className="w-8"></div>
                </div>
                {/* Screenshot PJ Dashboard */}
                <img src="/images/poster/pj.png" alt="PJ Dashboard" className="w-full h-full object-cover object-top opacity-90 hover:opacity-100 transition-opacity" />
              </div>
              {/* Laptop Base */}
              <div className="w-full h-5 bg-gradient-to-b from-stone-800 to-stone-950 rounded-b-3xl mt-1 mx-auto max-w-[95%] shadow-xl">
                 <div className="w-32 h-1.5 bg-stone-700 rounded-b-lg mx-auto"></div>
              </div>
            </div>
            
            {/* Callout Box 1 */}
            <div className="absolute -right-16 top-1/4 z-20 animate-bounce" style={{animationDuration: '3s'}}>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-xl flex items-center space-x-3 text-white">
                <div className="bg-amber-500 p-2 rounded-lg"><MonitorPlay className="w-5 h-5 text-white" /></div>
                <div>
                  <p className="font-bold text-sm leading-tight">Dashboard Admin & PJ</p>
                  <p className="text-[10px] text-amber-200">Kelola absensi & rekap Excel</p>
                </div>
              </div>
            </div>
          </div>

          {/* Phone Mockup (Left) */}
          <div className="absolute left-10 -bottom-10 w-[300px] transform hover:-translate-y-4 transition-transform duration-700 z-30">
             {/* Glowing border effect */}
             <div className="absolute -inset-1 bg-gradient-to-b from-purple-500 to-amber-500 rounded-[3.5rem] blur opacity-40"></div>
            <div className="relative bg-stone-900 rounded-[3.5rem] p-3 shadow-2xl border border-stone-700">
              <div className="bg-black rounded-[2.8rem] overflow-hidden border border-stone-800 relative aspect-[9/19]">
                {/* Phone Notch */}
                <div className="absolute top-0 inset-x-0 h-7 bg-transparent flex justify-center z-30">
                  <div className="w-28 h-6 bg-stone-900 rounded-b-2xl flex items-center justify-center space-x-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-stone-700"></div>
                     <div className="w-12 h-1.5 rounded-full bg-stone-800"></div>
                  </div>
                </div>
                {/* Screenshot Mahasiswa */}
                <img src="/images/poster/mahasiswa.png" alt="Mahasiswa Dashboard" className="w-full h-full object-cover object-top" />
              </div>
            </div>

            {/* Callout Box 2 */}
            <div className="absolute -left-12 bottom-32 z-30 animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}>
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-2xl shadow-xl flex items-center space-x-3 text-white">
                <div className="bg-purple-500 p-2 rounded-lg"><Smartphone className="w-5 h-5 text-white" /></div>
                <div>
                  <p className="font-bold text-sm leading-tight">Akses Mobile</p>
                  <p className="text-[10px] text-purple-200">Presensi via Smartphone</p>
                </div>
              </div>
            </div>
          </div>

          {/* Callout Box 3 (Center Bottom) */}
          <div className="absolute left-1/3 bottom-10 z-20">
             <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/10 backdrop-blur-md border border-amber-500/30 p-5 rounded-3xl shadow-2xl flex items-center space-x-4">
                <div className="text-center">
                   <p className="text-stone-300 text-xs mb-1 uppercase tracking-widest">Akses Mulai Dari</p>
                   <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-amber-200 drop-shadow-md">Gratis</p>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="text-white space-y-1">
                   <p className="text-xs flex items-center space-x-1"><CheckCircle className="w-3 h-3 text-green-400" /> <span>Real-time GPS Absensi</span></p>
                   <p className="text-xs flex items-center space-x-1"><CheckCircle className="w-3 h-3 text-green-400" /> <span>Export PDF & Excel</span></p>
                   <p className="text-xs flex items-center space-x-1"><CheckCircle className="w-3 h-3 text-green-400" /> <span>Penyimpanan Materi</span></p>
                </div>
             </div>
          </div>
        </div>

        {/* Tutorial Steps (Glassmorphism) */}
        <div className="mt-20 grid grid-cols-3 gap-8 w-full max-w-5xl z-20">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-colors group">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center text-white font-black text-2xl mb-4 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">1</div>
            <h3 className="text-white font-bold text-xl mb-2">Login Akun</h3>
            <p className="text-stone-400 text-sm leading-relaxed">Akses web dan gunakan NIM serta PIN rahasia untuk masuk ke portal Dashboard Pribadi.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-colors group">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-700 rounded-full flex items-center justify-center text-white font-black text-2xl mb-4 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">2</div>
            <h3 className="text-white font-bold text-xl mb-2">Masukkan Token</h3>
            <p className="text-stone-400 text-sm leading-relaxed">Dapatkan 4-digit token presensi dari PJ Kelas dan ketikkan saat sesi absen dibuka.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-colors group">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-black text-2xl mb-4 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">3</div>
            <h3 className="text-white font-bold text-xl mb-2">Selesai!</h3>
            <p className="text-stone-400 text-sm leading-relaxed">Status absensi Anda otomatis tersimpan dengan aman dan direkap ke dalam PDF/Excel.</p>
          </div>
        </div>

        {/* Footer / Call to Action */}
        <div className="mt-16 text-center z-20 mb-10">
           <p className="text-white font-bold mb-2 tracking-widest uppercase text-sm">Gunakan Sekarang Juga!</p>
           <p className="text-stone-400 text-sm flex items-center justify-center space-x-2">
             <span>@kelas_hka</span>
             <span>|</span>
             <span>kelas-hk-a-uinssc-2025.vercel.app</span>
           </p>
        </div>

      </div>
    </div>
  );
}
