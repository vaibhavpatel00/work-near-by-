import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { calculateDistance, generateId } from '../utils/helpers';
import { useLocation } from './LocationContext';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const WorkerContext = createContext(null);

const WORKERS_STORAGE_KEY = 'wikwik_workers_v3';
const GIG_CATEGORY_WORKER = 'worker_profile';

// Curated authentic local service providers across Kukatpally, Hitech City, Gachibowli & surrounding areas
const INITIAL_CURATED_WORKERS = [
  // ==========================================================
  // 1. KUKATPALLY & KPHB COLONY & MIYAPUR
  // ==========================================================
  {
    id: 'worker-kphb-bike-1',
    workerId: 'seed-kphb-1',
    workerEmail: 'sirichandana.kphb@wikwik.in',
    name: 'Siri Chandana Bike Service & Puncture Works',
    profession: 'mechanic',
    customProfession: 'Bike & 2-Wheeler Garage',
    phone: '9849234510',
    whatsapp: '9849234510',
    workingHours: '08:30 AM - 09:30 PM',
    workingDays: 'All 7 Days',
    experience: '8+ Years Experience',
    livingArea: 'KPHB Phase 3, Kukatpally, Hyderabad',
    location: { address: 'KPHB Phase 3, Kukatpally, Hyderabad', lat: 17.4938, lng: 78.3989 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Complete 2-wheeler general servicing, engine oil change, brake overhaul, carburetor cleaning, and emergency tube & tubeless puncture repair.',
    emergencyAvailable: true,
    rating: 4.9,
    reviewsCount: 24,
    status: 'active',
    registeredAt: '2026-08-01T08:00:00Z',
  },
  {
    id: 'worker-kphb-bike-2',
    workerId: 'seed-kphb-1b',
    workerEmail: 'riders.kphb@wikwik.in',
    name: 'Riders Bike Point & Royal Enfield Service',
    profession: 'mechanic',
    customProfession: 'Motorcycle & Enfield Specialist',
    phone: '9848123401',
    whatsapp: '9848123401',
    workingHours: '09:00 AM - 09:00 PM',
    workingDays: 'Monday - Saturday',
    experience: '10+ Years Experience',
    livingArea: 'Road No 12, KPHB Colony, Hyderabad',
    location: { address: 'Road No 12, KPHB Colony, Hyderabad', lat: 17.4915, lng: 78.3950 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Specialist in Royal Enfield, Bajaj Pulsar, Yamaha, and Honda bikes. Engine decarb, disk brake service, clutch fitting, and chain lubrication.',
    emergencyAvailable: true,
    rating: 4.8,
    reviewsCount: 18,
    status: 'active',
    registeredAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'worker-kphb-elec-1',
    workerId: 'seed-kphb-2',
    workerEmail: 'balaji.elec@wikwik.in',
    name: 'Sri Balaji Electrical Works & Wiring',
    profession: 'electrician',
    customProfession: 'Electrical Technician',
    phone: '9885412390',
    whatsapp: '9885412390',
    workingHours: '09:00 AM - 09:00 PM',
    workingDays: 'Monday - Saturday',
    experience: '10+ Years Experience',
    livingArea: 'Near KPHB Metro, Kukatpally, Hyderabad',
    location: { address: 'Near KPHB Metro, Kukatpally, Hyderabad', lat: 17.4950, lng: 78.4010 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Specialist in house wiring, switchboard fixing, MCB tripping troubleshooting, inverter fitting, geyser installation, and LED lighting.',
    emergencyAvailable: true,
    rating: 4.8,
    reviewsCount: 19,
    status: 'active',
    registeredAt: '2026-08-02T09:00:00Z',
  },
  {
    id: 'worker-kphb-elec-2',
    workerId: 'seed-kphb-2b',
    workerEmail: 'venkata.elec@wikwik.in',
    name: 'Venkata Sai Inverter & Home Electricals',
    profession: 'electrician',
    customProfession: 'Inverter & Home Electrician',
    phone: '9885002233',
    whatsapp: '9885002233',
    workingHours: '08:00 AM - 10:00 PM',
    workingDays: 'All 7 Days',
    experience: '7+ Years Experience',
    livingArea: 'Pragathi Nagar, Kukatpally, Hyderabad',
    location: { address: 'Pragathi Nagar, Kukatpally, Hyderabad', lat: 17.5080, lng: 78.3880 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Luminous & Microtek inverter battery installation, geyser service, flat wiring check, 3-phase connection setup, and emergency power restoration.',
    emergencyAvailable: true,
    rating: 4.9,
    reviewsCount: 15,
    status: 'active',
    registeredAt: '2026-08-02T11:00:00Z',
  },
  {
    id: 'worker-kphb-plumb-1',
    workerId: 'seed-kphb-3',
    workerEmail: 'shiva.plumber@wikwik.in',
    name: 'Shiva Plumbing & Sanitary Works',
    profession: 'plumber',
    customProfession: 'Plumber & Sanitary Expert',
    phone: '9989123481',
    whatsapp: '9989123481',
    workingHours: '08:00 AM - 08:30 PM',
    workingDays: 'All 7 Days',
    experience: '7+ Years Experience',
    livingArea: 'Road No 1, KPHB Colony, Hyderabad',
    location: { address: 'Road No 1, KPHB Colony, Hyderabad', lat: 17.4920, lng: 78.3965 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Bathroom fittings, tap & pipe leak repairs, overhead water tank connection, motor pump fitting, and drainage block clear.',
    emergencyAvailable: true,
    rating: 4.9,
    reviewsCount: 16,
    status: 'active',
    registeredAt: '2026-08-03T10:00:00Z',
  },
  {
    id: 'worker-kphb-plumb-2',
    workerId: 'seed-kphb-3b',
    workerEmail: 'saikrishna.plumb@wikwik.in',
    name: 'Sai Krishna Sanitary & Pipe Fittings',
    profession: 'plumber',
    customProfession: 'Plumber & Motor Technician',
    phone: '9949112244',
    whatsapp: '9949112244',
    workingHours: '08:30 AM - 09:00 PM',
    workingDays: 'All 7 Days',
    experience: '9+ Years Experience',
    livingArea: 'KPHB Phase 1, Kukatpally, Hyderabad',
    location: { address: 'KPHB Phase 1, Kukatpally, Hyderabad', lat: 17.4900, lng: 78.4050 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Water tank installation, CPVC and PVC pipe leakage repair, toilet flush valve overhaul, wash basin and tap replacement.',
    emergencyAvailable: true,
    rating: 4.8,
    reviewsCount: 12,
    status: 'active',
    registeredAt: '2026-08-03T12:00:00Z',
  },
  {
    id: 'worker-kphb-ro-1',
    workerId: 'seed-kphb-4',
    workerEmail: 'pranav.ro@wikwik.in',
    name: 'Pranav Sai RO Purifiers & Filter Service',
    profession: 'water_filter',
    customProfession: 'RO Water Purifier Technician',
    phone: '9676543210',
    whatsapp: '9676543210',
    workingHours: '09:00 AM - 08:00 PM',
    workingDays: 'Monday - Saturday',
    experience: '6+ Years Experience',
    livingArea: 'Near Remedy Hospital, KPHB, Hyderabad',
    location: { address: 'Near Remedy Hospital, KPHB, Hyderabad', lat: 17.4965, lng: 78.4025 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Repair & service for Kent, Aquaguard, Pureit, Livpure, Blue Star. Filter candle replacement, RO membrane change, booster pump repair & TDS check.',
    emergencyAvailable: false,
    rating: 4.8,
    reviewsCount: 14,
    status: 'active',
    registeredAt: '2026-08-04T11:00:00Z',
  },
  {
    id: 'worker-kphb-ro-2',
    workerId: 'seed-kphb-4b',
    workerEmail: 'uma.aqua@wikwik.in',
    name: 'UMA Aqua Care RO Service & Repair',
    profession: 'water_filter',
    customProfession: 'Water Purifier & Filter Expert',
    phone: '9676112233',
    whatsapp: '9676112233',
    workingHours: '09:00 AM - 09:00 PM',
    workingDays: 'All 7 Days',
    experience: '8+ Years Experience',
    livingArea: 'MIG Sector, KPHB Colony, Hyderabad',
    location: { address: 'MIG Sector, KPHB Colony, Hyderabad', lat: 17.4940, lng: 78.4040 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Doorstep water purifier servicing in KPHB & Kukatpally. Carbon filter replacement, UV chamber repair, leak fixing, and water hardness testing.',
    emergencyAvailable: false,
    rating: 4.9,
    reviewsCount: 21,
    status: 'active',
    registeredAt: '2026-08-04T14:00:00Z',
  },
  {
    id: 'worker-kphb-ac-1',
    workerId: 'seed-kphb-5',
    workerEmail: 'coolpoint.ac@wikwik.in',
    name: 'Cool Point AC & Refrigerator Repair',
    profession: 'ac_repair',
    customProfession: 'AC & Appliance Technician',
    phone: '9700123456',
    whatsapp: '9700123456',
    workingHours: '09:00 AM - 09:00 PM',
    workingDays: 'All 7 Days',
    experience: '9+ Years Experience',
    livingArea: 'KPHB 4th Phase, Kukatpally, Hyderabad',
    location: { address: 'KPHB 4th Phase, Kukatpally, Hyderabad', lat: 17.4910, lng: 78.3940 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Split & window AC gas filling, jet pump chemical wash, cooling fault troubleshooting, compressor maintenance, and refrigerator repair.',
    emergencyAvailable: true,
    rating: 4.9,
    reviewsCount: 22,
    status: 'active',
    registeredAt: '2026-08-05T08:30:00Z',
  },
  {
    id: 'worker-kphb-paint-1',
    workerId: 'seed-kphb-6',
    workerEmail: 'shiva.paint@wikwik.in',
    name: 'Shiva Colour World & Home Painting',
    profession: 'painter',
    customProfession: 'House Painter & Waterproofing',
    phone: '9849556677',
    whatsapp: '9849556677',
    workingHours: '08:00 AM - 07:30 PM',
    workingDays: 'Monday - Saturday',
    experience: '11+ Years Experience',
    livingArea: 'Near Forum Mall, Kukatpally, Hyderabad',
    location: { address: 'Near Forum Mall, Kukatpally, Hyderabad', lat: 17.4870, lng: 78.3900 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Interior & exterior painting, Asian Paints Royale finish, wall putty, dampness treatment, waterproof coating, and texture painting.',
    emergencyAvailable: false,
    rating: 4.8,
    reviewsCount: 17,
    status: 'active',
    registeredAt: '2026-08-05T09:30:00Z',
  },
  {
    id: 'worker-kphb-clean-1',
    workerId: 'seed-kphb-7',
    workerEmail: 'cleanexpress.kphb@wikwik.in',
    name: 'Clean Express Home Deep Cleaning',
    profession: 'cleaner',
    customProfession: 'Deep Cleaning & Housekeeping',
    phone: '9700334455',
    whatsapp: '9700334455',
    workingHours: '08:00 AM - 08:00 PM',
    workingDays: 'All 7 Days',
    experience: '5+ Years Experience',
    livingArea: 'KPHB Phase 6, Kukatpally, Hyderabad',
    location: { address: 'KPHB Phase 6, Kukatpally, Hyderabad', lat: 17.4980, lng: 78.3920 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Full flat deep cleaning, bathroom tile scrubbing, kitchen chimney degreasing, sofa & mattress vacuuming for moves and festivals.',
    emergencyAvailable: false,
    rating: 4.9,
    reviewsCount: 20,
    status: 'active',
    registeredAt: '2026-08-05T10:30:00Z',
  },
  {
    id: 'worker-kphb-cook-1',
    workerId: 'seed-kphb-8',
    workerEmail: 'anand.cook@wikwik.in',
    name: 'Anand Home Cook & Catering Services',
    profession: 'chef',
    customProfession: 'Home Cook & South/North Indian Chef',
    phone: '9866778899',
    whatsapp: '9866778899',
    workingHours: '06:30 AM - 09:30 PM',
    workingDays: 'All 7 Days',
    experience: '12+ Years Experience',
    livingArea: 'Kukatpally Main Road, Hyderabad',
    location: { address: 'Kukatpally Main Road, Hyderabad', lat: 17.4890, lng: 78.4110 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Experienced hygienic cook for daily home meals (South Indian, North Indian, Veg & Non-Veg) and small family event catering.',
    emergencyAvailable: false,
    rating: 4.9,
    reviewsCount: 23,
    status: 'active',
    registeredAt: '2026-08-05T11:30:00Z',
  },

  // ==========================================================
  // 2. HITECH CITY / MADHAPUR / KONDAPUR / JUBILEE HILLS
  // ==========================================================
  {
    id: 'worker-hitech-bike-1',
    workerId: 'seed-hitech-1',
    workerEmail: 'mastermotors.madhapur@wikwik.in',
    name: 'Master Motors 2-Wheeler Garage',
    profession: 'mechanic',
    customProfession: 'Bike Garage & Breakdown Point',
    phone: '9848012345',
    whatsapp: '9848012345',
    workingHours: '08:00 AM - 10:00 PM',
    workingDays: 'All 7 Days',
    experience: '11+ Years Experience',
    livingArea: '100 Feet Road, Madhapur, Hyderabad',
    location: { address: '100 Feet Road, Madhapur, Hyderabad', lat: 17.4483, lng: 78.3910 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Emergency breakdown assistance in Hitech City & Madhapur. Puncture repair, battery jump start, disc brake service, clutch plate & chain replacement.',
    emergencyAvailable: true,
    rating: 4.9,
    reviewsCount: 31,
    status: 'active',
    registeredAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'worker-hitech-bike-2',
    workerId: 'seed-hitech-1b',
    workerEmail: 'ridendrepair.madhapur@wikwik.in',
    name: 'Ride N Repair Doorstep Bike Service',
    profession: 'mechanic',
    customProfession: 'Doorstep Bike Maintenance & Puncture',
    phone: '9848223344',
    whatsapp: '9848223344',
    workingHours: '08:00 AM - 09:30 PM',
    workingDays: 'All 7 Days',
    experience: '8+ Years Experience',
    livingArea: 'Image Gardens Road, Madhapur, Hyderabad',
    location: { address: 'Image Gardens Road, Madhapur, Hyderabad', lat: 17.4470, lng: 78.3840 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Doorstep bike servicing at offices and apartments. Synthetic engine oil change, spark plug replacement, brake shoe alignment, and mobile puncture repair.',
    emergencyAvailable: true,
    rating: 4.8,
    reviewsCount: 26,
    status: 'active',
    registeredAt: '2026-08-01T11:00:00Z',
  },
  {
    id: 'worker-hitech-elec-1',
    workerId: 'seed-hitech-2',
    workerEmail: 'gruha.avasar@wikwik.in',
    name: 'Gruha Avasar Electrical Solutions',
    profession: 'electrician',
    customProfession: 'Certified Electrician',
    phone: '7893163537',
    whatsapp: '7893163537',
    workingHours: '09:00 AM - 09:00 PM',
    workingDays: 'Monday - Saturday',
    experience: '8+ Years Experience',
    livingArea: 'Near Cyber Towers, Hitech City, Hyderabad',
    location: { address: 'Near Cyber Towers, Hitech City, Hyderabad', lat: 17.4504, lng: 78.3808 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Doorstep electrical repair for apartments & IT offices. Short circuit repair, distribution board check, geyser installation, and fan fitting.',
    emergencyAvailable: true,
    rating: 4.8,
    reviewsCount: 20,
    status: 'active',
    registeredAt: '2026-08-02T10:00:00Z',
  },
  {
    id: 'worker-hitech-elec-2',
    workerId: 'seed-hitech-2b',
    workerEmail: 'vijay.elec@wikwik.in',
    name: 'Vijay Electrical & Power Maintenance',
    profession: 'electrician',
    customProfession: 'Residential & Commercial Electrician',
    phone: '9885223344',
    whatsapp: '9885223344',
    workingHours: '08:30 AM - 09:30 PM',
    workingDays: 'All 7 Days',
    experience: '9+ Years Experience',
    livingArea: 'Kavuri Hills, Madhapur, Hyderabad',
    location: { address: 'Kavuri Hills, Madhapur, Hyderabad', lat: 17.4430, lng: 78.3960 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Rapid electrical troubleshooter for high-rise gated communities. Sub-meter connection, geyser element replacement, power backup wiring, and LED panel fixes.',
    emergencyAvailable: true,
    rating: 4.9,
    reviewsCount: 18,
    status: 'active',
    registeredAt: '2026-08-02T12:00:00Z',
  },
  {
    id: 'worker-hitech-plumb-1',
    workerId: 'seed-hitech-3',
    workerEmail: 'dillraj.plumber@wikwik.in',
    name: 'Dillraj Plumbing & Leakage Solutions',
    profession: 'plumber',
    customProfession: 'Plumbing Specialist',
    phone: '9666151431',
    whatsapp: '9666151431',
    workingHours: '24/7 Available',
    workingDays: 'All 7 Days',
    experience: '12+ Years Experience',
    livingArea: 'Ayyappa Society, Madhapur, Hyderabad',
    location: { address: 'Ayyappa Society, Madhapur, Hyderabad', lat: 17.4520, lng: 78.3880 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Rapid response plumber in Madhapur & Hitech City. Concealed pipe leak detection, kitchen sink drainage, flush tank repair, and washbasin replacement.',
    emergencyAvailable: true,
    rating: 4.9,
    reviewsCount: 27,
    status: 'active',
    registeredAt: '2026-08-03T11:00:00Z',
  },
  {
    id: 'worker-hitech-plumb-2',
    workerId: 'seed-hitech-3b',
    workerEmail: 'myplumber.hitech@wikwik.in',
    name: 'My Plumber 24/7 Rapid Solutions',
    profession: 'plumber',
    customProfession: 'Emergency Plumber & Drain Specialist',
    phone: '9666223344',
    whatsapp: '9666223344',
    workingHours: '24/7 Available',
    workingDays: 'All 7 Days',
    experience: '10+ Years Experience',
    livingArea: 'Vittal Rao Nagar, Hitech City, Hyderabad',
    location: { address: 'Vittal Rao Nagar, Hitech City, Hyderabad', lat: 17.4460, lng: 78.3815 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Emergency plumbing specialist for water overflow, pipe bursts, bathroom drain blockage, and hot water mixer fitting in IT corridor.',
    emergencyAvailable: true,
    rating: 4.8,
    reviewsCount: 22,
    status: 'active',
    registeredAt: '2026-08-03T13:00:00Z',
  },
  {
    id: 'worker-hitech-ro-1',
    workerId: 'seed-hitech-4',
    workerEmail: 'puritan.aqua@wikwik.in',
    name: 'Puritan Aqua RO Purifier Services',
    profession: 'water_filter',
    customProfession: 'RO Water Filter Specialist',
    phone: '9866123478',
    whatsapp: '9866123478',
    workingHours: '09:00 AM - 08:30 PM',
    workingDays: 'Monday - Saturday',
    experience: '5+ Years Experience',
    livingArea: 'Kondapur Main Road, Hyderabad',
    location: { address: 'Kondapur Main Road, Hyderabad', lat: 17.4640, lng: 78.3610 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Doorstep water purifier servicing for all brands. Sediment filter, carbon filter, booster pump repair, UV lamp change, and new unit installation.',
    emergencyAvailable: false,
    rating: 4.7,
    reviewsCount: 15,
    status: 'active',
    registeredAt: '2026-08-04T12:00:00Z',
  },
  {
    id: 'worker-hitech-ro-2',
    workerId: 'seed-hitech-4b',
    workerEmail: 'aquashield.madhapur@wikwik.in',
    name: 'Aqua Shield Water Purifiers & Service',
    profession: 'water_filter',
    customProfession: 'RO Purifier Installation & Repair',
    phone: '9866334455',
    whatsapp: '9866334455',
    workingHours: '09:00 AM - 09:00 PM',
    workingDays: 'All 7 Days',
    experience: '7+ Years Experience',
    livingArea: 'Madhapur Metro Station Road, Hyderabad',
    location: { address: 'Madhapur Metro Station Road, Hyderabad', lat: 17.4490, lng: 78.3890 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Kent, Aquaguard, Pureit repair and AMC contracts. Pre-filter housing change, RO booster pump adapter fix, low water flow resolution.',
    emergencyAvailable: false,
    rating: 4.9,
    reviewsCount: 19,
    status: 'active',
    registeredAt: '2026-08-04T14:30:00Z',
  },
  {
    id: 'worker-hitech-driver-1',
    workerId: 'seed-hitech-5',
    workerEmail: 'hitech.drivers@wikwik.in',
    name: 'Hitech City Express Acting Drivers',
    profession: 'driver',
    customProfession: 'Professional Acting Driver',
    phone: '9949012345',
    whatsapp: '9949012345',
    workingHours: '24/7 Available',
    workingDays: 'All 7 Days',
    experience: '10+ Years Experience',
    livingArea: 'Near Raheja Mindspace, Hitech City, Hyderabad',
    location: { address: 'Near Raheja Mindspace, Hitech City, Hyderabad', lat: 17.4420, lng: 78.3780 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Verified professional drivers for manual & automatic luxury cars. Local city driving, outstation highway trips, airport drop & pick up, and corporate travel.',
    emergencyAvailable: true,
    rating: 4.9,
    reviewsCount: 35,
    status: 'active',
    registeredAt: '2026-08-05T09:00:00Z',
  },
  {
    id: 'worker-hitech-driver-2',
    workerId: 'seed-hitech-5b',
    workerEmail: 'safehands.drivers@wikwik.in',
    name: 'Safe Hands Professional Car Drivers',
    profession: 'driver',
    customProfession: 'Chauffeur & Outstation Driver',
    phone: '9949113355',
    whatsapp: '9949113355',
    workingHours: '24/7 Available',
    workingDays: 'All 7 Days',
    experience: '12+ Years Experience',
    livingArea: 'Cyber Towers Hub, Hitech City, Hyderabad',
    location: { address: 'Cyber Towers Hub, Hitech City, Hyderabad', lat: 17.4510, lng: 78.3810 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Experienced non-smoking drivers for family outstation trips (Vijayawada, Bengaluru, Srisailam, Goa), night party drops, and daily office commute.',
    emergencyAvailable: true,
    rating: 4.9,
    reviewsCount: 29,
    status: 'active',
    registeredAt: '2026-08-05T10:00:00Z',
  },
  {
    id: 'worker-hitech-ac-1',
    workerId: 'seed-hitech-6',
    workerEmail: 'coolcare.madhapur@wikwik.in',
    name: 'Cool Care Express AC Service',
    profession: 'ac_repair',
    customProfession: 'AC & Inverter Repair Specialist',
    phone: '9700445566',
    whatsapp: '9700445566',
    workingHours: '08:30 AM - 09:30 PM',
    workingDays: 'All 7 Days',
    experience: '8+ Years Experience',
    livingArea: 'Silicon Valley, Madhapur, Hyderabad',
    location: { address: 'Silicon Valley, Madhapur, Hyderabad', lat: 17.4515, lng: 78.3845 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Daikin, Voltas, LG, Samsung, Blue Star split AC gas charging (R32, R410A), PCB board repair, copper pipe welding, and deep jet cleaning.',
    emergencyAvailable: true,
    rating: 4.8,
    reviewsCount: 23,
    status: 'active',
    registeredAt: '2026-08-05T11:00:00Z',
  },
  {
    id: 'worker-hitech-carpenter-1',
    workerId: 'seed-hitech-7',
    workerEmail: 'royalwood.kondapur@wikwik.in',
    name: 'Royal Woodcraft & Modular Kitchen Fix',
    profession: 'carpenter',
    customProfession: 'Carpenter & Modular Wood Worker',
    phone: '9849334455',
    whatsapp: '9849334455',
    workingHours: '09:00 AM - 08:30 PM',
    workingDays: 'Monday - Saturday',
    experience: '13+ Years Experience',
    livingArea: 'Kondapur RTO Office Road, Hyderabad',
    location: { address: 'Kondapur RTO Office Road, Hyderabad', lat: 17.4680, lng: 78.3580 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'IKEA & Amazon furniture assembly, hydraulic bed fitting, soft-close cabinet hinges repair, TV unit mounting, and customized wooden work.',
    emergencyAvailable: false,
    rating: 4.9,
    reviewsCount: 19,
    status: 'active',
    registeredAt: '2026-08-05T12:00:00Z',
  },
  {
    id: 'worker-hitech-beauty-1',
    workerId: 'seed-hitech-8',
    workerEmail: 'glamour.kondapur@wikwik.in',
    name: 'Glamour Touch Home Salon & Beautician',
    profession: 'beautician',
    customProfession: 'Home Salon & Bridal Beautician',
    phone: '9989223344',
    whatsapp: '9989223344',
    workingHours: '09:00 AM - 08:00 PM',
    workingDays: 'All 7 Days',
    experience: '7+ Years Experience',
    livingArea: 'Madhapur 100ft Road, Hyderabad',
    location: { address: 'Madhapur 100ft Road, Hyderabad', lat: 17.4475, lng: 78.3900 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Hygienic doorstep salon service for women. Facial, waxing, threading, manicure, pedicure, hair spa, and event party makeup.',
    emergencyAvailable: false,
    rating: 4.9,
    reviewsCount: 32,
    status: 'active',
    registeredAt: '2026-08-05T13:00:00Z',
  },

  // ==========================================================
  // 3. GACHIBOWLI & FINANCIAL DISTRICT & NANAKRAMGUDA & MANIKONDA
  // ==========================================================
  {
    id: 'worker-gachi-bike-1',
    workerId: 'seed-gachi-1',
    workerEmail: 'gachibowli.bike@wikwik.in',
    name: 'Gachibowli Bike Care Point',
    profession: 'mechanic',
    customProfession: 'Royal Enfield & Superbike Specialist',
    phone: '9849112233',
    whatsapp: '9849112233',
    workingHours: '08:30 AM - 09:30 PM',
    workingDays: 'All 7 Days',
    experience: '9+ Years Experience',
    livingArea: 'Near DLF Cybercity Gate 2, Gachibowli, Hyderabad',
    location: { address: 'Near DLF Cybercity Gate 2, Gachibowli, Hyderabad', lat: 17.4455, lng: 78.3540 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Royal Enfield, Yamaha, Honda, KTM servicing. Chain lubrication, engine decarb, brake service, electrical troubleshooting & breakdown help near DLF.',
    emergencyAvailable: true,
    rating: 4.9,
    reviewsCount: 28,
    status: 'active',
    registeredAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'worker-gachi-bike-2',
    workerId: 'seed-gachi-1b',
    workerEmail: 'finbike.nanakramguda@wikwik.in',
    name: 'Financial District Bike Clinic & Puncture Works',
    profession: 'mechanic',
    customProfession: '2-Wheeler Repair & Emergency Puncture',
    phone: '9848334455',
    whatsapp: '9848334455',
    workingHours: '08:00 AM - 10:00 PM',
    workingDays: 'All 7 Days',
    experience: '8+ Years Experience',
    livingArea: 'Nanakramguda Junction, Gachibowli, Hyderabad',
    location: { address: 'Nanakramguda Junction, Gachibowli, Hyderabad', lat: 17.4290, lng: 78.3410 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Immediate puncture repair, battery charging, carburetor tuning, engine troubleshooting for tech employees in Financial District & Waverock.',
    emergencyAvailable: true,
    rating: 4.8,
    reviewsCount: 21,
    status: 'active',
    registeredAt: '2026-08-01T12:00:00Z',
  },
  {
    id: 'worker-gachi-elec-1',
    workerId: 'seed-gachi-2',
    workerEmail: 'cybercity.elec@wikwik.in',
    name: 'Cybercity Electricals & Maintenance',
    profession: 'electrician',
    customProfession: 'Home Electrician & Geyser Repair',
    phone: '9876501234',
    whatsapp: '9876501234',
    workingHours: '09:00 AM - 09:00 PM',
    workingDays: 'All 7 Days',
    experience: '8+ Years Experience',
    livingArea: 'Telecom Nagar, Gachibowli, Hyderabad',
    location: { address: 'Telecom Nagar, Gachibowli, Hyderabad', lat: 17.4410, lng: 78.3560 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Geyser repair and fitting, emergency power breakdown service, main distribution board checking, inverter setup, socket & modular switch repairs.',
    emergencyAvailable: true,
    rating: 4.8,
    reviewsCount: 18,
    status: 'active',
    registeredAt: '2026-08-02T11:00:00Z',
  },
  {
    id: 'worker-gachi-elec-2',
    workerId: 'seed-gachi-2b',
    workerEmail: 'manikonda.elec@wikwik.in',
    name: 'Manikonda Home Power & Wiring Solutions',
    profession: 'electrician',
    customProfession: 'Apartment & Villa Electrician',
    phone: '9885334455',
    whatsapp: '9885334455',
    workingHours: '08:30 AM - 09:00 PM',
    workingDays: 'All 7 Days',
    experience: '10+ Years Experience',
    livingArea: 'Puppalaguda / Manikonda, Gachibowli, Hyderabad',
    location: { address: 'Puppalaguda / Manikonda, Gachibowli, Hyderabad', lat: 17.4080, lng: 78.3750 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Complete electrical troubleshooting for gated communities. Power trip analysis, MCB replacement, chandelier & decorative lamp installation.',
    emergencyAvailable: true,
    rating: 4.9,
    reviewsCount: 24,
    status: 'active',
    registeredAt: '2026-08-02T13:00:00Z',
  },
  {
    id: 'worker-gachi-plumb-1',
    workerId: 'seed-gachi-3',
    workerEmail: 'gachibowli.plumb@wikwik.in',
    name: 'Gachibowli Express Plumbing Services',
    profession: 'plumber',
    customProfession: 'Plumbing & Drainage Technician',
    phone: '9988776655',
    whatsapp: '9988776655',
    workingHours: '08:00 AM - 09:00 PM',
    workingDays: 'All 7 Days',
    experience: '7+ Years Experience',
    livingArea: 'Indira Nagar, Gachibowli, Hyderabad',
    location: { address: 'Indira Nagar, Gachibowli, Hyderabad', lat: 17.4380, lng: 78.3490 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Same-day plumbing for IT professionals and families in Gachibowli. Shower mixer replacement, pressure pump installation, drain unclogging & pipe fittings.',
    emergencyAvailable: true,
    rating: 4.8,
    reviewsCount: 17,
    status: 'active',
    registeredAt: '2026-08-03T12:00:00Z',
  },
  {
    id: 'worker-gachi-plumb-2',
    workerId: 'seed-gachi-3b',
    workerEmail: 'dlfplumber.gachi@wikwik.in',
    name: 'DLF Area Express Plumbers',
    profession: 'plumber',
    customProfession: 'Sanitary & Concealed Leak Specialist',
    phone: '9666334455',
    whatsapp: '9666334455',
    workingHours: '24/7 Available',
    workingDays: 'All 7 Days',
    experience: '9+ Years Experience',
    livingArea: 'Near DLF Gate 1, Gachibowli, Hyderabad',
    location: { address: 'Near DLF Gate 1, Gachibowli, Hyderabad', lat: 17.4440, lng: 78.3530 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Emergency plumber near DLF Cybercity. Water heater plumbing, flush valve replacement, kitchen sink clogging, and pump repairs.',
    emergencyAvailable: true,
    rating: 4.9,
    reviewsCount: 20,
    status: 'active',
    registeredAt: '2026-08-03T14:00:00Z',
  },
  {
    id: 'worker-gachi-ro-1',
    workerId: 'seed-gachi-4',
    workerEmail: 'aquashield.ro@wikwik.in',
    name: 'Aqua Shield RO Purifier Installation & Repair',
    profession: 'water_filter',
    customProfession: 'Water Purifier Technician',
    phone: '9123456780',
    whatsapp: '9123456780',
    workingHours: '09:00 AM - 08:30 PM',
    workingDays: 'Monday - Saturday',
    experience: '6+ Years Experience',
    livingArea: 'Near Q-City, Financial District, Gachibowli, Hyderabad',
    location: { address: 'Near Q-City, Financial District, Gachibowli, Hyderabad', lat: 17.4320, lng: 78.3390 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Specialist in Kent, Aquaguard, Pureit, Livpure filter changes, TDS balancing, leakage fixing, alkaline filter upgrade, and annual maintenance.',
    emergencyAvailable: false,
    rating: 4.9,
    reviewsCount: 16,
    status: 'active',
    registeredAt: '2026-08-04T13:00:00Z',
  },
  {
    id: 'worker-gachi-ro-2',
    workerId: 'seed-gachi-4b',
    workerEmail: 'puredrop.gachi@wikwik.in',
    name: 'Pure Drop Aqua Systems & Maintenance',
    profession: 'water_filter',
    customProfession: 'RO Filter & Water Purifier Specialist',
    phone: '9866445566',
    whatsapp: '9866445566',
    workingHours: '08:30 AM - 08:30 PM',
    workingDays: 'All 7 Days',
    experience: '8+ Years Experience',
    livingArea: 'ISB Road, Gachibowli, Hyderabad',
    location: { address: 'ISB Road, Gachibowli, Hyderabad', lat: 17.4260, lng: 78.3450 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'RO membrane replacement, TDS adjustment, tap adapter leak repair, pre-filter candle change, and residential water testing.',
    emergencyAvailable: false,
    rating: 4.8,
    reviewsCount: 15,
    status: 'active',
    registeredAt: '2026-08-04T15:00:00Z',
  },
  {
    id: 'worker-gachi-carpenter-1',
    workerId: 'seed-gachi-5',
    workerEmail: 'srisai.wood@wikwik.in',
    name: 'Sri Sai Wood Works & Furniture Carpentry',
    profession: 'carpenter',
    customProfession: 'Carpenter & Furniture Specialist',
    phone: '9866001122',
    whatsapp: '9866001122',
    workingHours: '09:00 AM - 08:00 PM',
    workingDays: 'Monday - Saturday',
    experience: '12+ Years Experience',
    livingArea: 'Gowlidoddy, Gachibowli, Hyderabad',
    location: { address: 'Gowlidoddy, Gachibowli, Hyderabad', lat: 17.4300, lng: 78.3450 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Door lock installation, modular kitchen drawer alignment, bed & wardrobe assembly, hinge replacement, sliding door channel repair, and custom carpentry.',
    emergencyAvailable: false,
    rating: 4.8,
    reviewsCount: 19,
    status: 'active',
    registeredAt: '2026-08-05T14:00:00Z',
  },
  {
    id: 'worker-gachi-tutor-1',
    workerId: 'seed-gachi-6',
    workerEmail: 'cybertutors.gachi@wikwik.in',
    name: 'Cyber Tutors Home Tuition & Coaching',
    profession: 'tutor',
    customProfession: 'CBSE & ICSE Home Tutor',
    phone: '9949224466',
    whatsapp: '9949224466',
    workingHours: '04:00 PM - 09:00 PM',
    workingDays: 'Monday - Friday',
    experience: '6+ Years Experience',
    livingArea: 'Telecom Nagar, Gachibowli, Hyderabad',
    location: { address: 'Telecom Nagar, Gachibowli, Hyderabad', lat: 17.4415, lng: 78.3555 },
    rate: 0,
    rateUnit: 'Contact for Quote',
    currency: '₹',
    description: 'Personalized 1-on-1 home tuition for Classes 6 to 12 (Maths, Physics, Chemistry, Computer Science). Concept-focused teaching with weekly test analysis.',
    emergencyAvailable: false,
    rating: 4.9,
    reviewsCount: 22,
    status: 'active',
    registeredAt: '2026-08-05T15:00:00Z',
  },
];

// Helper to encode metadata into description string
const encodeWorkerDescriptionWithMeta = (description, meta = {}) => {
  const cleanDesc = (description || '').split('\n\n__META__')[0];
  const metaObj = {
    workerId: meta.workerId || '',
    workerEmail: meta.workerEmail || '',
    name: meta.name || '',
    profession: meta.profession || 'electrician',
    customProfession: meta.customProfession || '',
    phone: meta.phone || '',
    whatsapp: meta.whatsapp || '',
    workingHours: meta.workingHours || '09:00 AM - 08:00 PM',
    workingDays: meta.workingDays || 'Monday - Saturday',
    experience: meta.experience || '',
    livingArea: meta.livingArea || '',
    location: meta.location || { address: '', lat: 0, lng: 0 },
    rate: meta.rate || 0,
    rateUnit: meta.rateUnit || 'Contact for Quote',
    currency: meta.currency || '₹',
    emergencyAvailable: Boolean(meta.emergencyAvailable),
    rating: meta.rating || 4.8,
    reviewsCount: meta.reviewsCount || 5,
    status: meta.status || 'active',
  };
  return `${cleanDesc}\n\n__META__${JSON.stringify(metaObj)}`;
};

// Helper to decode description and metadata
const decodeWorkerDescriptionWithMeta = (rawDescription) => {
  if (!rawDescription) return { description: '', meta: {} };
  const parts = rawDescription.split('\n\n__META__');
  if (parts.length > 1) {
    try {
      const meta = JSON.parse(parts[parts.length - 1]);
      return { description: parts[0], meta };
    } catch {
      return { description: rawDescription, meta: {} };
    }
  }
  return { description: rawDescription, meta: {} };
};

// Fallback UUID regex check
const isUuid = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

export const WorkerProvider = ({ children }) => {
  const { location } = useLocation();
  const { user } = useAuth();

  const [workers, setWorkers] = useState(() => {
    try {
      const stored = localStorage.getItem(WORKERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch { /* ignore */ }
    return INITIAL_CURATED_WORKERS;
  });

  const [toasts, setToasts] = useState([]);

  // Sync worker profiles from Supabase
  const syncWithSupabase = useCallback(async () => {
    try {
      const { data: gigData, error: gigError } = await supabase
        .from('gigs')
        .select('*')
        .eq('category', GIG_CATEGORY_WORKER)
        .eq('status', 'active')
        .order('posted_at', { ascending: false });

      if (!gigError && gigData && Array.isArray(gigData) && gigData.length > 0) {
        const parsedWorkers = gigData.map(g => {
          const { description, meta } = decodeWorkerDescriptionWithMeta(g.description);
          return {
            id: String(g.id),
            workerId: meta.workerId || g.posted_by,
            workerEmail: meta.workerEmail || '',
            name: meta.name || g.title || 'Professional Worker',
            profession: meta.profession || 'electrician',
            customProfession: meta.customProfession || '',
            phone: meta.phone || '',
            whatsapp: meta.whatsapp || meta.phone || '',
            workingHours: meta.workingHours || '09:00 AM - 08:00 PM',
            workingDays: meta.workingDays || 'Monday - Saturday',
            experience: meta.experience || 'Experienced',
            livingArea: meta.livingArea || g.location?.address || 'Nearby Area',
            location: meta.location || g.location || { address: '', lat: 0, lng: 0 },
            rate: Number(meta.rate || g.amount || 0),
            rateUnit: meta.rateUnit || 'Contact for Quote',
            currency: g.currency || meta.currency || '₹',
            description: description || '',
            emergencyAvailable: Boolean(meta.emergencyAvailable),
            rating: Number(meta.rating || 4.8),
            reviewsCount: Number(meta.reviewsCount || 6),
            status: g.status || 'active',
            registeredAt: g.posted_at,
          };
        });

        // Merge curated workers with user-registered workers
        const mergedMap = new Map();
        INITIAL_CURATED_WORKERS.forEach(w => mergedMap.set(w.id, w));
        parsedWorkers.forEach(w => mergedMap.set(w.id, w));

        setWorkers(Array.from(mergedMap.values()));
      }
    } catch (err) {
      console.warn('Worker sync notice:', err);
    }
  }, []);

  // Fetch on mount & poll every 4 seconds + Realtime channel
  useEffect(() => {
    syncWithSupabase();
    const interval = setInterval(syncWithSupabase, 4000);

    let channel = null;
    try {
      channel = supabase
        .channel('public:workers_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'gigs' }, () => {
          syncWithSupabase();
        })
        .subscribe();
    } catch (e) {
      console.warn('Worker realtime sub error:', e);
    }

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [syncWithSupabase]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(WORKERS_STORAGE_KEY, JSON.stringify(workers));
    } catch { /* safety */ }
  }, [workers]);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  // Register or Update a worker profile
  const registerWorker = useCallback(async (workerData) => {
    const profileId = workerData.id || generateId();
    const workerUserId = user?.id || profileId;
    const workerUserEmail = (user?.email || workerData.workerEmail || '').trim().toLowerCase();

    const workerObj = {
      id: profileId,
      workerId: workerUserId,
      workerEmail: workerUserEmail,
      name: workerData.name || user?.name || 'Worker',
      profession: workerData.profession || 'electrician',
      customProfession: workerData.customProfession || '',
      phone: workerData.phone || user?.phone || '',
      whatsapp: workerData.whatsapp || workerData.phone || user?.phone || '',
      workingHours: workerData.workingHours || '09:00 AM - 08:00 PM',
      workingDays: workerData.workingDays || 'Monday - Saturday',
      experience: workerData.experience || '2+ Years',
      livingArea: workerData.livingArea || workerData.location?.address || 'Nearby',
      location: workerData.location || { address: workerData.livingArea || '', lat: location.lat, lng: location.lng },
      rate: Number(workerData.rate || 0),
      rateUnit: workerData.rateUnit || 'Contact for Quote',
      currency: workerData.currency || '₹',
      description: workerData.description || '',
      emergencyAvailable: Boolean(workerData.emergencyAvailable),
      rating: 4.9,
      reviewsCount: 1,
      status: 'active',
      registeredAt: new Date().toISOString(),
    };

    // Update local state immediately
    setWorkers(prev => [workerObj, ...prev.filter(w => w.id !== profileId && w.workerEmail !== workerUserEmail)]);
    showToast('Worker profile registered successfully! People nearby can now find and contact you.', 'success');

    // Central Supabase persist
    const encodedDescription = encodeWorkerDescriptionWithMeta(workerObj.description, workerObj);

    const payload = {
      id: profileId,
      title: `${workerObj.name} - ${workerObj.profession.toUpperCase()}`,
      description: encodedDescription,
      category: GIG_CATEGORY_WORKER,
      amount: workerObj.rate,
      currency: workerObj.currency,
      date: new Date().toISOString(),
      duration: workerObj.workingHours,
      location: workerObj.location,
      posted_by: isUuid(workerUserId) ? workerUserId : profileId,
      status: 'active',
      posted_at: workerObj.registeredAt,
    };

    try {
      await supabase.from('gigs').upsert([payload]);
    } catch (err) {
      console.warn('Worker Supabase save error:', err);
    }

    setTimeout(syncWithSupabase, 400);

    return workerObj;
  }, [user, location, showToast, syncWithSupabase]);

  // Search & Filter nearby workers by profession & radius
  const getNearbyWorkers = useCallback((filters = {}) => {
    const {
      profession,
      searchQuery = '',
      radiusKm = 100,
    } = filters;

    let filtered = workers.filter(worker => {
      if (worker.status !== 'active') return false;

      // Profession filter
      if (profession && profession !== 'all') {
        if (worker.profession !== profession && worker.customProfession !== profession) {
          return false;
        }
      }

      // Radius matching (Haversine distance from user's GPS/current location)
      if (worker.location && typeof worker.location.lat === 'number' && typeof worker.location.lng === 'number') {
        const dist = calculateDistance(location.lat, location.lng, worker.location.lat, worker.location.lng);
        if (radiusKm < 200 && dist > radiusKm) {
          return false;
        }
      }

      // Search Query filter (name, profession, livingArea, skills)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (worker.name || '').toLowerCase().includes(q);
        const matchesProf = (worker.profession || '').toLowerCase().includes(q);
        const matchesArea = (worker.livingArea || '').toLowerCase().includes(q);
        const matchesDesc = (worker.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesProf && !matchesArea && !matchesDesc) return false;
      }

      return true;
    });

    // Attach computed distance
    filtered = filtered.map(worker => ({
      ...worker,
      distance: (worker.location && typeof worker.location.lat === 'number')
        ? calculateDistance(location.lat, location.lng, worker.location.lat, worker.location.lng)
        : 0,
    }));

    // Sort by nearest first
    filtered.sort((a, b) => a.distance - b.distance);
    return filtered;
  }, [workers, location]);

  // Get worker by ID
  const getWorkerById = useCallback((id) => {
    const worker = workers.find(w => String(w.id) === String(id));
    if (!worker) return null;

    return {
      ...worker,
      distance: (worker.location && typeof worker.location.lat === 'number')
        ? calculateDistance(location.lat, location.lng, worker.location.lat, worker.location.lng)
        : 0,
    };
  }, [workers, location]);

  // Check if current logged in user has a registered worker profile
  const myWorkerProfile = user
    ? workers.find(w => 
        (user.email && w.workerEmail && user.email.toLowerCase() === w.workerEmail.toLowerCase()) ||
        (user.id && w.workerId && String(user.id) === String(w.workerId))
      ) || null
    : null;

  return (
    <WorkerContext.Provider value={{
      workers,
      toasts,
      showToast,
      registerWorker,
      getNearbyWorkers,
      getWorkerById,
      myWorkerProfile,
    }}>
      {children}
    </WorkerContext.Provider>
  );
};

export const useWorkers = () => {
  const ctx = useContext(WorkerContext);
  if (!ctx) throw new Error('useWorkers must be used within WorkerProvider');
  return ctx;
};
