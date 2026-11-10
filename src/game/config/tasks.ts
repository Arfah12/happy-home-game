import type { RoomId, TaskId } from '../types';

export interface TaskDef {
  id: TaskId;
  name: string;
  description: string;
  icon: string;
  room: RoomId;
  requiredLevel: number;
  coins: number;
  xp: number;
}

export const TASKS: TaskDef[] = [
  {
    id: 'cook_breakfast',
    name: 'Masak sarapan',
    description: 'Pergi dapur, masak sarapan sedap untuk keluarga.',
    icon: '🍳',
    room: 'kitchen',
    requiredLevel: 1,
    coins: 50,
    xp: 20,
  },
  {
    id: 'wash_dishes',
    name: 'Basuh pinggan',
    description: 'Gosok pinggan kotor dalam sinki dapur.',
    icon: '🍽️',
    room: 'kitchen',
    requiredLevel: 1,
    coins: 30,
    xp: 10,
  },
  {
    id: 'clean_living',
    name: 'Mop ruang tamu',
    description: 'Ambil mop kat rak alatan, gosok semua kotoran.',
    icon: '🧽',
    room: 'living',
    requiredLevel: 1,
    coins: 60,
    xp: 25,
  },
  {
    id: 'vacuum_floor',
    name: 'Vakum lantai',
    description: 'Ambil vakum, sedut semua bebola habuk.',
    icon: '🌀',
    room: 'living',
    requiredLevel: 1,
    coins: 45,
    xp: 18,
  },
  {
    id: 'do_laundry',
    name: 'Basuh baju',
    description: 'Kutip baju kotor, basuh dalam mesin, ambil baju bersih.',
    icon: '🧺',
    room: 'laundry',
    requiredLevel: 2,
    coins: 40,
    xp: 15,
  },
  {
    id: 'make_bed',
    name: 'Kemas katil',
    description: 'Rapikan cadar dan bantal dalam bilik tidur.',
    icon: '🛏️',
    room: 'bedroom',
    requiredLevel: 3,
    coins: 35,
    xp: 14,
  },
  {
    id: 'water_garden',
    name: 'Siram pokok',
    description: 'Isi penyiram kat paip, siram semua pokok bunga.',
    icon: '🌻',
    room: 'garden',
    requiredLevel: 5,
    coins: 55,
    xp: 22,
  },
  {
    id: 'tidy_toys',
    name: 'Kemas mainan',
    description: 'Kutip mainan bersepah dalam bilik anak, masuk dalam kotak mainan.',
    icon: '🧸',
    room: 'kids',
    requiredLevel: 8,
    coins: 65,
    xp: 26,
  },
  {
    id: 'family_dinner',
    name: 'Makan malam sekeluarga',
    description: 'Masak makan malam lepas 5 petang, tunggu abang balik, panggil semua makan.',
    icon: '🍽️',
    room: 'kitchen',
    requiredLevel: 1,
    coins: 70,
    xp: 30,
  },
];

export const TASK_BY_ID: Record<TaskId, TaskDef> = Object.fromEntries(
  TASKS.map((t) => [t.id, t]),
) as Record<TaskId, TaskDef>;

export function availableTasks(level: number): TaskDef[] {
  return TASKS.filter((t) => t.requiredLevel <= level);
}
