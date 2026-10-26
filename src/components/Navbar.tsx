import React, { useState } from 'react';
import { User, DecodedJwt } from '../types';
import { LogOut, Key, Database, Menu, X, ChevronDown } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  jwtPayload: DecodedJwt | null;
  onOpenJwtModal: () => void;
  onOpenSupabaseModal: () => void;
  onLogout: () => void;
  classNameInfo?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenJwtModal,
  onOpenSupabaseModal,
  onLogout,
  classNameInfo
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) return null;

  const isTeacher = currentUser.role === 'GURU' || currentUser.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 bg-[#FFDE59] border-b-3 sm:border-b-4 border-black shadow-pixel-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-black text-[#FFDE59] flex items-center justify-center rounded border-2 border-black font-pixel text-xs sm:text-sm shadow-pixel-sm shrink-0">
            ED
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-pixel text-xs sm:text-sm text-black tracking-tight whitespace-nowrap">
                EDUBITS
              </span>
              <span className="hidden xs:inline-block bg-black text-[#FFDE59] text-[8px] sm:text-[9px] font-pixel px-1.5 py-0.5 rounded whitespace-nowrap">
                HUB
              </span>
            </div>
            <p className="text-[10px] font-mono font-medium text-slate-800 hidden md:block truncate">
              SMP Belajar ID &bull; JWT Portal
            </p>
          </div>
        </div>

        {/* Right: Desktop Controls (md and up) */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* User Profile Badge */}
          <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 border-2 border-black rounded shadow-pixel-sm">
            <div className={`w-2.5 h-2.5 rounded-full border border-black shrink-0 ${isTeacher ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <div className="text-left leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                  {currentUser.full_name}
                </span>
                <span className={`text-[8px] font-pixel px-1.5 py-0.5 rounded border border-black ${
                  isTeacher ? 'bg-amber-300 text-black' : 'bg-emerald-200 text-black'
                }`}>
                  {isTeacher ? 'GURU / ADMIN' : `SISWA ${classNameInfo ? `(${classNameInfo})` : ''}`}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-600 mt-1">
                {isTeacher ? currentUser.email : `NIS: ${currentUser.nis || '-'}`}
              </div>
            </div>
          </div>

          {/* Teacher Supabase Button */}
          {isTeacher && (
            <button
              onClick={onOpenSupabaseModal}
              className="pixel-btn bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] py-1.5 px-2.5 gap-1.5 cursor-pointer"
              title="Integrasi Supabase Anda"
            >
              <Database className="w-3.5 h-3.5 text-emerald-200" />
              <span>SUPABASE</span>
            </button>
          )}

          {/* Teacher JWT Button */}
          {isTeacher && (
            <button
              onClick={onOpenJwtModal}
              className="pixel-btn bg-[#2563EB] hover:bg-blue-700 text-white text-[10px] py-1.5 px-2.5 gap-1.5 cursor-pointer"
              title="Lihat Decoded JWT Token"
            >
              <Key className="w-3.5 h-3.5" />
              <span>JWT</span>
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="pixel-btn bg-red-500 hover:bg-red-600 text-white text-[10px] py-1.5 px-3 gap-1 cursor-pointer"
            title="Keluar dari sistem"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>KELUAR</span>
          </button>
        </div>

        {/* Right: Mobile View (Single compact row on phones) */}
        <div className="flex md:hidden items-center gap-1.5">
          {/* Compact User Name Pill */}
          <div className="flex items-center gap-1.5 bg-white px-2 py-1 border-2 border-black rounded shadow-pixel-sm max-w-[160px] xs:max-w-[190px]">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isTeacher ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <span className="text-[11px] font-bold text-slate-900 truncate">
              {currentUser.full_name.split(' ')[0]}
            </span>
            <span className={`text-[8px] font-pixel px-1 py-0.2 rounded border border-black shrink-0 ${
              isTeacher ? 'bg-amber-300' : 'bg-emerald-200'
            }`}>
              {isTeacher ? 'GURU' : 'SISWA'}
            </span>
          </div>

          {/* Mobile Menu Dropdown Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 bg-white hover:bg-amber-100 border-2 border-black rounded shadow-pixel-sm text-black flex items-center justify-center cursor-pointer"
            aria-label="Menu navigasi"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFFDF5] border-t-3 border-black p-3 space-y-2 shadow-pixel animate-in slide-in-from-top-2 duration-150">
          <div className="p-2.5 bg-white border-2 border-black rounded font-mono text-xs space-y-1">
            <div className="font-bold text-slate-900">{currentUser.full_name}</div>
            <div className="text-slate-600 text-[11px]">
              {isTeacher ? currentUser.email : `NIS: ${currentUser.nis || '-'} &bull; ${classNameInfo || 'Kelas Siswa'}`}
            </div>
            <div className="inline-block font-pixel text-[9px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 mt-1">
              Peran: {currentUser.role} {isTeacher ? '(Admin Utama)' : '(Read Only)'}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-1">
            {isTeacher && (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSupabaseModal();
                  }}
                  className="pixel-btn bg-emerald-600 text-white text-xs py-2 px-3 gap-2 justify-start w-full cursor-pointer"
                >
                  <Database className="w-4 h-4 text-emerald-200" />
                  <span>INTEGRASI SUPABASE</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenJwtModal();
                  }}
                  className="pixel-btn bg-[#2563EB] text-white text-xs py-2 px-3 gap-2 justify-start w-full cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>TOKEN JWT INSPECTOR</span>
                </button>
              </>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="pixel-btn bg-red-500 hover:bg-red-600 text-white text-xs py-2 px-3 gap-2 justify-center w-full cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>KELUAR DARI SISTEM</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
