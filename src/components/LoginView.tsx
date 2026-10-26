import React, { useState } from 'react';
import { api } from '../lib/api';
import { User } from '../types';
import { KeyRound, Shield, GraduationCap, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const response = await api.login(username, password);
      setSuccessMsg(`Login Berhasil! Mengalihkan...`);
      setTimeout(() => {
        onLoginSuccess(response.user);
      }, 350);
    } catch (err: any) {
      setError(err.message || 'Gagal login. Periksa email/username dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Pixel Card */}
        <div className="pixel-box bg-white overflow-hidden shadow-pixel-lg">
          {/* Card Title Bar */}
          <div className="p-4 bg-[#FFDE59] border-b-4 border-black flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-red-500 border border-black inline-block"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-black inline-block"></span>
              <span className="w-3.5 h-3.5 rounded-full bg-green-500 border border-black inline-block"></span>
              <h2 className="font-pixel text-xs sm:text-sm text-black ml-2 tracking-wide">
                MASUK KE EDUBITS
              </h2>
            </div>
            <span className="text-[10px] font-pixel bg-black text-[#FFDE59] px-2 py-0.5 rounded">
              AUTH JWT
            </span>
          </div>

          <div className="p-6 space-y-5">
            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4 pt-1">
              {error && (
                <div className="p-3 bg-red-100 border-2 border-red-700 text-red-900 rounded text-xs font-mono">
                  ⚠️ {error}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-green-100 border-2 border-green-700 text-green-900 rounded text-xs font-mono">
                  ✨ {successMsg}
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1">
                <label className="block text-[11px] font-pixel text-slate-800">
                  EMAIL / USERNAME / NIS:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan Email, Username, atau NIS"
                    className="w-full pixel-input text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="block text-[11px] font-pixel text-slate-800">
                  PASSWORD:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full pixel-input text-xs sm:text-sm font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-black p-1"
                    title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full pixel-btn bg-[#FFDE59] hover:bg-yellow-400 text-black py-3 text-xs tracking-wider font-pixel mt-2 disabled:opacity-50"
              >
                {loading ? 'MEMVERIFIKASI JWT...' : 'MASUK KE SISTEM 🚀'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
