import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl'
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className={`relative w-full ${maxWidth} bg-[#FFFBEA] border-3 sm:border-4 border-black shadow-pixel sm:shadow-pixel-lg rounded-lg overflow-hidden my-auto max-h-[92vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-2.5 sm:p-3 bg-[#FFDE59] border-b-3 sm:border-b-4 border-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 pr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-black shrink-0"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 border border-black shrink-0"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-black shrink-0"></span>
            <h3 className="font-pixel text-[11px] sm:text-xs text-black uppercase tracking-wide truncate ml-1">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 hover:bg-black hover:text-white rounded border-2 border-black transition-colors shrink-0 cursor-pointer"
            title="Tutup dialog"
            aria-label="Tutup"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-3.5 sm:p-5 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};
