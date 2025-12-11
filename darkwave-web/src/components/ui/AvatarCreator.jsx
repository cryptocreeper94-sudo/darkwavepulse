import { useState, useCallback } from 'react'

const avatarOptions = {
  skinTone: [
    { id: 'light', label: 'Light', color: '#FFDFC4' },
    { id: 'light-tan', label: 'Light Tan', color: '#F0C08A' },
    { id: 'tan', label: 'Tan', color: '#D4A574' },
    { id: 'medium', label: 'Medium', color: '#C68642' },
    { id: 'olive', label: 'Olive', color: '#9F8170' },
    { id: 'brown', label: 'Brown', color: '#8D5524' },
    { id: 'dark-brown', label: 'Dark Brown', color: '#5C3D2E' },
    { id: 'dark', label: 'Dark', color: '#3B2219' },
  ],
  faceShape: [
    { id: 'oval', label: 'Oval', icon: '🥚' },
    { id: 'round', label: 'Round', icon: '⭕' },
    { id: 'square', label: 'Square', icon: '⬜' },
    { id: 'heart', label: 'Heart', icon: '💜' },
  ],
  hairStyle: [
    { id: 'short', label: 'Short', icon: '💇' },
    { id: 'medium', label: 'Medium', icon: '💇‍♀️' },
    { id: 'long', label: 'Long', icon: '👩‍🦱' },
    { id: 'curly', label: 'Curly', icon: '🌀' },
    { id: 'wavy', label: 'Wavy', icon: '🌊' },
    { id: 'braids', label: 'Braids', icon: '🪢' },
    { id: 'afro', label: 'Afro', icon: '🔴' },
    { id: 'bald', label: 'Bald', icon: '👴' },
    { id: 'buzzcut', label: 'Buzz Cut', icon: '✂️' },
    { id: 'ponytail', label: 'Ponytail', icon: '🎀' },
    { id: 'pigtails', label: 'Pigtails', icon: '🎀🎀' },
    { id: 'mohawk', label: 'Mohawk', icon: '🦔' },
    { id: 'dreads', label: 'Dreads', icon: '🔗' },
    { id: 'cornrows', label: 'Cornrows', icon: '〰️' },
    { id: 'man-bun', label: 'Man Bun', icon: '🔵' },
    { id: 'pixie', label: 'Pixie Cut', icon: '✨' },
    { id: 'bob', label: 'Bob', icon: '💁' },
  ],
  hairColor: [
    { id: 'black', label: 'Black', color: '#1a1a1a' },
    { id: 'dark-brown', label: 'Dark Brown', color: '#3b2417' },
    { id: 'brown', label: 'Brown', color: '#6a4e42' },
    { id: 'light-brown', label: 'Light Brown', color: '#a67c52' },
    { id: 'blonde', label: 'Blonde', color: '#d4a76a' },
    { id: 'platinum', label: 'Platinum', color: '#e8e4d9' },
    { id: 'red', label: 'Red', color: '#8b3a3a' },
    { id: 'ginger', label: 'Ginger', color: '#c65d3b' },
    { id: 'gray', label: 'Gray', color: '#888888' },
    { id: 'white', label: 'White', color: '#e0e0e0' },
    { id: 'blue', label: 'Blue', color: '#3498db' },
    { id: 'purple', label: 'Purple', color: '#9b59b6' },
    { id: 'pink', label: 'Pink', color: '#e91e8c' },
    { id: 'green', label: 'Green', color: '#27ae60' },
  ],
  eyeColor: [
    { id: 'brown', label: 'Brown', color: '#5D4037' },
    { id: 'blue', label: 'Blue', color: '#1976D2' },
    { id: 'green', label: 'Green', color: '#388E3C' },
    { id: 'hazel', label: 'Hazel', color: '#8D6E63' },
    { id: 'gray', label: 'Gray', color: '#607D8B' },
    { id: 'amber', label: 'Amber', color: '#FF8F00' },
  ],
  eyebrowStyle: [
    { id: 'thin', label: 'Thin', icon: '―' },
    { id: 'thick', label: 'Thick', icon: '━' },
    { id: 'arched', label: 'Arched', icon: '⌒' },
    { id: 'straight', label: 'Straight', icon: '—' },
  ],
  facialHair: [
    { id: 'none', label: 'None', icon: '😊' },
    { id: 'stubble', label: 'Stubble', icon: '🧔‍♂️' },
    { id: 'mustache', label: 'Mustache', icon: '👨' },
    { id: 'goatee', label: 'Goatee', icon: '🧔' },
    { id: 'full-beard', label: 'Full Beard', icon: '🧔‍♂️' },
    { id: 'soul-patch', label: 'Soul Patch', icon: '😎' },
  ],
  bodyType: [
    { id: 'slim', label: 'Slim', icon: '🧍' },
    { id: 'average', label: 'Average', icon: '🧍' },
    { id: 'athletic', label: 'Athletic', icon: '💪' },
    { id: 'curvy', label: 'Curvy', icon: '🧍‍♀️' },
    { id: 'plus', label: 'Plus Size', icon: '🧍' },
  ],
  clothing: [
    { id: 'suit', label: 'Business Suit', icon: '👔', color: '#2c3e50' },
    { id: 'casual', label: 'Casual', icon: '👕', color: '#3498db' },
    { id: 'hoodie', label: 'Hoodie', icon: '🧥', color: '#34495e' },
    { id: 'tshirt', label: 'T-Shirt', icon: '👕', color: '#e74c3c' },
    { id: 'dress', label: 'Dress', icon: '👗', color: '#9b59b6' },
    { id: 'blazer', label: 'Blazer', icon: '🧥', color: '#1abc9c' },
    { id: 'crypto', label: 'Crypto Merch', icon: '₿', color: '#f39c12' },
    { id: 'tank-top', label: 'Tank Top', icon: '🎽', color: '#e67e22' },
    { id: 'jacket', label: 'Jacket', icon: '🧥', color: '#2c3e50' },
    { id: 'vest', label: 'Vest', icon: '🦺', color: '#7f8c8d' },
    { id: 'polo', label: 'Polo', icon: '👕', color: '#16a085' },
    { id: 'sweater', label: 'Sweater', icon: '🧶', color: '#8e44ad' },
    { id: 'crop-top', label: 'Crop Top', icon: '👚', color: '#e91e63' },
  ],
  accessories: [
    { id: 'none', label: 'None', icon: '✖️' },
    { id: 'glasses', label: 'Glasses', icon: '👓' },
    { id: 'sunglasses', label: 'Sunglasses', icon: '🕶️' },
    { id: 'earrings', label: 'Earrings', icon: '💎' },
    { id: 'necklace', label: 'Necklace', icon: '📿' },
    { id: 'headphones', label: 'Headphones', icon: '🎧' },
    { id: 'hat', label: 'Hat', icon: '🧢' },
    { id: 'bandana', label: 'Bandana', icon: '🎀' },
    { id: 'beanie', label: 'Beanie', icon: '🧢' },
    { id: 'cap-backwards', label: 'Cap Backwards', icon: '🔄' },
    { id: 'chain-necklace', label: 'Chain', icon: '⛓️' },
    { id: 'watch', label: 'Watch', icon: '⌚' },
    { id: 'rings', label: 'Rings', icon: '💍' },
  ],
  background: [
    { id: 'dark', label: 'Dark', color: '#0f0f0f' },
    { id: 'space', label: 'Space', color: '#0B0C10' },
    { id: 'ocean', label: 'Ocean', color: '#0d1b2a' },
    { id: 'forest', label: 'Forest', color: '#0f1419' },
    { id: 'sunset', label: 'Sunset', color: '#2A2416' },
    { id: 'neon', label: 'Neon', color: '#1a1a2e' },
    { id: 'crypto', label: 'Crypto', color: '#1a1a1a' },
  ]
}

const dicebearStyles = [
  { id: 'personas', label: 'Personas' },
  { id: 'notionists', label: 'Notionists' },
  { id: 'avataaars', label: 'Avataaars' },
  { id: 'lorelei', label: 'Lorelei' },
  { id: 'micah', label: 'Micah' },
]

const defaultAvatar = {
  skinTone: 'medium',
  faceShape: 'oval',
  hairStyle: 'short',
  hairColor: 'black',
  eyeColor: 'brown',
  eyebrowStyle: 'thick',
  facialHair: 'none',
  bodyType: 'average',
  clothing: 'casual',
  accessories: 'none',
  background: 'dark',
  name: 'My Avatar',
  dicebearStyle: 'personas'
}

function buildDicebearUrl(avatar, size = 200) {
  const style = avatar.dicebearStyle || 'personas'
  const seed = avatar.name || 'default'
  
  const skinOpt = avatarOptions.skinTone.find(s => s.id === avatar.skinTone)
  const hairOpt = avatarOptions.hairColor.find(h => h.id === avatar.hairColor)
  const bgOpt = avatarOptions.background.find(b => b.id === avatar.background)
  
  const skinColor = skinOpt ? skinOpt.color.replace('#', '') : 'c68642'
  const hairColor = hairOpt ? hairOpt.color.replace('#', '') : '1a1a1a'
  const backgroundColor = bgOpt ? bgOpt.color.replace('#', '') : '0f0f0f'
  
  const params = new URLSearchParams({
    seed: seed,
    backgroundColor: backgroundColor,
    size: size.toString()
  })
  
  if (style === 'personas' || style === 'notionists') {
    params.append('skinColor', skinColor)
  }
  
  return `https://api.dicebear.com/9.x/${style}/svg?${params.toString()}`
}

function AvatarPreview({ avatar, size = 200 }) {
  const bgOpt = avatarOptions.background.find(b => b.id === avatar.background)
  const bgColor = bgOpt ? bgOpt.color : '#0f0f0f'
  const avatarUrl = buildDicebearUrl(avatar, size)
  
  return (
    <div style={{
      width: size,
      height: size,
      background: bgColor,
      borderRadius: 16,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 40px rgba(0, 212, 255, 0.15)'
    }}>
      <img 
        src={avatarUrl}
        alt={avatar.name || 'Avatar'}
        style={{
          width: '85%',
          height: '85%',
          objectFit: 'contain'
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'white',
        fontSize: 12,
        fontWeight: 600,
        textShadow: '0 2px 4px rgba(0,0,0,0.8)'
      }}>
        {avatar.name}
      </div>
    </div>
  )
}

function Accordion({ title, icon, isOpen, onToggle, children }) {
  return (
    <div style={{
      background: '#1a1a1a',
      borderRadius: 10,
      marginBottom: 8,
      border: isOpen ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid rgba(255,255,255,0.1)',
      overflow: 'hidden',
      transition: 'border-color 0.2s ease'
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: isOpen ? '#00D4FF' : '#ccc',
          transition: 'color 0.2s ease'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
          <span>{icon}</span>
          {title}
        </span>
        <span style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          fontSize: 12
        }}>
          ▼
        </span>
      </button>
      <div style={{
        maxHeight: isOpen ? 400 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.3s ease'
      }}>
        <div style={{ padding: '0 14px 14px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function OptionGrid({ options, selected, onSelect, type = 'icon' }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: 6 
    }}>
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          style={{
            width: type === 'color' ? 32 : 'auto',
            height: type === 'color' ? 32 : 34,
            minWidth: type === 'color' ? 32 : 54,
            padding: type === 'color' ? 0 : '6px 10px',
            borderRadius: type === 'color' ? '50%' : 8,
            border: selected === opt.id 
              ? '2px solid #00D4FF' 
              : '1px solid rgba(255,255,255,0.15)',
            background: type === 'color' ? opt.color : 'rgba(255,255,255,0.05)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: type === 'color' ? 12 : 11,
            transition: 'all 0.2s',
            boxShadow: selected === opt.id ? '0 0 12px rgba(0,212,255,0.5)' : 'none'
          }}
        >
          {type !== 'color' && (opt.icon ? `${opt.icon}` : opt.label)}
        </button>
      ))}
    </div>
  )
}

function StyleSelector({ selected, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {dicebearStyles.map(style => {
        const previewUrl = `https://api.dicebear.com/9.x/${style.id}/svg?seed=preview&size=48&backgroundColor=1a1a1a`
        return (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: 8,
              background: selected === style.id ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255,255,255,0.05)',
              border: selected === style.id ? '2px solid #00D4FF' : '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: selected === style.id ? '0 0 15px rgba(0,212,255,0.3)' : 'none'
            }}
          >
            <img 
              src={previewUrl} 
              alt={style.label}
              style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 6,
                background: '#1a1a1a'
              }} 
            />
            <span style={{ 
              fontSize: 10, 
              color: selected === style.id ? '#00D4FF' : '#888',
              fontWeight: 600
            }}>
              {style.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export { avatarOptions, defaultAvatar, AvatarPreview, buildDicebearUrl }

export default function AvatarCreator({ isOpen, onClose, onSave, isPremium = false }) {
  const [avatar, setAvatar] = useState(() => {
    const saved = localStorage.getItem('pulse-user-avatar')
    if (saved) {
      const parsed = JSON.parse(saved)
      return { ...defaultAvatar, ...parsed }
    }
    return defaultAvatar
  })
  
  const [openAccordion, setOpenAccordion] = useState('face')
  
  const updateAvatar = useCallback((key, value) => {
    setAvatar(prev => ({ ...prev, [key]: value }))
  }, [])
  
  const handleSave = useCallback(() => {
    localStorage.setItem('pulse-user-avatar', JSON.stringify(avatar))
    onSave?.(avatar)
    onClose?.()
  }, [avatar, onSave, onClose])
  
  const handleRandomize = useCallback(() => {
    const randomSeed = Math.random().toString(36).substring(2, 10)
    const random = {
      skinTone: avatarOptions.skinTone[Math.floor(Math.random() * avatarOptions.skinTone.length)].id,
      faceShape: avatarOptions.faceShape[Math.floor(Math.random() * avatarOptions.faceShape.length)].id,
      hairStyle: avatarOptions.hairStyle[Math.floor(Math.random() * avatarOptions.hairStyle.length)].id,
      hairColor: avatarOptions.hairColor[Math.floor(Math.random() * avatarOptions.hairColor.length)].id,
      eyeColor: avatarOptions.eyeColor[Math.floor(Math.random() * avatarOptions.eyeColor.length)].id,
      eyebrowStyle: avatarOptions.eyebrowStyle[Math.floor(Math.random() * avatarOptions.eyebrowStyle.length)].id,
      facialHair: avatarOptions.facialHair[Math.floor(Math.random() * avatarOptions.facialHair.length)].id,
      bodyType: avatarOptions.bodyType[Math.floor(Math.random() * avatarOptions.bodyType.length)].id,
      clothing: avatarOptions.clothing[Math.floor(Math.random() * avatarOptions.clothing.length)].id,
      accessories: avatarOptions.accessories[Math.floor(Math.random() * avatarOptions.accessories.length)].id,
      background: avatarOptions.background[Math.floor(Math.random() * avatarOptions.background.length)].id,
      name: avatar.name || randomSeed,
      dicebearStyle: avatar.dicebearStyle
    }
    setAvatar(random)
  }, [avatar.name, avatar.dicebearStyle])
  
  const toggleAccordion = useCallback((id) => {
    setOpenAccordion(prev => prev === id ? null : id)
  }, [])
  
  if (!isOpen) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.92)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }} onClick={onClose}>
      <div style={{
        background: '#0f0f0f',
        borderRadius: 16,
        border: '1px solid rgba(0, 212, 255, 0.2)',
        width: '100%',
        maxWidth: 720,
        maxHeight: '92vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 0 60px rgba(0, 212, 255, 0.1)'
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: '#141414'
        }}>
          <h2 style={{ 
            margin: 0, 
            color: '#00D4FF', 
            fontSize: 18,
            fontFamily: 'Orbitron, sans-serif',
            textShadow: '0 0 20px rgba(0, 212, 255, 0.4)'
          }}>
            Avatar Creator
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#888',
              fontSize: 18,
              cursor: 'pointer',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 16
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gridTemplateRows: 'auto auto',
            gap: 12
          }}
          className="avatar-bento-grid"
          >
            <div style={{
              gridRow: 'span 2',
              background: '#141414',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              minHeight: 280
            }}>
              <AvatarPreview avatar={avatar} size={220} />
            </div>
            
            <div style={{
              background: '#141414',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.08)',
              padding: 16
            }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6, display: 'block' }}>
                  Avatar Name
                </label>
                <input
                  type="text"
                  value={avatar.name}
                  onChange={e => updateAvatar('name', e.target.value)}
                  placeholder="Enter name..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: 'white',
                    fontSize: 13
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  Avatar Style
                </label>
                <StyleSelector 
                  selected={avatar.dicebearStyle || 'personas'} 
                  onSelect={v => updateAvatar('dicebearStyle', v)} 
                />
              </div>
              
              <button
                onClick={handleRandomize}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.2), rgba(0, 212, 255, 0.2))',
                  border: '1px solid rgba(157, 78, 221, 0.4)',
                  borderRadius: 8,
                  color: '#c084fc',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s'
                }}
              >
                🎲 Randomize
              </button>
            </div>
            
            <div style={{
              background: '#141414',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.08)',
              padding: 12,
              maxHeight: 320,
              overflowY: 'auto'
            }}>
              <Accordion 
                title="Face & Skin" 
                icon="👤" 
                isOpen={openAccordion === 'face'}
                onToggle={() => toggleAccordion('face')}
              >
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#666', marginBottom: 6, fontWeight: 600 }}>SKIN TONE</div>
                  <OptionGrid 
                    options={avatarOptions.skinTone} 
                    selected={avatar.skinTone} 
                    onSelect={v => updateAvatar('skinTone', v)} 
                    type="color" 
                  />
                </div>
              </Accordion>
              
              <Accordion 
                title="Hair" 
                icon="💇" 
                isOpen={openAccordion === 'hair'}
                onToggle={() => toggleAccordion('hair')}
              >
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: '#666', marginBottom: 6, fontWeight: 600 }}>HAIR STYLE</div>
                  <OptionGrid 
                    options={avatarOptions.hairStyle} 
                    selected={avatar.hairStyle} 
                    onSelect={v => updateAvatar('hairStyle', v)} 
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#666', marginBottom: 6, fontWeight: 600 }}>HAIR COLOR</div>
                  <OptionGrid 
                    options={avatarOptions.hairColor} 
                    selected={avatar.hairColor} 
                    onSelect={v => updateAvatar('hairColor', v)} 
                    type="color" 
                  />
                </div>
              </Accordion>
              
              <Accordion 
                title="Clothing & Style" 
                icon="👔" 
                isOpen={openAccordion === 'clothing'}
                onToggle={() => toggleAccordion('clothing')}
              >
                <OptionGrid 
                  options={avatarOptions.clothing} 
                  selected={avatar.clothing} 
                  onSelect={v => updateAvatar('clothing', v)} 
                />
              </Accordion>
              
              <Accordion 
                title="Accessories" 
                icon="🕶️" 
                isOpen={openAccordion === 'accessories'}
                onToggle={() => toggleAccordion('accessories')}
              >
                <OptionGrid 
                  options={avatarOptions.accessories} 
                  selected={avatar.accessories} 
                  onSelect={v => updateAvatar('accessories', v)} 
                />
              </Accordion>
              
              <Accordion 
                title="Background" 
                icon="🎨" 
                isOpen={openAccordion === 'background'}
                onToggle={() => toggleAccordion('background')}
              >
                <OptionGrid 
                  options={avatarOptions.background} 
                  selected={avatar.background} 
                  onSelect={v => updateAvatar('background', v)} 
                  type="color" 
                />
              </Accordion>
            </div>
          </div>
          
          {!isPremium && (
            <div style={{
              marginTop: 12,
              padding: 12,
              background: 'rgba(249, 115, 22, 0.08)',
              border: '1px solid rgba(249, 115, 22, 0.25)',
              borderRadius: 10,
              fontSize: 12,
              color: '#f97316',
              textAlign: 'center'
            }}>
              Upgrade to Premium to unlock all customization options!
            </div>
          )}
        </div>
        
        <div style={{
          display: 'flex',
          gap: 12,
          padding: 16,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          background: '#141414'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              color: '#888',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #00D4FF, #9D4EDD)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
              transition: 'all 0.2s'
            }}
          >
            Save Avatar
          </button>
        </div>
      </div>
      
      <style>{`
        @media (max-width: 768px) {
          .avatar-bento-grid {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto !important;
          }
          .avatar-bento-grid > div:first-child {
            grid-row: span 1 !important;
          }
        }
      `}</style>
    </div>
  )
}
