import {
  Car, ChefHat, Shield, Store, Sparkles, Zap, Wrench,
  BookOpen, Truck, PartyPopper, Hammer, Scissors, Camera, PawPrint, Leaf, Briefcase
} from 'lucide-react';

export const CATEGORIES = [
  { id: 'driver', name: 'Driver', icon: Car, emoji: '🚗', cssClass: 'cat-driver' },
  { id: 'chef', name: 'Chef / Cook', icon: ChefHat, emoji: '👨‍🍳', cssClass: 'cat-chef' },
  { id: 'security', name: 'Security', icon: Shield, emoji: '🛡️', cssClass: 'cat-security' },
  { id: 'shopkeeper', name: 'Shopkeeper', icon: Store, emoji: '🏪', cssClass: 'cat-shopkeeper' },
  { id: 'cleaner', name: 'Cleaner', icon: Sparkles, emoji: '🧹', cssClass: 'cat-cleaner' },
  { id: 'electrician', name: 'Electrician', icon: Zap, emoji: '⚡', cssClass: 'cat-electrician' },
  { id: 'plumber', name: 'Plumber', icon: Wrench, emoji: '🔧', cssClass: 'cat-plumber' },
  { id: 'tutor', name: 'Tutor', icon: BookOpen, emoji: '📚', cssClass: 'cat-tutor' },
  { id: 'delivery', name: 'Delivery', icon: Truck, emoji: '🚚', cssClass: 'cat-delivery' },
  { id: 'event', name: 'Event Staff', icon: PartyPopper, emoji: '🎉', cssClass: 'cat-event' },
  { id: 'labour', name: 'Labour', icon: Hammer, emoji: '🏗️', cssClass: 'cat-labour' },
  { id: 'beautician', name: 'Beautician', icon: Scissors, emoji: '💇', cssClass: 'cat-beautician' },
  { id: 'photographer', name: 'Photographer', icon: Camera, emoji: '📷', cssClass: 'cat-photographer' },
  { id: 'petcare', name: 'Pet Care', icon: PawPrint, emoji: '🐕', cssClass: 'cat-petcare' },
  { id: 'gardener', name: 'Gardener', icon: Leaf, emoji: '🌿', cssClass: 'cat-gardener' },
  { id: 'other', name: 'Other', icon: Briefcase, emoji: '💼', cssClass: 'cat-other' },
];

export const getCategoryById = (id) => {
  const cat = CATEGORIES.find(c => c.id === id);
  if (cat) return cat;
  // Fallback for custom category names
  return { id, name: id || 'Other Work', icon: Briefcase, emoji: '💼', cssClass: 'cat-other' };
};
