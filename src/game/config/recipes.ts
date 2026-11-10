export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  requiredLevel: number;
  /** Multiplies the base cooking reward. */
  rewardMultiplier: number;
  /** Speed of the timing needle, in sweeps per second. */
  speed: number;
  /** Width of the "good" zone (0..1 of the bar). */
  zoneWidth: number;
  steps: string[];
  color: string;
}

export const RECIPES: Recipe[] = [
  {
    id: 'pancakes',
    name: 'Lempeng Pisang',
    emoji: '🥞',
    requiredLevel: 1,
    rewardMultiplier: 1,
    speed: 0.55,
    zoneWidth: 0.26,
    steps: ['Lenyek pisang', 'Terbalikkan lempeng', 'Siram madu'],
    color: '#f6c26b',
  },
  {
    id: 'eggs_toast',
    name: 'Roti Bakar & Telur Separuh Masak',
    emoji: '🍳',
    requiredLevel: 1,
    rewardMultiplier: 1,
    speed: 0.6,
    zoneWidth: 0.24,
    steps: ['Pecahkan telur', 'Bakar roti', 'Sapu kaya & butter'],
    color: '#ffe27a',
  },
  {
    id: 'nasi_lemak',
    name: 'Nasi Lemak',
    emoji: '🍛',
    requiredLevel: 3,
    rewardMultiplier: 1.2,
    speed: 0.72,
    zoneWidth: 0.21,
    steps: ['Kukus nasi santan', 'Goreng ikan bilis', 'Kacau sambal', 'Susun dalam pinggan'],
    color: '#ff8f6b',
  },
  {
    id: 'omelette',
    name: 'Mee Goreng Mamak',
    emoji: '🍜',
    requiredLevel: 7,
    rewardMultiplier: 1.4,
    speed: 0.85,
    zoneWidth: 0.19,
    steps: ['Tumis bawang', 'Masuk mee', 'Gaul kicap & sos', 'Perah limau'],
    color: '#ffd166',
  },
  {
    id: 'smoothie_bowl',
    name: 'Roti Jala Kari',
    emoji: '🫓',
    requiredLevel: 7,
    rewardMultiplier: 1.5,
    speed: 0.95,
    zoneWidth: 0.17,
    steps: ['Bancuh adunan', 'Jalakan atas kuali', 'Lipat roti jala', 'Tuang kari ayam'],
    color: '#c98bff',
  },
];

/** Perfect-hit window as a fraction of the good zone (centered). */
export const PERFECT_FRACTION = 0.35;
