import { useAvatar } from '../../context/AvatarContext'
import { buildDicebearUrl, avatarOptions } from './AvatarCreator'

export default function MiniAvatar({ size = 32, onClick = null, showFallback = true }) {
  const { avatar, isCustomMode } = useAvatar()
  
  const bg = avatarOptions.background.find(b => b.id === avatar.background) || avatarOptions.background[0]
  
  if (!isCustomMode && showFallback) {
    return (
      <div 
        onClick={onClick}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFA500, #FF6B00)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: onClick ? 'pointer' : 'default',
          boxShadow: '0 2px 8px rgba(255, 165, 0, 0.3)',
          fontSize: size * 0.5
        }}
      >
        🐱
      </div>
    )
  }
  
  const avatarUrl = buildDicebearUrl(avatar, size * 2)
  
  return (
    <div 
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        border: '2px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <img 
        src={avatarUrl}
        alt={avatar.name || 'Avatar'}
        style={{
          width: '90%',
          height: '90%',
          objectFit: 'contain'
        }}
      />
    </div>
  )
}
