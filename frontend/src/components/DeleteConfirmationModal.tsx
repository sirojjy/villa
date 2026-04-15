'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  isDeleting?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Record?",
  message = "This action is permanent and cannot be undone. Are you absolutely sure you want to proceed?",
  isDeleting = false
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="p-10 text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-red-500 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
            <AlertTriangle className="w-10 h-10" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-tight">
            {title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed px-2">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="px-10 pb-10 flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-4 rounded-[1.5rem] transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Yes, Delete It Now"}
          </button>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-cyan-500/10 text-slate-600 dark:text-slate-300 dark:hover:text-cyan-400 font-black py-4 rounded-[1.5rem] transition-all border border-transparent dark:hover:border-cyan-500/20 active:scale-95"
          >
            Cancel Action
          </button>
        </div>
      </div>
    </div>
  );
}
