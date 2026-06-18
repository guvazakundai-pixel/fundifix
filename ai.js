// ZimFix — Kundai AI Assistant (Powered by Groq via serverless proxy)

const MENDIE_API_URL = '/api/mendie';

const MENDIE_GREETINGS = [
  "Need help fixing your device? 👋",
  "Cracked screen? I can help! 💪",
  "Tell Kundai what's broken 🔧",
  "Quick diagnosis, right here ✨"
];

const MENDIE_INITIAL_SUGGESTIONS = [
  "My screen is cracked",
  "My phone won't charge",
  "My battery drains quickly",
  "My phone fell into water",
  "My laptop won't turn on"
];

let chatHistory = [];
let isMendieTyping = false;

window.addEventListener('DOMContentLoaded', () => {
  initMendieBubble();
});

function initMendieBubble() {
  const ping = document.getElementById('mendie-ping-bubble');
  let pingIndex = 0;
  setInterval(() => {
    pingIndex = (pingIndex + 1) % MENDIE_GREETINGS.length;
    ping.textContent = MENDIE_GREETINGS[pingIndex];
  }, 8000);
}

function toggleMendieChat() {
  const panel = document.getElementById('mendie-chat-box');
  const unread = document.getElementById('mendie-unread');
  panel.classList.toggle('active');
  unread.style.display = 'none';
  if (panel.classList.contains('active')) {
    document.getElementById('mendie-input').focus();
    scrollChatBottom();
    if (chatHistory.length === 0) {
      resetMendieConversation();
    }
  }
}

function openMendieChat(directLink = false) {
  const panel = document.getElementById('mendie-chat-box');
  panel.classList.add('active');
  document.getElementById('mendie-unread').style.display = 'none';
  if (directLink || chatHistory.length === 0) {
    resetMendieConversation();
  }
  setTimeout(() => document.getElementById('mendie-input').focus(), 100);
}

function scrollChatBottom() {
  const log = document.getElementById('mendie-messages-log');
  setTimeout(() => { log.scrollTop = log.scrollHeight; }, 50);
}

function resetMendieConversation() {
  chatHistory = [];
  const log = document.getElementById('mendie-messages-log');
  log.innerHTML = '';

  addBotMessageWithTyping("Hi there! 👋 I'm Kundai, your repair assistant.", () => {
    setTimeout(() => {
      addBotMessage("Tell me what's wrong with your device and I'll help you find the best repair expert near you.");
      renderQuickReplies(MENDIE_INITIAL_SUGGESTIONS);
    }, 600);
  });
}

function addBotMessageWithTyping(text, callback) {
  if (isMendieTyping) return;
  const log = document.getElementById('mendie-messages-log');
  const typingEl = document.createElement('div');
  typingEl.className = 'chat-msg chat-msg-bot';
  typingEl.id = 'mendie-typing-indicator';
  typingEl.innerHTML = '<div class="mendie-typing-indicator"><span></span><span></span><span></span></div>';
  log.appendChild(typingEl);
  scrollChatBottom();

  const delay = Math.min(text.length * 10, 1200) + 200;
  setTimeout(() => {
    const indicator = document.getElementById('mendie-typing-indicator');
    if (indicator) indicator.remove();
    addBotMessage(text);
    if (callback) callback();
  }, delay);
}

function showGeminiTyping() {
  isMendieTyping = true;
  const log = document.getElementById('mendie-messages-log');
  const typingEl = document.createElement('div');
  typingEl.className = 'chat-msg chat-msg-bot';
  typingEl.id = 'mendie-gemini-typing';
  typingEl.innerHTML = '<div class="mendie-typing-indicator"><span></span><span></span><span></span></div>';
  log.appendChild(typingEl);
  scrollChatBottom();
}

function hideGeminiTyping() {
  isMendieTyping = false;
  const el = document.getElementById('mendie-gemini-typing');
  if (el) el.remove();
}

function addBotMessage(text, html = null) {
  const log = document.getElementById('mendie-messages-log');
  const bubble = document.createElement('div');
  bubble.className = 'chat-msg chat-msg-bot';
  bubble.style.animation = 'slideIn 0.3s ease forwards';
  if (html) {
    bubble.innerHTML = html;
  } else {
    bubble.textContent = text;
  }
  log.appendChild(bubble);
  scrollChatBottom();
}

function addUserMessage(text) {
  const log = document.getElementById('mendie-messages-log');
  const bubble = document.createElement('div');
  bubble.className = 'chat-msg chat-msg-user';
  bubble.style.animation = 'slideIn 0.3s ease forwards';
  bubble.textContent = text;
  log.appendChild(bubble);
  scrollChatBottom();
}

function renderQuickReplies(options) {
  const mount = document.getElementById('mendie-quick-replies-mount');
  mount.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quick-reply-btn';
    btn.textContent = opt;
    btn.onclick = () => handleUserInput(opt);
    mount.appendChild(btn);
  });
}

function handleMendieKeyPress(e) {
  if (e.key === 'Enter') sendMendieMessage();
}

function sendMendieMessage() {
  const input = document.getElementById('mendie-input');
  const val = input.value.trim();
  if (!val || isMendieTyping) return;
  input.value = '';
  handleUserInput(val);
}

async function handleUserInput(input) {
  addUserMessage(input);
  document.getElementById('mendie-quick-replies-mount').innerHTML = '';
  chatHistory.push({ role: 'user', text: input });

  while (chatHistory.length > 20) {
    chatHistory.shift();
  }

  showGeminiTyping();

  const maxRetries = 2;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const context = buildContext(input);

      const response = await fetch(MENDIE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          context: context
        }),
        signal: AbortSignal.timeout(30000)
      });

      const data = await response.json();

      hideGeminiTyping();

      if (data.reply) {
        chatHistory.push({ role: 'model', text: data.reply });
        processGeminiReply(data.reply, input, data.suggestions || []);
        return;
      } else {
        lastError = new Error('Empty reply from API');
      }
    } catch (error) {
      lastError = error;
      console.error(`Kundai API attempt ${attempt + 1} failed:`, error);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
    }
  }

  hideGeminiTyping();
  addBotMessage("I'm having trouble connecting right now. Could you try again? 🔧");
  renderQuickReplies(MENDIE_INITIAL_SUGGESTIONS);
}

function buildContext(userInput) {
  let context = '';
  const lowerInput = userInput.toLowerCase();

  const brands = ['Apple', 'Samsung', 'Tecno', 'Infinix', 'Xiaomi', 'Huawei'];
  brands.forEach(b => {
    if (lowerInput.includes(b.toLowerCase())) {
      context += `\nUser mentioned brand: ${b}.`;
      const models = typeof MODELS !== 'undefined' ? MODELS[b] : [];
      if (models.length) context += ` Available models: ${models.join(', ')}.`;
    }
  });
  if (lowerInput.includes('iphone')) context += '\nUser mentioned brand: Apple (iPhone).';
  if (lowerInput.includes('galaxy')) context += '\nUser mentioned brand: Samsung (Galaxy).';

  const issueMap = {
    'screen': 'Screen Replacement', 'cracked': 'Screen Replacement', 'glass': 'Screen Replacement',
    'battery': 'Battery Replacement', 'drain': 'Battery Replacement', 'charging': 'Charging Port Repair',
    'charge': 'Charging Port Repair', 'water': 'Water Damage Recovery', 'wet': 'Water Damage Recovery',
    'camera': 'Camera Repair', 'software': 'Software & Unlocking', 'unlock': 'Software & Unlocking',
    'back glass': 'Back Glass Replacement', 'backglass': 'Back Glass Replacement'
  };
  Object.keys(issueMap).forEach(kw => {
    if (lowerInput.includes(kw)) {
      context += `\nUser likely has issue: ${issueMap[kw]}.`;
      if (typeof getRepairEstimate === 'function') {
        const brand = brands.find(b => lowerInput.includes(b.toLowerCase())) || 'Apple';
        const defaultModel = (typeof MODELS !== 'undefined' && MODELS[brand]) ? MODELS[brand][0] : 'iPhone 15';
        const issueId = Object.keys(issueMap).find(k => lowerInput.includes(k)) || 'screen';
        const issueKeyMap = { 'screen': 'screen', 'cracked': 'screen', 'glass': 'screen', 'battery': 'battery', 'drain': 'battery', 'charging': 'charging', 'charge': 'charging', 'water': 'water', 'wet': 'water', 'camera': 'camera', 'software': 'software', 'unlock': 'software', 'back glass': 'backglass', 'backglass': 'backglass' };
        const mappedIssue = issueKeyMap[issueId] || 'screen';
        const est = getRepairEstimate(brand, defaultModel, mappedIssue);
        if (est) context += ` Price estimate for ${brand} ${issueMap[kw]}: $${est[0]}-$${est[1]}, takes ${est[2]}-${est[3]} hours.`;
      }
    }
  });

  const cities = typeof CITY_COORDS !== 'undefined' ? Object.keys(CITY_COORDS) : [];

  if (typeof techniciansDb !== 'undefined') {
    const techsInCity = techniciansDb.filter(t => t.city === 'Harare');
    if (lowerInput.includes('harare') || lowerInput.includes('zimbabwe') || lowerInput.includes('hw')) {
      context += '\nTop technicians in Harare:';
      techsInCity.slice(0, 3).forEach(t => {
        context += `\n- [TECH_CARD:${t.id}] ${t.name}: ${t.rating}★, ${t.specializations.join('/')}, ${t.experience} exp, ${t.repairsCompleted} repairs, ${t.verified ? 'Verified ✅' : 'Unverified'}. Location: ${t.location}. WhatsApp: ${t.whatsapp}`;
      });
    }
  }

  return context;
}

function processGeminiReply(reply, userInput, apiSuggestions) {
  const techCardRegex = /\[TECH_CARD:(\d+)\]/g;
  let match;
  const techCards = [];
  let cleanReply = reply;

  while ((match = techCardRegex.exec(reply)) !== null) {
    const techId = parseInt(match[1]);
    const tech = typeof techniciansDb !== 'undefined' ? techniciansDb.find(t => t.id === techId) : null;
    if (tech) techCards.push(tech);
    cleanReply = cleanReply.replace(match[0], tech ? tech.name : '');
  }

  const parts = cleanReply.split('\n').filter(p => p.trim());
  let delay = 0;
  parts.forEach((part, i) => {
    const text = part.trim();
    if (!text) return;
    delay += 300;
    setTimeout(() => addBotMessage(text), delay);
  });

  delay += 500;
  setTimeout(() => {
    techCards.forEach(tech => {
      const reason = `Specializes in ${tech.specializations.join('/')}, rated ${tech.rating.toFixed(1)}★, ${tech.repairsCompleted} repairs completed.`;
      renderTechMatchCard(tech, tech.verified ? reason + ' Verified ✅' : reason);
    });

    if (apiSuggestions && apiSuggestions.length > 0) {
      renderQuickReplies(apiSuggestions.slice(0, 4));
    } else if (techCards.length === 0) {
      const suggestions = getSmartSuggestions(userInput);
      renderQuickReplies(suggestions);
    } else {
      renderQuickReplies(['Ask another question', 'View full directory', 'Start over']);
    }
  }, delay);
}

function getSmartSuggestions(userInput) {
  const lower = userInput.toLowerCase();
  const history = chatHistory.map(m => m.text.toLowerCase());
  const allText = history.join(' ');

  if (allText.includes('screen') || allText.includes('crack') || allText.includes('glass')) {
    if (!allText.match(/iphone|samsung|tecno|infinix|xiaomi|huawei|galaxy/)) {
      return ['iPhone', 'Samsung Galaxy', 'Tecno', 'Infinix'];
    }
    return ['How much will it cost?', 'Find a technician in Harare', 'Is it worth repairing?'];
  }
  if (allText.includes('battery') || allText.includes('drain') || allText.includes('charging') || allText.includes('charge')) {
    if (!allText.match(/iphone|samsung|tecno|infinix|xiaomi|huawei|galaxy/)) {
      return ['iPhone', 'Samsung Galaxy', 'Tecno', 'Infinix'];
    }
    return ['How much will it cost?', 'Find a technician in Harare', 'Ask about warranty'];
  }
  if (allText.includes('water') || allText.includes('wet')) {
    return ['Can it be saved?', 'How much does water damage repair cost?', 'Find a technician in Harare', 'Is my data safe?'];
  }
  if (lower.includes('price') || lower.includes('cost') || lower.includes('how much') || lower.includes('pricing')) {
    return ['Screen repair cost', 'Battery replacement cost', 'Find a technician in Harare', 'View pricing guide'];
  }
  if (lower.includes('technician') || lower.includes('repair') || lower.includes('fix') || lower.includes('find')) {
    return ['Find technicians in Harare', 'How much will it cost?', 'View pricing guide', 'Ask something else'];
  }
  return ['My screen is cracked', 'Phone not charging', 'Battery draining fast', 'Water damage'];
}

function renderTechMatchCard(tech, reason) {
  const log = document.getElementById('mendie-messages-log');
  const card = document.createElement('div');
  card.className = 'chat-recommend-card';
  card.onclick = () => {
    window.location.hash = `#profile/${tech.id}`;
    toggleMendieChat();
  };

  const badge = tech.verified ? '<span style="color:var(--color-success);font-weight:700;font-size:11px;">✓ Verified</span>' : '';

  card.innerHTML = `
    <div class="chat-recommend-img">
      <img src="${tech.profilePic}" alt="${tech.name}">
    </div>
    <div class="chat-recommend-info">
      <h5>${tech.name} ${badge}</h5>
      <p style="color:var(--color-accent);font-weight:600;margin-bottom:2px;">★ ${tech.rating.toFixed(1)} (${tech.reviews.length} reviews)</p>
      <p style="font-size:11px;color:var(--text-muted);line-height:1.4;">${reason}</p>
    </div>
  `;

  log.appendChild(card);
  scrollChatBottom();
  if (typeof lucide !== 'undefined') lucide.createIcons();
}