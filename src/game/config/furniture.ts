export type FurnitureCategory =
  | 'seating'
  | 'tables'
  | 'decor'
  | 'plants'
  | 'lighting'
  | 'bedroom'
  | 'kids'
  | 'garden'
  | 'premium';

export type FurnitureModel =
  | 'rug'
  | 'plant_pot'
  | 'plant_tall'
  | 'floor_lamp'
  | 'side_table'
  | 'bean_bag'
  | 'armchair'
  | 'bookshelf'
  | 'easel_art'
  | 'nightstand'
  | 'dresser'
  | 'sofa'
  | 'coffee_table'
  | 'tv_stand'
  | 'bench'
  | 'flower_bed'
  | 'fountain'
  | 'piano'
  | 'aquarium'
  | 'dining_set'
  | 'toy_chest'
  | 'rocking_horse'
  | 'lounge_chair'
  | 'crystal_lamp';

export interface FurnitureItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  requiredLevel: number;
  category: FurnitureCategory;
  model: FurnitureModel;
  color: string;
  accent: string;
  /** Footprint in metres before rotation: [width (x), depth (z)]. */
  size: [number, number];
  /** Whether the player collides with it. Rugs and flat items do not. */
  collide: boolean;
  /** XP awarded the first time the item is bought (decorating is progress too). */
  xp: number;
}

export const CATEGORY_LABELS: Record<FurnitureCategory, string> = {
  seating: 'Tempat Duduk',
  tables: 'Meja',
  decor: 'Hiasan',
  plants: 'Pokok',
  lighting: 'Lampu',
  bedroom: 'Bilik Tidur',
  kids: 'Budak-budak',
  garden: 'Taman',
  premium: 'Premium',
};

export const FURNITURE: FurnitureItem[] = [
  // Level 1
  { id: 'cozy_rug', name: 'Karpet Bulat Comel', emoji: '🟣', price: 60, requiredLevel: 1, category: 'decor', model: 'rug', color: '#c9a7ff', accent: '#ffffff', size: [2.4, 2.4], collide: false, xp: 4 },
  { id: 'potted_fern', name: 'Pokok Pakis', emoji: '🪴', price: 40, requiredLevel: 1, category: 'plants', model: 'plant_pot', color: '#6cc47a', accent: '#f4a6a6', size: [0.7, 0.7], collide: true, xp: 3 },
  { id: 'reading_lamp', name: 'Lampu Baca', emoji: '💡', price: 80, requiredLevel: 1, category: 'lighting', model: 'floor_lamp', color: '#fff2b3', accent: '#8f7aa8', size: [0.6, 0.6], collide: true, xp: 5 },
  { id: 'side_table', name: 'Meja Sisi Peach', emoji: '🟠', price: 90, requiredLevel: 1, category: 'tables', model: 'side_table', color: '#ffc4a3', accent: '#e8a07c', size: [0.8, 0.8], collide: true, xp: 5 },
  { id: 'bean_bag', name: 'Bean Bag Pudina', emoji: '🫘', price: 110, requiredLevel: 1, category: 'seating', model: 'bean_bag', color: '#9be3c4', accent: '#7cc9a8', size: [1.1, 1.1], collide: true, xp: 6 },
  { id: 'pastel_armchair', name: 'Kerusi Empuk Pastel', emoji: '🪑', price: 150, requiredLevel: 1, category: 'seating', model: 'armchair', color: '#ffb3c9', accent: '#e88aa6', size: [1.1, 1.0], collide: true, xp: 8 },
  // Level 2
  { id: 'bookshelf', name: 'Rak Buku Cerita', emoji: '📚', price: 180, requiredLevel: 2, category: 'decor', model: 'bookshelf', color: '#d9b38c', accent: '#8bc6ff', size: [1.4, 0.45], collide: true, xp: 9 },
  { id: 'wall_art', name: 'Lukisan Senja', emoji: '🖼️', price: 120, requiredLevel: 2, category: 'decor', model: 'easel_art', color: '#ff9f80', accent: '#ffe08a', size: [0.9, 0.6], collide: true, xp: 6 },
  // Level 3
  { id: 'nightstand', name: 'Meja Sisi Katil Awan', emoji: '🌙', price: 100, requiredLevel: 3, category: 'bedroom', model: 'nightstand', color: '#ffffff', accent: '#b8c7ff', size: [0.7, 0.6], collide: true, xp: 5 },
  { id: 'dresser', name: 'Almari Laci Ungu', emoji: '🗄️', price: 200, requiredLevel: 3, category: 'bedroom', model: 'dresser', color: '#d8c4ff', accent: '#ffffff', size: [1.5, 0.6], collide: true, xp: 10 },
  // Level 4 – living room upgrades
  { id: 'pastel_sofa', name: 'Sofa Marshmallow', emoji: '🛋️', price: 300, requiredLevel: 4, category: 'seating', model: 'sofa', color: '#a8d8ff', accent: '#7fb8e6', size: [2.4, 1.0], collide: true, xp: 15 },
  { id: 'coffee_table', name: 'Meja Kopi Kayu', emoji: '☕', price: 160, requiredLevel: 4, category: 'tables', model: 'coffee_table', color: '#d9a877', accent: '#ffffff', size: [1.4, 0.8], collide: true, xp: 8 },
  { id: 'tv_stand', name: 'Kabinet TV Retro', emoji: '📺', price: 260, requiredLevel: 4, category: 'decor', model: 'tv_stand', color: '#f7e1c6', accent: '#3d3a4f', size: [1.6, 0.5], collide: true, xp: 13 },
  { id: 'monstera', name: 'Pokok Monstera', emoji: '🌿', price: 140, requiredLevel: 4, category: 'plants', model: 'plant_tall', color: '#3fae6a', accent: '#ffffff', size: [0.8, 0.8], collide: true, xp: 7 },
  // Level 5 – garden
  { id: 'garden_bench', name: 'Bangku Taman', emoji: '🪵', price: 220, requiredLevel: 5, category: 'garden', model: 'bench', color: '#c98f5f', accent: '#5f8a5a', size: [1.8, 0.6], collide: true, xp: 11 },
  { id: 'flower_bed', name: 'Batas Bunga', emoji: '🌷', price: 130, requiredLevel: 5, category: 'garden', model: 'flower_bed', color: '#ff7eb6', accent: '#ffd54f', size: [1.6, 0.8], collide: true, xp: 7 },
  { id: 'bird_fountain', name: 'Kolam Burung', emoji: '⛲', price: 350, requiredLevel: 5, category: 'garden', model: 'fountain', color: '#e6e1f0', accent: '#8fd3ff', size: [1.3, 1.3], collide: true, xp: 17 },
  // Level 6 – premium
  { id: 'grand_piano', name: 'Piano Besar', emoji: '🎹', price: 900, requiredLevel: 6, category: 'premium', model: 'piano', color: '#2f2b3a', accent: '#ffffff', size: [1.6, 1.8], collide: true, xp: 40 },
  { id: 'aquarium', name: 'Akuarium Karang', emoji: '🐠', price: 650, requiredLevel: 6, category: 'premium', model: 'aquarium', color: '#8fd3ff', accent: '#ff8f6b', size: [1.6, 0.6], collide: true, xp: 30 },
  { id: 'velvet_sofa', name: 'Sofa Baldu', emoji: '👑', price: 700, requiredLevel: 6, category: 'premium', model: 'sofa', color: '#b06ab3', accent: '#f6d365', size: [2.6, 1.05], collide: true, xp: 32 },
  // Level 7 – kitchen upgrades
  { id: 'dining_set', name: 'Set Meja Makan', emoji: '🍽️', price: 400, requiredLevel: 7, category: 'tables', model: 'dining_set', color: '#fff7ec', accent: '#ff9fb8', size: [1.8, 1.8], collide: true, xp: 20 },
  // Level 8 – kids
  { id: 'toy_chest', name: 'Peti Mainan Pelangi', emoji: '🎁', price: 180, requiredLevel: 8, category: 'kids', model: 'toy_chest', color: '#ffd166', accent: '#ef476f', size: [1.1, 0.6], collide: true, xp: 9 },
  { id: 'rocking_horse', name: 'Kuda Goyang', emoji: '🐴', price: 240, requiredLevel: 8, category: 'kids', model: 'rocking_horse', color: '#f4a261', accent: '#ffffff', size: [1.2, 0.5], collide: true, xp: 12 },
  // Level 9 – larger house
  { id: 'lounge_chair', name: 'Kerusi Malas Berjemur', emoji: '🌞', price: 280, requiredLevel: 9, category: 'seating', model: 'lounge_chair', color: '#ffe08a', accent: '#ffffff', size: [0.8, 1.9], collide: true, xp: 14 },
  // Level 10 – dream house
  { id: 'golden_fountain', name: 'Air Pancut Emas', emoji: '✨', price: 1500, requiredLevel: 10, category: 'premium', model: 'fountain', color: '#f6d365', accent: '#8fd3ff', size: [1.5, 1.5], collide: true, xp: 60 },
  { id: 'crystal_lamp', name: 'Lampu Kristal', emoji: '💎', price: 1000, requiredLevel: 10, category: 'premium', model: 'crystal_lamp', color: '#e8f4ff', accent: '#f6d365', size: [0.8, 0.8], collide: true, xp: 45 },
];

export const FURNITURE_BY_ID: Record<string, FurnitureItem> = Object.fromEntries(
  FURNITURE.map((f) => [f.id, f]),
);
