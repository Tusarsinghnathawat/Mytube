'use client';

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';

const Toast: React.FC = () => {
  const { toast, hideToast } = useUIStore();

  useEffect(() => {
    if (toast?.isVisible) {
      const timer = setTimeout(() => {
        hideToast();
      }, 5000); // Auto hide after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  if (!toast?.isVisible) return null;

  const icons = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <XCircle size={20} className="text-red-500" />,
    warning: <AlertCircle size={20} className="text-yellow-500" />,
    info: <Info size={20} className="text-blue-500" />,
  };

  const backgrounds = {
    success: 'bg-green-900/90 border-green-500',
    error: 'bg-red-900/90 border-red-500',
    warning: 'bg-yellow-900/90 border-yellow-500',
    info: 'bg-blue-900/90 border-blue-500',
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
      <div className={cn(
        'flex items-center space-x-3 p-4 rounded-lg border backdrop-blur-sm shadow-lg max-w-sm',
        backgrounds[toast.type]
      )}>
        {icons[toast.type]}
        <p className="text-white text-sm flex-1">{toast.message}</p>
        <button
          onClick={hideToast}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export { Toast }; 