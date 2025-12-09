import { User, VideoAsset } from '../types';

const USER_STORAGE_KEY = 'shortsgen_user';
const LIBRARY_STORAGE_KEY = 'shortsgen_library';

// --- User Management ---

export const getSessionUser = (): User | null => {
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const createAccount = (email: string, referralUsed: boolean = false): User => {
  const newUser: User = {
    username: email.split('@')[0],
    email,
    credits: referralUsed ? 3 : 1, // +2 for referral logic
    referralCode: Math.random().toString(36).substring(7).toUpperCase(),
    isLoggedIn: true,
  };
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
  return newUser;
};

export const updateCredits = (amount: number): User | null => {
  const user = getSessionUser();
  if (!user) return null;
  
  user.credits += amount;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  return user;
};

export const deductCredit = (): User | null => {
  const user = getSessionUser();
  if (!user || user.credits <= 0) return null;

  user.credits -= 1;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  return user;
};

export const logoutUser = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
};

// --- Asset Library Management ---

const DEFAULT_STOCK_ASSETS: VideoAsset[] = [
  { id: 's1', name: 'Neon City Drive', url: 'https://assets.mixkit.co/videos/preview/mixkit-night-neon-city-traffic-hyperlapse-40937-large.mp4', type: 'stock' },
  { id: 's2', name: 'Abstract Blue', url: 'https://assets.mixkit.co/videos/preview/mixkit-blue-ink-swirling-in-water-328-large.mp4', type: 'stock' },
  { id: 's3', name: 'Tech Server', url: 'https://assets.mixkit.co/videos/preview/mixkit-server-room-with-blue-lights-25752-large.mp4', type: 'stock' },
  { id: 's4', name: 'Clouds Timelapse', url: 'https://assets.mixkit.co/videos/preview/mixkit-white-clouds-moving-fast-in-a-blue-sky-time-lapse-24958-large.mp4', type: 'stock' }
];

export const getAssetLibrary = (): VideoAsset[] => {
  // In a real app, we would persist user uploads. 
  // For this prototype using Blob URLs (which expire), we only return stock + current session uploads (handled in App state),
  // but we'll return the stock list here.
  return DEFAULT_STOCK_ASSETS;
};

export const saveAssetToLibrary = (file: File): VideoAsset => {
  const url = URL.createObjectURL(file);
  const asset: VideoAsset = {
    id: Math.random().toString(36).substr(2, 9),
    name: file.name,
    url: url,
    type: 'user'
  };
  return asset;
};
