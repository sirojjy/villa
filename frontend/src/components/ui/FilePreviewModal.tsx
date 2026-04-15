'use client';

import { X, ExternalLink, Download, FileText, Image as ImageIcon } from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName?: string;
}

export default function FilePreviewModal({ isOpen, onClose, fileUrl, fileName }: FilePreviewModalProps) {
  if (!isOpen) return null;

  const isPDF = fileUrl.toLowerCase().endsWith('.pdf');
  const fullUrl = fileUrl.startsWith('http') ? fileUrl : `http://localhost:3000${fileUrl}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/80 backdrop-blur-md" 
        onClick={onClose} 
      />
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[85vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
              {isPDF ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">File Preview</h3>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                {fileName || 'Attachment Document'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href={fullUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 p-4 md:p-8 flex items-center justify-center overflow-auto">
          {isPDF ? (
            <iframe 
              src={fullUrl} 
              className="w-full h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white"
              title="PDF Preview"
            />
          ) : (
            <img 
              src={fullUrl} 
              alt="Attachment Preview" 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-xl"
            />
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-center">
           <a 
              href={fullUrl} 
              download
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-8 py-3 rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
           >
             <Download className="w-5 h-5" />
             Download File
           </a>
        </div>
      </div>
    </div>
  );
}
