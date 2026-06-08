import Phaser from 'phaser';
import { ActiveBuff, PowerUpType, PowerUpConfig } from '../types/powerup';
import { getPowerUpConfig } from '../config/powerups';
import { GAME_CONFIG } from '../config/gameConfig';

interface BuffDisplay {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Text;
  timerBar: Phaser.GameObjects.Graphics;
  timeText: Phaser.GameObjects.Text;
}

export class BuffManager {
  private scene: Phaser.Scene;
  private activeBuffs: Map<PowerUpType, ActiveBuff> = new Map();
  private buffDisplays: Map<PowerUpType, BuffDisplay> = new Map();
  private buffContainer!: Phaser.GameObjects.Container;
  private onBuffEndCallbacks: Map<PowerUpType, () => void> = new Map();
  private onBuffStartCallbacks: Map<PowerUpType, (config: PowerUpConfig) => void> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createBuffContainer();
  }

  private createBuffContainer(): void {
    this.buffContainer = this.scene.add.container(
      GAME_CONFIG.width - 20,
      135
    );
  }

  public onBuffStart(type: PowerUpType, callback: (config: PowerUpConfig) => void): void {
    this.onBuffStartCallbacks.set(type, callback);
  }

  public onBuffEnd(type: PowerUpType, callback: () => void): void {
    this.onBuffEndCallbacks.set(type, callback);
  }

  public addBuff(type: PowerUpType, duration: number): void {
    const now = this.scene.time.now;
    const config = getPowerUpConfig(type);
    if (!config) return;

    const existingBuff = this.activeBuffs.get(type);
    if (existingBuff) {
      existingBuff.endTime = Math.max(existingBuff.endTime, now + duration);
      this.updateBuffDisplay(type);
      return;
    }

    this.activeBuffs.set(type, {
      type,
      endTime: now + duration,
      duration,
    });

    this.createBuffDisplay(type, config);
    this.arrangeBuffDisplays();

    const callback = this.onBuffStartCallbacks.get(type);
    if (callback) {
      callback(config);
    }

    this.showBuffActivateEffect(type, config);
  }

  public hasBuff(type: PowerUpType): boolean {
    const buff = this.activeBuffs.get(type);
    if (!buff) return false;
    return this.scene.time.now < buff.endTime;
  }

  public getBuffRemainingTime(type: PowerUpType): number {
    const buff = this.activeBuffs.get(type);
    if (!buff) return 0;
    return Math.max(0, buff.endTime - this.scene.time.now);
  }

  private createBuffDisplay(type: PowerUpType, config: PowerUpConfig): void {
    const buffWidth = 120;
    const buffHeight = 40;

    const container = this.scene.add.container(0, 0);

    const bg = this.scene.add.graphics();
    bg.fillStyle(config.bgColor, 0.9);
    bg.lineStyle(2, config.color, 1);
    bg.fillRoundedRect(0, 0, buffWidth, buffHeight, 8);
    bg.strokeRoundedRect(0, 0, buffWidth, buffHeight, 8);

    const icon = this.scene.add.text(10, buffHeight / 2, config.icon, {
      fontSize: '20px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0, 0.5);

    const timerBar = this.scene.add.graphics();

    const timeText = this.scene.add.text(buffWidth - 10, buffHeight / 2, '', {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(1, 0.5);

    container.add([bg, timerBar, icon, timeText]);
    this.buffContainer.add(container);

    this.buffDisplays.set(type, { container, bg, icon, timerBar, timeText });
  }

  private arrangeBuffDisplays(): void {
    const buffTypes = Array.from(this.buffDisplays.keys());
    buffTypes.forEach((type, index) => {
      const display = this.buffDisplays.get(type);
      if (display) {
        display.container.setPosition(0, index * 50);
      }
    });
  }

  private updateBuffDisplay(type: PowerUpType): void {
    const display = this.buffDisplays.get(type);
    const buff = this.activeBuffs.get(type);
    const config = getPowerUpConfig(type);

    if (!display || !buff || !config) return;

    const remaining = this.getBuffRemainingTime(type);
    const progress = remaining / buff.duration;

    display.timerBar.clear();
    display.timerBar.fillStyle(config.color, 1);
    display.timerBar.fillRoundedRect(2, 32, 116 * progress, 6, 3);

    display.timeText.setText(`${(remaining / 1000).toFixed(1)}s`);
  }

  private showBuffActivateEffect(type: PowerUpType, config: PowerUpConfig): void {
    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

    const effectText = this.scene.add.text(centerX, centerY, `${config.name}!`, {
      fontSize: '48px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffffff',
      stroke: config.bgColor.toString(16),
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(200);

    this.scene.tweens.add({
      targets: effectText,
      scale: { from: 0.5, to: 1.5 },
      alpha: { from: 0, to: 1 },
      duration: 300,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 500,
      onComplete: () => effectText.destroy(),
    });

    this.scene.cameras.main.flash(300,
      (config.bgColor >> 16) & 255,
      (config.bgColor >> 8) & 255,
      config.bgColor & 255,
      true
    );
  }

  public update(): void {
    const now = this.scene.time.now;
    const buffsToRemove: PowerUpType[] = [];

    this.activeBuffs.forEach((buff, type) => {
      if (now >= buff.endTime) {
        buffsToRemove.push(type);
      } else {
        this.updateBuffDisplay(type);
      }
    });

    buffsToRemove.forEach(type => {
      this.removeBuff(type);
    });
  }

  private removeBuff(type: PowerUpType): void {
    this.activeBuffs.delete(type);

    const display = this.buffDisplays.get(type);
    if (display) {
      this.scene.tweens.add({
        targets: display.container,
        alpha: 0,
        x: 50,
        duration: 300,
        ease: 'Cubic.In',
        onComplete: () => {
          display.container.destroy();
          this.buffDisplays.delete(type);
          this.arrangeBuffDisplays();
        },
      });
    }

    const callback = this.onBuffEndCallbacks.get(type);
    if (callback) {
      callback();
    }
  }

  public clearAll(): void {
    this.activeBuffs.clear();
    this.buffDisplays.forEach(display => {
      display.container.destroy();
    });
    this.buffDisplays.clear();
  }

  public getActiveBuffTypes(): PowerUpType[] {
    return Array.from(this.activeBuffs.keys()).filter(type => this.hasBuff(type));
  }
}
