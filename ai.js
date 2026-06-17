// FundiFix - Kaya AI Assistant Controller

const KAYA_GREETINGS = [
  "Need help finding a technician?",
  "Need a screen replacement? Ask me.",
  "Check repair costs instantly here!"
];

let chatHistory = [];
let currentChatState = 0; // State machine tracking: 0=Brand, 1=Model, 2=Issue, 3=City, 4=Budget, 5=Results
let userData = {
  brand: '',
  model: '',
  issue: '',
  city: '',
  budget: 0
};

// Initialize Kaya Ping Bubble Cycle
window.addEventListener('DOMContentLoaded', () => {
  initKayaBubble();
  resetKayaConversation();
});

function initKayaBubble() {
  const ping = document.getElementById('kaya-ping-bubble');
  
  // Rotate through prompts every 8 seconds
  let pingIndex = 0;
  setInterval(() => {
    pingIndex = (pingIndex + 1) % KAYA_GREETINGS.length;
    ping.textContent = KAYA_GREETINGS[pingIndex];
  }, 8000);
}

function toggleKayaChat() {
  const panel = document.getElementById('kaya-chat-box');
  const unread = document.getElementById('kaya-unread');
  
  panel.classList.toggle('active');
  unread.style.display = 'none';
  
  // Focus input
  if (panel.classList.contains('active')) {
    document.getElementById('kaya-input').focus();
    // Auto scroll messages to bottom
    scrollChatBottom();
  }
}

function openKayaChat(directLink = false) {
  const panel = document.getElementById('kaya-chat-box');
  panel.classList.add('active');
  if (directLink) {
    resetKayaConversation();
  }
}

function scrollChatBottom() {
  const log = document.getElementById('kaya-messages-log');
  setTimeout(() => {
    log.scrollTop = log.scrollHeight;
  }, 50);
}

// CONVERSATION ENGINE (State Machine)
function resetKayaConversation() {
  chatHistory = [];
  currentChatState = 0;
  userData = { brand: '', model: '', issue: '', city: '', budget: 0 };
  
  const log = document.getElementById('kaya-messages-log');
  log.innerHTML = '';
  
  addBotMessage("Hi there! I am Kaya, your phone repair assistant. What brand of phone are you using today?");
  renderQuickReplies(BRANDS);
}

function addBotMessage(text, html = null) {
  const log = document.getElementById('kaya-messages-log');
  const bubble = document.createElement('div');
  bubble.className = 'chat-msg chat-msg-bot';
  if (html) {
    bubble.innerHTML = html;
  } else {
    bubble.textContent = text;
  }
  log.appendChild(bubble);
  scrollChatBottom();
}

function addUserMessage(text) {
  const log = document.getElementById('kaya-messages-log');
  const bubble = document.createElement('div');
  bubble.className = 'chat-msg chat-msg-user';
  bubble.textContent = text;
  log.appendChild(bubble);
  scrollChatBottom();
}

// QUICK REPLIES
function renderQuickReplies(options) {
  const mount = document.getElementById('kaya-quick-replies-mount');
  mount.innerHTML = '';
  
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quick-reply-btn';
    btn.textContent = opt;
    btn.onclick = () => handleUserInput(opt);
    mount.appendChild(btn);
  });
}

function handleKayaKeyPress(e) {
  if (e.key === 'Enter') {
    sendKayaMessage();
  }
}

function sendKayaMessage() {
  const input = document.getElementById('kaya-input');
  const val = input.value.trim();
  if (!val) return;
  
  input.value = '';
  handleUserInput(val);
}

// USER RESPONSE DISPATCHER
function handleUserInput(input) {
  addUserMessage(input);
  
  // Hide quick replies while generating reply
  document.getElementById('kaya-quick-replies-mount').innerHTML = '';
  
  setTimeout(() => {
    processChatState(input);
  }, 500);
}

function processChatState(input) {
  const sanitized = input.trim();
  
  switch(currentChatState) {
    case 0: // BRAND SELECTED
      // Validate brand
      const matchedBrand = BRANDS.find(b => b.toLowerCase() === sanitized.toLowerCase());
      if (matchedBrand) {
        userData.brand = matchedBrand;
        currentChatState = 1;
        addBotMessage(`Awesome. Which model of ${userData.brand} do you have?`);
        
        const models = MODELS[userData.brand] || [];
        renderQuickReplies(models.slice(0, 4));
      } else {
        // Fallback for custom brands
        userData.brand = sanitized;
        currentChatState = 1;
        addBotMessage(`I've noted that brand. What model is it?`);
      }
      break;
      
    case 1: // MODEL SELECTED
      userData.model = sanitized;
      currentChatState = 2;
      addBotMessage("Got it. What issue are you experiencing with it?");
      
      const issueNames = REPAIR_ISSUES.map(i => i.name);
      renderQuickReplies(issueNames);
      break;
      
    case 2: // ISSUE SELECTED
      const matchedIssue = REPAIR_ISSUES.find(i => i.name.toLowerCase().includes(sanitized.toLowerCase()) || sanitized.toLowerCase().includes(i.id));
      if (matchedIssue) {
        userData.issue = matchedIssue.id;
        userData.issueName = matchedIssue.name;
      } else {
        userData.issue = 'screen'; // fallback default
        userData.issueName = sanitized;
      }
      
      currentChatState = 3;
      addBotMessage("Understood. Which city are you currently in?");
      renderQuickReplies(Object.keys(CITY_COORDS));
      break;
      
    case 3: // CITY SELECTED
      const matchedCity = Object.keys(CITY_COORDS).find(c => c.toLowerCase() === sanitized.toLowerCase());
      if (matchedCity) {
        userData.city = matchedCity;
      } else {
        userData.city = 'Harare'; // default fallback
      }
      
      currentChatState = 4;
      addBotMessage("Perfect. What is your approximate budget for the repair (in USD)?");
      renderQuickReplies(['Under $30', 'Under $50', 'Under $100', 'Any Budget']);
      break;
      
    case 4: // BUDGET SELECTED
      let budgetVal = 999;
      if (sanitized.includes('30')) budgetVal = 30;
      else if (sanitized.includes('50')) budgetVal = 50;
      else if (sanitized.includes('100')) budgetVal = 100;
      userData.budget = budgetVal;
      
      currentChatState = 5;
      provideDiagnosticRecommendation();
      break;
      
    case 5: // RESTART
      resetKayaConversation();
      break;
  }
}

// RECOMMENDATION ALGORITHM
function provideDiagnosticRecommendation() {
  // 1. Calculate price guideline
  const pricing = getRepairEstimate(userData.brand, userData.model, userData.issue);
  const minPrice = pricing[0];
  const maxPrice = pricing[1];
  const timeMin = pricing[2];
  const timeMax = pricing[3];
  
  addBotMessage(`Based on our index database, a ${userData.brand} ${userData.model} ${userData.issueName} typically costs between $${minPrice} and $${maxPrice} USD in ${userData.city}, and takes about ${timeMin}-${timeMax} hours to fix.`);
  
  // 2. Filter match technicians
  const matchedTechs = techniciansDb.filter(t => {
    const matchesCity = t.city.toLowerCase() === userData.city.toLowerCase();
    const matchesBrand = t.specializations.includes(userData.brand);
    return matchesCity && matchesBrand;
  });
  
  // Sort by rating desc
  matchedTechs.sort((a, b) => b.rating - a.rating);
  
  setTimeout(() => {
    if (matchedTechs.length === 0) {
      addBotMessage("I couldn't find a specialized technician in your city matching that specific brand. However, here are general technicians in your area:");
      const cityTechs = techniciansDb.filter(t => t.city.toLowerCase() === userData.city.toLowerCase());
      if (cityTechs.length > 0) {
        cityTechs.forEach(t => renderTechMatchCard(t, "Highly rated local generalist."));
      } else {
        addBotMessage("There are no repair shops registered in your city yet. You can look at neighboring cities or use our Pricing Tool to check guidelines.");
      }
    } else {
      addBotMessage("Here is the best recommendation I found for you:");
      
      // Recommend top match
      const primaryMatch = matchedTechs[0];
      let matchReason = `Recommended because they specialize in ${userData.brand} models, have a stellar ${primaryMatch.rating.toFixed(1)} rating, and have completed ${primaryMatch.repairsCompleted} repairs.`;
      
      if (primaryMatch.verified) {
        matchReason += " They are also a verified partner.";
      }
      
      renderTechMatchCard(primaryMatch, matchReason);
      
      // If there are other options
      if (matchedTechs.length > 1) {
        const secondary = matchedTechs[1];
        setTimeout(() => {
          addBotMessage(`An alternative option is ${secondary.name} ($${getMinPrice(secondary)} onwards), rated ${secondary.rating.toFixed(1)}/5.`);
          renderTechMatchCard(secondary, "Recommended for speedy turnaround.");
        }, 800);
      }
    }
    
    // Quick Replies for restarting
    setTimeout(() => {
      renderQuickReplies(['Start New Search', 'Go to Directory']);
    }, 1500);
  }, 1000);
}

function renderTechMatchCard(tech, reason) {
  const log = document.getElementById('kaya-messages-log');
  const card = document.createElement('div');
  card.className = 'chat-recommend-card';
  card.onclick = () => {
    window.location.hash = `#profile/${tech.id}`;
    toggleKayaChat();
  };
  
  card.innerHTML = `
    <div class="chat-recommend-img">
      <img src="${tech.profilePic}" alt="${tech.name}">
    </div>
    <div class="chat-recommend-info">
      <h5>${tech.name}</h5>
      <p style="color:var(--color-accent); font-weight:600; margin-bottom:2px;">★ ${tech.rating.toFixed(1)} (${tech.reviews.length} reviews)</p>
      <p style="font-size:11px; font-style:italic;">"${reason}"</p>
    </div>
  `;
  
  log.appendChild(card);
  scrollChatBottom();
  
  // Re-run icons
  lucide.createIcons();
}
