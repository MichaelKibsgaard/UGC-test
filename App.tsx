
import React, { useState, useEffect } from 'react';
import { User, VideoConfig, PRICING_TIERS, ProfilePosition, VideoAsset } from './types';
import * as db from './services/mockDb';
import * as gemini from './services/geminiService';
import { Button, Input, FileUpload, Modal, Badge } from './components/UIComponents';
import { generateVideo } from './services/videoGenerator';
import PreviewEngine from './components/PreviewEngine';

export default function App() {
  // --- State ---
  const [user, setUser] = useState<User | null>(null);
  const [videoConfig, setVideoConfig] = useState<VideoConfig>({
    topText: "POV: You found the best AI tool",
    bottomText: "",
    footerText: "Link in bio for early access 🚀",
    username: "ai_hustler",
    backgroundVideoUrl: null,
    overlayMediaUrl: null,
    overlayMediaType: 'image',
    avatarUrl: null,
    profilePosition: 'bottom',
    hookStyle: {
      textColor: '#FFFFFF',
      backgroundColor: '#2962FF',
      fontSize: 20,
      fontFamily: 'Inter',
      padding: 12,
      lineHeight: 1.2,
      rotation: 0
    }
  });

  // Library State
  const [libraryAssets, setLibraryAssets] = useState<VideoAsset[]>([]);
  const [isLibraryOpen, setLibraryOpen] = useState(false);

  // UI State
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isGenerating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [showStyleControls, setShowStyleControls] = useState(false);

  // --- Effects ---
  useEffect(() => {
    const session = db.getSessionUser();
    if (session) setUser(session);

    // Load Library
    setLibraryAssets(db.getAssetLibrary());
  }, []);

  // --- Handlers ---
  const handleFileChange = (key: keyof VideoConfig, file: File) => {
    const url = URL.createObjectURL(file);
    setVideoConfig(prev => ({ ...prev, [key]: url }));
  };

  const handleOverlayFileChange = (file: File) => {
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video') ? 'video' : 'image';
    setVideoConfig(prev => ({
      ...prev,
      overlayMediaUrl: url,
      overlayMediaType: type
    }));
  };

  const handleLibraryUpload = (file: File) => {
    const newAsset = db.saveAssetToLibrary(file);
    setLibraryAssets(prev => [newAsset, ...prev]);
  };

  const selectAsset = (asset: VideoAsset) => {
    setVideoConfig(prev => ({ ...prev, backgroundVideoUrl: asset.url }));
    setLibraryOpen(false);
  };

  const generateHook = async () => {
    setAiLoading(true);
    const hook = await gemini.generateViralHook(videoConfig.topText || "Tech");
    setVideoConfig(prev => ({ ...prev, topText: hook }));
    setAiLoading(false);
  };

  const updateHookStyle = (key: keyof typeof videoConfig.hookStyle, value: any) => {
    setVideoConfig(prev => ({
      ...prev,
      hookStyle: { ...prev.hookStyle, [key]: value }
    }));
  };

  const handleGenerateClick = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (user.credits <= 0) {
      alert("Insufficient credits! Please top up.");
      return;
    }

    startGeneration();
  };

  const startGeneration = async () => {
    const updatedUser = db.deductCredit();
    if (updatedUser) setUser(updatedUser);

    setGenerating(true);
    setGeneratedVideoUrl(null);
    setProgress(0);

    try {
      const blob = await generateVideo(videoConfig, (p) => setProgress(p));
      const url = URL.createObjectURL(blob);
      setGeneratedVideoUrl(url);
    } catch (e) {
      console.error("Generation failed", e);
      alert("Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleLogin = () => {
    // Simplified login/signup for prototype
    const newUser = db.createAccount(authEmail, !!referralCodeInput);
    setUser(newUser);
    setAuthModalOpen(false);

    // Auto-start generation after login if that was the intent
    setTimeout(startGeneration, 500);
  };

  const buyCredits = (amount: number) => {
    if (confirm(`Simulate payment for ${amount} credits?`)) {
      const updated = db.updateCredits(amount);
      if (updated) setUser(updated);
    }
  };

  const handleLogout = () => {
    db.logoutUser();
    setUser(null);
  };

  const FONT_OPTIONS = [
    { label: 'Inter (Modern)', value: 'Inter' },
    { label: 'Montserrat (Bold)', value: 'Montserrat' },
    { label: 'Marker (Viral)', value: 'Permanent Marker' },
    { label: 'Serif (Elegant)', value: 'Playfair Display' },
    { label: 'Mono (Tech)', value: 'Roboto Mono' },
  ];

  const POSITION_OPTIONS: { label: string, value: ProfilePosition }[] = [
    { label: 'Very Top', value: 'top' },
    { label: 'Below Top Text', value: 'below-hook' },
    { label: 'Below Image', value: 'below-image' },
    { label: 'Very Bottom', value: 'bottom' },
  ];

  // --- Render ---
  return (
    <div className="flex h-screen w-full bg-midnight">

      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-gray-800 flex flex-col p-6 shrink-0 z-20 shadow-2xl hidden md:flex">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-electric rounded flex items-center justify-center">
            <i className="fas fa-video text-white text-xs"></i>
          </div>
          <h1 className="font-bold text-xl tracking-tight">ShortsGen.ai</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Menu</div>
          <button className="w-full text-left px-3 py-2 rounded bg-electric/10 text-electric border-l-2 border-electric font-medium">
            <i className="fas fa-magic mr-3"></i> Create Video
          </button>
          <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-800 text-gray-400 font-medium transition-colors">
            <i className="fas fa-history mr-3"></i> History
          </button>
        </nav>

        {user ? (
          <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-xs font-bold uppercase">Balance</span>
              <span className={`text-sm font-bold ${user.credits === 0 ? 'text-red-400' : 'text-green-400'}`}>
                {user.credits} Credits
              </span>
            </div>
            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden mb-3">
              <div className="bg-electric h-full" style={{ width: `${Math.min(user.credits * 10, 100)}%` }}></div>
            </div>
            <Button variant="primary" fullWidth onClick={() => setUser({ ...user, credits: 0 })}>
              <span className="text-xs">Get Credits</span>
            </Button>
            <button onClick={handleLogout} className="w-full text-center text-xs text-gray-500 mt-2 hover:text-white">
              Logout
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Free Credit Indicator */}
            <Badge variant="green">
              <i className="fas fa-gift"></i>
              1 Free Video Remaining
            </Badge>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700">
              <p className="text-xs text-gray-400 mb-2">Log in to save your viral videos.</p>
              <Button variant="secondary" fullWidth onClick={() => setAuthModalOpen(true)}>Login</Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">

        {/* Left: Editor */}
        <div className="w-full md:w-[450px] bg-midnight border-r border-gray-800 overflow-y-auto p-6 md:p-8 relative scrollbar-thin">
          <div className="max-w-md mx-auto space-y-8 pb-20">

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Editor</h2>
              <p className="text-gray-400 text-sm">Design your viral short in seconds.</p>
            </div>

            {/* Inputs */}
            <div className="space-y-6">

              {/* Hook Generator & Editor */}
              <div>
                <Input
                  label="Top Text (Hook)"
                  value={videoConfig.topText}
                  onChange={(v) => setVideoConfig(prev => ({ ...prev, topText: v }))}
                  rightElement={
                    <button
                      onClick={generateHook}
                      disabled={aiLoading}
                      className="text-electric hover:text-white transition-colors"
                      title="AI Polish"
                    >
                      <i className={`fas fa-sparkles ${aiLoading ? 'animate-spin' : ''}`}></i>
                    </button>
                  }
                />

                <Input
                  label="Bottom Text"
                  value={videoConfig.bottomText}
                  onChange={(v) => setVideoConfig(prev => ({ ...prev, bottomText: v }))}
                  placeholder="e.g. Wait for it..."
                />

                {/* Hook Style Toggle */}
                <div className="mt-2 border border-gray-800 bg-gray-900/50 rounded-lg p-3">
                  <button
                    onClick={() => setShowStyleControls(!showStyleControls)}
                    className="flex items-center justify-between w-full text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-white"
                  >
                    <span><i className="fas fa-palette mr-2"></i> Text Styling</span>
                    <i className={`fas fa-chevron-down transition-transform ${showStyleControls ? 'rotate-180' : ''}`}></i>
                  </button>

                  {showStyleControls && (
                    <div className="mt-4 space-y-4 animate-fade-in">
                      {/* Fonts */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Font Family</label>
                        <select
                          value={videoConfig.hookStyle.fontFamily}
                          onChange={(e) => updateHookStyle('fontFamily', e.target.value)}
                          className="w-full bg-midnight border border-gray-700 rounded p-2 text-sm text-white focus:border-electric outline-none"
                        >
                          {FONT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>

                      {/* Colors Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Text Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={videoConfig.hookStyle.textColor}
                              onChange={(e) => updateHookStyle('textColor', e.target.value)}
                              className="bg-transparent w-8 h-8 rounded cursor-pointer border-none"
                            />
                            <span className="text-xs font-mono text-gray-400">{videoConfig.hookStyle.textColor}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Background</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={videoConfig.hookStyle.backgroundColor}
                              onChange={(e) => updateHookStyle('backgroundColor', e.target.value)}
                              className="bg-transparent w-8 h-8 rounded cursor-pointer border-none"
                            />
                            <span className="text-xs font-mono text-gray-400">{videoConfig.hookStyle.backgroundColor}</span>
                          </div>
                        </div>
                      </div>

                      {/* Sliders */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Size</span>
                            <span>{videoConfig.hookStyle.fontSize}px</span>
                          </div>
                          <input
                            type="range" min="12" max="48"
                            value={videoConfig.hookStyle.fontSize}
                            onChange={(e) => updateHookStyle('fontSize', Number(e.target.value))}
                            className="w-full accent-electric bg-gray-700 h-1 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Padding</span>
                            <span>{videoConfig.hookStyle.padding}px</span>
                          </div>
                          <input
                            type="range" min="4" max="32"
                            value={videoConfig.hookStyle.padding}
                            onChange={(e) => updateHookStyle('padding', Number(e.target.value))}
                            className="w-full accent-electric bg-gray-700 h-1 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Rotation</span>
                            <span>{videoConfig.hookStyle.rotation}°</span>
                          </div>
                          <input
                            type="range" min="-5" max="5" step="0.5"
                            value={videoConfig.hookStyle.rotation}
                            onChange={(e) => updateHookStyle('rotation', Number(e.target.value))}
                            className="w-full accent-electric bg-gray-700 h-1 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Background Video Section with Library */}
              <FileUpload
                label="Background Video"
                accept="video/*"
                onFileSelect={(f) => handleFileChange('backgroundVideoUrl', f)}
                currentPreview={videoConfig.backgroundVideoUrl}
                previewType="video"
                extraAction={
                  <button
                    onClick={() => setLibraryOpen(true)}
                    className="text-xs text-electric hover:text-white font-bold flex items-center gap-1 transition-colors"
                  >
                    <i className="fas fa-th-large"></i> Browse Library
                  </button>
                }
              />

              <FileUpload
                label="Overlay Media (Image/Video)"
                accept="image/*,video/*"
                onFileSelect={handleOverlayFileChange}
                currentPreview={videoConfig.overlayMediaUrl}
                previewType={videoConfig.overlayMediaType}
              />

              <div className="grid grid-cols-2 gap-4">
                <FileUpload
                  label="Avatar"
                  accept="image/*"
                  onFileSelect={(f) => handleFileChange('avatarUrl', f)}
                  currentPreview={videoConfig.avatarUrl}
                  previewType="image"
                />
                <Input
                  label="Username"
                  value={videoConfig.username}
                  onChange={(v) => setVideoConfig(prev => ({ ...prev, username: v }))}
                />
              </div>

              <Input
                label="Footer Text"
                value={videoConfig.footerText}
                onChange={(v) => setVideoConfig(prev => ({ ...prev, footerText: v }))}
              />

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1 font-bold">Profile Position</label>
                <select
                  value={videoConfig.profilePosition}
                  onChange={(e) => setVideoConfig(prev => ({ ...prev, profilePosition: e.target.value as ProfilePosition }))}
                  className="w-full bg-midnight border border-gray-700 rounded p-3 text-white focus:border-electric outline-none"
                >
                  {POSITION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

            </div>

            {/* Sticky Generate Bar */}
            <div className="fixed bottom-0 left-0 md:left-64 w-full md:w-[450px] bg-midnight/95 backdrop-blur border-t border-gray-800 p-6 z-10">
              {user && user.credits === 0 ? (
                <div className="text-center">
                  <p className="text-red-400 text-sm mb-2 font-bold">Out of credits</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PRICING_TIERS.map(tier => (
                      <button
                        key={tier.name}
                        onClick={() => buyCredits(tier.credits)}
                        className={`p-2 rounded border text-xs flex flex-col items-center ${tier.popular ? 'border-electric bg-electric/10' : 'border-gray-700 hover:border-gray-500'}`}
                      >
                        <span className="font-bold">{tier.credits} Cr</span>
                        <span className="text-gray-400">${tier.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleGenerateClick}
                  disabled={isGenerating}
                >
                  {isGenerating ? 'RENDERING...' : (
                    <>
                      GENERATE VIDEO <span className="opacity-50 text-xs ml-2">(-1 Credit)</span>
                    </>
                  )}
                </Button>
              )}
            </div>

          </div>
        </div>

        {/* Right: Preview Area */}
        <div className="flex-1 bg-gradient-to-br from-gray-900 to-black relative flex items-center justify-center">
          <div className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs font-mono text-gray-400 border border-white/5">
            1080x1920 • 30FPS • PREVIEW
          </div>

          <PreviewEngine config={videoConfig} />

          {/* Overlay for Generation Process */}
          {(isGenerating || generatedVideoUrl) && (
            <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-12">
              {isGenerating ? (
                <div className="w-full max-w-md text-center">
                  <div className="mb-8 relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-800"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-electric border-t-transparent animate-spin"></div>
                    <i className="fas fa-magic absolute inset-0 flex items-center justify-center text-electric text-2xl"></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Rendering Viral Magic...</h3>
                  <p className="text-gray-400 mb-6">Stitching layers, applying effects, and optimizing for retention.</p>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-electric h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              ) : (
                <div className="text-center animate-fade-in pt-4">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                    <i className="fas fa-check text-white"></i>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-4">Video Ready!</h2>
                  <p className="text-gray-400 mb-8 max-w-sm mx-auto">Your video has been generated and deducted from your balance.</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => setGeneratedVideoUrl(null)} variant="secondary">Create Another</Button>
                    <a href={generatedVideoUrl || "#"} download={`viral_short_${Date.now()}.webm`} className="no-underline">
                      <Button variant="success">
                        <i className="fas fa-download"></i> Download Video
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Video Library Modal */}
      <Modal
        isOpen={isLibraryOpen}
        onClose={() => setLibraryOpen(false)}
        title="Video Repository"
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-400 text-sm">Select a background video or upload a new one to your library.</p>
            <label className="cursor-pointer bg-electric hover:bg-electricHover text-white text-xs font-bold px-4 py-2 rounded flex items-center gap-2 transition-colors">
              <i className="fas fa-cloud-upload-alt"></i> Upload New
              <input
                type="file"
                className="hidden"
                accept="video/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) handleLibraryUpload(e.target.files[0]);
                }}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {libraryAssets.map(asset => (
              <div
                key={asset.id}
                onClick={() => selectAsset(asset)}
                className="group relative aspect-[9/16] rounded-xl overflow-hidden border border-gray-700 hover:border-electric cursor-pointer transition-all hover:shadow-[0_0_20px_rgba(41,98,255,0.3)]"
              >
                <video src={asset.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <span className="text-white font-bold text-sm truncate">{asset.name}</span>
                  <span className="text-xs text-gray-400 capitalize">{asset.type}</span>
                </div>
                {/* Selection Indicator */}
                {videoConfig.backgroundVideoUrl === asset.url && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-electric rounded-full flex items-center justify-center text-white text-xs shadow-lg">
                    <i className="fas fa-check"></i>
                  </div>
                )}
              </div>
            ))}
          </div>
          {libraryAssets.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <i className="fas fa-film text-4xl mb-3 opacity-30"></i>
              <p>Library is empty. Upload your first video!</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Auth Modal (The Gate) */}
      <Modal isOpen={isAuthModalOpen} onClose={() => setAuthModalOpen(false)}>
        <div className="text-center mb-8 pt-4">
          <div className="w-16 h-16 bg-electric/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-lock text-electric text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Wait! Save your masterpiece.</h2>
          <p className="text-gray-400 text-sm">Create a free account to render and download your video. We'll even give you <span className="text-electric font-bold">1 Free Credit</span>.</p>
        </div>

        <div className="space-y-4 max-w-sm mx-auto pb-4">
          <Input
            label="Email Address"
            placeholder="creator@example.com"
            value={authEmail}
            onChange={setAuthEmail}
          />
          <Input
            label="Referral Code (Optional)"
            placeholder="FRIEND123 (+2 Credits)"
            value={referralCodeInput}
            onChange={setReferralCodeInput}
          />
          <Button variant="primary" fullWidth onClick={handleLogin}>
            Create Free Account
          </Button>
          <p className="text-center text-xs text-gray-500 mt-4">
            By joining, you agree to our Terms of Service.
          </p>
        </div>
      </Modal>

    </div>
  );
}
