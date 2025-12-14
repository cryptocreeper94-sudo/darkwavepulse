import { useEffect, useRef, useCallback } from 'react';

const generateSessionId = () => {
  let sessionId = sessionStorage.getItem('pulse_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    sessionStorage.setItem('pulse_session_id', sessionId);
  }
  return sessionId;
};

export default function useAnalytics(tenantId = 'pulse') {
  const sessionId = useRef(generateSessionId());
  const pageStartTime = useRef(Date.now());
  const lastPage = useRef('');
  
  const trackPageView = useCallback(async (page) => {
    if (page === lastPage.current) return;
    
    if (lastPage.current && pageStartTime.current) {
      const duration = Math.round((Date.now() - pageStartTime.current) / 1000);
      if (duration > 0) {
        try {
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              page: lastPage.current,
              sessionId: sessionId.current,
              tenantId,
              duration,
            }),
          });
        } catch (e) {}
      }
    }
    
    lastPage.current = page;
    pageStartTime.current = Date.now();
    
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          referrer: document.referrer || null,
          sessionId: sessionId.current,
          tenantId,
        }),
      });
    } catch (e) {
      console.warn('Analytics tracking failed:', e);
    }
  }, [tenantId]);
  
  useEffect(() => {
    const currentPath = window.location.pathname + window.location.hash;
    trackPageView(currentPath);
    
    const handleBeforeUnload = () => {
      if (lastPage.current && pageStartTime.current) {
        const duration = Math.round((Date.now() - pageStartTime.current) / 1000);
        navigator.sendBeacon('/api/analytics/track', JSON.stringify({
          page: lastPage.current,
          sessionId: sessionId.current,
          tenantId,
          duration,
        }));
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && lastPage.current && pageStartTime.current) {
        const duration = Math.round((Date.now() - pageStartTime.current) / 1000);
        navigator.sendBeacon('/api/analytics/track', JSON.stringify({
          page: lastPage.current,
          sessionId: sessionId.current,
          tenantId,
          duration,
        }));
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tenantId, trackPageView]);
  
  return { trackPageView, sessionId: sessionId.current };
}
