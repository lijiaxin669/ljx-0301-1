import { PowerUpConfig } from '../types/powerup';

export const POWERUP_CONFIGS: PowerUpConfig[] = [
  {
    type: 'double_score',
    name: '双倍得分',
    icon: 'x2',
    color: 0x9b59b6,
    bgColor: 0x8e44ad,
    duration: 8000,
    spawnChance: 0.04,
    description: '8秒内得分翻倍',
  },
  {
    type: 'slow_motion',
    name: '时间减缓',
    icon: '⏱',
    color: 0x3498db,
    bgColor: 0x2980b9,
    duration: 6000,
    spawnChance: 0.03,
    description: '6秒内下落速度减半',
  },
  {
    type: 'shield',
    name: '无敌护盾',
    icon: '🛡',
    color: 0x2ecc71,
    bgColor: 0x27ae60,
    duration: 5000,
    spawnChance: 0.025,
    description: '5秒内免疫炸弹',
  },
];

export const getPowerUpConfig = (type: string): PowerUpConfig | undefined => {
  return POWERUP_CONFIGS.find(p => p.type === type);
};

export const shouldSpawnPowerUp = (): PowerUpConfig | null => {
  const rand = Math.random();
  let cumulative = 0;
  for (const config of POWERUP_CONFIGS) {
    cumulative += config.spawnChance;
    if (rand < cumulative) {
      return config;
    }
  }
  return null;
};
