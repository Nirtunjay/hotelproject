/**
 * scripts/seed.js  —  Dev-only seed script.
 * Clears and re-populates: hotels, rooms, restaurants, restaurant_tables, users (admin only).
 * Run: npm run seed
 * Guard: refuses to run if NODE_ENV === 'production'.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
require('../src/config/env'); // validate env vars

if (process.env.NODE_ENV === 'production') {
  console.error('❌  Seed script must not run in production.');
  process.exit(1);
}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { slugify } = require('../src/utils/slugify');

const Hotel = require('../src/models/Hotel');
const Room  = require('../src/models/Room');
const Restaurant = require('../src/models/Restaurant');
const RestaurantTable = require('../src/models/RestaurantTable');
const User  = require('../src/models/User');

// ── Hotel seed data (migrated from Flask hotel_service.py) ───────────────────

const HOTELS_RAW = [
  {
    name: 'The Imperial New Delhi', city: 'Delhi',
    address: 'Janpath Lane, Connaught Place, New Delhi – 110001',
    description: 'A landmark of colonial grandeur at the heart of New Delhi, offering exquisite Art Deco interiors, world-class dining, and impeccable service.',
    starRating: 5, amenities: ['WiFi','Swimming Pool','Spa','Gym','Valet Parking','Airport Shuttle','Fine Dining','Bar','Business Centre','Concierge','24-hr Room Service'],
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
    coordinates: { lat: 28.6222, lng: 77.2219 }, checkInTime: '14:00', checkOutTime: '11:00',
    policies: 'Free cancellation up to 24 hours before check-in.',
    rooms: [
      { type: 'Deluxe Room',    pricePerNight: 18500, capacity: 2, totalInventory: 20 },
      { type: 'Premier Room',   pricePerNight: 24000, capacity: 2, totalInventory: 10 },
      { type: 'Suite',          pricePerNight: 45000, capacity: 3, totalInventory: 6  },
      { type: 'Imperial Suite', pricePerNight: 85000, capacity: 4, totalInventory: 2  },
    ],
  },
  {
    name: 'Leela Palace New Delhi', city: 'Delhi',
    address: 'Africa Avenue, Chanakyapuri, New Delhi – 110023',
    description: 'An ultra-luxury retreat in the diplomatic enclave blending Mughal architecture with contemporary opulence, featuring a rooftop pool overlooking the Delhi skyline.',
    starRating: 5, amenities: ['WiFi','Rooftop Pool','Spa','Gym','Multiple Restaurants','Butler Service','Valet Parking','Helipad','Business Centre'],
    images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'],
    coordinates: { lat: 28.5921, lng: 77.1893 }, checkInTime: '15:00', checkOutTime: '12:00',
    policies: 'Free cancellation up to 48 hours before check-in.',
    rooms: [
      { type: 'Grand Deluxe Room',   pricePerNight: 22000, capacity: 2, totalInventory: 15 },
      { type: 'Royal Suite',         pricePerNight: 55000, capacity: 3, totalInventory: 5  },
      { type: 'Presidential Suite',  pricePerNight: 120000, capacity: 4, totalInventory: 1 },
    ],
  },
  {
    name: 'Ibis New Delhi Aerocity', city: 'Delhi',
    address: 'Asset Area 7, Hospitality District, Aerocity, New Delhi – 110037',
    description: 'Modern, affordable comfort steps from Indira Gandhi International Airport. Perfect for transit stays or quick business trips.',
    starRating: 3, amenities: ['WiFi','Restaurant','Bar','Gym','Airport Shuttle','24-hr Front Desk','Laundry'],
    images: ['https://images.unsplash.com/photo-1495365200479-c4ed1d35e1aa?w=800'],
    coordinates: { lat: 28.5562, lng: 77.0928 }, checkInTime: '14:00', checkOutTime: '12:00',
    policies: 'Non-refundable rate. Free cancellation on flexible rate up to 24 hours.',
    rooms: [
      { type: 'Standard Room',  pricePerNight: 3800, capacity: 2, totalInventory: 50 },
      { type: 'Superior Room',  pricePerNight: 4800, capacity: 2, totalInventory: 20 },
    ],
  },
  {
    name: 'The Taj Mahal Palace Mumbai', city: 'Mumbai',
    address: 'Apollo Bunder, Colaba, Mumbai – 400001',
    description: 'The iconic Taj Mahal Palace, overlooking the Gateway of India and the Arabian Sea, is India\'s most storied hotel. A century of heritage meets flawless luxury.',
    starRating: 5, amenities: ['WiFi','Sea-View Pool','Spa','Gym','6 Restaurants','Butler Service','Valet Parking','Heritage Tour','Business Centre','Cigar Lounge'],
    images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'],
    coordinates: { lat: 18.9217, lng: 72.8332 }, checkInTime: '14:00', checkOutTime: '12:00',
    policies: 'Complimentary cancellation up to 72 hours before arrival.',
    rooms: [
      { type: 'Luxury Room',               pricePerNight: 28000,  capacity: 2, totalInventory: 20 },
      { type: 'Luxury Suite',              pricePerNight: 65000,  capacity: 3, totalInventory: 8  },
      { type: 'Grand Presidential Suite',  pricePerNight: 200000, capacity: 4, totalInventory: 1  },
    ],
  },
  {
    name: 'Trident Nariman Point', city: 'Mumbai',
    address: 'Nariman Point, Mumbai – 400021',
    description: 'Contemporary elegance at India\'s financial hub. The Trident Nariman Point offers breathtaking Marine Drive sea views and seamless business facilities.',
    starRating: 5, amenities: ['WiFi','Infinity Pool','Spa','Gym','Fine Dining','Business Centre','Concierge','24-hr Room Service'],
    images: ['https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800'],
    coordinates: { lat: 18.9256, lng: 72.8242 }, checkInTime: '14:00', checkOutTime: '12:00',
    policies: 'Free cancellation up to 24 hours before check-in.',
    rooms: [
      { type: 'Superior Room',        pricePerNight: 16500, capacity: 2, totalInventory: 25 },
      { type: 'Deluxe Sea-View Room', pricePerNight: 22000, capacity: 2, totalInventory: 15 },
      { type: 'Club Suite',           pricePerNight: 40000, capacity: 3, totalInventory: 5  },
    ],
  },
  {
    name: 'Hotel Suba Palace Mumbai', city: 'Mumbai',
    address: 'Battery Street, Apollo Bunder, Mumbai – 400039',
    description: 'A well-loved mid-range hotel in the heart of Colaba, moments from the Gateway of India. Great value with warm, personalised service.',
    starRating: 3, amenities: ['WiFi','Restaurant','Bar','Parking','Laundry','24-hr Front Desk'],
    images: ['https://images.unsplash.com/photo-1501117716987-c8c394bb29df?w=800'],
    coordinates: { lat: 18.9229, lng: 72.8306 }, checkInTime: '14:00', checkOutTime: '11:00',
    policies: 'Free cancellation up to 24 hours before check-in.',
    rooms: [
      { type: 'Standard Room', pricePerNight: 5500, capacity: 2, totalInventory: 30 },
      { type: 'Deluxe Room',   pricePerNight: 7000, capacity: 3, totalInventory: 10 },
    ],
  },
  {
    name: 'Rambagh Palace Jaipur', city: 'Jaipur',
    address: 'Bhawani Singh Rd, Rambagh, Jaipur – 302005',
    description: 'Once the residence of the Maharaja of Jaipur, Rambagh Palace is a magnificent showcase of Rajput architecture with royal suites and manicured gardens.',
    starRating: 5, amenities: ['WiFi','Heritage Pool','Spa','Polo Ground','Royal Dining','Elephant Ride','Valet Parking','Concierge','Butler Service'],
    images: ['https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800'],
    coordinates: { lat: 26.8890, lng: 75.8069 }, checkInTime: '14:00', checkOutTime: '12:00',
    policies: '72-hour free cancellation policy applies.',
    rooms: [
      { type: 'Grand Deluxe Room', pricePerNight: 35000,  capacity: 2, totalInventory: 10 },
      { type: 'Palace Suite',      pricePerNight: 75000,  capacity: 3, totalInventory: 5  },
      { type: 'Royal Suite',       pricePerNight: 150000, capacity: 4, totalInventory: 2  },
    ],
  },
  {
    name: 'Hotel Pearl Palace Jaipur', city: 'Jaipur',
    address: '51-52 Hari Kishan Somani Marg, Hathroi, Jaipur – 302001',
    description: 'A charming boutique hotel with artistic Rajasthani décor. Famous for its award-winning rooftop restaurant with sweeping Pink City views.',
    starRating: 3, amenities: ['WiFi','Rooftop Restaurant','Parking','Travel Desk','Laundry','24-hr Front Desk'],
    images: ['https://images.unsplash.com/photo-1529290130-4ca3753253ae?w=800'],
    coordinates: { lat: 26.9124, lng: 75.8065 }, checkInTime: '12:00', checkOutTime: '11:00',
    policies: 'Free cancellation up to 24 hours before check-in.',
    rooms: [
      { type: 'Standard Room', pricePerNight: 2800, capacity: 2, totalInventory: 20 },
      { type: 'Deluxe Room',   pricePerNight: 3800, capacity: 3, totalInventory: 10 },
    ],
  },
  {
    name: 'Zostel Jaipur', city: 'Jaipur',
    address: 'D-168 Shiv Marg, Bani Park, Jaipur – 302016',
    description: 'Jaipur\'s favourite backpacker hostel in the peaceful Bani Park area. Colourful, safe, and social — with easy access to the walled city.',
    starRating: 2, amenities: ['WiFi','Common Kitchen','Chill-Out Area','Rooftop','Travel Desk','Bicycle Rental'],
    images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'],
    coordinates: { lat: 26.9300, lng: 75.7970 }, checkInTime: '12:00', checkOutTime: '10:00',
    policies: 'Non-refundable bookings. Contact hostel for special cancellation requests.',
    rooms: [
      { type: 'Dormitory Bed', pricePerNight: 850,  capacity: 1, totalInventory: 40 },
      { type: 'Private Room',  pricePerNight: 2200, capacity: 2, totalInventory: 8  },
    ],
  },
  {
    name: 'The Leela Palace Bengaluru', city: 'Bangalore',
    address: '23 HAL Old Airport Rd, Kodihalli, Bengaluru – 560008',
    description: 'A premier urban resort combining South Indian architecture with cutting-edge technology — ideal for both leisure and corporate travellers.',
    starRating: 5, amenities: ['WiFi','Pool','Spa','Gym','Fine Dining','Business Centre','Concierge','Valet Parking','24-hr Room Service','Kids Club'],
    images: ['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'],
    coordinates: { lat: 12.9591, lng: 77.6490 }, checkInTime: '14:00', checkOutTime: '12:00',
    policies: 'Free cancellation up to 48 hours before check-in.',
    rooms: [
      { type: 'Deluxe Room',  pricePerNight: 19000, capacity: 2, totalInventory: 20 },
      { type: 'Premier Room', pricePerNight: 25000, capacity: 2, totalInventory: 10 },
      { type: 'Club Suite',   pricePerNight: 48000, capacity: 3, totalInventory: 4  },
    ],
  },
  {
    name: 'Treebo Trend Maple Suites Bangalore', city: 'Bangalore',
    address: '100 Feet Road, Indiranagar, Bengaluru – 560038',
    description: 'Comfortable, modern rooms in the vibrant Indiranagar neighbourhood, surrounded by Bengaluru\'s best cafés, restaurants, and pubs.',
    starRating: 3, amenities: ['WiFi','Restaurant','Parking','Laundry','Air Conditioning','24-hr Front Desk'],
    images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800'],
    coordinates: { lat: 12.9716, lng: 77.6413 }, checkInTime: '13:00', checkOutTime: '11:00',
    policies: 'Free cancellation up to 24 hours before check-in.',
    rooms: [
      { type: 'Standard Room', pricePerNight: 4200, capacity: 2, totalInventory: 30 },
      { type: 'Superior Room', pricePerNight: 5500, capacity: 2, totalInventory: 10 },
    ],
  },
  {
    name: 'Taj Exotica Resort & Spa Goa', city: 'Goa',
    address: 'Calvaddo, Benaulim Beach, South Goa – 403716',
    description: 'A 56-acre slice of paradise on Benaulim Beach combining Portuguese heritage, lush tropical gardens, and world-class amenities.',
    starRating: 5, amenities: ['WiFi','Private Beach','4 Pools','Spa','Water Sports','Fine Dining','Bar','Kids Club','Valet Parking','Yoga Classes'],
    images: ['https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800'],
    coordinates: { lat: 15.2593, lng: 73.9316 }, checkInTime: '15:00', checkOutTime: '12:00',
    policies: '72-hour free cancellation. No-show charged full first night.',
    rooms: [
      { type: 'Deluxe Room', pricePerNight: 25000, capacity: 2, totalInventory: 15 },
      { type: 'Pool Villa',  pricePerNight: 58000, capacity: 2, totalInventory: 6  },
      { type: 'Beach Villa', pricePerNight: 80000, capacity: 4, totalInventory: 3  },
    ],
  },
  {
    name: 'Zostel Goa (Panaji)', city: 'Goa',
    address: '31/1 January 6th Lane, Fontainhas, Panaji, Goa – 403001',
    description: 'Goa\'s coolest backpacker hostel in the colourful Latin Quarter of Fontainhas. Perfect for solo travellers and budget-conscious explorers.',
    starRating: 2, amenities: ['WiFi','Common Kitchen','Chill-Out Area','Lockers','Bicycle Rental','Travel Desk'],
    images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'],
    coordinates: { lat: 15.4989, lng: 73.8278 }, checkInTime: '12:00', checkOutTime: '10:00',
    policies: 'Non-refundable bookings.',
    rooms: [
      { type: 'Dormitory Bed', pricePerNight: 950,  capacity: 1, totalInventory: 40 },
      { type: 'Private Room',  pricePerNight: 2800, capacity: 2, totalInventory: 8  },
    ],
  },
  {
    name: 'ITC Mughal Agra', city: 'Agra',
    address: 'Fatehabad Road, Tajganj, Agra – 282001',
    description: 'Inspired by Mughal architecture, ITC Mughal is spread across 35 acres of lush gardens, minutes from the Taj Mahal.',
    starRating: 5, amenities: ['WiFi','Pool','Spa','Taj-View Rooms','Mughal Gardens','Fine Dining','Gym','Cooking Classes','Concierge'],
    images: ['https://images.unsplash.com/photo-1519449556851-5720b33024e7?w=800'],
    coordinates: { lat: 27.1527, lng: 78.0401 }, checkInTime: '14:00', checkOutTime: '12:00',
    policies: 'Free cancellation up to 48 hours before check-in.',
    rooms: [
      { type: 'Deluxe Room',  pricePerNight: 21000, capacity: 2, totalInventory: 15 },
      { type: 'Mughal Suite', pricePerNight: 50000, capacity: 3, totalInventory: 5  },
    ],
  },
  {
    name: 'The Taj Coromandel Chennai', city: 'Chennai',
    address: '37 Mahatma Gandhi Rd, Nungambakkam, Chennai – 600034',
    description: 'Chennai\'s premier address for luxury travel. The Taj Coromandel delivers South Indian warmth paired with contemporary sophistication.',
    starRating: 5, amenities: ['WiFi','Pool','Spa','Gym','Multiple Restaurants','Business Centre','Concierge','Valet Parking'],
    images: ['https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800'],
    coordinates: { lat: 13.0574, lng: 80.2510 }, checkInTime: '14:00', checkOutTime: '12:00',
    policies: 'Free cancellation up to 24 hours before check-in.',
    rooms: [
      { type: 'Superior Room', pricePerNight: 17500, capacity: 2, totalInventory: 20 },
      { type: 'Deluxe Room',   pricePerNight: 22000, capacity: 2, totalInventory: 10 },
      { type: 'Suite',         pricePerNight: 48000, capacity: 3, totalInventory: 4  },
    ],
  },
  {
    name: 'Taj Falaknuma Palace Hyderabad', city: 'Hyderabad',
    address: 'Engine Bowli, Falaknuma, Hyderabad – 500053',
    description: 'Perched 2,000 feet above Hyderabad, the Falaknuma Palace was built by the sixth Nizam and offers unparalleled Nizami grandeur.',
    starRating: 5, amenities: ['WiFi','Pool','Spa','Royal Banquet','Horse Carriage','Heritage Tour','Butler Service','Telescope Terrace','Fine Dining','Library'],
    images: ['https://images.unsplash.com/photo-1559628229-7a9e97fc13ef?w=800'],
    coordinates: { lat: 17.3227, lng: 78.4650 }, checkInTime: '15:00', checkOutTime: '12:00',
    policies: '72-hour free cancellation. Special rates are non-refundable.',
    rooms: [
      { type: 'Deluxe Room',       pricePerNight: 42000,  capacity: 2, totalInventory: 8 },
      { type: 'Nizam Suite',       pricePerNight: 100000, capacity: 3, totalInventory: 3 },
      { type: 'Falaknuma Suite',   pricePerNight: 200000, capacity: 4, totalInventory: 1 },
    ],
  },
  {
    name: 'Golkonda Hotel Hyderabad', city: 'Hyderabad',
    address: '10-1-124 Masab Tank, Hyderabad – 500028',
    description: 'A reliable 4-star retreat in central Hyderabad offering comfortable rooms, a sparkling pool, and easy access to city attractions.',
    starRating: 4, amenities: ['WiFi','Pool','Gym','Restaurant','Bar','Banquet Halls','Travel Desk','Parking'],
    images: ['https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800'],
    coordinates: { lat: 17.4022, lng: 78.4602 }, checkInTime: '14:00', checkOutTime: '12:00',
    policies: 'Free cancellation up to 24 hours before check-in.',
    rooms: [
      { type: 'Deluxe Room', pricePerNight: 8500,  capacity: 2, totalInventory: 25 },
      { type: 'Suite',       pricePerNight: 16000, capacity: 3, totalInventory: 8  },
    ],
  },
  {
    name: 'FabHotel Prime Corporate Hub Hyderabad', city: 'Hyderabad',
    address: 'Plot 86, Kavuri Hills, Madhapur, Hyderabad – 500033',
    description: 'Budget-friendly business hotel in the heart of Hyderabad\'s IT corridor. Clean rooms, fast WiFi, and quick access to HITEC City offices.',
    starRating: 2, amenities: ['WiFi','Restaurant','Air Conditioning','Parking','24-hr Front Desk'],
    images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800'],
    coordinates: { lat: 17.4400, lng: 78.3789 }, checkInTime: '12:00', checkOutTime: '10:00',
    policies: 'Non-refundable rate. Free cancellation on flexible rate up to 6 hours before check-in.',
    rooms: [
      { type: 'Standard Room', pricePerNight: 2200, capacity: 2, totalInventory: 35 },
    ],
  },
];

// ── Restaurant seed data (migrated from Flask restaurant_service.py) ──────────

const RESTAURANTS_RAW = [
  {
    name: 'Bukhara – ITC Maurya', city: 'Delhi',
    address: 'Sardar Patel Marg, Diplomatic Enclave, New Delhi – 110021',
    description: 'World-famous for its slow-cooked Dal Bukhara and the theatrical open tandoor kitchen. A timeless Delhi institution hosting world leaders for over four decades.',
    cuisine: ['North Indian', 'Tandoor'], priceForTwo: 5000, rating: 4.8,
    images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'],
    openingHours: { open: '12:30', close: '23:45' },
    coordinates: { lat: 28.5983, lng: 77.1701 },
    tables: [{ tableType: '2-Top', capacity: 2, quantity: 8 }, { tableType: '4-Top', capacity: 4, quantity: 10 }, { tableType: 'Private Dining Room', capacity: 12, quantity: 2 }],
  },
  {
    name: 'Indian Accent', city: 'Delhi',
    address: 'The Lodhi, Lodhi Road, New Delhi – 110003',
    description: 'Repeatedly ranked among Asia\'s 50 Best Restaurants, Indian Accent reinvents Indian cuisine with global techniques. Chef Manish Mehrotra\'s tasting menu is unmissable.',
    cuisine: ['Modern Indian', 'Contemporary'], priceForTwo: 7000, rating: 4.9,
    images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'],
    openingHours: { open: '12:00', close: '23:00' },
    coordinates: { lat: 28.5931, lng: 77.2219 },
    tables: [{ tableType: '2-Top', capacity: 2, quantity: 6 }, { tableType: '4-Top', capacity: 4, quantity: 8 }, { tableType: "Chef's Table", capacity: 8, quantity: 1 }],
  },
  {
    name: 'Paranthe Wali Gali – Old Delhi', city: 'Delhi',
    address: 'Gali Paranthe Wali, Chandni Chowk, Old Delhi – 110006',
    description: 'A legendary street-food lane in Chandni Chowk serving 150 varieties of stuffed paranthas since 1875. The ultimate Delhi heritage food experience.',
    cuisine: ['Street Food', 'North Indian'], priceForTwo: 400, rating: 4.4,
    images: ['https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'],
    openingHours: { open: '07:00', close: '22:00' },
    coordinates: { lat: 28.6562, lng: 77.2300 },
    tables: [{ tableType: '2-Top', capacity: 2, quantity: 10 }, { tableType: '4-Top', capacity: 4, quantity: 5 }],
  },
  {
    name: 'Wasabi by Morimoto – Taj Mahal Palace', city: 'Mumbai',
    address: 'Apollo Bunder, Colaba, Mumbai – 400001',
    description: 'An exquisite Japanese dining experience by the legendary Iron Chef Masaharu Morimoto, located inside the iconic Taj Mahal Palace.',
    cuisine: ['Japanese', 'Sushi', 'Contemporary'], priceForTwo: 9000, rating: 4.8,
    images: ['https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800'],
    openingHours: { open: '12:00', close: '23:00' },
    coordinates: { lat: 18.9217, lng: 72.8332 },
    tables: [{ tableType: '2-Top', capacity: 2, quantity: 8 }, { tableType: '4-Top', capacity: 4, quantity: 6 }, { tableType: 'Sushi Bar', capacity: 1, quantity: 10 }],
  },
  {
    name: 'Khyber Restaurant Mumbai', city: 'Mumbai',
    address: '145 Mahatma Gandhi Rd, Fort, Mumbai – 400001',
    description: 'An iconic Mumbai institution since 1938, Khyber delivers rich North-Western Frontier cuisine in a magnificent setting adorned with hand-painted murals.',
    cuisine: ['North Indian', 'Mughlai', 'Frontier'], priceForTwo: 2500, rating: 4.6,
    images: ['https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=800'],
    openingHours: { open: '12:30', close: '23:30' },
    coordinates: { lat: 18.9322, lng: 72.8360 },
    tables: [{ tableType: '2-Top', capacity: 2, quantity: 12 }, { tableType: '4-Top', capacity: 4, quantity: 10 }, { tableType: '6-Top', capacity: 6, quantity: 4 }],
  },
  {
    name: 'Mahesh Lunch Home Mumbai', city: 'Mumbai',
    address: '8-B, Cowasji Patel St, Fort, Mumbai – 400001',
    description: 'Mumbai\'s go-to destination for fresh coastal seafood since 1948. The Butter Pepper Garlic Crab is legendary.',
    cuisine: ['Seafood', 'Coastal Indian', 'Mangalorean'], priceForTwo: 1800, rating: 4.5,
    images: ['https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800'],
    openingHours: { open: '11:00', close: '23:30' },
    coordinates: { lat: 18.9312, lng: 72.8358 },
    tables: [{ tableType: '2-Top', capacity: 2, quantity: 10 }, { tableType: '4-Top', capacity: 4, quantity: 8 }, { tableType: '6-Top', capacity: 6, quantity: 3 }],
  },
  {
    name: 'Laxmi Mishtan Bhandar Jaipur', city: 'Jaipur',
    address: 'Johari Bazaar, Jaipur – 302003',
    description: 'A beloved Jaipur institution since 1954 serving authentic Rajasthani sweets, chaat, and thali. The pyaaz kachori and daal baati churma are unmissable.',
    cuisine: ['Rajasthani', 'Indian Sweets', 'Street Food'], priceForTwo: 600, rating: 4.5,
    images: ['https://images.unsplash.com/photo-1567521464027-f127ff144326?w=800'],
    openingHours: { open: '08:00', close: '22:30' },
    coordinates: { lat: 26.9239, lng: 75.8267 },
    tables: [{ tableType: '2-Top', capacity: 2, quantity: 15 }, { tableType: '4-Top', capacity: 4, quantity: 10 }],
  },
  {
    name: 'Chokhi Dhani Jaipur', city: 'Jaipur',
    address: '12 Miles, Tonk Road, Jaipur – 303905',
    description: 'An immersive Rajasthani village resort experience with traditional folk performances, camel rides, and authentic Rajasthani thali under the stars.',
    cuisine: ['Rajasthani', 'Traditional Indian'], priceForTwo: 1500, rating: 4.4,
    images: ['https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800'],
    openingHours: { open: '17:00', close: '23:00' },
    coordinates: { lat: 26.8010, lng: 75.8333 },
    tables: [{ tableType: '4-Top', capacity: 4, quantity: 20 }, { tableType: '6-Top', capacity: 6, quantity: 10 }, { tableType: '8-Top', capacity: 8, quantity: 5 }],
  },
  {
    name: 'Karavalli – The Gateway Hotel Bangalore', city: 'Bangalore',
    address: '66 Residency Road, Bengaluru – 560025',
    description: 'Consistently rated among India\'s top restaurants, Karavalli specialises in coastal Karnataka and Kerala cuisine in a serene garden setting.',
    cuisine: ['Coastal Karnataka', 'Kerala', 'Seafood'], priceForTwo: 3000, rating: 4.7,
    images: ['https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800'],
    openingHours: { open: '12:30', close: '15:00', dinnerOpen: '19:30', dinnerClose: '23:00' },
    coordinates: { lat: 12.9716, lng: 77.5946 },
    tables: [{ tableType: '2-Top', capacity: 2, quantity: 10 }, { tableType: '4-Top', capacity: 4, quantity: 8 }, { tableType: '6-Top', capacity: 6, quantity: 4 }],
  },
  {
    name: 'Truffles Bangalore', city: 'Bangalore',
    address: '36 St Marks Road, Bengaluru – 560001',
    description: 'Bengaluru\'s most beloved burger and steak joint. Expect long queues, hearty American-style comfort food, and a buzzing vibe — worth every wait.',
    cuisine: ['American', 'Burgers', 'Continental'], priceForTwo: 1200, rating: 4.5,
    images: ['https://images.unsplash.com/photo-1550547660-d9450f859349?w=800'],
    openingHours: { open: '12:00', close: '23:30' },
    coordinates: { lat: 12.9716, lng: 77.5946 },
    tables: [{ tableType: '2-Top', capacity: 2, quantity: 15 }, { tableType: '4-Top', capacity: 4, quantity: 10 }],
  },
  {
    name: "Vinayak Family Restaurant Goa", city: 'Goa',
    address: 'Miramar, Panaji, Goa – 403001',
    description: 'A no-frills Goan institution beloved by locals for authentic fish curry rice, prawn balchão, and bebinca dessert at unbeatable prices.',
    cuisine: ['Goan', 'Seafood', 'Indian'], priceForTwo: 800, rating: 4.4,
    images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'],
    openingHours: { open: '11:00', close: '22:30' },
    coordinates: { lat: 15.4909, lng: 73.8278 },
    tables: [{ tableType: '2-Top', capacity: 2, quantity: 10 }, { tableType: '4-Top', capacity: 4, quantity: 8 }],
  },
  {
    name: 'Gunpowder – Goa', city: 'Goa',
    address: 'House 2191, 18 June Road, Panaji, Goa – 403001',
    description: 'A hidden gem in Panaji serving bold South Indian cuisine — think Kerala prawn curry, Chettinad chicken, and toddy-shop-style fish dishes in a breezy heritage house.',
    cuisine: ['South Indian', 'Kerala', 'Chettinad'], priceForTwo: 1200, rating: 4.6,
    images: ['https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=800'],
    openingHours: { open: '12:00', close: '22:30' },
    coordinates: { lat: 15.4934, lng: 73.8278 },
    tables: [{ tableType: '2-Top', capacity: 2, quantity: 8 }, { tableType: '4-Top', capacity: 4, quantity: 6 }],
  },
  {
    name: 'Pind Balluchi – ITC Mughal', city: 'Agra',
    address: 'Fatehabad Road, Tajganj, Agra – 282001',
    description: 'A rustic Punjabi dhaba experience elevated to restaurant quality, inside the ITC Mughal complex. Dal makhani and tandoori roti are exceptional.',
    cuisine: ['Punjabi', 'North Indian', 'Tandoor'], priceForTwo: 1800, rating: 4.4,
    images: ['https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800'],
    openingHours: { open: '12:00', close: '23:00' },
    coordinates: { lat: 27.1527, lng: 78.0401 },
    tables: [{ tableType: '2-Top', capacity: 2, quantity: 10 }, { tableType: '4-Top', capacity: 4, quantity: 8 }, { tableType: '6-Top', capacity: 6, quantity: 3 }],
  },
  {
    name: 'Peshawri – ITC Grand Chola Chennai', city: 'Chennai',
    address: '63 Mount Road, Guindy, Chennai – 600032',
    description: 'An ode to the culinary traditions of the North-West Frontier, Peshawri is known for its clay-oven cuisine and the iconic Dal Bukhara.',
    cuisine: ['North Indian', 'Tandoor', 'Frontier'], priceForTwo: 4000, rating: 4.7,
    images: ['https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800'],
    openingHours: { open: '12:30', close: '15:00' },
    coordinates: { lat: 13.0067, lng: 80.2206 },
    tables: [{ tableType: '2-Top', capacity: 2, quantity: 8 }, { tableType: '4-Top', capacity: 4, quantity: 6 }, { tableType: '6-Top', capacity: 6, quantity: 2 }],
  },
  {
    name: 'Murugan Idli Shop Chennai', city: 'Chennai',
    address: '77 Gandhi Irwin Rd, Egmore, Chennai – 600008',
    description: 'South India\'s most celebrated idli shop, serving cloud-soft idlis with an array of freshly ground chutneys and sambar since 1971.',
    cuisine: ['South Indian', 'Breakfast', 'Tiffin'], priceForTwo: 300, rating: 4.6,
    images: ['https://images.unsplash.com/photo-1630383249896-424e482df921?w=800'],
    openingHours: { open: '06:00', close: '22:00' },
    coordinates: { lat: 13.0786, lng: 80.2707 },
    tables: [{ tableType: '2-Top', capacity: 2, quantity: 20 }, { tableType: '4-Top', capacity: 4, quantity: 10 }],
  },
  {
    name: 'Paradise Restaurant Hyderabad', city: 'Hyderabad',
    address: 'Persis Complex, MG Road, Secunderabad – 500003',
    description: 'The home of authentic Hyderabadi Dum Biryani since 1953. The dum-cooked mutton biryani is a pilgrimage for biryani lovers across India.',
    cuisine: ['Hyderabadi', 'Biryani', 'Mughlai'], priceForTwo: 1200, rating: 4.6,
    images: ['https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800'],
    openingHours: { open: '11:30', close: '23:30' },
    coordinates: { lat: 17.4347, lng: 78.4997 },
    tables: [{ tableType: '2-Top', capacity: 2, quantity: 20 }, { tableType: '4-Top', capacity: 4, quantity: 15 }, { tableType: '6-Top', capacity: 6, quantity: 5 }],
  },
  {
    name: 'Flechazo – Hyderabad', city: 'Hyderabad',
    address: 'Road No. 36, Jubilee Hills, Hyderabad – 500033',
    description: 'A chic rooftop Spanish tapas bar in Jubilee Hills, blending Latin flavours with Hyderabadi warmth. Perfect for sundowners and long weekend dinners.',
    cuisine: ['Spanish', 'Tapas', 'Mediterranean'], priceForTwo: 2800, rating: 4.5,
    images: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800'],
    openingHours: { open: '12:00', close: '01:00' },
    coordinates: { lat: 17.4260, lng: 78.4136 },
    tables: [{ tableType: '2-Top', capacity: 2, quantity: 10 }, { tableType: '4-Top', capacity: 4, quantity: 8 }, { tableType: 'Rooftop Lounge', capacity: 6, quantity: 4 }],
  },
  {
    name: 'Ohri\'s Jiva Imperia Hyderabad', city: 'Hyderabad',
    address: 'Basheer Bagh, Hyderabad – 500029',
    description: 'A multi-cuisine landmark in the heart of Hyderabad offering continental, North Indian, and Hyderabadi cuisine across a sprawling 3-floor heritage property.',
    cuisine: ['Multi-cuisine', 'Continental', 'Hyderabadi'], priceForTwo: 2000, rating: 4.3,
    images: ['https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800'],
    openingHours: { open: '12:00', close: '00:00' },
    coordinates: { lat: 17.4062, lng: 78.4692 },
    tables: [{ tableType: '2-Top', capacity: 2, quantity: 15 }, { tableType: '4-Top', capacity: 4, quantity: 12 }, { tableType: '6-Top', capacity: 6, quantity: 4 }],
  },
];

// ── Main seed function ─────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    Hotel.deleteMany({}),
    Room.deleteMany({}),
    Restaurant.deleteMany({}),
    RestaurantTable.deleteMany({}),
    User.deleteMany({ role: 'admin' }), // only clear admin users; keep real customer data safe
  ]);
  console.log('🗑️   Cleared existing seed collections');

  // Seed hotels + rooms
  for (const h of HOTELS_RAW) {
    const { rooms, ...hotelData } = h;
    const slug = `${slugify(hotelData.name)}-${hotelData.city.toLowerCase()}`;
    const hotel = await Hotel.create({ ...hotelData, slug });
    await Room.insertMany(rooms.map(r => ({ ...r, hotel: hotel._id })));
  }
  console.log(`🏨  Seeded ${HOTELS_RAW.length} hotels`);

  // Seed restaurants + tables
  for (const r of RESTAURANTS_RAW) {
    const { tables, ...restData } = r;
    const slug = `${slugify(restData.name)}-${restData.city.toLowerCase()}`;
    const restaurant = await Restaurant.create({ ...restData, slug });
    await RestaurantTable.insertMany(tables.map(t => ({ ...t, restaurant: restaurant._id })));
  }
  console.log(`🍽️   Seeded ${RESTAURANTS_RAW.length} restaurants`);

  // Seed admin user (idempotent: only if ADMIN_EMAIL env var is set)
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const hash = await bcrypt.hash(adminPassword, 12);
    await User.create({ name: 'Admin', email: adminEmail, password: hash, role: 'admin' });
    console.log(`👤  Admin user created: ${adminEmail}`);
  } else {
    console.log('⚠️   ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin creation');
  }

  await mongoose.disconnect();
  console.log('✅  Seed complete');
}

seed().catch(err => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
