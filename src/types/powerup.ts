export type PowerUpType = 'double_score' | 'slow_motion' | 'shield';

export interface PowerUpConfig {
  type: PowerUpType;
  name: string;
  icon: string;
  color: number;
  bgColor: number;
  duration: number;
  spawnChance: number;
  description: string;
}

export interface ActiveBuff {
  type: PowerUpType;
  endTime: number;
  duration: number;
}

interface RedPacketConfig {
  type: 'small' | 'medium' | 'large';
  score: number;
  color: number;
  size: number;
  weight: number;
  label: string;
}

export interface PowerUpItem extends Phaser.Physics.Arcade.Sprite {
  itemType?: 'redpacket' | 'bomb' | 'powerup';
  powerUpType?: PowerUpType;
  powerUpConfig?: PowerUpConfig;
  packetConfig?: RedPacketConfig;
  baseScore?: number;
}
