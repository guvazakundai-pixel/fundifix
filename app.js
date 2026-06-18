// Repair Hub Premium Redesign — App Controller

let mapInstance = null;
let mapMarkers = [];
let activeUser = JSON.parse(localStorage.getItem('repairhub_user_v2')) || null;

const CITY_COORDS = {
  'Harare': [-17.8252, 31.0530],
  'Nairobi': [-1.2921, 36.8219],
  'Lagos': [6.5244, 3.3792],
  'Johannesburg': [-26.2041, 28.0473],
  'Accra': [5.6037, -0.1870]
};

const HERO_PHRASES = [
  'Phone Repair',
  'Laptop Repair',
  'Solar Repair',
  'Home Repair',
  'Electrical',
  'Plumbing'
];

const SEARCH_EXAMPLES = [
  'iPhone screen repair',
  'Laptop not charging',
  'Solar inverter issue',
  'Washing machine leaking',
  'Samsung battery replacement',
  'Plumbing emergency',
  'Electrical wiring',
  'Refrigerator not cooling'
];

const TESTIMONIALS_DATA = [
  { name: 'Tatenda C.', role: 'Harare, Zimbabwe', text: 'Professional service! Replaced my Galaxy S23 Ultra screen in under 2 hours. Ephraim explains pricing transparently. Highly recommended.', stars: 5 },
  { name: 'Amani W.', role: 'Nairobi, Kenya', text: 'Excellent service. They repaired my Infinix Note battery quickly. They even gave me a 3-month warranty card. Will use again!', stars: 5 },
  { name: 'Chidi O.', role: 'Lagos, Nigeria', text: 'Chidi is the king of Tecno micro-soldering. Fixed a dead motherboard that three other shops said was unrepairable. Amazing work!', stars: 5 },
  { name: 'Sipho N.', role: 'Johannesburg, SA', text: 'Specializes in iPhones. Completely pristine screen restoration. They only use certified refurbished or genuine pull-offs.', stars: 5 },
  { name: 'Kofi M.', role: 'Accra, Ghana', text: 'Affordable and fast. Replaced my charging pin in 30 minutes. Coffee offered while you wait. Great experience!', stars: 4 },
  { name: 'Tendai M.', role: 'Harare, Zimbabwe', text: 'Joina City is highly secure. Honest pricing, did the water damage recovery for my iPhone XR and it works fully now.', stars: 5 },
];

let currentHeroIndex = 0;
let currentSearchExample = 0;
let searchExampleInterval;
let heroInterval;
let testimonialPosition = 0;

window.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initNavbarScroll();
  initPopularRankings();
  populateBrandSelectors();
  updateAuthBtnState();
  initScrollAnimations();
  initHeroParticles();
  renderTestimonials();
  renderTechShowcase();

  lucide.createIcons();
});

// HERO PARTICLES
function initHeroParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'hero-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.width = (2 + Math.random() * 4) + 'px';
    particle.style.height = particle.style.width;
    particle.style.animationDuration = (10 + Math.random() * 20) + 's';
    particle.style.animationDelay = Math.random() * 10 + 's';
    particle.style.opacity = (0.05 + Math.random() * 0.15);
    const colors = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-purple)'];
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    container.appendChild(particle);
  }
}

// FAQ TOGGLE
function toggleFaq(el) {
  const wasActive = el.classList.contains('active');
  document.querySelectorAll('.faq-item').forEach(item => item.classList.remove('active'));
  if (!wasActive) el.classList.add('active');
  lucide.createIcons();
}

// SCROLL ANIMATIONS (INTERSECTION OBSERVER)
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.classList.contains('stat-number')) {
          animateCounter(entry.target);
        }
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
  document.querySelectorAll('.stat-number').forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const duration = 2000;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = current.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

// ROUTING
function initRouter() {
  const handleRoute = () => {
    const hash = window.location.hash || '#home';
    const views = document.querySelectorAll('.view');
    views.forEach(v => v.style.display = 'none');
    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));

    if (hash === '#home' || hash.startsWith('#home')) {
      document.getElementById('view-home').style.display = 'block';
      document.querySelector('[data-nav="home"]')?.classList.add('active');
      window.scrollTo(0, 0);
    } else if (hash.startsWith('#search')) {
      document.getElementById('view-search').style.display = 'block';
      document.querySelector('[data-nav="search"]')?.classList.add('active');
      parseAndSearch();
    } else if (hash.startsWith('#profile/')) {
      document.getElementById('view-profile').style.display = 'block';
      const techId = parseInt(hash.split('/')[1]);
      renderTechnicianProfile(techId);
    } else if (hash.startsWith('#pricing')) {
      document.getElementById('view-pricing').style.display = 'block';
      document.querySelector('[data-nav="pricing"]')?.classList.add('active');
      populatePricingModels();
      calculatePagePrice();
    } else if (hash.startsWith('#get-listed')) {
      document.getElementById('view-get-listed').style.display = 'block';
    } else if (hash.startsWith('#admin')) {
      document.getElementById('view-admin').style.display = 'block';
      initAdminPanel();
    }

    lucide.createIcons();
  };

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

// NAVBAR
function initNavbarScroll() {
  const navbar = document.getElementById('main-navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });
}

function toggleMobileMenu() {
  document.getElementById('mobile-menu').classList.toggle('active');
  document.getElementById('mobile-menu-toggle').classList.toggle('active');
}

function closeMobileMenu() {
  document.getElementById('mobile-menu').classList.remove('active');
  document.getElementById('mobile-menu-toggle').classList.remove('active');
}

function populateSearchModels() {}
function populateBrandSelectors() {}

// MAP & SEARCH
function parseAndSearch() {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const location = urlParams.get('location') || '';
  const brand = urlParams.get('brand') || '';
  const issue = urlParams.get('issue') || '';

  if (location) document.getElementById('filter-city').value = location;
  if (brand) document.getElementById('filter-brand').value = brand;
  if (issue) document.getElementById('filter-issue').value = issue;

  runSearchFiltering();
}

function executeHeroSearch() {
  const location = document.getElementById('search-location')?.value || '';
  const brand = document.getElementById('search-brand')?.value || '';
  const issue = document.getElementById('search-issue')?.value || '';
  window.location.hash = `#search?location=${encodeURIComponent(location)}&brand=${encodeURIComponent(brand)}&issue=${encodeURIComponent(issue)}`;
}

function runSearchFiltering() {
  const cityVal = document.getElementById('filter-city')?.value || '';
  const brandVal = document.getElementById('filter-brand')?.value || '';
  const issueVal = document.getElementById('filter-issue')?.value || '';
  const verifiedVal = document.getElementById('filter-verified')?.value || '';

  const filtered = techniciansDb.filter(tech => {
    if (cityVal && tech.city !== cityVal) return false;
    if (brandVal && !tech.specializations.includes(brandVal)) return false;
    if (verifiedVal === 'true' && !tech.verified) return false;
    return true;
  });

  renderTechnicianCards(filtered);
  updateMapMarkers(filtered, cityVal);
}

function renderTechnicianCards(techs) {
  const mount = document.getElementById('listings-grid-mount');
  const countOutput = document.getElementById('search-results-count');
  if (!mount || !countOutput) return;

  countOutput.textContent = `${techs.length} technician${techs.length === 1 ? '' : 's'} found`;

  if (techs.length === 0) {
    mount.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px 24px;color:var(--text-secondary);"><i data-lucide="info" style="width:48px;height:48px;color:var(--text-muted);margin-bottom:16px;"></i><h3>No Technicians Found</h3><p style="margin-top:8px;">Try clearing your search filters or searching a different city.</p><button class="btn btn-outline" style="margin-top:16px;" onclick="resetSearchFilters()">Reset Filters</button></div>`;
    lucide.createIcons();
    return;
  }

  mount.innerHTML = techs.map(tech => {
    const verBadge = tech.verified ? `<div class="tech-card-verified-badge"><i data-lucide="badge-check" style="width:14px;height:14px;"></i> Verified Expert</div>` : '';
    const ratingDisplay = tech.rating ? `<div class="tech-card-rating-badge"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>${tech.rating.toFixed(1)}</div>` : '';
    const tags = tech.specializations.slice(0, 3).map(s => `<span class="tech-card-tag">${s}</span>`).join('');

    return `
      <div class="tech-card" onclick="window.location.hash='#profile/${tech.id}'">
        <div class="tech-card-image">
          <img src="${tech.coverPic}" alt="${tech.name}" loading="lazy">
          ${verBadge}${ratingDisplay}
          <div class="tech-card-avatar"><img src="${tech.profilePic}" alt="${tech.owner}"></div>
        </div>
        <div class="tech-card-body">
          <h4 class="tech-card-title">${tech.name}</h4>
          <p class="tech-card-location"><i data-lucide="map-pin" style="width:13px;height:13px;"></i> ${tech.location}</p>
          <div class="tech-card-tags">${tags}</div>
          <div class="tech-card-footer">
            <span class="tech-card-speed"><i data-lucide="message-circle" style="width:14px;height:14px;"></i> ${tech.responseSpeed}</span>
            <span class="tech-card-stats">${tech.repairsCompleted} fixed</span>
          </div>
        </div>
      </div>`;
  }).join('');

  lucide.createIcons();
}

function resetSearchFilters() {
  document.getElementById('filter-city').value = '';
  document.getElementById('filter-brand').value = '';
  document.getElementById('filter-issue').value = '';
  document.getElementById('filter-verified').value = '';
  runSearchFiltering();
}

function updateMapMarkers(techs, currentCity) {
  if (!mapInstance) {
    const center = [-6.0000, 22.0000];
    const container = document.getElementById('leaflet-map');
    if (!container) return;
    container.innerHTML = '';
    mapInstance = L.map('leaflet-map', { zoomControl: false }).setView(center, 3);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: 'abcd', maxZoom: 20
    }).addTo(mapInstance);
    L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);
  }

  mapMarkers.forEach(m => mapInstance.removeLayer(m));
  mapMarkers = [];
  if (techs.length === 0) return;

  const coords = [];
  techs.forEach(tech => {
    if (tech.coordinates && tech.coordinates.lat) {
      coords.push([tech.coordinates.lat, tech.coordinates.lng]);
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background:linear-gradient(135deg,var(--color-primary),var(--color-accent));color:white;padding:6px 12px;border-radius:var(--radius-full);font-weight:700;font-size:12px;box-shadow:var(--shadow-md);border:2px solid white;display:flex;align-items:center;gap:4px;white-space:nowrap;">★ ${tech.rating.toFixed(1)} | $${getMinPrice(tech)}</div>`,
        iconSize: [80, 32], iconAnchor: [40, 16]
      });
      const marker = L.marker([tech.coordinates.lat, tech.coordinates.lng], { icon: customIcon }).addTo(mapInstance);
      marker.bindPopup(`<div style="font-family:'Inter',sans-serif;width:180px;"><h5 style="margin-bottom:4px;font-weight:700;">${tech.name}</h5><p style="font-size:11px;color:var(--text-secondary);margin-bottom:8px;">${tech.location}</p><a href="#profile/${tech.id}" style="color:var(--color-primary);font-size:12px;font-weight:600;text-decoration:none;">View Profile →</a></div>`);
      mapMarkers.push(marker);
    }
  });

  if (coords.length > 0) {
    if (currentCity && CITY_COORDS[currentCity]) {
      mapInstance.setView(CITY_COORDS[currentCity], 12);
    } else {
      mapInstance.fitBounds(coords, { padding: [50, 50], maxZoom: 13 });
    }
  }
}

function getMinPrice(tech) { return tech.specializations.includes('Apple') ? 45 : 25; }

// TECH SHOWCASE
function renderTechShowcase() {
  const mount = document.getElementById('tech-showcase-mount');
  if (!mount) return;

  const topTechs = [...techniciansDb].sort((a, b) => b.rating - a.rating).slice(0, 4);

  mount.innerHTML = topTechs.map(tech => {
    const verBadge = tech.verified ? `<div class="tech-showcase-badge"><i data-lucide="badge-check" style="width:12px;height:12px;"></i> Verified</div>` : '';
    const tags = tech.specializations.slice(0, 3).map(s => `<span class="tech-showcase-tag">${s}</span>`).join('');

    return `
      <div class="tech-showcase-card fade-up" onclick="window.location.hash='#profile/${tech.id}'">
        <div class="tech-showcase-card-img">
          <img src="${tech.coverPic}" alt="${tech.name}" loading="lazy">
          ${verBadge}
          <div class="tech-showcase-rating">★ ${tech.rating.toFixed(1)}</div>
          <div class="tech-showcase-avatar"><img src="${tech.profilePic}" alt="${tech.owner}"></div>
        </div>
        <div class="tech-showcase-body">
          <div class="tech-showcase-name">${tech.name}</div>
          <div class="tech-showcase-location"><i data-lucide="map-pin" style="width:12px;height:12px;"></i> ${tech.city}</div>
          <div class="tech-showcase-tags">${tags}</div>
          <div class="tech-showcase-footer">
            <span class="tech-showcase-speed"><i data-lucide="zap" style="width:12px;height:12px;"></i> ${tech.responseSpeed}</span>
            <span class="tech-showcase-stats">${tech.repairsCompleted} fixed</span>
          </div>
        </div>
      </div>`;
  }).join('');

  lucide.createIcons();
}

// TESTIMONIALS
function renderTestimonials() {
  const track = document.getElementById('testimonials-track');
  if (!track) return;

  track.innerHTML = TESTIMONIALS_DATA.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-stars">${'★'.repeat(t.stars)}</div>
      <div class="testimonial-text">"${t.text}"</div>
      <div class="testimonial-author">
        <div class="testimonial-avatar">${t.name.charAt(0)}</div>
        <div>
          <div class="testimonial-name">${t.name}</div>
          <div class="testimonial-role">${t.role}</div>
        </div>
      </div>
    </div>
  `).join('');

  const dotsEl = document.getElementById('carousel-dots');
  if (dotsEl) {
    const totalSlides = Math.ceil(TESTIMONIALS_DATA.length / getTestimonialsPerView());
    dotsEl.innerHTML = Array.from({ length: totalSlides }, (_, i) =>
      `<button class="carousel-dot ${i === 0 ? 'active' : ''}" onclick="goToTestimonialSlide(${i})"></button>`
    ).join('');
  }
}

function getTestimonialsPerView() {
  if (window.innerWidth <= 768) return 1;
  if (window.innerWidth <= 1024) return 2;
  return 3;
}

function moveTestimonials(dir) {
  const track = document.getElementById('testimonials-track');
  if (!track) return;
  const perView = getTestimonialsPerView();
  const maxPos = Math.max(0, TESTIMONIALS_DATA.length - perView);
  testimonialPosition = Math.max(0, Math.min(maxPos, testimonialPosition + dir));
  const cardWidth = track.parentElement.offsetWidth / perView;
  track.style.transform = `translateX(-${testimonialPosition * cardWidth}px)`;
  updateCarouselDots();
}

function goToTestimonialSlide(idx) {
  const track = document.getElementById('testimonials-track');
  if (!track) return;
  const perView = getTestimonialsPerView();
  testimonialPosition = idx * perView;
  const maxPos = Math.max(0, TESTIMONIALS_DATA.length - perView);
  testimonialPosition = Math.min(testimonialPosition, maxPos);
  const cardWidth = track.parentElement.offsetWidth / perView;
  track.style.transform = `translateX(-${testimonialPosition * cardWidth}px)`;
  updateCarouselDots();
}

function updateCarouselDots() {
  const perView = getTestimonialsPerView();
  const currentSlide = Math.floor(testimonialPosition / perView);
  document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

// PROFILE
function renderTechnicianProfile(id) {
  const tech = techniciansDb.find(t => t.id === id);
  const mount = document.getElementById('profile-detail-mount');
  if (!tech) { mount.innerHTML = `<div class="section" style="text-align:center;"><h2>Profile Not Found</h2><a href="#search" class="btn btn-primary" style="margin-top:20px;">Back to Search</a></div>`; return; }

  const verBadge = tech.verified ? `<span style="display:flex;align-items:center;gap:4px;color:var(--color-success);font-weight:700;"><i data-lucide="badge-check" style="width:16px;height:16px;"></i> Verified Expert</span>` : '<span style="color:var(--text-muted)">Unverified Listing</span>';
  const aspects = { quality: 0, speed: 0, communication: 0, pricing: 0, professionalism: 0 };
  if (tech.reviews && tech.reviews.length > 0) {
    tech.reviews.forEach(r => { Object.keys(aspects).forEach(k => { aspects[k] += r.aspects ? (r.aspects[k] || 5) : 5; }); });
    Object.keys(aspects).forEach(k => { aspects[k] = (aspects[k] / tech.reviews.length).toFixed(1); });
  } else { Object.keys(aspects).forEach(k => aspects[k] = '5.0'); }

  const sideImg1 = 'https://images.unsplash.com/photo-1597740985671-2a8a3b80f02e?w=500&q=80';
  const sideImg2 = 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500&q=80';
  const specsList = tech.specializations.map(s => `<span class="tech-card-tag" style="padding:6px 12px;font-size:13px;">${s} Specialist</span>`).join('');

  const reviewsHtml = tech.reviews && tech.reviews.length > 0 ? tech.reviews.map(r => {
    const firstLetter = r.user ? r.user.charAt(0) : 'U';
    return `<div class="review-card"><div class="review-user-meta"><div class="review-user-info"><div class="review-avatar-char">${firstLetter}</div><div><div class="review-username">${r.user}</div><div class="review-date">${r.date}</div></div></div><div class="review-score"><i data-lucide="star" style="width:14px;height:14px;fill:#FFCC00;stroke:#FFCC00;"></i><span>${r.rating.toFixed(1)}</span></div></div><p class="review-comment">${r.comment}</p></div>`;
  }).join('') : `<p style="color:var(--text-secondary);text-align:center;padding:24px 0;">No reviews yet. Be the first!</p>`;

  mount.innerHTML = `
    <div class="profile-hero">
      <a href="#search" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;color:var(--text-secondary);margin-bottom:24px;font-weight:600;"><i data-lucide="arrow-left" style="width:16px;height:16px;"></i> Back to Directory</a>
      <div class="profile-header-meta">
        <div>
          <h1 class="profile-header-title">${tech.name}</h1>
          <div class="profile-subheader-row">
            <span style="font-weight:700;display:flex;align-items:center;gap:4px;color:var(--text-primary);"><i data-lucide="star" style="width:14px;height:14px;fill:#FFCC00;stroke:#FFCC00;"></i> ${tech.rating.toFixed(1)}</span>
            <span>•</span>
            <span style="text-decoration:underline;font-weight:600;">${tech.reviewsCount} reviews</span>
            <span>•</span>
            <span>${verBadge}</span>
            <span>•</span>
            <span style="display:flex;align-items:center;gap:4px;"><i data-lucide="map-pin" style="width:14px;height:14px;"></i> ${tech.location}</span>
          </div>
        </div>
      </div>
      <div class="profile-gallery-grid">
        <div class="profile-gallery-main"><img src="${tech.coverPic}" alt="Shop image"></div>
        <div class="profile-gallery-sides">
          <div class="profile-gallery-side-img"><img src="${sideImg1}" alt="Working photo"></div>
          <div class="profile-gallery-side-img"><img src="${sideImg2}" alt="Completed repair"></div>
        </div>
      </div>
    </div>
    <div class="profile-content-layout">
      <div class="profile-info-column">
        <div>
          <h2 style="font-size:24px;margin-bottom:8px;display:flex;align-items:center;gap:12px;">Shop Managed by ${tech.owner} <img src="${tech.profilePic}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;"></h2>
          <p style="color:var(--text-secondary);font-size:14px;">Offering professional mobile repairs with verified diagnostics and transparent pricing.</p>
        </div>
        <div class="profile-trust-strip">
          <div class="profile-trust-box"><div class="profile-trust-box-value">${tech.experience}</div><div class="profile-trust-box-label">Experience</div></div>
          <div class="profile-trust-box"><div class="profile-trust-box-value">${tech.repairsCompleted}</div><div class="profile-trust-box-label">Completed</div></div>
          <div class="profile-trust-box"><div class="profile-trust-box-value">${tech.responseSpeed.split(' ').slice(2).join(' ') || 'Instant'}</div><div class="profile-trust-box-label">Response</div></div>
        </div>
        <div>
          <h3 class="profile-section-title">Areas of Expertise</h3>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px;">${specsList}</div>
          <h3 class="profile-section-title">Business Hours</h3>
          <ul style="list-style:none;font-size:14px;display:flex;flex-direction:column;gap:8px;color:var(--text-secondary);">
            <li style="display:flex;justify-content:space-between;"><span>Weekdays:</span><strong>${tech.workingHours.weekday}</strong></li>
            <li style="display:flex;justify-content:space-between;"><span>Saturdays:</span><strong>${tech.workingHours.Saturday}</strong></li>
            <li style="display:flex;justify-content:space-between;"><span>Sundays:</span><strong>${tech.workingHours.Sunday}</strong></li>
          </ul>
        </div>
        <div>
          <h3 class="profile-section-title">Verified Reviews Summary</h3>
          <div class="profile-review-summary-row">
            <div class="aspect-rating-bar"><div class="aspect-bar-label"><span>Repair Quality</span><strong>${aspects.quality}</strong></div><div class="aspect-bar-outer"><div class="aspect-bar-inner" style="width:${aspects.quality*20}%;"></div></div></div>
            <div class="aspect-rating-bar"><div class="aspect-bar-label"><span>Turnaround Speed</span><strong>${aspects.speed}</strong></div><div class="aspect-bar-outer"><div class="aspect-bar-inner" style="width:${aspects.speed*20}%;"></div></div></div>
            <div class="aspect-rating-bar"><div class="aspect-bar-label"><span>Communication</span><strong>${aspects.communication}</strong></div><div class="aspect-bar-outer"><div class="aspect-bar-inner" style="width:${aspects.communication*20}%;"></div></div></div>
            <div class="aspect-rating-bar"><div class="aspect-bar-label"><span>Fair Pricing</span><strong>${aspects.pricing}</strong></div><div class="aspect-bar-outer"><div class="aspect-bar-inner" style="width:${aspects.pricing*20}%;"></div></div></div>
          </div>
          <div class="reviews-list">${reviewsHtml}</div>
          <div class="add-review-section">
            <h4 style="font-size:18px;margin-bottom:8px;">Leave a Verified Review</h4>
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:20px;">Only users who have done repairs here are permitted to post ratings.</p>
            <div class="rating-stars-input" id="star-input-group">
              <button class="star-btn active" onclick="setFormStars(1)" data-val="1"><i data-lucide="star"></i></button>
              <button class="star-btn active" onclick="setFormStars(2)" data-val="2"><i data-lucide="star"></i></button>
              <button class="star-btn active" onclick="setFormStars(3)" data-val="3"><i data-lucide="star"></i></button>
              <button class="star-btn active" onclick="setFormStars(4)" data-val="4"><i data-lucide="star"></i></button>
              <button class="star-btn active" onclick="setFormStars(5)" data-val="5"><i data-lucide="star"></i></button>
            </div>
            <form id="write-review-form" onsubmit="handleReviewSubmit(event, ${tech.id})">
              <div class="review-inputs-grid">
                <div class="review-form-field"><label for="review-author">Your Name</label><input type="text" id="review-author" required placeholder="e.g. Sandra Ndlovu"></div>
                <div class="review-form-field"><label for="review-pricing-score">Price Rating (1-5)</label><select id="review-pricing-score" required><option value="5">5 - Extremely Fair</option><option value="4">4 - Good Price</option><option value="3">3 - Average</option><option value="2">2 - High Price</option><option value="1">1 - Overcharged</option></select></div>
              </div>
              <div class="review-form-field" style="margin-bottom:20px;"><label for="review-comment-field">Review Comments</label><textarea id="review-comment-field" required rows="4" placeholder="Detail your experience..."></textarea></div>
              <button type="submit" class="btn btn-accent" style="height:44px;border-radius:var(--radius-md);">Post Review</button>
            </form>
          </div>
        </div>
      </div>
      <div>
        <div class="profile-card-cta">
          <div>
            <div style="font-size:12px;color:var(--text-muted);font-weight:700;text-transform:uppercase;">Starting Price Guideline</div>
            <div style="font-size:32px;font-weight:800;color:var(--color-primary);margin-top:4px;">$25 <span style="font-size:14px;font-weight:500;color:var(--text-secondary);">diagnostic included</span></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <a href="https://wa.me/${tech.whatsapp}?text=Hi%20${encodeURIComponent(tech.name)},%20I%20found%20you%20on%20Repair%20Hub%20and%20need%20a%20phone%20repair." target="_blank" class="btn btn-accent" style="height:48px;border-radius:var(--radius-md);font-size:15px;text-decoration:none;"><i data-lucide="message-square-text"></i> Message on WhatsApp</a>
            <a href="tel:${tech.phone}" class="btn btn-outline" style="height:48px;border-radius:var(--radius-md);font-size:15px;text-decoration:none;"><i data-lucide="phone"></i> Call Direct</a>
          </div>
          <div style="font-size:12px;color:var(--text-secondary);text-align:center;padding-top:8px;border-top:1px solid var(--color-border);"><i data-lucide="shield-check" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:4px;"></i> Repair Hub safe platform validation</div>
        </div>
      </div>
    </div>`;

  lucide.createIcons();
}

let currentFormStars = 5;
function setFormStars(rating) {
  currentFormStars = rating;
  document.querySelectorAll('#star-input-group .star-btn').forEach((s, idx) => {
    s.classList.toggle('active', idx < rating);
  });
}

function handleReviewSubmit(e, techId) {
  e.preventDefault();
  if (!activeUser) { alert('You must be signed in to submit reviews.'); openAuthModal(); return; }

  const tech = techniciansDb.find(t => t.id === techId);
  if (!tech) return;

  tech.reviews.push({
    id: Date.now(), user: document.getElementById('review-author').value,
    rating: currentFormStars, date: new Date().toISOString().split('T')[0],
    comment: document.getElementById('review-comment-field').value,
    aspects: { quality: currentFormStars, speed: currentFormStars, communication: 4, pricing: parseInt(document.getElementById('review-pricing-score').value), professionalism: 5 }
  });

  const sum = tech.reviews.reduce((acc, r) => acc + r.rating, 0);
  tech.rating = sum / tech.reviews.length;
  tech.reviewsCount = tech.reviews.length;
  saveToLocalStorage();
  renderTechnicianProfile(techId);
  alert('Review successfully submitted!');
}

// PRICING
function populatePricingModels() {
  const brandSelect = document.getElementById('price-brand');
  const modelSelect = document.getElementById('price-model');
  const models = MODELS[brandSelect?.value] || [];
  if (modelSelect) modelSelect.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
}

function calculatePagePrice() {
  const brand = document.getElementById('price-brand')?.value || 'Apple';
  const model = document.getElementById('price-model')?.value || 'iPhone 15';
  const issue = document.getElementById('price-issue')?.value || 'screen';
  const estimate = getRepairEstimate(brand, model, issue);

  const minVal = estimate[0], maxVal = estimate[1], timeMin = estimate[2], timeMax = estimate[3];
  const priceEl = document.getElementById('calc-price-output');
  const timeEl = document.getElementById('calc-time-output');
  if (priceEl) priceEl.textContent = `$${minVal} - $${maxVal}`;
  if (timeEl) timeEl.textContent = `${timeMin} - ${timeMax} hr${timeMax === 1 ? '' : 's'}`;
}

// RANKINGS
function initPopularRankings() {
  const topRated = [...techniciansDb].sort((a, b) => b.rating - a.rating).slice(0, 3);
  renderRankingCol('ranking-top-rated', topRated, 'rating');
  const fastest = [...techniciansDb].sort((a, b) => parseResponseTime(a.responseSpeed) - parseResponseTime(b.responseSpeed)).slice(0, 3);
  renderRankingCol('ranking-fastest', fastest, 'response');
  const specialists = [...techniciansDb].filter(t => t.specializations.includes('Apple') && t.specializations.includes('Samsung')).slice(0, 3);
  renderRankingCol('ranking-specialists', specialists, 'specialty');
}

function parseResponseTime(s) { const n = parseInt(s.replace(/[^0-9]/g, '')); return isNaN(n) ? 99 : n; }

function renderRankingCol(id, items, type) {
  const mount = document.getElementById(id);
  if (!mount) return;
  mount.innerHTML = items.map((item, idx) => {
    let subtext = '';
    if (type === 'rating') subtext = `${item.rating.toFixed(1)} ★ (${item.reviewsCount} reviews)`;
    else if (type === 'response') subtext = item.responseSpeed;
    else subtext = `${item.specializations.slice(0, 2).join('/')} verified expert`;
    return `<a href="#profile/${item.id}" class="ranking-item"><span class="ranking-num">0${idx + 1}</span><div class="ranking-item-img"><img src="${item.profilePic}" alt="${item.name}"></div><div class="ranking-item-details"><div class="ranking-item-name">${item.name}</div><div class="ranking-item-sub">${subtext}</div></div></a>`;
  }).join('');
}

// ONBOARD
function handleOnboardSubmit(e) {
  e.preventDefault();
  const newTech = {
    id: techniciansDb.length + 1,
    name: document.getElementById('onboard-name').value,
    owner: document.getElementById('onboard-owner').value,
    profilePic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    coverPic: 'https://images.unsplash.com/photo-1622060873503-09c8a0ded32f?w=800&auto=format&fit=crop&q=80',
    verified: false, rating: 5.0, reviewsCount: 0,
    city: document.getElementById('onboard-city').value,
    location: `${document.getElementById('onboard-address').value}, ${document.getElementById('onboard-city').value}`,
    coordinates: CITY_COORDS[document.getElementById('onboard-city').value] ? { lat: CITY_COORDS[document.getElementById('onboard-city').value][0] + (Math.random() - 0.5) * 0.02, lng: CITY_COORDS[document.getElementById('onboard-city').value][1] + (Math.random() - 0.5) * 0.02 } : { lat: 0, lng: 0 },
    whatsapp: document.getElementById('onboard-whatsapp').value,
    phone: '+' + document.getElementById('onboard-whatsapp').value,
    experience: `${document.getElementById('onboard-experience').value} years`,
    repairsCompleted: '0 repairs',
    specializations: Array.from(document.querySelectorAll('input[name="specialty"]:checked')).map(c => c.value) || ['Apple', 'Samsung'],
    responseSpeed: 'Responds within 10 mins',
    workingHours: { weekday: '8:00 AM - 5:00 PM', Saturday: '9:00 AM - 1:00 PM', Sunday: 'Closed' },
    reviews: []
  };
  techniciansDb.push(newTech);
  saveToLocalStorage();
  alert('Application submitted successfully! Pending admin verification.');
  window.location.hash = '#home';
}

// AUTH
function openAuthModal() { document.getElementById('auth-modal').classList.add('active'); }
function closeAuthModal(e, isGuest = false) { if (!e || e.target === document.getElementById('auth-modal') || isGuest) document.getElementById('auth-modal').classList.remove('active'); }

function mockGoogleAuth() {
  activeUser = { name: 'Guvaza Kundai', email: 'kundai.guvaza@gmail.com', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' };
  localStorage.setItem('repairhub_user_v2', JSON.stringify(activeUser));
  updateAuthBtnState();
  closeAuthModal(null, true);
  alert('Successfully signed in with Google!');
}

function mockEmailAuth() {
  activeUser = { name: 'Email User', email: 'user@repairhub.co.za', avatar: '' };
  localStorage.setItem('repairhub_user_v2', JSON.stringify(activeUser));
  updateAuthBtnState();
  closeAuthModal(null, true);
  alert('Successfully signed in with Email!');
}

function updateAuthBtnState() {
  const btn = document.getElementById('auth-nav-btn');
  if (activeUser) {
    btn.textContent = activeUser.name.split(' ')[0];
    btn.onclick = () => { if (confirm('Sign out of Repair Hub?')) { activeUser = null; localStorage.removeItem('repairhub_user_v2'); updateAuthBtnState(); } };
  } else {
    btn.textContent = 'Sign In';
    btn.onclick = openAuthModal;
  }
}