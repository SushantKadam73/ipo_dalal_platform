import React from 'react';
import { Toast } from '../hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastComponentProps {
  toast: Toast;
  onClose: () => void;
}

function ToastComponent({ toast, onClose }: ToastComponentProps) {
  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'info':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`rounded-lg shadow-lg px-4 py-3 min-w-80 max-w-sm ${getToastStyles(toast.type)} animate-in slide-in-from-right`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getIcon(toast.type)}</span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 ml-2"
        >
          ×
        </button>
      </div>
    </div>
  );
}