// FundiFix — Mendie AI Assistant (Alive, Friendly, Smart)

const MENDIE_GREETINGS = [
  "Need help fixing your device? 👋",
  "Cracked screen? I can help! 💪",
  "Tell Mendie what's broken 🔧",
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
let currentChatState = 0;
let userData = { brand: '', model: '', issue: '', city: '', budget: 0 };

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
  currentChatState = 0;
  userData = { brand: '', model: '', issue: '', city: '', budget: 0 };
  const log = document.getElementById('mendie-messages-log');
  log.innerHTML = '';

  addBotMessageWithTyping("Hi there! 👋 I'm Mendie, your repair assistant.", () => {
    setTimeout(() => {
      addBotMessage("Tell me what's wrong with your device and I'll help you figure out the problem and find the best repair expert near you.");
      renderQuickReplies(MENDIE_INITIAL_SUGGESTIONS);
    }, 600);
  });
}

function addBotMessageWithTyping(text, callback) {
  const log = document.getElementById('mendie-messages-log');
  
  // Show typing indicator
  const typingEl = document.createElement('div');
  typingEl.className = 'chat-msg chat-msg-bot';
  typingEl.innerHTML = '<div class="mendie-typing-indicator"><span></span><span></span><span></span></div>';
  log.appendChild(typingEl);
  scrollChatBottom();

  const delay = Math.min(text.length * 12, 1500) + 300;
  
  setTimeout(() => {
    log.removeChild(typingEl);
    addBotMessage(text);
    if (callback) callback();
  }, delay);
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
  if (!val) return;
  input.value = '';
  handleUserInput(val);
}

function handleUserInput(input) {
  addUserMessage(input);
  document.getElementById('mendie-quick-replies-mount').innerHTML = '';

  setTimeout(() => {
    processChatState(input);
  }, 500);
}

function processChatState(input) {
  const sanitized = input.trim();
  
  switch(currentChatState) {
    case 0: // BRAND / ISSUE DETECTION
      // Check if user typed a common issue phrase
      const lowerInput = sanitized.toLowerCase();
      const issueKeywords = {
        'screen': 'screen', 'cracked': 'screen', 'crack': 'screen', 'glass': 'screen', 'display': 'screen', 'broken screen': 'screen',
        'battery': 'battery', 'drain': 'battery', 'draining': 'battery', 'not holding charge': 'battery',
        'charge': 'charging', 'charging': 'charging', 'not charging': 'charging', 'charger': 'charging',
        'water': 'water', 'wet': 'water', 'fell in water': 'water', 'dropped in water': 'water', 'rain': 'water',
        'camera': 'camera', 'laptop won': 'software', 'won\'t turn on': 'software', 'software': 'software', 'unlock': 'software',
        'laptop': 'laptop', 'pc': 'laptop', 'computer': 'laptop'
      };

      let detectedBrand = null;
      const brands = ['Apple', 'Samsung', 'Tecno', 'Infinix', 'Xiaomi', 'Huawei'];
      brands.forEach(b => { if (lowerInput.includes(b.toLowerCase())) detectedBrand = b; });
      if (lowerInput.includes('iphone')) detectedBrand = 'Apple';
      if (lowerInput.includes('galaxy')) detectedBrand = 'Samsung';

      let detectedIssue = null;
      Object.keys(issueKeywords).forEach(kw => {
        if (lowerInput.includes(kw)) detectedIssue = issueKeywords[kw];
      });

      if (detectedBrand || detectedIssue) {
        if (detectedBrand) userData.brand = detectedBrand;
        if (detectedIssue) { userData.issue = detectedIssue; userData.issueName = REPAIR_ISSUES.find(i => i.id === detectedIssue)?.name || detectedIssue; }

        addBotMessageWithTyping(`Got it! ${detectedBrand ? 'A ' + detectedBrand + ' device' : 'Your device'}${detectedIssue ? ' with a ' + (userData.issueName || detectedIssue) + ' issue' : ''}. Let me help you with that! 🛠️`, () => {
          if (!userData.brand) {
            currentChatState = 1;
            setTimeout(() => {
              addBotMessage("Which brand is your device?");
              renderQuickReplies(BRANDS);
            }, 400);
          } else if (!userData.issue) {
            currentChatState = 2;
            setTimeout(() => {
              addBotMessage("What specific issue are you experiencing?");
              renderQuickReplies(REPAIR_ISSUES.map(i => i.name));
            }, 400);
          } else {
            currentChatState = 3;
            setTimeout(() => {
              addBotMessage("Which city are you in? I'll find the best technicians near you.");
              renderQuickReplies(Object.keys(CITY_COORDS));
            }, 400);
          }
        });
      } else {
        // No brand or issue detected — ask what device they have
        currentChatState = 1;
        addBotMessageWithTyping("No problem! What brand of device are you working with?", () => {
          renderQuickReplies(BRANDS);
        });
      }
      break;

    case 1: // BRAND
      const matchedBrand2 = BRANDS.find(b => b.toLowerCase() === sanitized.toLowerCase());
      if (matchedBrand2) {
        userData.brand = matchedBrand2;
      } else {
        userData.brand = sanitized;
      }
      // If we already have the issue, skip to city
      if (userData.issue) {
        currentChatState = 3;
        addBotMessageWithTyping(`Got it! ${userData.brand} with a ${userData.issueName || 'repair'} issue. Which city are you in?`, () => {
          renderQuickReplies(Object.keys(CITY_COORDS));
        });
      } else {
        currentChatState = 2;
        addBotMessageWithTyping(`Awesome! A ${userData.brand} device. What's the problem you're experiencing?`, () => {
          renderQuickReplies(REPAIR_ISSUES.map(i => i.name));
        });
      }
      break;

    case 2: // ISSUE
      const lowerIssueInput = sanitized.toLowerCase();
      const matchedIssue = REPAIR_ISSUES.find(i => i.name.toLowerCase().includes(lowerIssueInput) || lowerIssueInput.includes(i.id));
      if (matchedIssue) {
        userData.issue = matchedIssue.id;
        userData.issueName = matchedIssue.name;
      } else {
        userData.issue = 'screen';
        userData.issueName = sanitized;
      }
      currentChatState = 3;
      addBotMessageWithTyping("Understood. Which city are you in?", () => {
        renderQuickReplies(Object.keys(CITY_COORDS));
      });
      break;

    case 3: // CITY
      const lowerCityInput = sanitized.toLowerCase();
      const matchedCity = Object.keys(CITY_COORDS).find(c => c.toLowerCase() === lowerCityInput);
      userData.city = matchedCity || 'Harare';
      currentChatState = 4;
      addBotMessageWithTyping("Perfect! What's your approximate budget for the repair?", () => {
        renderQuickReplies(['Under $30', 'Under $50', 'Under $100', 'Any Budget']);
      });
      break;

    case 4: // BUDGET
      let budgetVal = 999;
      if (sanitized.includes('30')) budgetVal = 30;
      else if (sanitized.includes('50')) budgetVal = 50;
      else if (sanitized.includes('100')) budgetVal = 100;
      userData.budget = budgetVal;
      currentChatState = 5;
      provideDiagnosticRecommendation();
      break;

    case 5: // RESTART
      resetMendieConversation();
      break;
  }
}

function provideDiagnosticRecommendation() {
  const pricing = getRepairEstimate(userData.brand, userData.model || 'iPhone 15', userData.issue);
  const minPrice = pricing[0];
  const maxPrice = pricing[1];
  const timeMin = pricing[2];
  const timeMax = pricing[3];

  addBotMessageWithTyping(`📊 Here's what I found:\n\nA ${userData.brand} ${userData.issueName || 'repair'} typically costs between $${minPrice} and $${maxPrice} in ${userData.city}, and takes about ${timeMin}-${timeMax} hours.`, () => {
    const matchedTechs = techniciansDb.filter(t => {
      const matchesCity = t.city.toLowerCase() === userData.city.toLowerCase();
      const matchesBrand = !userData.brand || t.specializations.includes(userData.brand);
      return matchesCity && matchesBrand;
    }).sort((a, b) => b.rating - a.rating);

    setTimeout(() => {
      if (matchedTechs.length === 0) {
        const cityTechs = techniciansDb.filter(t => t.city.toLowerCase() === userData.city.toLowerCase());
        if (cityTechs.length > 0) {
          addBotMessage("I couldn't find a specialist for your brand in this city, but here are top-rated local technicians:");
          cityTechs.slice(0, 2).forEach(t => renderTechMatchCard(t, "Highly rated local expert."));
        } else {
          addBotMessage("No technicians registered in your city yet. Try checking a nearby city or use our Pricing Tool for cost estimates.");
        }
      } else {
        addBotMessage("🎉 Here's the best match for you:");
        const primary = matchedTechs[0];
        let reason = `Specializes in ${userData.brand || 'repairs'}, rated ${primary.rating.toFixed(1)}★, completed ${primary.repairsCompleted} repairs.`;
        if (primary.verified) reason += " Verified partner ✅";
        renderTechMatchCard(primary, reason);

        if (matchedTechs.length > 1) {
          setTimeout(() => {
            const secondary = matchedTechs[1];
            addBotMessage(`Another option: ${secondary.name} — ${secondary.rating.toFixed(1)}★ rating, from $${getMinPrice(secondary)}.`);
            renderTechMatchCard(secondary, "Great alternative option.");
          }, 800);
        }
      }

      setTimeout(() => {
        renderQuickReplies(['Start New Search', 'Go to Directory', 'Ask Another Question']);
      }, 1500);
    }, 1000);
  });
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
  lucide.createIcons();
}