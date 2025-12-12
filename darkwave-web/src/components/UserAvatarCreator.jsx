import { useState, useEffect } from 'react';
import './UserAvatarCreator.css';

const AVATAR_STYLES = [
  {
    id: 'lorelei',
    name: 'Anime',
    description: 'Japanese anime-inspired style',
    subscriberOnly: true
  },
  {
    id: 'adventurer',
    name: 'Illustrated',
    description: 'Hand-drawn illustrated avatars',
    subscriberOnly: true
  },
  {
    id: 'big-ears',
    name: 'Cute',
    description: 'Friendly cartoon style',
    subscriberOnly: true
  },
  {
    id: 'avataaars',
    name: 'Cartoon',
    description: 'Classic cartoon avatar style',
    subscriberOnly: true
  },
  {
    id: 'pixel-art',
    name: 'Pixel Art',
    description: 'Retro 8-bit pixel style',
    subscriberOnly: true
  },
  {
    id: 'micah',
    name: 'Minimalist',
    description: 'Clean and simple style',
    subscriberOnly: true
  },
  {
    id: 'fun-emoji',
    name: 'Emoji',
    description: 'Fun emoji-style faces',
    subscriberOnly: true
  },
  {
    id: 'thumbs',
    name: 'Thumbs',
    description: 'Simple icon style',
    subscriberOnly: false
  }
];

const BACKGROUND_COLORS = [
  { id: 'dark', hex: '0f0f0f', name: 'Dark' },
  { id: 'space', hex: '0b0c10', name: 'Space' },
  { id: 'ocean', hex: '0d1b2a', name: 'Ocean' },
  { id: 'neon', hex: '1a1a2e', name: 'Neon' },
  { id: 'teal', hex: '0d3b3b', name: 'Teal' },
  { id: 'purple', hex: '2d1b4e', name: 'Purple' }
];

export default function UserAvatarCreator({ isSubscriber = false, onSave, onClose }) {
  const [selectedStyle, setSelectedStyle] = useState('thumbs');
  const [seed, setSeed] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('0f0f0f');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    setSeed(Math.random().toString(36).substring(2, 10));
  }, []);

  useEffect(() => {
    if (seed) {
      const url = `https://api.dicebear.com/9.x/${selectedStyle}/svg?seed=${seed}&backgroundColor=${backgroundColor}&size=200`;
      setAvatarUrl(url);
    }
  }, [selectedStyle, seed, backgroundColor]);

  const handleRandomize = () => {
    setSeed(Math.random().toString(36).substring(2, 10));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        style: selectedStyle,
        seed,
        backgroundColor,
        avatarUrl
      });
    }
  };

  const availableStyles = isSubscriber 
    ? AVATAR_STYLES 
    : AVATAR_STYLES.filter(s => !s.subscriberOnly);

  return (
    <div className="avatar-creator-overlay">
      <div className="avatar-creator-modal">
        <div className="avatar-creator-header">
          <h2>Create Your Avatar</h2>
          <button className="avatar-close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="avatar-creator-content">
          <div className="avatar-preview-section">
            <div className="avatar-preview-container" style={{ backgroundColor: `#${backgroundColor}` }}>
              {avatarUrl && (
                <img src={avatarUrl} alt="Your Avatar" className="avatar-preview-image" />
              )}
            </div>
            <button className="randomize-btn" onClick={handleRandomize}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              Randomize
            </button>
          </div>

          <div className="avatar-options-section">
            <div className="option-group">
              <label>Style</label>
              <div className="style-grid">
                {AVATAR_STYLES.map(style => {
                  const isLocked = style.subscriberOnly && !isSubscriber;
                  return (
                    <button
                      key={style.id}
                      className={`style-option ${selectedStyle === style.id ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                      onClick={() => !isLocked && setSelectedStyle(style.id)}
                      disabled={isLocked}
                      title={isLocked ? 'Subscriber Only' : style.description}
                    >
                      <img 
                        src={`https://api.dicebear.com/9.x/${style.id}/svg?seed=preview&backgroundColor=1a1a1a&size=48`}
                        alt={style.name}
                        className="style-preview"
                      />
                      <span className="style-name">{style.name}</span>
                      {isLocked && (
                        <span className="lock-icon">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4z"/>
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {!isSubscriber && (
                <p className="subscriber-note">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                  Upgrade to RM+ for all avatar styles
                </p>
              )}
            </div>

            <div className="option-group">
              <label>Background</label>
              <div className="color-grid">
                {BACKGROUND_COLORS.map(color => (
                  <button
                    key={color.id}
                    className={`color-option ${backgroundColor === color.hex ? 'selected' : ''}`}
                    style={{ backgroundColor: `#${color.hex}` }}
                    onClick={() => setBackgroundColor(color.hex)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="avatar-creator-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={handleSave}>
            Save Avatar
          </button>
        </div>
      </div>
    </div>
  );
}
