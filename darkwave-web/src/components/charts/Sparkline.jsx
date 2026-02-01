import { useRef, useEffect } from 'react'

const Sparkline = ({ data, width = 100, height = 32, color = '#00D4FF', showPositive = true }) => {
  const canvasRef = useRef(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data || data.length < 2) return
    
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)
    
    ctx.clearRect(0, 0, width, height)
    
    const values = data.map(d => typeof d === 'number' ? d : d.value || d.close || 0)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    
    const isUp = values[values.length - 1] >= values[0]
    const lineColor = showPositive ? (isUp ? '#39FF14' : '#FF4444') : color
    
    const points = values.map((val, i) => ({
      x: (i / (values.length - 1)) * width,
      y: height - ((val - min) / range) * (height - 4) - 2
    }))
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, `${lineColor}33`)
    gradient.addColorStop(1, `${lineColor}00`)
    
    ctx.beginPath()
    ctx.moveTo(points[0].x, height)
    points.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(points[points.length - 1].x, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
    
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    
  }, [data, width, height, color, showPositive])
  
  if (!data || data.length < 2) {
    return (
      <div 
        style={{ 
          width, 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#444',
          fontSize: '10px'
        }}
      >
        —
      </div>
    )
  }
  
  return <canvas ref={canvasRef} style={{ display: 'block' }} />
}

export default Sparkline
