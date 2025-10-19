import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after duration
    if (newToast.duration) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }
  };

  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Entry animation handled by CSS
    return () => {
      // Cleanup
    };
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300); // Match animation duration
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-400" />,
    error: <XCircle className="h-5 w-5 text-red-400" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-400" />,
    info: <Info className="h-5 w-5 text-blue-400" />,
  };

  const colors = {
    success: 'bg-green-900/90 border-green-600',
    error: 'bg-red-900/90 border-red-600',
    warning: 'bg-yellow-900/90 border-yellow-600',
    info: 'bg-blue-900/90 border-blue-600',
  };

  return (
    <div
      className={`
        pointer-events-auto
        min-w-[320px] max-w-md
        ${colors[toast.type]}
        backdrop-blur-sm
        border-2 rounded-lg shadow-2xl
        p-4
        transform transition-all duration-300 ease-out
        ${isExiting 
          ? 'translate-x-[400px] opacity-0' 
          : 'translate-x-0 opacity-100 animate-slide-in-right'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {icons[toast.type]}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white mb-0.5">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-sm text-gray-300">
              {toast.message}
            </p>
          )}
        </div>

        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      {toast.duration && (
        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/40 rounded-full animate-shrink"
            style={{ animationDuration: `${toast.duration}ms` }}
          />
        </div>
      )}
    </div>
  );
};

// Utility function for quick toast notifications
export const toast = {
  success: (title: string, message?: string, duration?: number) => {
    const event = new CustomEvent('show-toast', {
      detail: { type: 'success', title, message, duration },
    });
    window.dispatchEvent(event);
  },
  error: (title: string, message?: string, duration?: number) => {
    const event = new CustomEvent('show-toast', {
      detail: { type: 'error', title, message, duration },
    });
    window.dispatchEvent(event);
  },
  warning: (title: string, message?: string, duration?: number) => {
    const event = new CustomEvent('show-toast', {
      detail: { type: 'warning', title, message, duration },
    });
    window.dispatchEvent(event);
  },
  info: (title: string, message?: string, duration?: number) => {
    const event = new CustomEvent('show-toast', {
      detail: { type: 'info', title, message, duration },
    });
    window.dispatchEvent(event);
  },
};
