import { X } from 'lucide-react';
import { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      <div className="relative w-full max-w-md bg-white shadow-2xl border border-black/10 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
          <h3 className="text-lg font-bold text-[#1d1c1d]">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 text-[#6b6a6b] hover:bg-black/5 transition"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
