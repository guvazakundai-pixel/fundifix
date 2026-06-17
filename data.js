// FundiFix Seed Database

const BRANDS = ['Apple', 'Samsung', 'Tecno', 'Infinix', 'Xiaomi', 'Huawei'];

const MODELS = {
  'Apple': ['iPhone 15 Pro Max', 'iPhone 15', 'iPhone 14 Pro', 'iPhone 13', 'iPhone 12', 'iPhone 11', 'iPhone XR', 'iPhone X'],
  'Samsung': ['Galaxy S24 Ultra', 'Galaxy S23 Ultra', 'Galaxy S22', 'Galaxy A54 5G', 'Galaxy A34', 'Galaxy A14', 'Galaxy Note 20', 'Galaxy S20 FE'],
  'Tecno': ['Camon 30 Premier', 'Camon 20 Pro', 'Spark 20 Pro', 'Spark 10 Pro', 'Phantom V Fold', 'Pop 8'],
  'Infinix': ['Note 40 Pro', 'Note 30 Pro', 'Hot 40 Pro', 'Zero 30 5G', 'Smart 8'],
  'Xiaomi': ['Redmi Note 13 Pro', 'Redmi Note 12', 'Redmi 12C', 'Xiaomi 13T', 'Poco X6 Pro'],
  'Huawei': ['P60 Pro', 'Nova 11 Pro', 'Y9a', 'P30 Lite', 'Mate 40 Pro']
};

const REPAIR_ISSUES = [
  { id: 'screen', name: 'Screen Replacement', description: 'Cracked glass, bleeding display, or unresponsive touch screen.' },
  { id: 'battery', name: 'Battery Replacement', description: 'Fast draining, swelling, or phone turning off unexpectedly.' },
  { id: 'charging', name: 'Charging Port Repair', description: 'Loose connection, slow charging, or not charging at all.' },
  { id: 'water', name: 'Water Damage Recovery', description: 'Liquid exposure diagnostic and chemical cleaning.' },
  { id: 'camera', name: 'Camera Repair', description: 'Blurry lens, autofocus failure, or black screen when opening camera.' },
  { id: 'backglass', name: 'Back Glass Replacement', description: 'Shattered rear casing or housing replacement.' },
  { id: 'software', name: 'Software & Unlocking', description: 'Boot loops, operating system crashes, or network unlocking.' }
];

// Reference Pricing Guide & Estimates Database
// Prices are in USD since USD is a common denominator across Africa (and Zimbabwe specifically uses USD/ZiG)
const REPAIR_ESTIMATES = {
  'Apple': {
    'iPhone 15 Pro Max': { screen: [220, 290, 1, 2], battery: [69, 89, 1, 2], charging: [60, 80, 1, 2], water: [50, 120, 3, 5], camera: [99, 150, 1, 2], backglass: [90, 140, 2, 3], software: [20, 40, 1, 2] },
    'iPhone 14 Pro': { screen: [180, 240, 1, 2], battery: [59, 79, 1, 2], charging: [50, 70, 1, 2], water: [50, 100, 3, 5], camera: [89, 130, 1, 2], backglass: [80, 120, 2, 3], software: [20, 40, 1, 2] },
    'iPhone 13': { screen: [120, 160, 1, 1.5], battery: [49, 69, 1, 1], charging: [45, 60, 1, 2], water: [40, 80, 2, 4], camera: [69, 99, 1, 1.5], backglass: [60, 90, 2, 3], software: [20, 30, 1, 1.5] },
    'iPhone 11': { screen: [70, 99, 1, 1], battery: [35, 49, 1, 1], charging: [35, 45, 1, 1.5], water: [30, 60, 2, 4], camera: [45, 69, 1, 1], backglass: [40, 60, 2, 3], software: [15, 25, 1, 1] }
  },
  'Samsung': {
    'Galaxy S24 Ultra': { screen: [240, 310, 1, 2], battery: [55, 75, 1, 2], charging: [50, 70, 1, 2], water: [50, 120, 3, 5], camera: [110, 160, 1, 2], backglass: [70, 100, 2, 3], software: [20, 45, 1, 2] },
    'Galaxy A54 5G': { screen: [79, 119, 1, 1.5], battery: [35, 49, 1, 1], charging: [30, 45, 1, 1.5], water: [30, 60, 2, 4], camera: [45, 69, 1, 1.5], backglass: [30, 50, 1.5, 2], software: [15, 30, 1, 1] },
    'Galaxy A14': { screen: [45, 65, 1, 1], battery: [25, 35, 1, 1], charging: [20, 30, 1, 1], water: [25, 50, 2, 3], camera: [30, 45, 1, 1], backglass: [20, 30, 1, 1.5], software: [10, 20, 1, 1] }
  },
  'Tecno': {
    'Camon 20 Pro': { screen: [50, 75, 1, 1.5], battery: [25, 35, 1, 1], charging: [20, 30, 1, 1], water: [25, 50, 2, 3], camera: [30, 50, 1, 1.5], backglass: [20, 30, 1, 1.5], software: [10, 20, 1, 1] },
    'Spark 10 Pro': { screen: [35, 50, 1, 1], battery: [20, 30, 1, 1], charging: [15, 25, 1, 1], water: [20, 40, 2, 3], camera: [25, 40, 1, 1], backglass: [15, 25, 1, 1.5], software: [10, 15, 1, 1] }
  },
  'Infinix': {
    'Note 30 Pro': { screen: [55, 80, 1, 1.5], battery: [25, 35, 1, 1], charging: [20, 30, 1, 1], water: [25, 50, 2, 3], camera: [30, 50, 1, 1.5], backglass: [20, 30, 1, 1.5], software: [10, 20, 1, 1] },
    'Smart 8': { screen: [30, 45, 1, 1], battery: [18, 28, 1, 1], charging: [15, 20, 1, 1], water: [20, 35, 2, 3], camera: [20, 30, 1, 1], backglass: [12, 20, 1, 1.5], software: [8, 15, 1, 1] }
  }
};

// Fallback logic function to dynamically generate a pricing estimate if a specific model is not listed
function getRepairEstimate(brand, model, issueId) {
  // Try exact lookup
  if (REPAIR_ESTIMATES[brand] && REPAIR_ESTIMATES[brand][model] && REPAIR_ESTIMATES[brand][model][issueId]) {
    return REPAIR_ESTIMATES[brand][model][issueId];
  }
  
  // Try brand-wide default averages based on premium/budget level of brand
  const isPremiumBrand = ['Apple', 'Samsung'].includes(brand);
  const isHighEndModel = model.toLowerCase().includes('pro') || model.toLowerCase().includes('ultra') || model.toLowerCase().includes('max') || model.toLowerCase().includes('fold');
  
  let baseRange = [35, 60]; // default budget screen cost
  
  switch(issueId) {
    case 'screen':
      baseRange = isPremiumBrand ? (isHighEndModel ? [180, 260] : [99, 150]) : (isHighEndModel ? [60, 95] : [35, 55]);
      break;
    case 'battery':
      baseRange = isPremiumBrand ? [40, 65] : [20, 35];
      break;
    case 'charging':
      baseRange = isPremiumBrand ? [35, 55] : [15, 30];
      break;
    case 'water':
      baseRange = isPremiumBrand ? [40, 90] : [20, 50];
      break;
    case 'camera':
      baseRange = isPremiumBrand ? (isHighEndModel ? [80, 130] : [50, 80]) : [25, 45];
      break;
    case 'backglass':
      baseRange = isPremiumBrand ? [50, 99] : [15, 30];
      break;
    case 'software':
      baseRange = isPremiumBrand ? [20, 35] : [10, 20];
      break;
  }
  
  // random timing
  const duration = issueId === 'water' ? [2, 4] : (issueId === 'backglass' ? [1.5, 3] : [1, 2]);
  
  return [...baseRange, ...duration];
}

const SEED_TECHNICIANS = [
  {
    id: 1,
    name: 'TechFix Solutions',
    owner: 'Ephraim Sibanda',
    profilePic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    coverPic: 'https://images.unsplash.com/photo-1622060873503-09c8a0ded32f?w=800&auto=format&fit=crop&q=80',
    verified: true,
    rating: 4.9,
    reviewsCount: 184,
    city: 'Harare',
    location: 'Suite 4, Eastgate Mall, Harare CBD',
    coordinates: { lat: -17.8292, lng: 31.0539 },
    whatsapp: '263772123456',
    phone: '+263772123456',
    experience: '6 years',
    repairsCompleted: '1,500+',
    specializations: ['Samsung', 'Apple', 'Huawei'],
    responseSpeed: 'Responds within 5 mins',
    workingHours: { weekday: '8:00 AM - 5:30 PM', Saturday: '8:30 AM - 1:00 PM', Sunday: 'Closed' },
    workGalleries: [
      { before: 'https://images.unsplash.com/photo-1597740985671-2a8a3b80f02e?w=300&q=80', after: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&q=80', label: 'iPhone 13 Screen Repair' }
    ],
    reviews: [
      {
        id: 101,
        user: 'Tatenda Chimbwanda',
        rating: 5,
        date: '2026-06-12',
        comment: 'Professional service! Replaced my Galaxy S23 Ultra screen in under 2 hours. Ephraim explains the pricing breakdown transparently. Highly recommended.',
        aspects: { quality: 5, speed: 5, communication: 5, pricing: 4, professionalism: 5 }
      },
      {
        id: 102,
        user: 'Nyasha Mukome',
        rating: 5,
        date: '2026-05-28',
        comment: 'Very polite, clean workshop. They test the face ID and camera post-repair before asking for payment.',
        aspects: { quality: 5, speed: 4, communication: 5, pricing: 5, professionalism: 5 }
      }
    ]
  },
  {
    id: 2,
    name: 'SmartFix Nairobi',
    owner: 'Josphat Mwangi',
    profilePic: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    coverPic: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800&auto=format&fit=crop&q=80',
    verified: true,
    rating: 4.8,
    reviewsCount: 212,
    city: 'Nairobi',
    location: '1st Floor, Junction Mall, Ngong Road, Nairobi',
    coordinates: { lat: -1.3006, lng: 36.7617 },
    whatsapp: '254712345678',
    phone: '+254712345678',
    experience: '8 years',
    repairsCompleted: '3,200+',
    specializations: ['Apple', 'Samsung', 'Tecno', 'Infinix'],
    responseSpeed: 'Responds within 10 mins',
    workingHours: { weekday: '8:00 AM - 7:00 PM', Saturday: '9:00 AM - 5:00 PM', Sunday: '10:00 AM - 2:00 PM' },
    workGalleries: [
      { before: 'https://images.unsplash.com/photo-1562408590-e32931084e23?w=300&q=80', after: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=300&q=80', label: 'Samsung charging port repair' }
    ],
    reviews: [
      {
        id: 201,
        user: 'Amani Wanjiku',
        rating: 5,
        date: '2026-06-14',
        comment: 'Excellent service. They repaired my Infinix Note battery quickly. They even gave me a 3-month warranty card.',
        aspects: { quality: 5, speed: 5, communication: 5, pricing: 5, professionalism: 5 }
      },
      {
        id: 202,
        user: 'David Kiprop',
        rating: 4,
        date: '2026-06-03',
        comment: 'Original parts are a bit expensive but the repair quality is unmatched. Safe environment inside the mall.',
        aspects: { quality: 5, speed: 4, communication: 4, pricing: 3, professionalism: 5 }
      }
    ]
  },
  {
    id: 3,
    name: 'Computer Village TechLab',
    owner: 'Chidi Okafor',
    profilePic: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    coverPic: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80',
    verified: true,
    rating: 4.7,
    reviewsCount: 342,
    city: 'Lagos',
    location: 'Shop 12, Pepple Street, Computer Village, Ikeja, Lagos',
    coordinates: { lat: 6.5966, lng: 3.3444 },
    whatsapp: '2348031234567',
    phone: '+2348031234567',
    experience: '10 years',
    repairsCompleted: '5,000+',
    specializations: ['Tecno', 'Infinix', 'Xiaomi', 'Samsung'],
    responseSpeed: 'Responds within 2 mins',
    workingHours: { weekday: '8:30 AM - 6:00 PM', Saturday: '9:00 AM - 6:00 PM', Sunday: 'Closed' },
    workGalleries: [],
    reviews: [
      {
        id: 301,
        user: 'Olumide Adebayo',
        rating: 5,
        date: '2026-06-15',
        comment: 'Chidi is the king of Tecno micro-soldering. Fixed a dead motherboard that three other shops said was unrepairable.',
        aspects: { quality: 5, speed: 5, communication: 4, pricing: 5, professionalism: 4 }
      },
      {
        id: 302,
        user: 'Chioma Nwachukwu',
        rating: 4,
        date: '2026-05-10',
        comment: 'Very fast and very cheap. Computer village is crowded, but Chidi has a clean small office upstairs where you can wait safely.',
        aspects: { quality: 4, speed: 5, communication: 4, pricing: 5, professionalism: 4 }
      }
    ]
  },
  {
    id: 4,
    name: 'iAmplify Repairs',
    owner: 'Le Roux Venter',
    profilePic: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
    coverPic: 'https://images.unsplash.com/photo-1601524909162-be87252be298?w=800&auto=format&fit=crop&q=80',
    verified: true,
    rating: 4.9,
    reviewsCount: 98,
    city: 'Johannesburg',
    location: 'Shop G12, Rosebank Mall, Rosebank, Johannesburg',
    coordinates: { lat: -26.1458, lng: 28.0431 },
    whatsapp: '27711234567',
    phone: '+27711234567',
    experience: '5 years',
    repairsCompleted: '950+',
    specializations: ['Apple', 'Xiaomi'],
    responseSpeed: 'Responds within 15 mins',
    workingHours: { weekday: '9:00 AM - 6:00 PM', Saturday: '9:00 AM - 5:00 PM', Sunday: '9:00 AM - 2:00 PM' },
    workGalleries: [],
    reviews: [
      {
        id: 401,
        user: 'Sipho Ndlovu',
        rating: 5,
        date: '2026-06-08',
        comment: 'Specializes in iPhones. Completely pristine screen restoration. They only use certified refurbished or genuine pull-offs.',
        aspects: { quality: 5, speed: 5, communication: 5, pricing: 4, professionalism: 5 }
      }
    ]
  },
  {
    id: 5,
    name: 'Accra Mobile Hub',
    owner: 'Kofi Mensah',
    profilePic: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=150&auto=format&fit=crop&q=80',
    coverPic: 'https://images.unsplash.com/photo-1562408590-e32931084e23?w=800&auto=format&fit=crop&q=80',
    verified: false,
    rating: 4.6,
    reviewsCount: 64,
    city: 'Accra',
    location: 'Near Kwame Nkrumah Interchange, Circle, Accra',
    coordinates: { lat: 5.5600, lng: -0.2078 },
    whatsapp: '233244123456',
    phone: '+233244123456',
    experience: '4 years',
    repairsCompleted: '600+',
    specializations: ['Infinix', 'Tecno', 'Samsung'],
    responseSpeed: 'Responds within 8 mins',
    workingHours: { weekday: '8:00 AM - 6:00 PM', Saturday: '8:00 AM - 5:00 PM', Sunday: 'Closed' },
    workGalleries: [],
    reviews: [
      {
        id: 501,
        user: 'Ama Serwaa',
        rating: 5,
        date: '2026-06-01',
        comment: 'Affordable. Replaced my charging pin in 30 minutes. Coffee offered while you wait.',
        aspects: { quality: 4, speed: 5, communication: 5, pricing: 5, professionalism: 4 }
      }
    ]
  },
  {
    id: 6,
    name: 'Apex Phone Lab',
    owner: 'Pardon Mandizvidza',
    profilePic: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    coverPic: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&auto=format&fit=crop&q=80',
    verified: true,
    rating: 4.9,
    reviewsCount: 112,
    city: 'Harare',
    location: 'Office 203, 2nd Floor, Joina City, Harare CBD',
    coordinates: { lat: -17.8312, lng: 31.0494 },
    whatsapp: '263773987654',
    phone: '+263773987654',
    experience: '7 years',
    repairsCompleted: '2,000+',
    specializations: ['Apple', 'Samsung', 'Tecno'],
    responseSpeed: 'Responds within 3 mins',
    workingHours: { weekday: '8:00 AM - 6:00 PM', Saturday: '9:00 AM - 2:00 PM', Sunday: 'Closed' },
    workGalleries: [],
    reviews: [
      {
        id: 601,
        user: 'Tendai Mutasa',
        rating: 5,
        date: '2026-06-16',
        comment: 'Joina City is highly secure. Honest pricing, did the water damage recovery for my iPhone XR and it works fully now. No hidden charges.',
        aspects: { quality: 5, speed: 5, communication: 5, pricing: 5, professionalism: 5 }
      }
    ]
  }
];

// Helper to get database items
function getLocalData(key, fallback) {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      return JSON.parse(data);
    } catch(e) {
      return fallback;
    }
  }
  localStorage.setItem(key, JSON.stringify(fallback));
  return fallback;
}

// Global mutable data references
const techniciansDb = getLocalData('fundifix_technicians', SEED_TECHNICIANS);
const reviewSubmissions = getLocalData('fundifix_submissions', []);

function saveToLocalStorage() {
  localStorage.setItem('fundifix_technicians', JSON.stringify(techniciansDb));
  localStorage.setItem('fundifix_submissions', JSON.stringify(reviewSubmissions));
}
