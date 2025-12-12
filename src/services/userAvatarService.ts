export interface AvatarStyle {
  id: string;
  name: string;
  description: string;
  preview: string;
  subscriberOnly: boolean;
}

export const AVATAR_STYLES: AvatarStyle[] = [
  {
    id: 'lorelei',
    name: 'Anime',
    description: 'Japanese anime-inspired style',
    preview: 'https://api.dicebear.com/9.x/lorelei/svg?seed=demo&backgroundColor=1a1a1a',
    subscriberOnly: true
  },
  {
    id: 'adventurer',
    name: 'Illustrated',
    description: 'Hand-drawn illustrated avatars',
    preview: 'https://api.dicebear.com/9.x/adventurer/svg?seed=demo&backgroundColor=1a1a1a',
    subscriberOnly: true
  },
  {
    id: 'big-ears',
    name: 'Cute',
    description: 'Friendly cartoon style with big ears',
    preview: 'https://api.dicebear.com/9.x/big-ears/svg?seed=demo&backgroundColor=1a1a1a',
    subscriberOnly: true
  },
  {
    id: 'avataaars',
    name: 'Cartoon',
    description: 'Classic cartoon avatar style',
    preview: 'https://api.dicebear.com/9.x/avataaars/svg?seed=demo&backgroundColor=1a1a1a',
    subscriberOnly: true
  },
  {
    id: 'pixel-art',
    name: 'Pixel Art',
    description: 'Retro 8-bit pixel style',
    preview: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=demo&backgroundColor=1a1a1a',
    subscriberOnly: true
  },
  {
    id: 'micah',
    name: 'Minimalist',
    description: 'Clean and simple illustrated style',
    preview: 'https://api.dicebear.com/9.x/micah/svg?seed=demo&backgroundColor=1a1a1a',
    subscriberOnly: true
  },
  {
    id: 'fun-emoji',
    name: 'Emoji',
    description: 'Fun emoji-style faces',
    preview: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=demo&backgroundColor=1a1a1a',
    subscriberOnly: true
  },
  {
    id: 'thumbs',
    name: 'Thumbs',
    description: 'Simple thumbs-up style icons',
    preview: 'https://api.dicebear.com/9.x/thumbs/svg?seed=demo&backgroundColor=1a1a1a',
    subscriberOnly: false
  }
];

export interface UserAvatarConfig {
  style: string;
  seed: string;
  backgroundColor: string;
  accessories?: string[];
  hairColor?: string;
  skinColor?: string;
}

export function generateUserAvatarUrl(config: UserAvatarConfig, size: number = 200): string {
  const { style, seed, backgroundColor } = config;
  
  const params = new URLSearchParams({
    seed: seed,
    backgroundColor: backgroundColor.replace('#', ''),
    size: size.toString()
  });
  
  if (config.hairColor) {
    params.append('hairColor', config.hairColor.replace('#', ''));
  }
  
  if (config.skinColor) {
    params.append('skinColor', config.skinColor.replace('#', ''));
  }
  
  return `https://api.dicebear.com/9.x/${style}/svg?${params.toString()}`;
}

export function getRandomSeed(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function getStyleById(styleId: string): AvatarStyle | undefined {
  return AVATAR_STYLES.find(s => s.id === styleId);
}

export function getAvailableStyles(isSubscriber: boolean): AvatarStyle[] {
  if (isSubscriber) {
    return AVATAR_STYLES;
  }
  return AVATAR_STYLES.filter(s => !s.subscriberOnly);
}

export const userAvatarService = {
  generateUserAvatarUrl,
  getRandomSeed,
  getStyleById,
  getAvailableStyles,
  AVATAR_STYLES
};
