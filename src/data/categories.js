import {
  Car, ChefHat, Shield, Store, Sparkles, Zap, Wrench,
  BookOpen, Truck, PartyPopper, Hammer, Scissors, Camera, 
  PawPrint, Leaf, Briefcase, Bike, Paintbrush, Airplay, Droplets
} from 'lucide-react';

export const CATEGORIES = [
  { id: 'electrician', name: 'Electrician', icon: Zap, emoji: '⚡', cssClass: 'cat-electrician' },
  { id: 'mechanic', name: 'Bike & Auto Mechanic', icon: Wrench, emoji: '🔧', cssClass: 'cat-mechanic' },
  { id: 'plumber', name: 'Plumber', icon: Wrench, emoji: '🚰', cssClass: 'cat-plumber' },
  { id: 'water_filter', name: 'RO Water Purifier & Filter', icon: Droplets, emoji: '💧', cssClass: 'cat-water' },
  { id: 'ac_repair', name: 'AC & Appliance Repair', icon: Airplay, emoji: '❄️', cssClass: 'cat-ac' },
  { id: 'driver', name: 'Driver', icon: Car, emoji: '🚗', cssClass: 'cat-driver' },
  { id: 'carpenter', name: 'Carpenter', icon: Hammer, emoji: '🪚', cssClass: 'cat-carpenter' },
  { id: 'painter', name: 'Painter', icon: Paintbrush, emoji: '🎨', cssClass: 'cat-painter' },
  { id: 'cleaner', name: 'Cleaner', icon: Sparkles, emoji: '🧹', cssClass: 'cat-cleaner' },
  { id: 'chef', name: 'Chef / Cook', icon: ChefHat, emoji: '👨‍🍳', cssClass: 'cat-chef' },
  { id: 'security', name: 'Security Guard', icon: Shield, emoji: '🛡️', cssClass: 'cat-security' },
  { id: 'shopkeeper', name: 'Shopkeeper', icon: Store, emoji: '🏪', cssClass: 'cat-shopkeeper' },
  { id: 'tutor', name: 'Tutor & Teacher', icon: BookOpen, emoji: '📚', cssClass: 'cat-tutor' },
  { id: 'delivery', name: 'Delivery Partner', icon: Truck, emoji: '🚚', cssClass: 'cat-delivery' },
  { id: 'event', name: 'Event Staff', icon: PartyPopper, emoji: '🎉', cssClass: 'cat-event' },
  { id: 'labour', name: 'Labour / Helper', icon: Hammer, emoji: '🏗️', cssClass: 'cat-labour' },
  { id: 'beautician', name: 'Beautician & Salon', icon: Scissors, emoji: '💇', cssClass: 'cat-beautician' },
  { id: 'photographer', name: 'Photographer', icon: Camera, emoji: '📷', cssClass: 'cat-photographer' },
  { id: 'petcare', name: 'Pet Care', icon: PawPrint, emoji: '🐕', cssClass: 'cat-petcare' },
  { id: 'gardener', name: 'Gardener', icon: Leaf, emoji: '🌿', cssClass: 'cat-gardener' },
  { id: 'other', name: 'Other Services', icon: Briefcase, emoji: '💼', cssClass: 'cat-other' },
];

export const getCategoryById = (id) => {
  const cat = CATEGORIES.find(c => c.id === id);
  if (cat) return cat;
  // Fallback for custom category names
  return { id, name: id || 'Other Work', icon: Briefcase, emoji: '💼', cssClass: 'cat-other' };
};
