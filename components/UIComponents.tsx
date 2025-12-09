import React from 'react';

export const Button = ({ 
  onClick, 
  children, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  fullWidth = false 
}: { 
  onClick?: () => void, 
  children: React.ReactNode, 
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline', 
  className?: string,
  disabled?: boolean,
  fullWidth?: boolean
}) => {
  const baseStyle = "px-4 py-2 rounded font-semibold transition-all duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-electric hover:bg-electricHover text-white shadow-[0_0_15px_rgba(41,98,255,0.5)]",
    secondary: "bg-card border border-gray-700 hover:border-gray-500 text-gray-300",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    outline: "bg-transparent border border-electric text-electric hover:bg-electric/10"
  };
  
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

export const Input = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  rightElement
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  rightElement?: React.ReactNode;
}) => (
  <div className="mb-4">
    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">{label}</label>
    <div className="relative">
      <input
        type={type}
        className="w-full bg-midnight border border-gray-700 rounded p-3 text-white focus:border-electric focus:outline-none focus:ring-1 focus:ring-electric transition-colors"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {rightElement && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          {rightElement}
        </div>
      )}
    </div>
  </div>
);

export const FileUpload = ({
  label,
  accept,
  onFileSelect,
  currentPreview,
  previewType,
  extraAction
}: {
  label: string;
  accept: string;
  onFileSelect: (file: File) => void;
  currentPreview?: string | null;
  previewType?: 'image' | 'video';
  extraAction?: React.ReactNode;
}) => {
  // Determine if we should show video or image tag based on explicit type or accept string
  const isVideo = previewType === 'video' || (!previewType && accept.includes('video') && !accept.includes('image'));

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <label className="block text-xs uppercase tracking-wider text-gray-500 font-bold">{label}</label>
        {extraAction}
      </div>
      <div className="flex items-center gap-4">
        <label className="flex-1 cursor-pointer bg-card hover:bg-gray-800 border border-dashed border-gray-600 rounded p-4 text-center transition-colors">
          <i className={`fas ${isVideo || accept.includes('video') ? 'fa-photo-video' : 'fa-image'} text-gray-400 mb-2 text-xl`}></i>
          <div className="text-sm text-gray-400">Click to Upload</div>
          <input 
            type="file" 
            className="hidden" 
            accept={accept}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onFileSelect(e.target.files[0]);
              }
            }}
          />
        </label>
        {currentPreview && (
          <div className="w-16 h-16 bg-gray-800 rounded overflow-hidden border border-gray-700 relative">
             {isVideo ? (
               <video src={currentPreview} className="w-full h-full object-cover" muted />
             ) : (
               <img src={currentPreview} alt="Preview" className="w-full h-full object-cover" />
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title?: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-gray-700 shadow-2xl relative overflow-hidden animate-fade-in">
         {/* Header */}
         <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
           {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
           <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
             <i className="fas fa-times text-xl"></i>
           </button>
         </div>
         {/* Scrollable Content */}
         <div className="p-6 overflow-y-auto custom-scrollbar">
           {children}
         </div>
      </div>
    </div>
  );
};

export const Badge = ({ children, variant = 'electric' }: { children: React.ReactNode, variant?: 'electric' | 'green' }) => {
  const colors = {
    electric: 'bg-electric/20 text-electric border-electric',
    green: 'bg-green-500/20 text-green-400 border-green-500'
  };
  return (
    <div className={`px-3 py-1.5 rounded text-xs font-bold border flex items-center justify-center gap-2 ${colors[variant]}`}>
      {children}
    </div>
  );
};
