import React, { useState } from 'react';
import { Modal } from './Modal';
import { DecodedJwt } from '../types';
import { authStorage } from '../lib/api';
import { Key, ShieldCheck, Copy, Check, Clock, UserCheck } from 'lucide-react';

interface JwtInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  decoded: DecodedJwt | null;
}

export const JwtInspectorModal: React.FC<JwtInspectorModalProps> = ({
  isOpen,
  onClose,
  token,
  decoded
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getExpirationTime = () => {
    if (!decoded?.exp) return 'Tidak tertera';
    const expDate = new Date(decoded.exp * 1000);
    return `${expDate.toLocaleDateString('id-ID')} ${expDate.toLocaleTimeString('id-ID')}`;
  };

  const getRemainingTime = () => {
    if (!decoded?.exp) return '';
    const now = Math.floor(Date.now() / 1000);
    const diff = decoded.exp - now;
    if (diff <= 0) return 'Kedaluwarsa';
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return `${days} hari ${hours} jam ${minutes} menit`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔑 JWT Token Inspector & RBAC Claim">
      <div className="space-y-5">
        <div className="p-3 bg-amber-50 border-2 border-black rounded flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-800">
            <p className="font-bold">Sistem Autentikasi JSON Web Token (JWT) Aktif</p>
            <p className="text-slate-600 mt-1">
              Token ini ditandatangani oleh server backend menggunakan secret key. Setiap panggilan API menyertakan header{' '}
              <code className="bg-slate-200 px-1 py-0.5 rounded text-black font-mono">Authorization: Bearer &lt;token&gt;</code>.
              Backend membaca klaim <span className="font-bold text-black font-mono">role: "{decoded?.role}"</span> untuk memvalidasi hak akses.
            </p>
          </div>
        </div>

        {/* Status Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="p-2.5 bg-white border-2 border-black rounded shadow-pixel-sm">
            <span className="text-[10px] text-slate-500 font-pixel block">ROLE CLAIM:</span>
            <span className={`inline-block mt-1 font-pixel text-xs px-2 py-0.5 rounded border border-black ${
              decoded?.role === 'GURU' || decoded?.role === 'ADMIN'
                ? 'bg-amber-300 text-black'
                : 'bg-emerald-300 text-black'
            }`}>
              {decoded?.role === 'GURU' ? '👑 GURU (ADMIN)' : '🎒 SISWA'}
            </span>
          </div>

          <div className="p-2.5 bg-white border-2 border-black rounded shadow-pixel-sm">
            <span className="text-[10px] text-slate-500 font-pixel block">ALGORITMA:</span>
            <span className="font-mono text-xs font-bold text-blue-700 mt-1 block">HS256 (HMAC-SHA256)</span>
          </div>

          <div className="p-2.5 bg-white border-2 border-black rounded shadow-pixel-sm">
            <span className="text-[10px] text-slate-500 font-pixel block">MASA BERLAKU:</span>
            <span className="font-mono text-xs font-bold text-emerald-700 mt-1 block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {getRemainingTime() || 'Aktif'}
            </span>
          </div>
        </div>

        {/* Decoded Claims Payload */}
        <div className="space-y-2">
          <h4 className="font-pixel text-xs text-slate-800 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-purple-600" /> DECODED JWT PAYLOAD (CLAIMS):
          </h4>
          <div className="bg-slate-900 text-green-400 p-3 rounded border-2 border-black font-mono text-xs overflow-x-auto shadow-inner">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(decoded, null, 2)}
            </pre>
          </div>
        </div>

        {/* Raw Token String */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-pixel text-xs text-slate-800 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-600" /> RAW JWT TOKEN (ENCODED):
            </h4>
            <button
              onClick={handleCopy}
              className="pixel-btn bg-white hover:bg-slate-100 text-black text-[10px] py-1 px-2.5 gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copied ? 'TERSALIN!' : 'SALIN TOKEN'}
            </button>
          </div>
          <div className="bg-white p-3 rounded border-2 border-black font-mono text-[11px] text-slate-700 break-all select-all max-h-24 overflow-y-auto">
            {token || 'Tidak ada token aktif'}
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="pixel-btn bg-[#FFDE59] text-black px-4 py-2 text-xs"
          >
            TUTUP INSPECTOR
          </button>
        </div>
      </div>
    </Modal>
  );
};
