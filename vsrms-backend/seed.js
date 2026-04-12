'use strict';

/**
 * VSRMS MongoDB Seed Script
 * Usage:  node seed.js   OR   npm run seed
 *
 * Wipes ALL collections, then creates:
 *   1 admin
 *   2 workshop owners (each manages 1 of the first 2 workshops)
 *   6 technicians   (3 per owner-managed workshop)
 *   10 customers
 *   20 workshops across Sri Lanka (2 owner-managed, 18 standalone)
 *   20 vehicles      (2 per customer)
 *   10 appointments  (1 per customer — mix of statuses)
 *   5  service records (for in_progress appointments)
 *   10 reviews        (one per customer)
 */

require('dotenv').config();
const mongoose = require('mongoose');

const User          = require('./src/models/User');
const Workshop      = require('./src/models/Workshop');
const Vehicle       = require('./src/models/Vehicle');
const Appointment   = require('./src/models/Appointment');
const ServiceRecord = require('./src/models/ServiceRecord');
const Review        = require('./src/models/Review');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pastDays   = (n) => new Date(Date.now() - n * 86_400_000);
const futureDays = (n) => new Date(Date.now() + n * 86_400_000);

// ─── 20 Workshops (real Sri Lankan coordinates) ───────────────────────────────
// Index 0 → Owner 1 (AutoFix Pro)   |  Index 1 → Owner 2 (Lanka Motors)
// Index 2–19 → standalone (no owner)
const WORKSHOPS = [
  {
    name: 'AutoFix Pro Colombo',
    location: { type: 'Point', coordinates: [79.8612, 6.9271] },
    address: '12 Galle Road, Colombo 03',
    district: 'Colombo',
    servicesOffered: ['Engine Repair', 'Brake Service', 'Oil Change', 'Tire Rotation', 'AC Repair'],
    description: 'Premier auto-repair workshop in Colombo with 15+ years of experience. Specialists in Japanese and European vehicles.',
    contactNumber: '+94 11 234 5678',
  },
  {
    name: 'Lanka Motors Kandy',
    location: { type: 'Point', coordinates: [80.6337, 7.2906] },
    address: '88 Peradeniya Road, Kandy',
    district: 'Kandy',
    servicesOffered: ['Full Service', 'Transmission Repair', 'Electrical Diagnostics', 'Body Work', 'Wheel Alignment'],
    description: 'Family-owned workshop in Kandy providing reliable and affordable vehicle maintenance since 1998.',
    contactNumber: '+94 81 222 3344',
  },
  {
    name: 'Precision Garage Galle',
    location: { type: 'Point', coordinates: [80.2170, 6.0329] },
    address: '34 Main Street, Galle Fort',
    district: 'Galle',
    servicesOffered: ['Suspension Repair', 'Engine Diagnostics', 'Air Conditioning', 'Battery Service', 'Detailing'],
    description: 'Modern facility in Galle equipped with the latest diagnostic tools for all makes and models.',
    contactNumber: '+94 91 333 4455',
  },
  {
    name: 'Matara Auto Works',
    location: { type: 'Point', coordinates: [80.5353, 5.9549] },
    address: '22 Beach Road, Matara',
    district: 'Matara',
    servicesOffered: ['Oil Change', 'Brake Repair', 'Clutch Replacement', 'Tyre Service'],
    description: 'Trusted workshop serving Matara and surrounding areas for over a decade.',
    contactNumber: '+94 41 222 1133',
  },
  {
    name: 'Negombo Speed Garage',
    location: { type: 'Point', coordinates: [79.8378, 7.2008] },
    address: '5 Lewis Place, Negombo',
    district: 'Gampaha',
    servicesOffered: ['Full Service', 'Wheel Alignment', 'Engine Tuning', 'Exhaust Repair'],
    description: 'Fast-turnaround service near Negombo with certified mechanics.',
    contactNumber: '+94 31 222 5566',
  },
  {
    name: 'Ratnapura Service Centre',
    location: { type: 'Point', coordinates: [80.3997, 6.6828] },
    address: '14 Colombo Road, Ratnapura',
    district: 'Ratnapura',
    servicesOffered: ['Engine Overhaul', 'AC Repair', 'Battery Replacement', 'Electrical Work'],
    description: 'Full-service workshop in the gem city, servicing all vehicle types.',
    contactNumber: '+94 45 222 7788',
  },
  {
    name: 'Kurunegala Auto Hub',
    location: { type: 'Point', coordinates: [80.3644, 7.4818] },
    address: '77 North Circular Road, Kurunegala',
    district: 'Kurunegala',
    servicesOffered: ['Brake Service', 'Suspension Work', 'Tire Fitting', 'Body Repairs'],
    description: 'Comprehensive vehicle care centre in Kurunegala town.',
    contactNumber: '+94 37 222 9900',
  },
  {
    name: 'Anuradhapura Motors',
    location: { type: 'Point', coordinates: [80.3989, 8.3114] },
    address: '19 Kandy Road, Anuradhapura',
    district: 'Anuradhapura',
    servicesOffered: ['Oil Change', 'Engine Repair', 'Gear Box Service', 'Air Filter Replacement'],
    description: 'Reliable mechanics serving the North Central Province.',
    contactNumber: '+94 25 222 4455',
  },
  {
    name: 'Polonnaruwa Garage',
    location: { type: 'Point', coordinates: [81.0001, 7.9403] },
    address: '8 Batticaloa Road, Polonnaruwa',
    district: 'Polonnaruwa',
    servicesOffered: ['Tire Service', 'Battery Replacement', 'Engine Diagnostics', 'Clutch Work'],
    description: 'Your trusted partner for vehicle maintenance in Polonnaruwa.',
    contactNumber: '+94 27 222 3322',
  },
  {
    name: 'Jaffna Top Gear',
    location: { type: 'Point', coordinates: [80.0137, 9.6615] },
    address: '45 Hospital Road, Jaffna',
    district: 'Jaffna',
    servicesOffered: ['Full Service', 'AC Service', 'Electrical Repairs', 'Painting & Body Work'],
    description: "Northern Sri Lanka's premier auto-repair destination.",
    contactNumber: '+94 21 222 6677',
  },
  {
    name: 'Trincomalee Fleet Care',
    location: { type: 'Point', coordinates: [81.2335, 8.5874] },
    address: '33 Dockyard Road, Trincomalee',
    district: 'Trincomalee',
    servicesOffered: ['Fleet Maintenance', 'Diesel Engine Service', 'Brake Overhaul', 'Suspension'],
    description: 'Specialising in fleet vehicles and heavy-duty maintenance.',
    contactNumber: '+94 26 222 8899',
  },
  {
    name: 'Batticaloa Expert Motors',
    location: { type: 'Point', coordinates: [81.6924, 7.7170] },
    address: '12 Bar Road, Batticaloa',
    district: 'Batticaloa',
    servicesOffered: ['Engine Repair', 'Gear Repair', 'Electrical Diagnostics', 'Cooling System'],
    description: 'Expert mechanics with 20 years of experience in Batticaloa.',
    contactNumber: '+94 65 222 1100',
  },
  {
    name: 'Ampara Auto Care',
    location: { type: 'Point', coordinates: [81.6724, 7.2993] },
    address: '5 DS Senanayake Mawatha, Ampara',
    district: 'Ampara',
    servicesOffered: ['Oil Change', 'Tyre Fitting', 'Air Conditioning', 'Battery Service'],
    description: 'Affordable and efficient vehicle maintenance in Ampara.',
    contactNumber: '+94 63 222 3344',
  },
  {
    name: 'Badulla Hill Country Garage',
    location: { type: 'Point', coordinates: [81.0558, 6.9895] },
    address: '28 Passara Road, Badulla',
    district: 'Badulla',
    servicesOffered: ['Brake Service', 'Engine Tuning', 'Clutch Repair', 'Exhaust Work'],
    description: 'Specialised in mountain-road vehicles and hill-country driving conditions.',
    contactNumber: '+94 55 222 5566',
  },
  {
    name: 'Nuwara Eliya Motors',
    location: { type: 'Point', coordinates: [80.7650, 6.9497] },
    address: '14 Grand Hotel Road, Nuwara Eliya',
    district: 'Nuwara Eliya',
    servicesOffered: ['Full Service', 'Heating System', 'Engine Overhaul', 'Tire Chain Fitting'],
    description: 'High-altitude vehicle-care specialists. Serving the hill station since 2005.',
    contactNumber: '+94 52 222 7788',
  },
  {
    name: 'Hambantota Wheels & More',
    location: { type: 'Point', coordinates: [81.1185, 6.1242] },
    address: '9 Siribopura Road, Hambantota',
    district: 'Hambantota',
    servicesOffered: ['Tyre Service', 'Wheel Alignment', 'Body Work', 'AC Repair'],
    description: 'Modern workshop in the southern development hub of Sri Lanka.',
    contactNumber: '+94 47 222 9900',
  },
  {
    name: 'Kegalle Quick Fix',
    location: { type: 'Point', coordinates: [80.3500, 7.2500] },
    address: '3 Kandy Road, Kegalle',
    district: 'Kegalle',
    servicesOffered: ['Oil Change', 'Brake Pads', 'Battery', 'Tyre Rotation', 'Engine Check'],
    description: 'Quick and reliable service on the Kandy–Colombo highway.',
    contactNumber: '+94 35 222 1122',
  },
  {
    name: 'Kalutara Coastal Garage',
    location: { type: 'Point', coordinates: [79.9607, 6.5854] },
    address: '56 Galle Road, Kalutara South',
    district: 'Kalutara',
    servicesOffered: ['Full Service', 'Rust Treatment', 'AC Service', 'Electrical Work'],
    description: 'Coastal vehicle specialists — protecting cars from salt-air corrosion.',
    contactNumber: '+94 34 222 3344',
  },
  {
    name: 'Puttalam North Garage',
    location: { type: 'Point', coordinates: [79.8405, 8.0362] },
    address: '21 Colombo Road, Puttalam',
    district: 'Puttalam',
    servicesOffered: ['Engine Repair', 'Gear Box', 'Fuel System', 'Suspension'],
    description: 'Trusted workshop for fishing-fleet and local vehicles in Puttalam.',
    contactNumber: '+94 32 222 5566',
  },
  {
    name: 'Vavuniya Service Station',
    location: { type: 'Point', coordinates: [80.4971, 8.7514] },
    address: '10 Horowpotana Road, Vavuniya',
    district: 'Vavuniya',
    servicesOffered: ['Diesel Service', 'Engine Overhaul', 'Brake System', 'Air Filter'],
    description: 'Full-service station in Vavuniya — gateway to the North.',
    contactNumber: '+94 24 222 7788',
  },
];

// ─── Users ────────────────────────────────────────────────────────────────────
const ADMIN = [
  {
    asgardeoSub: 'seed-admin-001',
    fullName: 'Nimal Silva',
    email: 'admin@vsrms.lk',
    phone: '+94 77 000 0001',
    role: 'admin',
    active: true,
  },
];

const OWNERS = [
  {
    asgardeoSub: 'seed-owner-001',
    fullName: 'Roshan Fernando',
    email: 'roshan@autofix.lk',
    phone: '+94 77 100 0001',
    role: 'workshop_owner',
    active: true,
  },
  {
    asgardeoSub: 'seed-owner-002',
    fullName: 'Thilak Bandara',
    email: 'thilak@lankamotors.lk',
    phone: '+94 77 100 0002',
    role: 'workshop_owner',
    active: true,
  },
];

// wsIdx = which workshop (0 = AutoFix, 1 = Lanka Motors)
const TECHNICIANS = [
  { asgardeoSub: 'seed-tech-001', fullName: 'Kamal Silva',         email: 'kamal@autofix.lk',        phone: '+94 77 200 0001', role: 'workshop_staff', active: true, wsIdx: 0 },
  { asgardeoSub: 'seed-tech-002', fullName: 'Nuwan Perera',        email: 'nuwan@autofix.lk',         phone: '+94 77 200 0002', role: 'workshop_staff', active: true, wsIdx: 0 },
  { asgardeoSub: 'seed-tech-003', fullName: 'Asanka Jayawardena',  email: 'asanka@autofix.lk',        phone: '+94 77 200 0003', role: 'workshop_staff', active: true, wsIdx: 0 },
  { asgardeoSub: 'seed-tech-004', fullName: 'Pradeep Kumara',      email: 'pradeep@lankamotors.lk',   phone: '+94 77 200 0004', role: 'workshop_staff', active: true, wsIdx: 1 },
  { asgardeoSub: 'seed-tech-005', fullName: 'Chaminda Rajapaksha', email: 'chaminda@lankamotors.lk',  phone: '+94 77 200 0005', role: 'workshop_staff', active: true, wsIdx: 1 },
  { asgardeoSub: 'seed-tech-006', fullName: 'Dilshan Wickrama',    email: 'dilshan@lankamotors.lk',   phone: '+94 77 200 0006', role: 'workshop_staff', active: true, wsIdx: 1 },
];

const CUSTOMERS = [
  { asgardeoSub: 'seed-cust-001', fullName: 'Amara Jayawardena',    email: 'amara@gmail.com',    phone: '+94 77 111 2233', role: 'customer', active: true },
  { asgardeoSub: 'seed-cust-002', fullName: 'Ishara Pathirana',     email: 'ishara@gmail.com',   phone: '+94 71 222 3344', role: 'customer', active: true },
  { asgardeoSub: 'seed-cust-003', fullName: 'Dinesh Samarasinghe',  email: 'dinesh@gmail.com',   phone: '+94 76 333 4455', role: 'customer', active: true },
  { asgardeoSub: 'seed-cust-004', fullName: 'Nalini Wickramaratne', email: 'nalini@gmail.com',   phone: '+94 78 444 5566', role: 'customer', active: true },
  { asgardeoSub: 'seed-cust-005', fullName: 'Chamara Dissanayake',  email: 'chamara@gmail.com',  phone: '+94 72 555 6677', role: 'customer', active: true },
  { asgardeoSub: 'seed-cust-006', fullName: 'Sanduni Mendis',       email: 'sanduni@gmail.com',  phone: '+94 75 666 7788', role: 'customer', active: true },
  { asgardeoSub: 'seed-cust-007', fullName: 'Ruwan Gunasekara',     email: 'ruwan@gmail.com',    phone: '+94 70 777 8899', role: 'customer', active: true },
  { asgardeoSub: 'seed-cust-008', fullName: 'Tharanga Rajapaksha',  email: 'tharanga@gmail.com', phone: '+94 77 888 9900', role: 'customer', active: true },
  { asgardeoSub: 'seed-cust-009', fullName: 'Manjula Senanayake',   email: 'manjula@gmail.com',  phone: '+94 71 999 0011', role: 'customer', active: true },
  { asgardeoSub: 'seed-cust-010', fullName: 'Prasad Liyanage',      email: 'prasad@gmail.com',   phone: '+94 76 000 1122', role: 'customer', active: true },
];

// ─── Vehicles: 2 per customer ─────────────────────────────────────────────────
// Primary (index 0–9)   → one appointment each
// Secondary (index 0–9) → no active appointment
const VEHICLES_PRIMARY = [
  { registrationNo: 'WP-CAR-1001', make: 'Toyota',     model: 'Corolla',    year: 2019, vehicleType: 'car',        mileage: 48500 },
  { registrationNo: 'WP-CAR-1002', make: 'Honda',      model: 'Civic',      year: 2020, vehicleType: 'car',        mileage: 32000 },
  { registrationNo: 'CP-VAN-1003', make: 'Toyota',     model: 'Hiace',      year: 2017, vehicleType: 'van',        mileage: 95000 },
  { registrationNo: 'SP-CAR-1004', make: 'Suzuki',     model: 'Swift',      year: 2021, vehicleType: 'car',        mileage: 18000 },
  { registrationNo: 'WP-MOT-1005', make: 'Honda',      model: 'CB150R',     year: 2022, vehicleType: 'motorcycle', mileage:  8500 },
  { registrationNo: 'NW-CAR-1006', make: 'Nissan',     model: 'Sunny',      year: 2018, vehicleType: 'car',        mileage: 61000 },
  { registrationNo: 'SG-TUK-1007', make: 'Bajaj',      model: 'RE 4S',      year: 2020, vehicleType: 'tuk',        mileage: 44000 },
  { registrationNo: 'WP-CAR-1008', make: 'Mazda',      model: 'Demio',      year: 2019, vehicleType: 'car',        mileage: 37500 },
  { registrationNo: 'CP-CAR-1009', make: 'Mitsubishi', model: 'Lancer',     year: 2016, vehicleType: 'car',        mileage: 82000 },
  { registrationNo: 'EP-VAN-1010', make: 'Suzuki',     model: 'Every',      year: 2021, vehicleType: 'van',        mileage: 22000 },
];

const VEHICLES_SECONDARY = [
  { registrationNo: 'WP-MOT-2001', make: 'Yamaha',     model: 'FZ-S',       year: 2021, vehicleType: 'motorcycle', mileage: 12000 },
  { registrationNo: 'WP-CAR-2002', make: 'Suzuki',     model: 'Alto',       year: 2022, vehicleType: 'car',        mileage:  5500 },
  { registrationNo: 'CP-CAR-2003', make: 'Honda',      model: 'Fit',        year: 2018, vehicleType: 'car',        mileage: 42000 },
  { registrationNo: 'SP-MOT-2004', make: 'Bajaj',      model: 'Pulsar 150', year: 2020, vehicleType: 'motorcycle', mileage: 28000 },
  { registrationNo: 'WP-CAR-2005', make: 'Toyota',     model: 'Vitz',       year: 2019, vehicleType: 'car',        mileage: 31000 },
  { registrationNo: 'NW-TUK-2006', make: 'Bajaj',      model: 'RE 4S',      year: 2021, vehicleType: 'tuk',        mileage: 19000 },
  { registrationNo: 'SG-CAR-2007', make: 'Hyundai',    model: 'i10',        year: 2020, vehicleType: 'car',        mileage: 24000 },
  { registrationNo: 'WP-VAN-2008', make: 'Nissan',     model: 'Caravan',    year: 2015, vehicleType: 'van',        mileage: 110000 },
  { registrationNo: 'CP-CAR-2009', make: 'Honda',      model: 'Vezel',      year: 2017, vehicleType: 'car',        mileage: 55000 },
  { registrationNo: 'EP-CAR-2010', make: 'Toyota',     model: 'Prius',      year: 2016, vehicleType: 'car',        mileage: 78000 },
];

// ─── Appointments: 1 per customer (primary vehicle) ──────────────────────────
// First 5 → in_progress (service records exist for these)
// Next 2  → confirmed   |  Last 3 → pending
const APPOINTMENTS = [
  { serviceType: 'Oil Change',              status: 'in_progress', scheduledDate: pastDays(1),   notes: 'Full synthetic oil 5W-30 requested.',       wsIdx: 0, techIdx: 0 },
  { serviceType: 'Brake Service',           status: 'in_progress', scheduledDate: pastDays(1),   notes: 'Front brake pads heavily worn.',             wsIdx: 1, techIdx: 3 },
  { serviceType: 'Engine Diagnostics',      status: 'in_progress', scheduledDate: pastDays(2),   notes: 'Check engine light on for 3 days.',          wsIdx: 0, techIdx: 1 },
  { serviceType: 'AC Repair',               status: 'in_progress', scheduledDate: pastDays(2),   notes: 'AC not cooling — possible refrigerant leak.', wsIdx: 1, techIdx: 4 },
  { serviceType: 'Suspension Inspection',   status: 'in_progress', scheduledDate: pastDays(1),   notes: 'Vehicle pulling noticeably to the left.',    wsIdx: 0, techIdx: 2 },
  { serviceType: 'Transmission Repair',     status: 'confirmed',   scheduledDate: futureDays(1), notes: 'Gear slipping in 3rd.',                      wsIdx: 1, techIdx: 3 },
  { serviceType: 'Full Service (60k km)',   status: 'confirmed',   scheduledDate: futureDays(2), notes: '60,000 km major service due.',               wsIdx: 0, techIdx: 0 },
  { serviceType: 'Battery Replacement',     status: 'pending',     scheduledDate: futureDays(3), notes: 'Battery not holding charge overnight.',      wsIdx: 1, techIdx: 5 },
  { serviceType: 'Wheel Alignment',         status: 'pending',     scheduledDate: futureDays(4), notes: 'Uneven tyre wear noticed.',                  wsIdx: 0, techIdx: 1 },
  { serviceType: 'Electrical Diagnostics',  status: 'pending',     scheduledDate: futureDays(5), notes: 'Multiple dashboard warning lights on.',      wsIdx: 1, techIdx: 4 },
];

// ─── Service records for in_progress appointments (first 5) ──────────────────
const RECORDS = [
  {
    workDone: 'Drained old 5W-30 mineral oil. Replaced with 5W-30 full synthetic. New oil filter and drain-plug washer fitted. Reset oil-service indicator.',
    partsReplaced: ['Oil filter', 'Drain plug washer', '4L synthetic oil (5W-30)'],
    totalCost: 4800,
    mileageAtService: 48000,
    techIdx: 0,
  },
  {
    workDone: 'Replaced all four brake pads (front and rear). Resurfaced front rotors. Topped up brake fluid. Test drive confirmed smooth, straight braking.',
    partsReplaced: ['Front brake pads (set)', 'Rear brake pads (set)', 'Brake cleaner spray'],
    totalCost: 14500,
    mileageAtService: 32000,
    techIdx: 3,
  },
  {
    workDone: 'Diagnosed faulty upstream O2 sensor (code P0141). Replaced sensor and spark plugs. Cleared fault codes. 20 km road test — no recurrence.',
    partsReplaced: ['O2 sensor (upstream)', 'Spark plugs ×4', 'Air filter'],
    totalCost: 21000,
    mileageAtService: 95000,
    techIdx: 1,
  },
  {
    workDone: 'Recharged AC with R134a refrigerant. Replaced blocked expansion valve. Fitted new cabin air filter. System now achieving 8 °C at vents.',
    partsReplaced: ['R134a refrigerant 500 g', 'Expansion valve', 'Cabin air filter'],
    totalCost: 9500,
    mileageAtService: 18000,
    techIdx: 4,
  },
  {
    workDone: 'Found worn left lower control-arm bushing. Replaced both lower bushings. Realigned steering geometry. Straight tracking confirmed on test drive.',
    partsReplaced: ['Lower control arm bushing ×2', 'Alignment shims'],
    totalCost: 16800,
    mileageAtService: 8500,
    techIdx: 2,
  },
];

// ─── Reviews (10) ─────────────────────────────────────────────────────────────
const REVIEWS_DATA = [
  { rating: 5, reviewText: 'Excellent service! Finished on time and the car runs perfectly. Will definitely return.' },
  { rating: 4, reviewText: 'Good quality brake work and fair price. Waited slightly longer than expected but overall very happy.' },
  { rating: 5, reviewText: 'Very honest diagnosis — found the exact fault and fixed it at a reasonable cost. No unnecessary upselling.' },
  { rating: 4, reviewText: 'AC is working great now. Staff explained the problem clearly before proceeding. Clean workshop.' },
  { rating: 5, reviewText: 'Impressed with the detail — they spotted a worn tyre during the suspension work. Highly recommend.' },
  { rating: 4, reviewText: 'Friendly and knowledgeable team. Full service took a full day but the job was thoroughly done.' },
  { rating: 3, reviewText: 'Work was done correctly, but the waiting area could do with an upgrade. Battery replacement itself was fine.' },
  { rating: 5, reviewText: 'Best workshop I have visited. State-of-the-art equipment and technicians who really know their craft.' },
  { rating: 4, reviewText: 'Quick booking process and wheel alignment done in 45 minutes. Back to straight tracking immediately.' },
  { rating: 5, reviewText: 'Transparent pricing, no invoice surprises. The diagnostics team is exceptionally skilled.' },
];

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ══════════════════════════════════════════════════════════════════════════════
async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB\n');

  // ── 1. FULL WIPE of all collections ─────────────────────────────────────────
  console.log('── Wiping all collections...');
  const [uDel, wDel, vDel, aDel, rDel, rvDel] = await Promise.all([
    User.deleteMany({}),
    Workshop.deleteMany({}),
    Vehicle.deleteMany({}),
    Appointment.deleteMany({}),
    ServiceRecord.deleteMany({}),
    Review.deleteMany({}),
  ]);
  console.log(`  Users: ${uDel.deletedCount}  Workshops: ${wDel.deletedCount}  Vehicles: ${vDel.deletedCount}`);
  console.log(`  Appointments: ${aDel.deletedCount}  Records: ${rDel.deletedCount}  Reviews: ${rvDel.deletedCount}`);

  // ── 2. Insert workshops (no owner yet — set after users created) ─────────────
  console.log('\n── Inserting 20 workshops...');
  const workshops = await Workshop.insertMany(WORKSHOPS);
  console.log(`  ✓ ${workshops.length} workshops`);

  // ── 3. Insert users ───────────────────────────────────────────────────────────
  console.log('\n── Inserting users...');
  const adminUsers    = await User.insertMany(ADMIN);
  const ownerUsers    = await User.insertMany(
    OWNERS.map((o, i) => ({ ...o, workshopId: workshops[i]._id }))
  );
  const techUsers     = await User.insertMany(
    TECHNICIANS.map(t => {
      const { wsIdx, ...rest } = t;
      return { ...rest, workshopId: workshops[wsIdx]._id };
    })
  );
  const customerUsers = await User.insertMany(CUSTOMERS);
  const totalUsers = adminUsers.length + ownerUsers.length + techUsers.length + customerUsers.length;
  console.log(`  ✓ ${totalUsers} users  (admin: ${adminUsers.length} | owners: ${ownerUsers.length} | techs: ${techUsers.length} | customers: ${customerUsers.length})`);

  // ── 4. Back-fill workshop ownerId + technicians[] ─────────────────────────────
  console.log('\n── Linking owners and technicians to first 2 workshops...');
  for (let i = 0; i < ownerUsers.length; i++) {
    const wsId   = workshops[i]._id;
    const ownId  = ownerUsers[i]._id;
    const techIds = techUsers.filter(t => TECHNICIANS[techUsers.indexOf(t)].wsIdx === i).map(t => t._id);
    await Workshop.findByIdAndUpdate(wsId, {
      ownerId:     ownId,
      technicians: techIds,
    });
  }
  console.log('  ✓ Ownership and technician lists updated');

  // ── 5. Insert vehicles (2 per customer) ──────────────────────────────────────
  console.log('\n── Inserting 20 vehicles...');
  const primaryVehicles   = await Vehicle.insertMany(VEHICLES_PRIMARY.map((v, i)   => ({ ...v, ownerId: customerUsers[i]._id })));
  const secondaryVehicles = await Vehicle.insertMany(VEHICLES_SECONDARY.map((v, i) => ({ ...v, ownerId: customerUsers[i]._id })));
  console.log(`  ✓ ${primaryVehicles.length + secondaryVehicles.length} vehicles (2 per customer)`);

  // ── 6. Insert appointments (1 per customer) ───────────────────────────────────
  console.log('\n── Inserting 10 appointments...');
  const appointments = await Appointment.insertMany(
    APPOINTMENTS.map((a, i) => {
      const { wsIdx, techIdx, ...rest } = a;
      return {
        ...rest,
        userId:     customerUsers[i]._id,
        vehicleId:  primaryVehicles[i]._id,
        workshopId: workshops[wsIdx]._id,
      };
    })
  );
  console.log(`  ✓ ${appointments.length} appointments  (in_progress: 5 | confirmed: 2 | pending: 3)`);

  // ── 7. Insert service records (for in_progress appointments only) ─────────────
  console.log('\n── Inserting 5 service records...');
  const records = await ServiceRecord.insertMany(
    RECORDS.map((r, i) => {
      const { techIdx, ...rest } = r;
      return {
        ...rest,
        appointmentId:  appointments[i]._id,
        vehicleId:      primaryVehicles[i]._id,
        serviceDate:    appointments[i].scheduledDate,
        technicianName: techUsers[techIdx].fullName,
      };
    })
  );
  console.log(`  ✓ ${records.length} service records`);

  // ── 8. Insert reviews ─────────────────────────────────────────────────────────
  console.log('\n── Inserting 10 reviews...');
  const reviews = await Review.insertMany(
    REVIEWS_DATA.map((rv, i) => ({
      ...rv,
      workshopId:    workshops[APPOINTMENTS[i].wsIdx]._id,
      userId:        customerUsers[i]._id,
      appointmentId: appointments[i]._id,
    }))
  );
  console.log(`  ✓ ${reviews.length} reviews`);

  // ── 9. Recalculate workshop ratings ──────────────────────────────────────────
  console.log('\n── Recalculating ratings for all workshops...');
  for (const ws of workshops) {
    const agg = await Review.aggregate([
      { $match: { workshopId: ws._id } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (agg.length) {
      await Workshop.findByIdAndUpdate(ws._id, {
        averageRating: Math.round(agg[0].avg * 10) / 10,
        totalReviews:  agg[0].count,
      });
    }
  }
  console.log('  ✓ Ratings updated');

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════');
  console.log('  SEED COMPLETE');
  console.log('════════════════════════════════════════════════');
  console.log(`  Workshops:       ${workshops.length}  (2 owner-managed, 18 standalone)`);
  console.log(`  Users:           ${totalUsers}`);
  console.log(`    Admin:         ${adminUsers.length}`);
  console.log(`    Owners:        ${ownerUsers.length}`);
  console.log(`    Technicians:   ${techUsers.length}`);
  console.log(`    Customers:     ${customerUsers.length}`);
  console.log(`  Vehicles:        ${primaryVehicles.length + secondaryVehicles.length}  (2 per customer)`);
  console.log(`  Appointments:    ${appointments.length}  (in_progress: 5 | confirmed: 2 | pending: 3)`);
  console.log(`  Service Records: ${records.length}`);
  console.log(`  Reviews:         ${reviews.length}`);
  console.log('════════════════════════════════════════════════');
  console.log('\nTest accounts (configure Asgardeo passwords separately):');
  console.log('  Admin     →  admin@vsrms.lk');
  console.log('  Owner 1   →  roshan@autofix.lk      (AutoFix Pro Colombo)');
  console.log('  Owner 2   →  thilak@lankamotors.lk  (Lanka Motors Kandy)');
  console.log('  Tech 1    →  kamal@autofix.lk        (AutoFix, 3 techs total)');
  console.log('  Tech 4    →  pradeep@lankamotors.lk  (Lanka Motors, 3 techs total)');
  console.log('  Customer  →  amara@gmail.com');
  console.log('\nVehicles currently in_progress:');
  APPOINTMENTS.filter(a => a.status === 'in_progress').forEach((a, i) => {
    const v = VEHICLES_PRIMARY[i];
    console.log(`  ${v.make} ${v.model} (${v.registrationNo}) → ${a.serviceType} at Workshop ${a.wsIdx}`);
  });

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('\nSeed failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
