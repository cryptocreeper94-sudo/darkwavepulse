import { useState, useEffect, useSyncExternalStore } from 'react'

const MOBILE_BREAKPOINT = 1024

function getSnapshot() {
  if (typeof window === 'undefined') return false
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
}

function getServerSnapshot() {
  return false
}

function subscribe(callback) {
  if (typeof window === 'undefined') return () => {}
  const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function useResponsiveValue(mobileValue, desktopValue) {
  const isMobile = useIsMobile()
  return isMobile ? mobileValue : desktopValue
}

export function useViewportBreakpoint() {
  const isMobile = useIsMobile()
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
  const isVerySmall = screenWidth < 400
  return {
    isMobile,
    isVerySmall,
    breakpoint: isMobile ? 'mobile' : 'desktop',
    gaugeSize: isVerySmall ? 110 : (isMobile ? 130 : 160),
    arrowSize: isVerySmall ? 20 : (isMobile ? 24 : 32),
    dotSize: isVerySmall ? 5 : (isMobile ? 6 : 8),
  }
}
