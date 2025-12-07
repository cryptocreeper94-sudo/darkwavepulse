import { useState, useRef, useEffect } from 'react'

export default function Carousel({ 
  children, 
  showArrows = true, 
  showDots = true,
  itemWidth = 280,
  gap = 12 
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const trackRef = useRef(null)
  const containerRef = useRef(null)
  
  const items = Array.isArray(children) ? children : [children]
  const itemCount = items.length
  
  const getVisibleItems = () => {
    if (!containerRef.current) return 1
    const containerWidth = containerRef.current.offsetWidth
    return Math.max(1, Math.floor(containerWidth / (itemWidth + gap)))
  }
  
  const getMaxIndex = () => {
    return Math.max(0, itemCount - getVisibleItems())
  }
  
  const next = () => {
    const maxIndex = getMaxIndex()
    setCurrentIndex(prev => prev < maxIndex ? prev + 1 : 0)
  }
  
  const prev = () => {
    const maxIndex = getMaxIndex()
    setCurrentIndex(prev => prev > 0 ? prev - 1 : maxIndex)
  }
  
  const goToIndex = (index) => {
    setCurrentIndex(Math.min(index, getMaxIndex()))
  }
  
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX)
  }
  
  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) next()
      else prev()
    }
  }
  
  const offset = currentIndex * (itemWidth + gap)
  const pageCount = Math.ceil(itemCount / Math.max(1, getVisibleItems()))
  const currentPage = Math.floor(currentIndex / Math.max(1, getVisibleItems()))
  
  const needsNav = itemCount > getVisibleItems()
  
  return (
    <div className="carousel" ref={containerRef}>
      <div 
        className="carousel-track"
        ref={trackRef}
        style={{ transform: `translateX(-${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((child, index) => (
          <div key={index} className="carousel-item" style={{ width: itemWidth }}>
            {child}
          </div>
        ))}
      </div>
      
      {showArrows && needsNav && (
        <>
          <button className="carousel-nav prev" onClick={prev}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button className="carousel-nav next" onClick={next}>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}
      
      {showDots && needsNav && pageCount > 1 && (
        <div className="carousel-dots">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              className={`carousel-dot ${i === currentPage ? 'active' : ''}`}
              onClick={() => goToIndex(i * getVisibleItems())}
            />
          ))}
        </div>
      )}
    </div>
  )
}
