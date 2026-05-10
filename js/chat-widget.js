(function () {
  'use strict';

  const CHATBOT_URL = 'https://postiz.unlockmxpro.com/chatbot';
  const SITE = document.documentElement.lang === 'en' ? 'msp' : 'unlock';
  const POLL_INTERVAL = 4000;

  const T = {
    msp: {
      title: 'MA MSP Support',
      subtitle: 'Typically replies instantly',
      placeholder: 'Ask us anything...',
      send: 'Send',
      welcome: "Hi! I'm the MA MSP virtual assistant. How can I help you today?",
      telegram: 'Chat on Telegram',
    },
    unlock: {
      title: 'Soporte UnlockMxPro',
      subtitle: 'Responde al instante',
      placeholder: 'Escríbenos lo que necesitas...',
      send: 'Enviar',
      welcome: '¡Hola! Soy el asistente virtual de UnlockMxPro. ¿En qué te ayudo hoy?',
      telegram: 'Chatear en Telegram',
    },
  };
  const lang = T[SITE];

  const sessionId = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  let pollTimer = null;
  let open = false;

  const style = document.createElement('style');
  style.textContent = `
    #umx-chat-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 9998;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #38bdf8);
      box-shadow: 0 4px 20px rgba(37,99,235,.45);
      border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: transform .2s;
    }
    #umx-chat-btn:hover { transform: scale(1.08); }
    #umx-chat-btn svg { width: 26px; height: 26px; fill: white; }
    #umx-chat-badge {
      position: absolute; top: -4px; right: -4px;
      background: #ef4444; color: white; font-size: 11px; font-weight: 700;
      width: 18px; height: 18px; border-radius: 50%; display: none;
      align-items: center; justify-content: center;
      font-family: Inter, sans-serif;
    }
    #umx-chat-window {
      position: fixed; bottom: 90px; right: 24px; z-index: 9999;
      width: 360px; max-width: calc(100vw - 32px);
      background: #fff; border-radius: 20px;
      box-shadow: 0 8px 40px rgba(0,0,0,.18);
      display: none; flex-direction: column; overflow: hidden;
      font-family: Inter, system-ui, sans-serif;
      border: 1px solid #e2e8f0;
    }
    #umx-chat-window.open { display: flex; }
    #umx-chat-header {
      background: linear-gradient(135deg, #2563eb, #38bdf8);
      padding: 16px 18px; color: white; display: flex; align-items: center; gap: 12px;
    }
    #umx-chat-header .avatar {
      width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,.25);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    #umx-chat-header .avatar svg { width: 20px; height: 20px; fill: white; }
    #umx-chat-header .info { flex: 1; }
    #umx-chat-header .title { font-weight: 700; font-size: .95rem; }
    #umx-chat-header .subtitle { font-size: .75rem; opacity: .85; margin-top: 2px; }
    #umx-chat-close {
      background: none; border: none; color: white; cursor: pointer;
      font-size: 1.3rem; line-height: 1; padding: 4px; opacity: .8;
    }
    #umx-chat-close:hover { opacity: 1; }
    #umx-chat-messages {
      flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column;
      gap: 10px; max-height: 340px; background: #f8fafc;
    }
    .umx-msg { display: flex; flex-direction: column; max-width: 82%; }
    .umx-msg.bot { align-self: flex-start; }
    .umx-msg.user { align-self: flex-end; }
    .umx-msg .bubble {
      padding: 10px 14px; border-radius: 16px; font-size: .88rem; line-height: 1.5;
    }
    .umx-msg.bot .bubble { background: white; color: #1e293b; border: 1px solid #e2e8f0; border-bottom-left-radius: 4px; }
    .umx-msg.user .bubble { background: #2563eb; color: white; border-bottom-right-radius: 4px; }
    .umx-msg .ts { font-size: .7rem; color: #94a3b8; margin-top: 3px; }
    .umx-msg.user .ts { text-align: right; }
    .umx-typing .bubble { display: flex; gap: 4px; align-items: center; padding: 12px 16px; }
    .umx-typing .dot {
      width: 7px; height: 7px; border-radius: 50%; background: #94a3b8;
      animation: umx-bounce .9s infinite;
    }
    .umx-typing .dot:nth-child(2) { animation-delay: .15s; }
    .umx-typing .dot:nth-child(3) { animation-delay: .3s; }
    @keyframes umx-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
    #umx-chat-footer { padding: 12px 14px; border-top: 1px solid #e2e8f0; background: white; }
    #umx-chat-input-row { display: flex; gap: 8px; }
    #umx-chat-input {
      flex: 1; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 9px 13px; font-size: .88rem; outline: none; font-family: inherit;
      resize: none; background: #f8fafc; color: #1e293b;
    }
    #umx-chat-input:focus { border-color: #2563eb; background: white; }
    #umx-chat-send {
      background: linear-gradient(135deg, #2563eb, #38bdf8);
      border: none; border-radius: 10px; padding: 9px 14px;
      cursor: pointer; color: white; display: flex; align-items: center; justify-content: center;
    }
    #umx-chat-send:hover { opacity: .9; }
    #umx-chat-send svg { width: 18px; height: 18px; fill: white; }
    #umx-tg-link {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      margin-top: 10px; color: #2563eb; font-size: .78rem; text-decoration: none; font-weight: 500;
    }
    #umx-tg-link:hover { text-decoration: underline; }
  `;
  document.head.appendChild(style);

  const tgHref = SITE === 'msp'
    ? 'https://t.me/mamspnow'
    : 'https://wa.me/+524661470586?text=Hola%20UnlockMxPro';

  const btn = document.createElement('button');
  btn.id = 'umx-chat-btn';
  btn.setAttribute('aria-label', 'Open chat');
  btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>
    <span id="umx-chat-badge"></span>`;

  const win = document.createElement('div');
  win.id = 'umx-chat-window';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', lang.title);
  win.innerHTML = `
    <div id="umx-chat-header">
      <div class="avatar"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg></div>
      <div class="info">
        <div class="title">${lang.title}</div>
        <div class="subtitle">● ${lang.subtitle}</div>
      </div>
      <button id="umx-chat-close" aria-label="Close">✕</button>
    </div>
    <div id="umx-chat-messages"></div>
    <div id="umx-chat-footer">
      <div id="umx-chat-input-row">
        <textarea id="umx-chat-input" rows="1" placeholder="${lang.placeholder}"></textarea>
        <button id="umx-chat-send" aria-label="${lang.send}">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
      <a href="${tgHref}" target="_blank" id="umx-tg-link">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#2563eb"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.927 14.144l-2.95-.924c-.641-.2-.653-.641.136-.953l11.57-4.461c.537-.194 1.006.131.836.947l-.625.468z"/></svg>
        ${lang.telegram}
      </a>
    </div>`;

  document.body.appendChild(btn);
  document.body.appendChild(win);

  const messagesEl = win.querySelector('#umx-chat-messages');
  const inputEl = win.querySelector('#umx-chat-input');
  const badge = btn.querySelector('#umx-chat-badge');

  let unread = 0;

  function now() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function addMessage(text, role) {
    const div = document.createElement('div');
    div.className = `umx-msg ${role}`;
    div.innerHTML = `<div class="bubble">${text}</div><div class="ts">${now()}</div>`;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    if (role === 'bot' && !open) {
      unread++;
      badge.textContent = unread;
      badge.style.display = 'flex';
    }
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'umx-msg bot umx-typing';
    el.id = 'umx-typing';
    el.innerHTML = '<div class="bubble"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const el = messagesEl.querySelector('#umx-typing');
    if (el) el.remove();
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    inputEl.style.height = 'auto';
    addMessage(text, 'user');
    showTyping();

    try {
      const resp = await fetch(`${CHATBOT_URL}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId, site: SITE }),
      });
      const data = await resp.json();
      hideTyping();
      addMessage(data.reply, 'bot');
    } catch {
      hideTyping();
      addMessage(lang.fallback || 'Error — please try again.', 'bot');
    }
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(async () => {
      try {
        const resp = await fetch(`${CHATBOT_URL}/poll/${sessionId}`);
        const data = await resp.json();
        if (data.reply) addMessage(data.reply, 'bot');
      } catch {}
    }, POLL_INTERVAL);
  }

  btn.addEventListener('click', () => {
    open = !open;
    win.classList.toggle('open', open);
    if (open) {
      unread = 0;
      badge.style.display = 'none';
      inputEl.focus();
      if (messagesEl.children.length === 0) addMessage(lang.welcome, 'bot');
      startPolling();
    }
  });

  win.querySelector('#umx-chat-close').addEventListener('click', () => {
    open = false;
    win.classList.remove('open');
  });

  win.querySelector('#umx-chat-send').addEventListener('click', sendMessage);

  inputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
  });
})();
