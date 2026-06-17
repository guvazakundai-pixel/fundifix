// FundiFix - Admin Panel Controller

let currentAdminTab = 'techs';
let isAdminAuthenticated = JSON.parse(localStorage.getItem('fundifix_admin_auth')) || false;

function initAdminPanel() {
  if (!isAdminAuthenticated) {
    promptAdminLogin();
    return;
  }
  
  // Re-draw stats
  updateAdminStats();
  
  // Render active tab contents
  renderAdminTable();
}

function promptAdminLogin() {
  const mount = document.getElementById('view-admin');
  mount.innerHTML = `
    <div class="section" style="max-width:440px; margin: 40px auto;">
      <div class="get-listed-card" style="padding: 40px;">
        <h2 style="font-size:24px; margin-bottom:8px; text-align:center;">Admin Portal</h2>
        <p style="color:var(--text-secondary); font-size:13.5px; text-align:center; margin-bottom: 24px;">
          Access administrative data controls and listing moderations.
        </p>
        
        <form onsubmit="handleAdminLoginSubmit(event)">
          <div class="form-field">
            <label for="admin-user">Username</label>
            <input type="text" id="admin-user" required value="admin" style="background-color: var(--bg-secondary);">
          </div>
          <div class="form-field">
            <label for="admin-pass">Password</label>
            <input type="password" id="admin-pass" required value="admin" style="background-color: var(--bg-secondary);">
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%; height:44px; border-radius: var(--radius-md); margin-top:8px;">
            Sign In to Dashboard
          </button>
        </form>
        <p style="font-size:11px; text-align:center; margin-top:16px; color:var(--text-muted);">
          Demo credentials prefilled for evaluation.
        </p>
      </div>
    </div>
  `;
}

function handleAdminLoginSubmit(e) {
  e.preventDefault();
  const u = document.getElementById('admin-user').value;
  const p = document.getElementById('admin-pass').value;
  
  if (u === 'admin' && p === 'admin') {
    isAdminAuthenticated = true;
    localStorage.setItem('fundifix_admin_auth', 'true');
    // Restore default view shell structure
    restoreAdminShell();
    initAdminPanel();
  } else {
    alert('Invalid admin credentials.');
  }
}

function logoutAdmin() {
  isAdminAuthenticated = false;
  localStorage.removeItem('fundifix_admin_auth');
  window.location.hash = '#home';
}

function restoreAdminShell() {
  const mount = document.getElementById('view-admin');
  mount.innerHTML = `
    <div class="admin-view-wrapper">
      <div class="admin-header">
        <div>
          <h1 style="font-size: 32px;">FundiFix Portal Admin</h1>
          <p style="color:var(--text-secondary); margin-top: 4px;">Monitor technician audits, moderation queues, and database variables.</p>
        </div>
        <button class="btn btn-outline" onclick="logoutAdmin()">Logout</button>
      </div>
      
      <!-- ANALYTICS GRID -->
      <div class="admin-stats-grid">
        <div class="admin-stat-card">
          <div class="admin-stat-title">Active Technicians</div>
          <div class="admin-stat-number" id="admin-stat-total-techs">0</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-title">Average Platform Rating</div>
          <div class="admin-stat-number">4.82</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-title">Verification Requests</div>
          <div class="admin-stat-number" id="admin-stat-pending">0</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-title">Total Site Clicks</div>
          <div class="admin-stat-number">14,240</div>
        </div>
      </div>
      
      <!-- ADMINISTRATIVE CONTROL TABS -->
      <div class="admin-tabs">
        <button class="admin-tab active" onclick="switchAdminTab('techs')" id="admin-tab-techs">Manage Technicians</button>
        <button class="admin-tab" onclick="switchAdminTab('queue')" id="admin-tab-queue">Applications Queue</button>
      </div>
      
      <!-- TABLE LISTINGS -->
      <div class="admin-table-card">
        <table class="admin-table" id="admin-data-table">
          <thead>
            <!-- Injected -->
          </thead>
          <tbody id="admin-table-body">
            <!-- Injected -->
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function updateAdminStats() {
  const activeCount = techniciansDb.filter(t => t.verified).length;
  const pendingCount = techniciansDb.filter(t => !t.verified).length;
  
  const totalNode = document.getElementById('admin-stat-total-techs');
  const pendingNode = document.getElementById('admin-stat-pending');
  
  if (totalNode) totalNode.textContent = activeCount;
  if (pendingNode) pendingNode.textContent = pendingCount;
}

function switchAdminTab(tab) {
  currentAdminTab = tab;
  
  document.getElementById('admin-tab-techs').classList.remove('active');
  document.getElementById('admin-tab-queue').classList.remove('active');
  
  if (tab === 'techs') {
    document.getElementById('admin-tab-techs').classList.add('active');
  } else {
    document.getElementById('admin-tab-queue').classList.add('active');
  }
  
  renderAdminTable();
}

function renderAdminTable() {
  const thead = document.querySelector('#admin-data-table thead');
  const tbody = document.getElementById('admin-table-body');
  
  if (currentAdminTab === 'techs') {
    thead.innerHTML = `
      <tr>
        <th>Shop Name</th>
        <th>Owner</th>
        <th>City</th>
        <th>Rating</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    `;
    
    // Filter active/verified techs
    const activeTechs = techniciansDb.filter(t => t.verified);
    
    if (activeTechs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No active technicians in database.</td></tr>`;
      return;
    }
    
    tbody.innerHTML = activeTechs.map(tech => `
      <tr>
        <td><strong>${tech.name}</strong></td>
        <td>${tech.owner}</td>
        <td>${tech.city}</td>
        <td>★ ${tech.rating.toFixed(1)}</td>
        <td><span style="color:var(--color-success); font-weight:700;">Active</span></td>
        <td>
          <button class="admin-action-btn admin-btn-delete" onclick="adminRevokeTech(${tech.id})">Unverify</button>
        </td>
      </tr>
    `).join('');
    
  } else {
    thead.innerHTML = `
      <tr>
        <th>Applicant Shop</th>
        <th>Owner Name</th>
        <th>City</th>
        <th>WhatsApp</th>
        <th>Experience</th>
        <th>Actions</th>
      </tr>
    `;
    
    // Filter unverified techs
    const pendingTechs = techniciansDb.filter(t => !t.verified);
    
    if (pendingTechs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:32px 0;">No pending onboarding applications.</td></tr>`;
      return;
    }
    
    tbody.innerHTML = pendingTechs.map(tech => `
      <tr>
        <td><strong>${tech.name}</strong></td>
        <td>${tech.owner}</td>
        <td>${tech.city}</td>
        <td>${tech.phone}</td>
        <td>${tech.experience}</td>
        <td style="display:flex; gap:8px;">
          <button class="admin-action-btn admin-btn-approve" onclick="adminVerifyTech(${tech.id})">Approve & Verify</button>
          <button class="admin-action-btn admin-btn-delete" onclick="adminDeleteTech(${tech.id})">Reject</button>
        </td>
      </tr>
    `).join('');
  }
}

// ADMINISTRATIVE ACTIONS
function adminVerifyTech(id) {
  const tech = techniciansDb.find(t => t.id === id);
  if (tech) {
    tech.verified = true;
    saveToLocalStorage();
    alert(`${tech.name} has been verified and added to search indexes.`);
    initAdminPanel();
    // Re-filter search lists
    if (typeof runSearchFiltering === 'function') runSearchFiltering();
    if (typeof initPopularRankings === 'function') initPopularRankings();
  }
}

function adminRevokeTech(id) {
  const tech = techniciansDb.find(t => t.id === id);
  if (tech) {
    tech.verified = false;
    saveToLocalStorage();
    alert(`${tech.name} verification has been revoked.`);
    initAdminPanel();
    // Re-filter search lists
    if (typeof runSearchFiltering === 'function') runSearchFiltering();
    if (typeof initPopularRankings === 'function') initPopularRankings();
  }
}

function adminDeleteTech(id) {
  const idx = techniciansDb.findIndex(t => t.id === id);
  if (idx !== -1) {
    const name = techniciansDb[idx].name;
    if (confirm(`Are you sure you want to permanently delete application for ${name}?`)) {
      techniciansDb.splice(idx, 1);
      saveToLocalStorage();
      initAdminPanel();
      if (typeof runSearchFiltering === 'function') runSearchFiltering();
      if (typeof initPopularRankings === 'function') initPopularRankings();
    }
  }
}
