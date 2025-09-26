
import React from 'react';

type ToastType = 'success' | 'error';

interface ToastContainerProps {
  toasts: {
    id: number;
    message: string;
    type: ToastType;
  }[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="fixed top-5 right-5 z-[100] space-y-2">
      {toasts.map(toast => {
        const typeClasses = {
          success: "bg-green-500",
          error: "bg-red-500",
        };
        return (
          <div key={toast.id} className={`p-4 rounded-lg shadow-lg text-white text-sm font-medium ${typeClasses[toast.type]} animate-slide-in-right`}>
            {toast.message}
          </div>
        );
      })}
    </div>
  );
};
