import React, { useEffect, useState, useCallback } from 'react';
import { api, authStorage } from './lib/api';
import { AppDataResponse, DecodedJwt, User } from './types';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { JwtInspectorModal } from './components/JwtInspectorModal';
import { SupabaseModal } from './components/SupabaseModal';
import { RefreshCw, Key, ShieldCheck, Database, Info, ExternalLink } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [jwtPayload, setJwtPayload] = useState<DecodedJwt | null>(null);
  const [appData, setAppData] = useState<AppDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jwtModalOpen, setJwtModalOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);

  // Load user from JWT token
  const loadSession = useCallback(async () => {
    const token = authStorage.getToken();
    if (!token) {
      setCurrentUser(null);
      setJwtPayload(null);
      setAppData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const meResponse = await api.getMe();
      setCurrentUser(meResponse.user);
      setJwtPayload(authStorage.decodeToken(token));

      // Fetch role-specific data
      const data = await api.fetchAppData();
      setAppData(data);
    } catch (err: any) {
      console.warn('Session verification failed:', err);
      authStorage.removeToken();
      setCurrentUser(null);
      setJwtPayload(null);
      setAppData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleLoginSuccess = async (user: User) => {
    const token = authStorage.getToken();
    setCurrentUser(user);
    setJwtPayload(authStorage.decodeToken(token));
    await loadSession();
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setJwtPayload(null);
    setAppData(null);
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset database ke data awal? Semua data yang baru ditambahkan akan dikembalikan.')) return;
    try {
      setLoading(true);
      await api.resetData();
      await loadSession();
    } catch (err: any) {
      alert(err.message || 'Gagal reset data');
      setLoading(false);
    }
  };

  const currentStudentClass = appData?.classes.find(c => c.id === currentUser?.class_id);

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-[#FFFBEA] flex flex-col items-center justify-center p-4">
        <div className="pixel-box bg-white p-6 max-w-sm w-full text-center space-y-4 shadow-pixel">
          <div className="w-12 h-12 bg-[#FFDE59] border-3 border-black mx-auto rounded flex items-center justify-center font-pixel text-xl animate-bounce">
            ED
          </div>
          <h2 className="font-pixel text-xs text-slate-900">MEMUAT SISTEM EDUBITS...</h2>
          <p className="text-xs font-mono text-slate-600">Memeriksa verifikasi token otentikasi JWT</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBEA] flex flex-col text-slate-900 font-sans">
      {/* Top Navbar when logged in */}
      {currentUser && (
        <Navbar
          currentUser={currentUser}
          jwtPayload={jwtPayload}
          onOpenJwtModal={() => setJwtModalOpen(true)}
          onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
          onLogout={handleLogout}
          classNameInfo={currentStudentClass?.class_name}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {!currentUser ? (
          <LoginView onLoginSuccess={handleLoginSuccess} />
        ) : (
          <div>
            {/* Quick Status Sub-bar */}
            <div className="bg-[#FFF8D6] border-b-2 border-black px-3 py-1.5 text-[10px] sm:text-[11px] font-mono text-slate-800">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="truncate">
                    Sesi JWT: <strong className="font-pixel text-[9px] text-emerald-800">TERVERIFIKASI</strong>
                  </span>
                  <span className="hidden xs:inline text-slate-400">&bull;</span>
                  <span className="hidden xs:inline-block font-pixel text-[8px] sm:text-[9px] bg-black text-[#FFDE59] px-1.5 py-0.2 rounded">
                    {currentUser.role}
                  </span>
                </div>
                {(currentUser.role === 'GURU' || currentUser.role === 'ADMIN') && (
                  <div className="hidden sm:flex items-center gap-2.5 text-[10px] shrink-0">
                    <button
                      onClick={() => setSupabaseModalOpen(true)}
                      className="hover:underline flex items-center gap-1 text-emerald-900 font-semibold cursor-pointer"
                      title="Status Integrasi Supabase"
                    >
                      <Database className="w-3 h-3 text-emerald-700" />
                      <span>Supabase: ugvcywndinfqiukbrgig</span>
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => setJwtModalOpen(true)}
                      className="hover:underline flex items-center gap-1 text-blue-900 font-semibold cursor-pointer"
                    >
                      <Key className="w-3 h-3 text-blue-700" />
                      <span>HS256 Claim</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Render Dashboard based on Verified Role */}
            {appData && (
              currentUser.role === 'GURU' || currentUser.role === 'ADMIN' ? (
                <TeacherDashboard
                  appData={appData}
                  onRefreshData={loadSession}
                  currentUser={currentUser}
                />
              ) : (
                <StudentDashboard
                  appData={appData}
                  onRefreshData={loadSession}
                  currentUser={currentUser}
                />
              )
            )}
          </div>
        )}
      </main>

      {/* JWT Inspector Modal */}
      <JwtInspectorModal
        isOpen={jwtModalOpen}
        onClose={() => setJwtModalOpen(false)}
        token={authStorage.getToken()}
        decoded={jwtPayload}
      />

      {/* Supabase Integration Modal */}
      <SupabaseModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-black text-white py-4 px-4 border-t-4 border-black">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-yellow-300 text-xs">EDUBITS</span>
            <span>&bull; SMP Belajar ID Pixel Learning Platform</span>
          </div>
          <div className="text-slate-400 text-[11px] text-center sm:text-right">
            Sistem Autentikasi JWT & Role-Based Access Control (Guru & Siswa)
          </div>
        </div>
      </footer>
    </div>
  );
}
