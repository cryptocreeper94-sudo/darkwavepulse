import{r as s,j as e,l as N,u as I,m as M,n as P,T as z,S as L,o as E,p as D,A as W,B as O,F as B,G as H,L as _,a as U,D as S,b as X,P as Y,V as $,c as V,q as k,W as q,d as K,e as Z,f as J,g as Q,h as ee,M as ae,i as te,k as se}from"./components-DJlKY0gb.js";const G=[{id:1,name:"Agent Alex",age:28,ageGroup:"young"},{id:2,name:"Agent Marcus",age:42,ageGroup:"middle"},{id:3,name:"Agent Sofia",age:26,ageGroup:"young"},{id:4,name:"Agent Raj",age:48,ageGroup:"middle"},{id:5,name:"Agent Layla",age:51,ageGroup:"middle"},{id:6,name:"Agent Blake",age:58,ageGroup:"old"},{id:7,name:"Agent Devon",age:45,ageGroup:"middle"},{id:8,name:"Agent Aria",age:31,ageGroup:"young"},{id:9,name:"Agent Mei",age:27,ageGroup:"young"},{id:10,name:"Agent Claire",age:61,ageGroup:"old"},{id:11,name:"Agent Vikram",age:39,ageGroup:"middle"},{id:12,name:"Agent Zara",age:29,ageGroup:"young"},{id:13,name:"Agent Marco",age:46,ageGroup:"middle"},{id:14,name:"Agent Jade",age:35,ageGroup:"middle"},{id:15,name:"Agent Luis",age:25,ageGroup:"young"},{id:16,name:"Agent Kaia",age:56,ageGroup:"old"},{id:17,name:"Agent Nova",age:32,ageGroup:"young"},{id:18,name:"Agent Kai",age:52,ageGroup:"middle"}];function ie({isOpen:g,onClose:o,isSubscribed:u}){const[r,l]=s.useState("all"),[m,a]=s.useState(null),n=r==="all"?G:G.filter(i=>i.ageGroup===r);return g?u?e.jsx("div",{className:"agent-selector-modal",children:e.jsx("div",{className:"agent-selector-container",children:e.jsxs("div",{className:"agent-carousel-wrapper",children:[e.jsxs("div",{className:"agent-carousel-header",children:[e.jsx("h3",{children:"Select Your Agent"}),e.jsx("button",{className:"agent-carousel-close",onClick:o,children:"×"})]}),e.jsx("div",{className:"agent-carousel-filters",children:["all","young","middle","old"].map(i=>e.jsx("button",{className:`agent-filter-btn ${r===i?"active":""}`,onClick:()=>l(i),children:i==="all"?"All":i==="young"?"Young (20-30)":i==="middle"?"Middle (35-55)":"Senior (55+)"},i))}),e.jsxs("div",{className:"agent-carousel",children:[e.jsx("button",{className:"agent-carousel-nav",children:"❮"}),e.jsx("div",{className:"agent-carousel-track",children:n.map(i=>e.jsxs("div",{className:"agent-carousel-card",onClick:()=>a(i),children:[e.jsx("div",{className:"agent-card-placeholder",children:i.name.charAt(7)}),e.jsxs("div",{className:"agent-card-info",children:[e.jsx("div",{className:"agent-card-name",children:i.name}),e.jsx("div",{className:"agent-card-age",children:i.age})]})]},i.id))}),e.jsx("button",{className:"agent-carousel-nav",children:"❯"})]}),e.jsx("div",{className:"agent-carousel-dots",children:[...Array(Math.ceil(n.length/3))].map((i,t)=>e.jsx("button",{className:`agent-dot ${t===0?"active":""}`},t))})]})})}):e.jsx("div",{className:"agent-selector-modal",children:e.jsx("div",{className:"agent-selector-container",children:e.jsxs("div",{className:"agent-selector-locked",children:[e.jsx("div",{className:"agent-lock-icon",children:"🔒"}),e.jsx("h3",{children:"Premium Feature"}),e.jsx("p",{children:"Choose from 18 AI agents"}),e.jsx("button",{className:"agent-upgrade-btn",children:"UPGRADE NOW"})]})})}):null}function re({isSubscribed:g=!1,selectedAgentId:o=1}){const[u,r]=s.useState(!1),[l,m]=s.useState(!1),[a,n]=s.useState(null);s.useEffect(()=>{const t=N.find(x=>x.id===o)||N[0];n(t)},[o]);const i=()=>{m(!l)};return e.jsxs(e.Fragment,{children:[e.jsxs("button",{className:"ai-chat-fab",onClick:i,title:a?`Chat with ${a.name}`:"Chat with AI Agent",children:[a?e.jsx("img",{src:a.image,alt:a.name,className:"ai-fab-agent-image",onError:t=>{t.target.style.display="none",t.target.nextSibling.style.display="flex"}}):null,e.jsx("div",{className:"ai-fab-fallback",style:{display:a?"none":"flex"},children:"AI"}),e.jsx("span",{className:"ai-chat-fab-glow"}),e.jsx("span",{className:"ai-chat-fab-pulse"})]}),l&&e.jsxs("div",{className:"ai-chat-panel",children:[e.jsxs("div",{className:"ai-chat-header",children:[e.jsxs("div",{className:"ai-chat-title",children:[a&&e.jsx("img",{src:a.image,alt:a.name,className:"ai-chat-header-avatar"}),e.jsx("span",{children:a?.name||"DarkWave AI"})]}),e.jsx("button",{className:"ai-chat-close",onClick:()=>m(!1),children:"×"})]}),e.jsx("div",{className:"ai-chat-body",children:e.jsxs("div",{className:"ai-chat-welcome",children:[a&&e.jsxs("div",{className:"ai-chat-agent-preview",children:[e.jsx("div",{className:"ai-chat-agent-glow"}),e.jsx("img",{src:a.image,alt:a.name,className:"ai-chat-agent-image"})]}),e.jsx("h3",{children:a?.name||"DarkWave AI Agent"}),e.jsx("p",{children:"Your personal trading assistant powered by advanced AI"}),e.jsxs("div",{className:"ai-chat-features",children:[e.jsx("div",{className:"ai-feature-item",children:"📊 Market Analysis"}),e.jsx("div",{className:"ai-feature-item",children:"🎯 Trade Signals"}),e.jsx("div",{className:"ai-feature-item",children:"🎤 Voice Control (Coming Soon)"})]}),e.jsx("button",{className:"ai-chat-select-agent",onClick:()=>r(!0),children:"Choose Different Agent"})]})}),e.jsxs("div",{className:"ai-chat-input-area",children:[e.jsx("input",{type:"text",placeholder:"Ask me anything about trading...",className:"ai-chat-input"}),e.jsx("button",{className:"ai-chat-send",children:e.jsx("svg",{width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",children:e.jsx("path",{d:"M2 21L23 12L2 3V10L17 12L2 14V21Z",fill:"currentColor"})})})]})]}),e.jsx(ie,{isOpen:u,onClose:()=>r(!1),isSubscribed:g}),e.jsx("style",{children:`
        .ai-chat-fab {
          position: fixed;
          bottom: 70px;
          right: 20px;
          width: 100px;
          height: 140px;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          overflow: visible;
          z-index: 1000;
          transition: transform 0.2s;
          padding: 0;
        }

        .ai-chat-fab:hover {
          transform: scale(1.1);
        }

        .ai-fab-agent-image {
          width: 100px;
          height: 140px;
          object-fit: contain;
          object-position: center bottom;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.6));
          position: relative;
          z-index: 2;
          animation: agentFloat 3s ease-in-out infinite;
        }

        @keyframes agentFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .ai-fab-fallback {
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #00d4ff, #0099ff);
          border-radius: 50%;
          color: white;
          font-weight: bold;
          font-size: 16px;
        }

        .ai-chat-fab-glow {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 40px;
          background: radial-gradient(ellipse, rgba(0, 212, 255, 0.7) 0%, rgba(0, 153, 255, 0.3) 40%, transparent 70%);
          filter: blur(12px);
          pointer-events: none;
          z-index: 1;
          animation: glowPulse 3s ease-in-out infinite;
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.8; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.15); }
        }

        .ai-chat-fab-pulse {
          display: none;
        }

        .ai-chat-panel {
          position: fixed;
          bottom: 160px;
          right: 20px;
          width: 360px;
          max-width: calc(100vw - 40px);
          height: 520px;
          max-height: calc(100vh - 200px);
          background: #1a1a1a;
          border-radius: 16px;
          border: 1px solid #333;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 212, 255, 0.1);
          display: flex;
          flex-direction: column;
          z-index: 1001;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ai-chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid #333;
        }

        .ai-chat-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          color: #fff;
        }

        .ai-chat-header-avatar {
          width: 40px;
          height: 50px;
          object-fit: contain;
          object-position: bottom;
        }

        .ai-chat-close {
          background: none;
          border: none;
          color: #888;
          font-size: 24px;
          cursor: pointer;
          padding: 4px 8px;
        }

        .ai-chat-close:hover {
          color: #fff;
        }

        .ai-chat-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .ai-chat-welcome {
          text-align: center;
          color: #888;
        }

        .ai-chat-agent-preview {
          position: relative;
          width: 150px;
          height: 180px;
          margin: 0 auto 16px;
        }

        .ai-chat-agent-glow {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 50px;
          background: radial-gradient(ellipse, rgba(0, 212, 255, 0.5) 0%, transparent 70%);
          filter: blur(15px);
        }

        .ai-chat-agent-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: bottom;
          position: relative;
          z-index: 2;
        }

        .ai-chat-welcome h3 {
          color: #fff;
          margin: 0 0 8px;
        }

        .ai-chat-welcome p {
          margin: 0 0 20px;
          font-size: 14px;
        }

        .ai-chat-features {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .ai-feature-item {
          background: #252525;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          color: #ccc;
        }

        .ai-chat-select-agent {
          background: linear-gradient(135deg, #00d4ff, #0099ff);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .ai-chat-select-agent:hover {
          opacity: 0.9;
        }

        .ai-chat-input-area {
          display: flex;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid #333;
        }

        .ai-chat-input {
          flex: 1;
          background: #252525;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 12px 16px;
          color: #fff;
          font-size: 14px;
        }

        .ai-chat-input::placeholder {
          color: #666;
        }

        .ai-chat-input:focus {
          outline: none;
          border-color: #00d4ff;
        }

        .ai-chat-send {
          background: linear-gradient(135deg, #00d4ff, #0099ff);
          border: none;
          border-radius: 8px;
          width: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
        }

        .ai-chat-send:hover {
          opacity: 0.9;
        }

        @media (max-width: 480px) {
          .ai-chat-panel {
            bottom: 90px;
            right: 10px;
            left: 10px;
            width: auto;
            height: calc(100vh - 160px);
          }

          .ai-chat-fab {
            bottom: 20px;
            right: 16px;
            width: 60px;
            height: 60px;
          }

          .ai-fab-agent-image {
            width: 75px;
            height: 95px;
          }
        }
      `})]})}const R={greetings:[{sass:"Hey there, trader! Ready to lose some money today?",plain:"Welcome! Let's analyze some charts together."},{sass:"Welcome back! The market didn't miss you, but I did.",plain:"Good to see you! Markets are moving."},{sass:"Oh, you're still here? Bold.",plain:"Ready for market insights?"}],tips:[{sass:"Pro tip: Buy high, sell low. Wait, that's not right...",plain:"Watch RSI and MACD for momentum signals."},{sass:"Remember: Every time you FOMO, a whale takes profits.",plain:"Always set stop losses to manage risk."},{sass:"RSI is oversold? Cool. So was your last 5 buys.",plain:"Oversold RSI can signal potential reversals."}],termResponses:{ATH:{sass:"All-Time High. That price you bought at before it crashed!",plain:"The highest price ever reached by an asset."},FOMO:{sass:"Fear Of Missing Out. The reason you bought at the top.",plain:"Anxiety about missing profitable opportunities."},HODL:{sass:"Hold On for Dear Life... or just can't spell 'hold'. Both valid!",plain:"Long-term holding strategy regardless of volatility."},RSI:{sass:"Relative Strength Index. 0-100 scale of market emotions.",plain:"A momentum oscillator measuring overbought/oversold conditions."},DeFi:{sass:"Finance without suits. Same greed, fewer middlemen.",plain:"Decentralized Finance - financial services on blockchain."}}},F={neutral:"/trading-cards-cutouts/Grumpy_orange_Crypto_Cat_ac1ff7e8.png",sideeye:"/trading-cards-cutouts/Grumpy_cat_sideeye_pose_5e52df88.png"};function ne({enabled:g=!0,interval:o=12e4}){const[u,r]=s.useState(!1),[l,m]=s.useState(null),{sassMode:a,onTermShow:n}=I(),{avatar:i,isCustomMode:t}=M(),x=s.useRef(null),v=s.useRef(null),h=s.useRef(null),y=s.useCallback((c,d="neutral")=>{h.current&&clearTimeout(h.current),m({text:c,pose:d}),r(!0),h.current=setTimeout(()=>{r(!1)},8e3)},[]),f=s.useCallback(()=>{if(!g)return;const c=["greetings","tips"],d=c[Math.floor(Math.random()*c.length)],j=R[d],p=j[Math.floor(Math.random()*j.length)],A=a?p.sass:p.plain;y(A,a?"sideeye":"neutral")},[g,a,y]);s.useEffect(()=>{if(g)return x.current=setTimeout(()=>{f()},15e3+Math.random()*15e3),v.current=setInterval(()=>{Math.random()>.7&&f()},o),()=>{x.current&&clearTimeout(x.current),v.current&&clearInterval(v.current),h.current&&clearTimeout(h.current)}},[g,o,f]),s.useEffect(()=>n?n(d=>{const j=d.term.toUpperCase(),p=R.termResponses[j];if(p){const A=a?p.sass:p.plain,C=a?"sideeye":"neutral";setTimeout(()=>{y(`${d.term}: ${A}`,C)},500)}}):void 0,[n,a,y]);const w=s.useCallback(()=>{r(!1),h.current&&clearTimeout(h.current)},[]);if(!u||!l)return null;const T=t?i.name||"Your Avatar":"CryptoCat",b=t?`👤 ${T} says...`:a?"😾 CryptoCat says...":"😺 CryptoCat says...";return e.jsxs("div",{className:"crypto-cat-popup",style:{position:"fixed",bottom:70,right:20,zIndex:9998,display:"flex",alignItems:"flex-end",gap:8,animation:"catSlideIn 0.4s ease-out",maxWidth:"calc(100vw - 40px)"},children:[e.jsxs("div",{style:{background:"linear-gradient(135deg, #1a1a1a, #0f0f0f)",border:t?"1px solid rgba(0, 212, 255, 0.4)":"1px solid rgba(255, 165, 0, 0.4)",borderRadius:16,padding:16,maxWidth:260,boxShadow:t?"0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(0, 212, 255, 0.2)":"0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(255, 165, 0, 0.2)"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8},children:[e.jsx("div",{style:{fontSize:10,color:t?"#00D4FF":"#FFA500",fontWeight:700,textTransform:"uppercase"},children:b}),e.jsx("button",{onClick:w,style:{background:"none",border:"none",color:"#666",fontSize:16,cursor:"pointer",padding:0,lineHeight:1},children:"×"})]}),e.jsx("div",{style:{fontSize:13,color:"#fff",lineHeight:1.5},children:l.text})]}),t?e.jsx(P,{size:60,showFallback:!1}):e.jsx("img",{src:F[l.pose]||F.neutral,alt:"CryptoCat",style:{width:60,height:60,objectFit:"contain",filter:"drop-shadow(0 4px 8px rgba(0,0,0,0.5))"},onError:c=>{c.target.style.display="none"}}),e.jsx("style",{children:`
        @keyframes catSlideIn {
          from { 
            opacity: 0; 
            transform: translateX(100px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }
        
        @media (max-width: 480px) {
          .crypto-cat-popup {
            left: 50% !important;
            right: auto !important;
            transform: translateX(-50%) !important;
            bottom: 80px !important;
            max-width: calc(100vw - 24px) !important;
            justify-content: center !important;
          }
        }
      `})]})}function oe(){const{isTelegram:g,telegramUser:o,isReady:u,webApp:r}=D(),l=window.location.hostname.includes("strikeagent"),[m,a]=s.useState(l?"sniper":"dashboard"),[n,i]=s.useState(null),[t,x]=s.useState(null),[v,h]=s.useState(null);s.useEffect(()=>{o?.id&&i(`telegram_${o.id}`)},[o]),s.useEffect(()=>{(async()=>{try{const c=await fetch("/api/session");if(c.ok){const d=await c.json();if(d.user?.email){i(d.user.email);const j=await fetch(`/api/users/${d.user.email}/dashboard`);if(j.ok){const p=await j.json();x(p),p.defaultLandingTab&&!l&&a(p.defaultLandingTab)}}}}catch{console.log("Session check failed, using defaults")}})()},[]),s.useEffect(()=>{r&&u&&(r.setHeaderColor?.("#1a1a2e"),r.setBackgroundColor?.("#1a1a2e"))},[r,u]);const y=(b="impact")=>{if(r?.HapticFeedback)switch(b){case"impact":r.HapticFeedback.impactOccurred("medium");break;case"notification":r.HapticFeedback.notificationOccurred("success");break;case"selection":r.HapticFeedback.selectionChanged();break}},f=b=>{y("selection"),a(b)},w=b=>{y("impact"),h(b),a("analysis")},T=()=>{switch(m){case"dashboard":return e.jsx(S,{userId:n,userConfig:t,onNavigate:f,onAnalyzeCoin:w,isTelegram:!0});case"markets":return e.jsx(ae,{isTelegram:!0});case"projects":return e.jsx(ee,{isTelegram:!0});case"learn":return e.jsx(Q,{isTelegram:!0});case"portfolio":return e.jsx(J,{isTelegram:!0});case"staking":return e.jsx(k,{requiredTier:"rm-plus",featureName:"Staking",mode:"overlay",currentTier:t?.subscriptionTier,children:e.jsx(Z,{isTelegram:!0})});case"sniper":return e.jsx(k,{requiredTier:"rm-plus",featureName:"StrikeAgent AI Trading",mode:"overlay",currentTier:t?.subscriptionTier,children:e.jsx(K,{isTelegram:!0})});case"wallet":return e.jsx(k,{requiredTier:"rm-plus",featureName:"Wallet Transactions",mode:"overlay",currentTier:t?.subscriptionTier,children:e.jsx(q,{userId:n,isTelegram:!0})});case"settings":return e.jsx(V,{userId:n,userConfig:t,setUserConfig:x,isTelegram:!0});case"v2-details":return e.jsx($,{isTelegram:!0});case"pricing":return e.jsx(Y,{userId:n,currentTier:t?.subscriptionTier,isTelegram:!0});case"analysis":return e.jsx(X,{coin:v,onBack:()=>f("dashboard"),isTelegram:!0});default:return e.jsx(S,{userId:n,userConfig:t,onNavigate:f,onAnalyzeCoin:w,isTelegram:!0})}};return u?e.jsx(W,{children:e.jsx(O,{children:e.jsx(B,{userId:n,children:e.jsxs(H,{children:[e.jsx(_,{activeTab:m,onTabChange:f,userTier:t?.subscriptionTier,isTelegram:!0,children:e.jsx("div",{style:{padding:"0 12px"},children:T()})}),e.jsx(U,{}),e.jsx(ne,{enabled:!0,interval:9e4}),e.jsx(re,{isSubscribed:t?.subscriptionTier&&t.subscriptionTier!=="free"})]})})})}):e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#1a1a2e",color:"#00d4ff"},children:[e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{width:50,height:50,border:"3px solid #00d4ff",borderTopColor:"transparent",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 16px"}}),e.jsx("p",{children:"Loading Pulse..."})]}),e.jsx("style",{children:`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `})]})}function le(){return e.jsx(z,{children:e.jsx(L,{children:e.jsx(E,{children:e.jsx(oe,{})})})})}te.createRoot(document.getElementById("root")).render(e.jsx(s.StrictMode,{children:e.jsx(se,{children:e.jsx(le,{})})}));
