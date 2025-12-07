export default function BentoGrid({ children, columns = 2, gap = 'md' }) {
  const gapClass = `gap-${gap}`
  const colClass = `bento-grid-${columns}`
  
  return (
    <div className={`bento-grid ${colClass} ${gapClass}`}>
      {children}
    </div>
  )
}

export function BentoItem({ children, span = 1, className = '' }) {
  const spanClass = span > 1 ? `bento-span-${span}` : ''
  
  return (
    <div className={`bento-item ${spanClass} ${className}`}>
      {children}
    </div>
  )
}
