
import React from 'react';
import { VideoConfig, ProfilePosition } from '../types';

interface PreviewProps {
  config: VideoConfig;
}

const PreviewEngine: React.FC<PreviewProps> = ({ config }) => {
  
  // Helper to render the Profile/User Info block
  const renderProfile = () => (
    <div className="flex items-center gap-3 w-full animate-fade-in">
      <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-white/30 shrink-0">
        {config.avatarUrl ? (
          <img src={config.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-white/50">
            <i className="fas fa-user"></i>
          </div>
        )}
      </div>
      <div className="flex flex-col overflow-hidden text-left">
        <span className="font-bold text-white text-sm truncate shadow-black drop-shadow-md">@{config.username || "username"}</span>
        <span className="text-xs text-gray-300 truncate shadow-black drop-shadow-md">{config.footerText || "Follow for more AI tips"}</span>
      </div>
    </div>
  );

  // Helper to render the styled text blocks
  const renderStyledText = (text: string, isTop: boolean) => {
    if (!text) return null;
    return (
      <div 
        className="rounded-lg shadow-lg text-center mx-auto"
        style={{
          color: config.hookStyle.textColor,
          backgroundColor: config.hookStyle.backgroundColor,
          fontSize: `${config.hookStyle.fontSize}px`,
          fontFamily: config.hookStyle.fontFamily,
          padding: `${config.hookStyle.padding}px`,
          lineHeight: config.hookStyle.lineHeight,
          transform: `rotate(${isTop ? config.hookStyle.rotation : 0}deg)`,
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          wordWrap: 'break-word',
          maxWidth: '100%',
          width: 'fit-content'
        }}
      >
        {text}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 bg-black/50">
      {/* Phone Frame */}
      <div 
        className="relative w-[360px] h-[640px] bg-black rounded-[30px] border-8 border-gray-800 shadow-2xl overflow-hidden"
        style={{ boxShadow: '0 0 50px rgba(0,0,0,0.8)' }}
      >
        {/* Background Layer */}
        <div className="absolute inset-0 bg-gray-900">
          {config.backgroundVideoUrl ? (
            <video 
              src={config.backgroundVideoUrl} 
              className="w-full h-full object-cover" 
              autoPlay 
              loop 
              muted 
              playsInline
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
              <span className="text-white/20 font-bold text-2xl">NO SIGNAL</span>
            </div>
          )}
        </div>

        {/* Overlay "Card" */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="w-full bg-black/60 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-xl flex flex-col gap-4 transform translate-y-4">
            
            {/* Slot 1: Profile (Top) */}
            {config.profilePosition === 'top' && renderProfile()}

            {/* Hook Text */}
            {renderStyledText(config.topText || "YOUR HOOK HERE", true)}
            
            {/* Slot 2: Profile (Below Hook) */}
            {config.profilePosition === 'below-hook' && renderProfile()}

            {/* Content Media (Image or Video) */}
            <div className="relative aspect-square w-full bg-gray-800 rounded-lg overflow-hidden border border-white/20 shrink-0">
              {config.overlayMediaUrl ? (
                config.overlayMediaType === 'video' ? (
                   <video 
                    src={config.overlayMediaUrl} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                   />
                ) : (
                   <img src={config.overlayMediaUrl} alt="Content" className="w-full h-full object-cover" />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <i className="fas fa-photo-video text-3xl"></i>
                </div>
              )}
            </div>

            {/* Slot 3: Profile (Below Image) */}
            {config.profilePosition === 'below-image' && renderProfile()}

            {/* Bottom Text */}
            {config.bottomText && renderStyledText(config.bottomText, false)}

            {/* Slot 4: Profile (Bottom - Default) */}
            {config.profilePosition === 'bottom' && renderProfile()}

          </div>
        </div>
        
        {/* Simulate UI Elements of TikTok/Reels */}
        <div className="absolute right-2 bottom-20 flex flex-col gap-4 items-center opacity-80">
           <div className="w-10 h-10 bg-gray-800/50 rounded-full flex items-center justify-center text-white"><i className="fas fa-heart"></i></div>
           <div className="w-10 h-10 bg-gray-800/50 rounded-full flex items-center justify-center text-white"><i className="fas fa-comment"></i></div>
           <div className="w-10 h-10 bg-gray-800/50 rounded-full flex items-center justify-center text-white"><i className="fas fa-share"></i></div>
        </div>

      </div>
    </div>
  );
};

export default PreviewEngine;
