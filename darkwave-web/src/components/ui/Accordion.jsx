import { useState } from 'react'

export function AccordionItem({ title, icon, children, isOpen, onToggle }) {
  return (
    <div className={`accordion-item ${isOpen ? 'open' : ''}`}>
      <button className="accordion-header" onClick={onToggle}>
        <span className="accordion-title">
          {icon && <span>{icon}</span>}
          {title}
        </span>
        <span className="accordion-arrow">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>
      <div className="accordion-content">
        <div className="accordion-body">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function Accordion({ children, singleOpen = true, defaultOpen = null }) {
  const [openItems, setOpenItems] = useState(
    defaultOpen !== null ? [defaultOpen] : []
  )
  
  const items = Array.isArray(children) ? children : [children]
  
  const handleToggle = (index) => {
    if (singleOpen) {
      setOpenItems(prev => prev.includes(index) ? [] : [index])
    } else {
      setOpenItems(prev => 
        prev.includes(index) 
          ? prev.filter(i => i !== index)
          : [...prev, index]
      )
    }
  }
  
  return (
    <div className="accordion">
      {items.map((child, index) => {
        if (child.type === AccordionItem) {
          return (
            <AccordionItem
              key={index}
              {...child.props}
              isOpen={openItems.includes(index)}
              onToggle={() => handleToggle(index)}
            />
          )
        }
        return child
      })}
    </div>
  )
}
