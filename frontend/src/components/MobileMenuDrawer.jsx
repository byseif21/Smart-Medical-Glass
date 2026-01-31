import { X } from 'lucide-react';

const MobileMenuDrawer = ({ isOpen, onClose, children, footer }) => {
  return (
    <div
      className={`fixed inset-0 z-[100] sm:hidden transition-all duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-[280px] bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-medical-gray-100">
            <span className="text-xl font-bold text-medical-primary">Menu</span>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-medical-gray-100 text-medical-gray-500 hover:text-red-500 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="p-5 border-t border-medical-gray-100 bg-medical-gray-50/50 mt-auto">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenuDrawer;
