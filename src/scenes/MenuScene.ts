import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { ScoreManager } from '../utils/ScoreManager';
import { getMaxLevel } from '../config/levels';

export class MenuScene extends Phaser.Scene {
  private startButton!: Phaser.GameObjects.Text;

  constructor() {
    super('MenuScene');
  }

  create(): void {
    const centerX = GAME_CONFIG.width / 2;

    this.add.rectangle(0, 0, GAME_CONFIG.width, GAME_CONFIG.height, 0x3d2317)
      .setOrigin(0, 0);

    this.addParticles();

    const title = this.add.text(centerX, 100, '抢红包大作战', {
      fontSize: '48px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffd700',
      stroke: '#cc0000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: { from: 1, to: 1.05 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const subtitle = this.add.text(centerX, 155, '关卡挑战模式', {
      fontSize: '22px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffcc00',
    }).setOrigin(0.5);

    const levelBadge = this.add.text(centerX, 195, `共 ${getMaxLevel()} 关等你挑战！`, {
      fontSize: '18px',
      fontFamily: 'Microsoft YaHei',
      color: '#44ff44',
    }).setOrigin(0.5);

    const instructions = [
      '← → 或 A D 键控制福袋移动',
      '触屏设备：左右滑动或点击两侧',
      '接红包得分，达到目标分通关',
      '躲炸弹，3条命，每关限时',
      '连击越多，得分越高！',
    ];

    instructions.forEach((text, i) => {
      this.add.text(centerX, 245 + i * 30, text, {
        fontSize: '17px',
        fontFamily: 'Microsoft YaHei',
        color: '#cccccc',
      }).setOrigin(0.5);
    });

    const highScore = ScoreManager.getHighScore();
    const highLevel = ScoreManager.getHighLevel();

    const statsY = 410;
    this.add.text(centerX - 100, statsY, `最高分: ${highScore}`, {
      fontSize: '22px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.text(centerX + 100, statsY, `最高关卡: 第${highLevel}关`, {
      fontSize: '22px',
      fontFamily: 'Microsoft YaHei',
      color: '#44ff44',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.startButton = this.add.text(centerX, 490, '开始挑战', {
      fontSize: '36px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffffff',
      backgroundColor: '#e74c3c',
      padding: { x: 50, y: 18 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.startButton.on('pointerover', () => {
      this.startButton.setStyle({ backgroundColor: '#c0392b' });
    });

    this.startButton.on('pointerout', () => {
      this.startButton.setStyle({ backgroundColor: '#e74c3c' });
    });

    this.startButton.on('pointerdown', () => {
      this.scene.start('GameScene', { startLevel: 1 });
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.scene.start('GameScene', { startLevel: 1 });
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('GameScene', { startLevel: 1 });
    });
  }

  private addParticles(): void {
    this.add.particles(0, 0, 'packet_small', {
      x: { min: 0, max: GAME_CONFIG.width },
      y: -50,
      lifespan: 4000,
      speedY: { min: 30, max: 60 },
      speedX: { min: -20, max: 20 },
      angle: { min: -15, max: 15 },
      rotate: { min: 0, max: 360 },
      quantity: 0.3,
      scale: { start: 0.5, end: 0.3 },
      alpha: { start: 0.6, end: 0.2 },
    }).setDepth(-1);
  }
}
