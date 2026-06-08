export interface LevelConfig {
  level: number;
  name: string;
  duration: number;
  targetScore: number;
  description: string;
  difficulty: {
    fallSpeed: { min: number; max: number };
    spawnInterval: { min: number; max: number };
    bombChance: { min: number; max: number };
    scoreMultiplier: number;
  };
}

export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    name: '初出茅庐',
    duration: 45,
    targetScore: 300,
    description: '热身关卡，熟悉操作',
    difficulty: {
      fallSpeed: { min: 120, max: 200 },
      spawnInterval: { min: 800, max: 1200 },
      bombChance: { min: 0.1, max: 0.15 },
      scoreMultiplier: 1.0,
    },
  },
  {
    level: 2,
    name: '小试牛刀',
    duration: 50,
    targetScore: 600,
    description: '速度加快，保持专注',
    difficulty: {
      fallSpeed: { min: 150, max: 250 },
      spawnInterval: { min: 700, max: 1000 },
      bombChance: { min: 0.15, max: 0.2 },
      scoreMultiplier: 1.1,
    },
  },
  {
    level: 3,
    name: '渐入佳境',
    duration: 55,
    targetScore: 1000,
    description: '炸弹增多，小心躲避',
    difficulty: {
      fallSpeed: { min: 180, max: 300 },
      spawnInterval: { min: 600, max: 900 },
      bombChance: { min: 0.2, max: 0.25 },
      scoreMultiplier: 1.2,
    },
  },
  {
    level: 4,
    name: '炉火纯青',
    duration: 60,
    targetScore: 1500,
    description: '节奏加快，连击加分',
    difficulty: {
      fallSpeed: { min: 220, max: 350 },
      spawnInterval: { min: 500, max: 800 },
      bombChance: { min: 0.22, max: 0.28 },
      scoreMultiplier: 1.3,
    },
  },
  {
    level: 5,
    name: '登峰造极',
    duration: 60,
    targetScore: 2200,
    description: '高手挑战，极限反应',
    difficulty: {
      fallSpeed: { min: 260, max: 400 },
      spawnInterval: { min: 450, max: 700 },
      bombChance: { min: 0.25, max: 0.32 },
      scoreMultiplier: 1.5,
    },
  },
  {
    level: 6,
    name: '手速王者',
    duration: 65,
    targetScore: 3000,
    description: '王者之路，非比寻常',
    difficulty: {
      fallSpeed: { min: 300, max: 450 },
      spawnInterval: { min: 400, max: 600 },
      bombChance: { min: 0.28, max: 0.35 },
      scoreMultiplier: 1.7,
    },
  },
  {
    level: 7,
    name: '神级操作',
    duration: 70,
    targetScore: 4000,
    description: '传说级别，神之手速',
    difficulty: {
      fallSpeed: { min: 350, max: 500 },
      spawnInterval: { min: 350, max: 550 },
      bombChance: { min: 0.3, max: 0.38 },
      scoreMultiplier: 2.0,
    },
  },
];

export const getLevelConfig = (level: number): LevelConfig => {
  const index = Math.min(level - 1, LEVELS.length - 1);
  return LEVELS[Math.max(0, index)];
};

export const getMaxLevel = (): number => LEVELS.length;

export const isLastLevel = (level: number): boolean => level >= LEVELS.length;
