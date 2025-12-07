// Affiliate Program JavaScript
// Handles referral link generation, stats display, and sharing

let affiliateData = null;

// AI Agent Persistence - Save/Load chat history
function saveFloatingAIHistory() {
  const messagesDiv = document.getElementById('floatingCatMessages');
  if (messagesDiv) {
    const messages = messagesDiv.innerHTML;
    localStorage.setItem('darkwave_ai_chat_history', messages);
  }
}

function loadFloatingAIHistory() {
  const messagesDiv = document.getElementById('floatingCatMessages');
  const savedHistory = localStorage.getItem('darkwave_ai_chat_history');
  
  if (savedHistory && messagesDiv) {
    messagesDiv.innerHTML = savedHistory;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    console.log('✅ AI chat history restored from localStorage');
  }
}

function clearFloatingAIHistory() {
  localStorage.removeItem('darkwave_ai_chat_history');
  console.log('🗑️ AI chat history cleared');
}

// Load affiliate stats on page load
async function loadAffiliateStats() {
  try {
    const userId = window.currentUser?.id;
    
    if (!userId) {
      console.log('⚠️ No user logged in, skipping affiliate stats load');
      return;
    }

    // Generate/retrieve referral code
    const response = await fetch('/api/referral/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to load affiliate stats');
    }

    affiliateData = await response.json();

    // Update UI with stats
    document.getElementById('affiliateUrlInput').value = affiliateData.url;
    document.getElementById('affiliateClicks').textContent = affiliateData.stats.clicks || 0;
    document.getElementById('affiliateSignups').textContent = affiliateData.stats.signups || 0;
    document.getElementById('affiliateConversions').textContent = affiliateData.stats.conversions || 0;
    document.getElementById('affiliateEarnings').textContent = `$${(affiliateData.stats.pendingEarnings || 0).toFixed(2)}`;

    console.log('✅ Affiliate stats loaded', affiliateData);
  } catch (error) {
    console.error('❌ Failed to load affiliate stats:', error);
    document.getElementById('affiliateUrlInput').value = 'Error loading link';
  }
}

// Copy affiliate link to clipboard
async function copyAffiliateLink() {
  const input = document.getElementById('affiliateUrlInput');
  const successMsg = document.getElementById('copySuccess');

  try {
    await navigator.clipboard.writeText(input.value);
    successMsg.style.display = 'block';
    setTimeout(() => {
      successMsg.style.display = 'none';
    }, 3000);
    console.log('✅ Affiliate link copied to clipboard');
  } catch (error) {
    console.error('❌ Failed to copy:', error);
    // Fallback for older browsers
    input.select();
    document.execCommand('copy');
    successMsg.style.display = 'block';
    setTimeout(() => {
      successMsg.style.display = 'none';
    }, 3000);
  }
}

// Share affiliate link via Web Share API or copy
async function shareAffiliateLink() {
  const shareUrl = affiliateData?.url || document.getElementById('affiliateUrlInput').value;
  const shareText = `Join me on DarkWave Pulse - the most transparent crypto & stock analysis platform! Get professional-grade insights, AI-powered predictions, and real Solana blockchain data. Subscribe today and I earn a commission! ${shareUrl}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Join DarkWave Pulse',
        text: shareText,
        url: shareUrl,
      });
      console.log('✅ Shared successfully via Web Share API');
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('❌ Share failed:', error);
        copyAffiliateLink();
      }
    }
  } else {
    // Fallback: copy to clipboard
    copyAffiliateLink();
    alert('Link copied to clipboard! Share it with your friends to earn commissions.');
  }
}

// Track referral code from URL on page load
function trackReferralFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');

  if (refCode) {
    // Store referral code in sessionStorage for later use during signup
    sessionStorage.setItem('referralCode', refCode);

    // Hash IP for tracking (privacy-preserving)
    const ipHash = 'hashed_' + Date.now(); // Simplified for client-side
    const userAgent = navigator.userAgent;

    // Track the click
    fetch('/api/referral/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: refCode,
        ipHash,
        userAgent,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('🔗 Referral click tracked:', refCode);
      })
      .catch((error) => {
        console.error('❌ Failed to track referral:', error);
      });
  }
}

// Initialize affiliate system
document.addEventListener('DOMContentLoaded', function () {
  // Track referral from URL params
  trackReferralFromUrl();

  // Load affiliate stats after user logs in
  setTimeout(() => {
    if (window.currentUser?.id) {
      loadAffiliateStats();
    }
  }, 2000); // Wait 2 seconds for auth to complete
  
  // Restore AI chat history from localStorage
  setTimeout(() => {
    loadFloatingAIHistory();
  }, 500); // Wait for DOM to be ready
});

console.log('✅ Affiliate system loaded');
