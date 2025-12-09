
export interface User {
  username: string;
  email: string;
  credits: number;
  referralCode: string;
  isLoggedIn: boolean;
}

export interface HookStyle {
  textColor: string;
  backgroundColor: string;
  fontSize: number;
  fontFamily: string;
  padding: number;
  lineHeight: number;
  rotation: number;
}

export type ProfilePosition = 'top' | 'below-hook' | 'below-image' | 'bottom';

export interface VideoConfig {
  topText: string;
  bottomText: string;
  footerText: string;
  backgroundVideoUrl: string | null; // URL.createObjectURL
  overlayMediaUrl: string | null;
  overlayMediaType: 'image' | 'video';
  avatarUrl: string | null;
  username: string;
  profilePosition: ProfilePosition;
  hookStyle: HookStyle;
}

export interface VideoAsset {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  type: 'stock' | 'user';
}

export interface PricingTier {
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  { name: 'Starter', credits: 5, price: 5 },
  { name: 'Creator', credits: 20, price: 15, popular: true },
  { name: 'Agency', credits: 50, price: 30 },
];
