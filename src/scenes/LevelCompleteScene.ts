import Phaser from 'phaser';
import { GAME_CONFIG } from '../config/gameConfig';
import { getLevelConfig, isLastLevel, getMaxLevel } from '../config/levels';
import { LevelResult } from '../types';

interface LevelCompleteData extends LevelResult {
  totalScore: number;
  totalMaxCombo: number;
  levelsCompleted: number;
}

export class LevelCompleteScene extends Phaser.Scene {
  private levelData!: LevelCompleteData;

  constructor() {
    super('LevelCompleteScene');
  }

  init(data: LevelCompleteData): void {
    this.levelData = data;
  }

  create(): void {
    const centerX = GAME_CONFIG.width / 2;

    this.add.rectangle(0, 0, GAME_CONFIG.width, GAME_CONFIG.height, 0x2c1810, 0.95)
      .setOrigin(0, 0);

    this.addConfetti();

    const title = this.levelData.isLastLevel ? '🎉 全部通关！🎉' : '✨ 关卡通过！✨';
    const titleText = this.add.text(centerX, 100, title, {
      fontSize: this.levelData.isLastLevel ? '42px' : '48px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: titleText,
      scale: { from: 0.5, to: 1.1 },
      duration: 600,
      ease: 'Back.easeOut',
    });

    const levelBadge = this.add.text(centerX, 160, `第 ${this.levelData.level} 关 · ${this.levelData.levelName}`, {
      fontSize: '28px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const statsY = 240;
    const stats = [
      { label: '本关得分', value: String(this.levelData.score), color: '#ffd700' },
      { label: '目标得分', value: String(this.levelData.targetScore), color: '#44ff44' },
      { label: '剩余时间', value: `${this.levelData.timeLeft}秒`, color: '#44aaff' },
      { label: '最高连击', value: `${this.levelData.maxCombo}连`, color: '#ff6b6b' },
      { label: '累计总分', value: String(this.levelData.totalScore), color: '#ffd700' },
    ];

    stats.forEach((stat, i) => {
      const y = statsY + i * 45;
      const bg = this.add.rectangle(centerX, y, 350, 40, 0x4a2c1f, 0.8)
        .setOrigin(0.5);
      const label = this.add.text(centerX - 160, y, stat.label, {
        fontSize: '18px',
        fontFamily: 'Microsoft YaHei',
        color: '#cccccc',
      }).setOrigin(0, 0.5);
      const value = this.add.text(centerX + 160, y, stat.value, {
        fontSize: '22px',
        fontFamily: 'Microsoft YaHei',
        color: stat.color,
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(1, 0.5);

      this.tweens.add({
        targets: [bg, label, value],
        alpha: { from: 0, to: 1 },
        x: { from: centerX - 50, to: centerX },
        duration: 300,
        delay: 200 + i * 100,
        ease: 'Cubic.Out',
      });
    });

    if (this.levelData.isLastLevel) {
      const completeText = this.add.text(centerX, 500, '🏆 恭喜你完成了所有关卡！', {
        fontSize: '24px',
        fontFamily: 'Microsoft YaHei',
        color: '#ffd700',
      }).setOrigin(0.5);

      const finalScoreText = this.add.text(centerX, 540, `最终得分: ${this.levelData.totalScore}`, {
        fontSize: '28px',
        fontFamily: 'Microsoft YaHei',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);

      const restartBtn = this.add.text(centerX, 610, '重新挑战', {
        fontSize: '28px',
        fontFamily: 'Microsoft YaHei',
        color: '#ffffff',
        backgroundColor: '#e74c3c',
        padding: { x: 50, y: 15 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      restartBtn.on('pointerover', () => restartBtn.setStyle({ backgroundColor: '#c0392b' }));
      restartBtn.on('pointerout', () => restartBtn.setStyle({ backgroundColor: '#e74c3c' }));
      restartBtn.on('pointerdown', () => {
        this.scene.start('GameScene', { startLevel: 1 });
      });

      const menuBtn = this.add.text(centerX, 670, '返回主菜单', {
        fontSize: '20px',
        fontFamily: 'Microsoft YaHei',
        color: '#cccccc',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      menuBtn.on('pointerover', () => menuBtn.setStyle({ color: '#ffffff' }));
      menuBtn.on('pointerout', () => menuBtn.setStyle({ color: '#cccccc' }));
      menuBtn.on('pointerdown', () => {
        this.scene.start('MenuScene');
      });
    } else {
      const nextLevel = getLevelConfig(this.levelData.level + 1);
      const nextLevelText = this.add.text(centerX, 500, `下一关: 第${this.levelData.level + 1}关 · ${nextLevel.name}`, {
        fontSize: '22px',
        fontFamily: 'Microsoft YaHei',
        color: '#ffcc00',
      }).setOrigin(0.5);

      const nextLevelInfo = this.add.text(centerX, 535,
        `目标: ${nextLevel.targetScore}分 | 时限: ${nextLevel.duration}秒 | 倍率: x${nextLevel.difficulty.scoreMultiplier}`, {
        fontSize: '16px',
        fontFamily: 'Microsoft YaHei',
        color: '#aaaaaa',
      }).setOrigin(0.5);

      const continueBtn = this.add.text(centerX, 600, '继续挑战', {
        fontSize: '32px',
        fontFamily: 'Microsoft YaHei',
        color: '#ffffff',
        backgroundColor: '#27ae60',
        padding: { x: 60, y: 18 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      continueBtn.on('pointerover', () => continueBtn.setStyle({ backgroundColor: '#229954' }));
      continueBtn.on('pointerout', () => continueBtn.setStyle({ backgroundColor: '#27ae60' }));
      continueBtn.on('pointerdown', () => {
        this.scene.start('GameScene', {
          startLevel: this.levelData.level + 1,
          totalScore: this.levelData.totalScore,
          totalMaxCombo: this.levelData.totalMaxCombo,
          levelsCompleted: this.levelData.levelsCompleted,
        });
      });

      const menuBtn = this.add.text(centerX, 670, '返回主菜单', {
        fontSize: '20px',
        fontFamily: 'Microsoft YaHei',
        color: '#cccccc',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      menuBtn.on('pointerover', () => menuBtn.setStyle({ color: '#ffffff' }));
      menuBtn.on('pointerout', () => menuBtn.setStyle({ color: '#cccccc' }));
      menuBtn.on('pointerdown', () => {
        this.scene.start('MenuScene');
      });
    }

    this.input.keyboard?.on('keydown-SPACE', () => {
      if (!this.levelData.isLastLevel) {
        this.scene.start('GameScene', {
          startLevel: this.levelData.level + 1,
          totalScore: this.levelData.totalScore,
          totalMaxCombo: this.levelData.totalMaxCombo,
          levelsCompleted: this.levelData.levelsCompleted,
        });
      } else {
        this.scene.start('GameScene', { startLevel: 1 });
      }
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      if (!this.levelData.isLastLevel) {
        this.scene.start('GameScene', {
          startLevel: this.levelData.level + 1,
          totalScore: this.levelData.totalScore,
          totalMaxCombo: this.levelData.totalMaxCombo,
          levelsCompleted: this.levelData.levelsCompleted,
        });
      } else {
        this.scene.start('GameScene', { startLevel: 1 });
      }
    });
  }

  private addConfetti(): void {
    const colors = [0xff4444, 0xffd700, 0x44ff44, 0x4444ff, 0xff44ff, 0x44ffff];

    this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: GAME_CONFIG.width },
      y: -30,
      lifespan: 4000,
      speedY: { min: 60, max: 120 },
      speedX: { min: -40, max: 40 },
      angle: { min: -10, max: 10 },
      rotate: { min: 0, max: 360 },
      quantity: 2,
      scale: { start: 1, end: 0.3 },
      alpha: { start: 1, end: 0 },
      tint: colors,
      bounds: { x: 0, y: 0, w: GAME_CONFIG.width, h: GAME_CONFIG.height + 100 },
    });
  }
}
