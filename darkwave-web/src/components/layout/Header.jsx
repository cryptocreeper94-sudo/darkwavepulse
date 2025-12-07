import { useState } from 'react'

export default function Header({ onMenuToggle, isMenuOpen }) {
  return (
    <header className="header">
      <button 
        className={`hamburger-btn ${isMenuOpen ? 'active' : ''}`}
        onClick={onMenuToggle}
        aria-label="Menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>
      
      <h1 className="header-title">PULSE</h1>
      
      <span className="header-version">v2.0</span>
    </header>
  )
}
