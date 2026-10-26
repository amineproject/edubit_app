import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Database, Check, Copy, ExternalLink, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [sqlScript, setSqlScript] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchStatusAndSchema = async () => {
    setLoading(true);
    try {
      const [resStatus, resSchema] = await Promise.all([
        fetch('/api/supabase/status').then(r => r.json()),
        fetch('/api/supabase/schema').then(r => r.json())
      ]);
      setStatus(resStatus);
      setSqlScript(resSchema.sql || '');
    } catch (err) {
      console.warn('Error loading Supabase info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatusAndSchema();
    }
  }, [isOpen]);

  const handleCopySql = () => {
    if (sqlScript) {
      navigator.clipboard.writeText(sqlScript);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText('https://ugvcywndinfqiukbrgig.supabase.co');
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚡ INTEGRASI SUPABASE ANDA" maxWidth="max-w-3xl">
      <div className="space-y-4">
        {/* Status Header */}
        <div className="p-3.5 bg-emerald-50 border-2 border-black rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-pixel-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-emerald-500 text-white flex items-center justify-center font-pixel text-lg border-2 border-black">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-pixel text-xs text-slate-900">SUPABASE TERHUBUNG</h4>
                <span className="bg-emerald-200 text-emerald-950 font-pixel text-[9px] px-1.5 py-0.5 rounded border border-emerald-600">
                  AKTIF
                </span>
              </div>
              <p className="font-mono text-xs text-slate-600 mt-0.5">
                Proyek Supabase Anda berhasil dikonfigurasi pada aplikasi Edubits.
              </p>
            </div>
          </div>

          <button
            onClick={fetchStatusAndSchema}
            disabled={loading}
            className="pixel-btn bg-white hover:bg-slate-100 text-black text-[10px] py-1.5 px-2.5 gap-1 self-start sm:self-auto"
            title="Segarkan status Supabase"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>CEK KONEKSI</span>
          </button>
        </div>

        {/* Credentials Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 bg-white border-2 border-black rounded space-y-1">
            <span className="text-[10px] font-pixel text-slate-500 block">PROJECT URL:</span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-900 truncate">https://ugvcywndinfqiukbrgig.supabase.co</span>
              <button
                onClick={handleCopyUrl}
                className="text-slate-600 hover:text-black shrink-0"
                title="Salin URL"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-3 bg-white border-2 border-black rounded space-y-1">
            <span className="text-[10px] font-pixel text-slate-500 block">PROJECT API KEY:</span>
            <div className="font-bold text-slate-900 truncate">sb_publishable_rnhioflH...</div>
          </div>
        </div>

        {/* SQL Schema Generator Box */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h4 className="font-pixel text-xs text-slate-900 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              SKRIP DDL SQL UNTUK SUPABASE SQL EDITOR:
            </h4>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySql}
                className="pixel-btn bg-[#FFDE59] text-black text-[10px] py-1 px-3 gap-1"
              >
                {copiedSql ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSql ? 'SKRIP TERSALIN!' : 'SALIN SKRIP SQL'}</span>
              </button>

              <a
                href="https://supabase.com/dashboard/project/ugvcywndinfqiukbrgig/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="pixel-btn bg-[#2563EB] hover:bg-blue-700 text-white text-[10px] py-1 px-3 gap-1"
              >
                <span>BUKA SQL EDITOR</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <p className="text-[11px] font-mono text-slate-600">
            Jalankan skrip ini sekali di dashboard Supabase Anda untuk membuat seluruh tabel (`users`, `classes`, `subjects`, `materials`, `assignments`, dll.) beserta data akun guru & siswa.
          </p>

          <div className="bg-slate-950 text-emerald-400 p-3 rounded border-2 border-black font-mono text-[11px] max-h-52 overflow-y-auto">
            <pre className="whitespace-pre-wrap select-all">{sqlScript || 'Memuat skrip SQL...'}</pre>
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="pixel-btn bg-white hover:bg-slate-100 text-black px-4 py-2 text-xs"
          >
            TUTUP
          </button>
        </div>
      </div>
    </Modal>
  );
};
