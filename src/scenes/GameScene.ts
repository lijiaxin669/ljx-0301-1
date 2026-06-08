import Phaser from 'phaser';
import { GAME_CONFIG, RED_PACKET_TYPES, COLORS } from '../config/gameConfig';
import { getLevelConfig, isLastLevel, getMaxLevel } from '../config/levels';
import { shouldSpawnPowerUp, getPowerUpConfig } from '../config/powerups';
import { ScoreManager } from '../utils/ScoreManager';
import { BuffManager } from '../utils/BuffManager';
import { GameState, RedPacketConfig, LevelResult, GameOverData, PowerUpItem, PowerUpConfig } from '../types';
import { LevelConfig } from '../config/levels';
import { PowerUpType } from '../types/powerup';

interface FallingItem extends PowerUpItem {}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private items!: Phaser.Physics.Arcade.Group;
  private gameState!: GameState;
  private levelConfig!: LevelConfig;
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private targetProgressBar!: Phaser.GameObjects.Graphics;
  private targetProgressBg!: Phaser.GameObjects.Graphics;
  private targetText!: Phaser.GameObjects.Text;
  private multiplierText!: Phaser.GameObjects.Text;
  private heartsContainer!: Phaser.GameObjects.Container;
  private gameTimer!: Phaser.Time.TimerEvent;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private comboTimer!: Phaser.Time.TimerEvent | null;
  private lastComboTime!: number;
  private isGameActive!: boolean;
  private pointerActive!: { left: boolean; right: boolean };
  private touchStartX!: number;
  private totalScore!: number;
  private totalMaxCombo!: number;
  private levelsCompleted!: number;
  private startLevel!: number;
  private buffManager!: BuffManager;
  private shieldEffect!: Phaser.GameObjects.Graphics | null;
  private slowMotionEffect!: Phaser.GameObjects.Graphics | null;
  private doubleScoreEffect!: Phaser.GameObjects.Text | null;

  constructor() {
    super('GameScene');
  }

  init(data: { startLevel?: number; totalScore?: number; totalMaxCombo?: number; levelsCompleted?: number }): void {
    this.startLevel = data?.startLevel || 1;
    this.totalScore = data?.totalScore || 0;
    this.totalMaxCombo = data?.totalMaxCombo || 0;
    this.levelsCompleted = data?.levelsCompleted || 0;

    this.levelConfig = getLevelConfig(this.startLevel);

    this.gameState = {
      score: 0,
      totalScore: this.totalScore,
      lives: GAME_CONFIG.maxLives,
      combo: 0,
      maxCombo: 0,
      timeLeft: this.levelConfig.duration,
      difficulty: 0,
      isPaused: false,
      currentLevel: this.startLevel,
      targetScore: this.levelConfig.targetScore,
      levelScore: 0,
      levelMaxCombo: 0,
      isLevelComplete: false,
    };

    this.comboTimer = null;
    this.lastComboTime = 0;
    this.isGameActive = true;
    this.pointerActive = { left: false, right: false };
    this.shieldEffect = null;
    this.slowMotionEffect = null;
    this.doubleScoreEffect = null;
  }

  create(): void {
    this.addBackground();
    this.createPlayer();
    this.createBuffManager();
    this.createUI();
    this.createFallingItems();
    this.setupCollisions();
    this.setupInput();
    this.setupBuffCallbacks();
    this.startGameLoop();
    this.showLevelStart();
  }

  private showLevelStart(): void {
    const centerX = GAME_CONFIG.width / 2;
    const centerY = GAME_CONFIG.height / 2;

    const overlay = this.add.rectangle(0, 0, GAME_CONFIG.width, GAME_CONFIG.height, 0x000000, 0.7)
      .setOrigin(0, 0).setDepth(100);

    const levelBadge = this.add.text(centerX, centerY - 60, `第 ${this.gameState.currentLevel} 关`, {
      fontSize: '48px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(101);

    const levelName = this.add.text(centerX, centerY, this.levelConfig.name, {
      fontSize: '36px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(101);

    const levelDesc = this.add.text(centerX, centerY + 50, this.levelConfig.description, {
      fontSize: '20px',
      fontFamily: 'Microsoft YaHei',
      color: '#cccccc',
    }).setOrigin(0.5).setDepth(101);

    const targetInfo = this.add.text(centerX, centerY + 90,
      `目标: ${this.levelConfig.targetScore}分 | 时限: ${this.levelConfig.duration}秒 | 倍率: x${this.levelConfig.difficulty.scoreMultiplier}`, {
      fontSize: '18px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffcc00',
    }).setOrigin(0.5).setDepth(101);

    const elements = [overlay, levelBadge, levelName, levelDesc, targetInfo];

    this.tweens.add({
      targets: [levelBadge, levelName, levelDesc, targetInfo],
      scale: { from: 0.5, to: 1 },
      alpha: { from: 0, to: 1 },
      duration: 500,
      ease: 'Back.easeOut',
    });

    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: elements,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          elements.forEach(e => e.destroy());
        },
      });
    }, [], this);
  }

  private addBackground(): void {
    this.add.rectangle(0, 0, GAME_CONFIG.width, GAME_CONFIG.height, 0x3d2317).setOrigin(0, 0);

    const graphics = this.add.graphics();
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, GAME_CONFIG.width);
      const y = Phaser.Math.Between(0, GAME_CONFIG.height);
      const size = Phaser.Math.Between(2, 6);
      graphics.fillStyle(0x4a2c1f, 0.4);
      graphics.fillCircle(x, y, size);
    }
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height - 80,
      'player'
    );
    this.player.setScale(0.9);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.setImmovable(true);
  }

  private createUI(): void {
    const uiY = 15;

    this.levelText = this.add.text(20, uiY, `第${this.gameState.currentLevel}关`, {
      fontSize: '22px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0, 0);

    this.multiplierText = this.add.text(20, uiY + 30, `x${this.levelConfig.difficulty.scoreMultiplier}`, {
      fontSize: '16px',
      fontFamily: 'Microsoft YaHei',
      color: '#44ff44',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0);

    this.scoreText = this.add.text(GAME_CONFIG.width / 2, uiY, `本关: 0`, {
      fontSize: '24px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0);

    this.timeText = this.add.text(GAME_CONFIG.width - 20, uiY, `${this.gameState.timeLeft}s`, {
      fontSize: '24px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0);

    this.comboText = this.add.text(GAME_CONFIG.width / 2, uiY + 35, '', {
      fontSize: '26px',
      fontFamily: 'Microsoft YaHei',
      color: '#ff6b6b',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0);

    const progressY = uiY + 75;
    const progressWidth = GAME_CONFIG.width - 40;
    const progressHeight = 16;

    this.targetProgressBg = this.add.graphics();
    this.targetProgressBg.fillStyle(0x2a1810, 0.8);
    this.targetProgressBg.fillRoundedRect(20, progressY, progressWidth, progressHeight, 8);

    this.targetProgressBar = this.add.graphics();

    this.targetText = this.add.text(GAME_CONFIG.width / 2, progressY + progressHeight / 2,
      `目标: ${this.gameState.targetScore}`, {
      fontSize: '14px',
      fontFamily: 'Microsoft YaHei',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0.5);

    this.heartsContainer = this.add.container(20, progressY + progressHeight + 15);
    this.updateHearts();

    this.updateProgressBar();
  }

  private updateProgressBar(): void {
    const progressY = 90;
    const progressWidth = GAME_CONFIG.width - 40;
    const progressHeight = 16;
    const progress = Math.min(this.gameState.levelScore / this.gameState.targetScore, 1);
    const barWidth = progressWidth * progress;

    this.targetProgressBar.clear();
    const color = progress >= 1 ? 0x44ff44 : (progress >= 0.7 ? 0xffd700 : 0xff6b6b);
    this.targetProgressBar.fillStyle(color, 1);
    this.targetProgressBar.fillRoundedRect(22, progressY + 2, Math.max(barWidth - 4, 0), progressHeight - 4, 6);

    this.targetText.setText(`目标: ${this.gameState.levelScore} / ${this.gameState.targetScore}`);

    if (progress >= 1 && !this.gameState.isLevelComplete) {
      this.gameState.isLevelComplete = true;
      this.handleLevelComplete();
    }
  }

  private updateHearts(): void {
    this.heartsContainer.removeAll(true);
    for (let i = 0; i < this.gameState.lives; i++) {
      const heart = this.add.image(i * 35, 0, 'heart');
      heart.setScale(0.9);
      this.heartsContainer.add(heart);
    }
  }

  private createFallingItems(): void {
    this.items = this.physics.add.group({
      defaultKey: 'packet_small',
      maxSize: 30,
    });
  }

  private setupCollisions(): void {
    this.physics.add.overlap(
      this.player,
      this.items,
      (obj1, obj2) => this.handleCollision(obj1 as Phaser.GameObjects.GameObject, obj2 as Phaser.GameObjects.GameObject),
      undefined,
      this
    );
  }

  private setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keyA = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isGameActive) return;
      this.touchStartX = pointer.x;
      if (pointer.x < GAME_CONFIG.width / 2) {
        this.pointerActive.left = true;
        this.pointerActive.right = false;
      } else {
        this.pointerActive.right = true;
        this.pointerActive.left = false;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isGameActive) return;
      if (pointer.isDown) {
        const deltaX = pointer.x - this.touchStartX;
        if (Math.abs(deltaX) > 10) {
          this.pointerActive.left = deltaX < 0;
          this.pointerActive.right = deltaX > 0;
          this.touchStartX = pointer.x;
        }
      }
    });

    this.input.on('pointerup', () => {
      this.pointerActive.left = false;
      this.pointerActive.right = false;
    });

    this.input.on('pointerupoutside', () => {
      this.pointerActive.left = false;
      this.pointerActive.right = false;
    });
  }

  private startGameLoop(): void {
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateGameTime,
      callbackScope: this,
      loop: true,
    });

    this.scheduleNextSpawn();
  }

  private getCurrentDifficulty(): number {
    const levelProgress = 1 - this.gameState.timeLeft / this.levelConfig.duration;
    return Math.min(levelProgress, 1);
  }

  private scheduleNextSpawn(): void {
    if (!this.isGameActive) return;

    const difficulty = this.getCurrentDifficulty();
    this.gameState.difficulty = difficulty;

    const diff = this.levelConfig.difficulty;
    const spawnInterval = Phaser.Math.Linear(
      diff.spawnInterval.max,
      diff.spawnInterval.min,
      difficulty
    );

    this.spawnTimer = this.time.delayedCall(
      spawnInterval, this.spawnItem, [], this);
  }

  private spawnItem(): void {
    if (!this.isGameActive) return;

    const difficulty = this.getCurrentDifficulty();
    const diff = this.levelConfig.difficulty;
    const bombChance = Phaser.Math.Linear(
      diff.bombChance.min,
      diff.bombChance.max,
      difficulty
    );

    const powerUpConfig = shouldSpawnPowerUp();
    const isBomb = !powerUpConfig && Math.random() < bombChance;

    let item: FallingItem;
    item = this.items.get(
      Phaser.Math.Between(40, GAME_CONFIG.width - 40),
      -50
    ) as FallingItem;

    if (!item) {
      this.scheduleNextSpawn();
      return;
    }

    item.powerUpType = undefined;
    item.powerUpConfig = undefined;

    if (powerUpConfig) {
      item.setTexture(`powerup_${powerUpConfig.type}`);
      item.itemType = 'powerup';
      item.powerUpType = powerUpConfig.type;
      item.powerUpConfig = powerUpConfig;
      item.packetConfig = undefined;
      item.baseScore = undefined;
    } else if (isBomb) {
      item.setTexture('bomb');
      item.itemType = 'bomb';
      item.packetConfig = undefined;
      item.baseScore = undefined;
    } else {
      const packetType = this.selectRedPacketType();
      item.setTexture(`packet_${packetType.type}`);
      item.itemType = 'redpacket';
      item.packetConfig = packetType;
      item.baseScore = Math.floor(packetType.score * this.levelConfig.difficulty.scoreMultiplier);
    }

    item.setActive(true);
    item.setVisible(true);
    item.setAngle(0);
    if (item.body) {
      item.body.reset(item.x, item.y);
      item.body.enable = true;
    }
    item.setScale(1);

    let fallSpeed = Phaser.Math.Linear(
      diff.fallSpeed.min,
      diff.fallSpeed.max,
      difficulty
    ) * Phaser.Math.FloatBetween(0.85, 1.15);

    if (this.buffManager.hasBuff('slow_motion')) {
      fallSpeed *= 0.45;
    }

    item.setVelocityY(fallSpeed);
    item.setVelocityX(Phaser.Math.FloatBetween(-30, 30));
    item.setAngularVelocity(Phaser.Math.FloatBetween(-50, 50));

    this.scheduleNextSpawn();
  }

  private selectRedPacketType(): RedPacketConfig {
    const totalWeight = RED_PACKET_TYPES.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;
    for (const packet of RED_PACKET_TYPES) {
      random -= packet.weight;
      if (random <= 0) {
        return packet;
      }
    }
    return RED_PACKET_TYPES[0];
  }

  private handleCollision(
    _player: Phaser.GameObjects.GameObject,
    item: Phaser.GameObjects.GameObject
  ): void {
    const fallingItem = item as FallingItem;
    if (!fallingItem.active) return;

    if (fallingItem.itemType === 'redpacket') {
      this.collectRedPacket(fallingItem);
    } else if (fallingItem.itemType === 'bomb') {
      this.hitBomb(fallingItem);
    } else if (fallingItem.itemType === 'powerup') {
      this.collectPowerUp(fallingItem);
    }

    fallingItem.setActive(false);
    fallingItem.setVisible(false);
    const body = fallingItem.body as Phaser.Physics.Arcade.Body | null;
    if (body) {
      body.stop();
    }
  }

  private collectRedPacket(item: FallingItem): void {
    const now = this.time.now;

    if (now - this.lastComboTime < GAME_CONFIG.comboTimeout) {
      this.gameState.combo++;
    } else {
      this.gameState.combo = 1;
    }
    this.lastComboTime = now;

    if (this.gameState.combo > this.gameState.maxCombo) {
      this.gameState.maxCombo = this.gameState.combo;
    }
    if (this.gameState.combo > this.gameState.levelMaxCombo) {
      this.gameState.levelMaxCombo = this.gameState.combo;
    }

    const baseScore = item.baseScore || 10;
    const comboBonus = Math.floor(baseScore * this.gameState.combo * GAME_CONFIG.comboBonusMultiplier);
    let totalScore = baseScore + comboBonus;

    if (this.buffManager.hasBuff('double_score')) {
      totalScore *= 2;
    }

    this.gameState.levelScore += totalScore;
    this.gameState.totalScore += totalScore;

    this.updateScore();
    this.updateProgressBar();
    this.showCombo();
    this.showScorePopup(item.x, item.y, totalScore,
      this.buffManager.hasBuff('double_score'));

    this.cameras.main.shake(100, 0.005);

    this.resetComboTimer();

    const color = item.packetConfig?.color || 0xff4444;
    this.add.particles(item.x, item.y, 'particle', {
      speedY: { min: 50, max: 150 },
      speedX: { min: -100, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      lifespan: 400,
      quantity: 10,
      tint: color,
    });
  }

  private hitBomb(item: FallingItem): void {
    if (this.buffManager.hasBuff('shield')) {
      this.cameras.main.shake(150, 0.01);
      this.add.particles(item.x, item.y, 'particle', {
        speedY: { min: 80, max: 150 },
        speedX: { min: -100, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.6, end: 0 },
        lifespan: 500,
        quantity: 15,
        tint: 0x2ecc71,
      });
      const shieldText = this.add.text(item.x, item.y - 20, '护盾抵挡!', {
        fontSize: '18px',
        fontFamily: 'Microsoft YaHei',
        color: '#2ecc71',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
      this.tweens.add({
        targets: shieldText,
        y: shieldText.y - 30,
        alpha: { from: 1, to: 0 },
        duration: 800,
        onComplete: () => shieldText.destroy(),
      });
      return;
    }

    this.gameState.lives--;
    this.gameState.combo = 0;
    this.updateHearts();
    this.updateComboDisplay();

    this.cameras.main.shake(300, 0.03);
    this.cameras.main.flash(200, 255, 0, 0);

    this.add.particles(item.x, item.y, 'particle', {
      speedY: { min: 100, max: 200 },
      speedX: { min: -150, max: 150 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      lifespan: 500,
      quantity: 20,
      tint: 0xff4444,
    });

    if (this.gameState.lives <= 0) {
      this.endGame('lives');
    }
  }

  private handleLevelComplete(): void {
    this.isGameActive = false;
    this.clearTimers();
    this.stopAllItems();

    const levelResult: LevelResult = {
      level: this.gameState.currentLevel,
      levelName: this.levelConfig.name,
      score: this.gameState.levelScore,
      targetScore: this.gameState.targetScore,
      timeLeft: this.gameState.timeLeft,
      maxCombo: this.gameState.levelMaxCombo,
      passed: true,
      isLastLevel: isLastLevel(this.gameState.currentLevel),
    };

    const newTotalMaxCombo = Math.max(this.totalMaxCombo, this.gameState.maxCombo);

    if (levelResult.isLastLevel) {
      this.time.delayedCall(800, () => {
        this.scene.start('LevelCompleteScene', {
          ...levelResult,
          totalScore: this.gameState.totalScore,
          totalMaxCombo: newTotalMaxCombo,
          levelsCompleted: this.levelsCompleted + 1,
        });
      }, [], this);
    } else {
      this.time.delayedCall(800, () => {
        this.scene.start('LevelCompleteScene', {
          ...levelResult,
          totalScore: this.gameState.totalScore,
          totalMaxCombo: newTotalMaxCombo,
          levelsCompleted: this.levelsCompleted + 1,
        });
      }, [], this);
    }
  }

  private showCombo(): void {
    if (this.gameState.combo >= GAME_CONFIG.comboDisplayThreshold) {
      this.tweens.add({
        targets: this.player,
        scale: { from: 1, to: 1.15 },
        duration: 150,
        yoyo: true,
        ease: 'Back.easeOut',
      });
    }
    this.updateComboDisplay();
  }

  private updateComboDisplay(): void {
    if (this.gameState.combo >= GAME_CONFIG.comboDisplayThreshold) {
      this.comboText.setText(`${this.gameState.combo} 连击!`);
      this.comboText.setAlpha(1);

      this.tweens.add({
        targets: this.comboText,
        scale: { from: 1.2, to: 1 },
        duration: 200,
        ease: 'Back.easeOut',
      });
    } else {
      this.comboText.setText('');
    }
  }

  private resetComboTimer(): void {
    if (this.comboTimer) {
      this.comboTimer.remove();
    }
    this.comboTimer = this.time.delayedCall(
      GAME_CONFIG.comboTimeout,
      () => {
        this.gameState.combo = 0;
        this.updateComboDisplay();
      },
      [],
      this
    );
  }

  private showScorePopup(x: number, y: number, score: number, isDouble: boolean = false): void {
    const text = isDouble ? `+${score} x2!` : `+${score}`;
    const color = isDouble ? '#9b59b6' : '#ffd700';
    const fontSize = isDouble ? '28px' : '24px';

    const popup = this.add.text(x, y, text, {
      fontSize,
      fontFamily: 'Microsoft YaHei',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    if (isDouble) {
      this.tweens.add({
        targets: popup,
        scale: { from: 0.5, to: 1.3 },
        duration: 200,
        ease: 'Back.easeOut',
        yoyo: true,
      });
    }

    this.tweens.add({
      targets: popup,
      y: y - 50,
      alpha: { from: 1, to: 0 },
      scale: { from: 1, to: 1.5 },
      duration: 800,
      ease: 'Cubic.Out',
      onComplete: () => popup.destroy(),
    });
  }

  private updateScore(): void {
    this.scoreText.setText(`本关: ${this.gameState.levelScore}`);
    this.tweens.add({
      targets: this.scoreText,
      scale: { from: 1.1, to: 1 },
      duration: 150,
      ease: 'Back.easeOut',
    });
  }

  private updateGameTime(): void {
    if (!this.isGameActive) return;

    this.gameState.timeLeft--;
    this.timeText.setText(`${this.gameState.timeLeft}s`);

    if (this.gameState.timeLeft <= 10) {
      this.timeText.setColor('#ff4444');
      if (!this.timeText.getData('isTweening')) {
        this.timeText.setData('isTweening', true);
        this.tweens.add({
          targets: this.timeText,
          scale: { from: 1.1, to: 1 },
          duration: 200,
          yoyo: true,
          repeat: -1,
        });
      }
    }

    if (this.gameState.timeLeft <= 0) {
      if (this.gameState.levelScore >= this.gameState.targetScore) {
        this.handleLevelComplete();
      } else {
        this.endGame('timeout');
      }
    }
  }

  update(): void {
    if (!this.isGameActive) return;

    let velocityX = 0;

    if (this.cursors.left.isDown || this.keyA.isDown || this.pointerActive.left) {
      velocityX = -GAME_CONFIG.playerSpeed * 60;
    } else if (this.cursors.right.isDown || this.keyD.isDown || this.pointerActive.right) {
      velocityX = GAME_CONFIG.playerSpeed * 60;
    }

    this.player.setVelocityX(velocityX);

    if (velocityX < 0) {
      this.player.setAngle(-8);
    } else if (velocityX > 0) {
      this.player.setAngle(8);
    } else {
      this.player.setAngle(0);
    }

    this.children.each((child) => {
      const item = child as FallingItem;
      if (item.active && item.y > GAME_CONFIG.height + 100) {
        item.setActive(false);
        item.setVisible(false);
        if (item.body) {
          item.body.stop();
        }
      }
      return null;
    });

    this.buffManager.update();
    this.updateShieldEffect();
  }

  private createBuffManager(): void {
    this.buffManager = new BuffManager(this);
  }

  private setupBuffCallbacks(): void {
    this.buffManager.onBuffStart('shield', () => {
      this.createShieldEffect();
    });
    this.buffManager.onBuffEnd('shield', () => {
      this.removeShieldEffect();
    });

    this.buffManager.onBuffStart('slow_motion', () => {
      this.createSlowMotionEffect();
    });
    this.buffManager.onBuffEnd('slow_motion', () => {
      this.removeSlowMotionEffect();
      this.updateAllItemSpeeds();
    });

    this.buffManager.onBuffStart('double_score', () => {
      this.createDoubleScoreEffect();
    });
    this.buffManager.onBuffEnd('double_score', () => {
      this.removeDoubleScoreEffect();
    });
  }

  private collectPowerUp(item: FallingItem): void {
    if (!item.powerUpType || !item.powerUpConfig) return;

    this.buffManager.addBuff(item.powerUpType, item.powerUpConfig.duration);

    this.add.particles(item.x, item.y, 'particle', {
      speedY: { min: 50, max: 150 },
      speedX: { min: -100, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.7, end: 0 },
      lifespan: 500,
      quantity: 20,
      tint: item.powerUpConfig.color,
    });

    this.lastComboTime = this.time.now;
  }

  private createShieldEffect(): void {
    if (this.shieldEffect) {
      this.shieldEffect.destroy();
    }

    this.shieldEffect = this.add.graphics();
    this.shieldEffect.setDepth(15);

    this.updateShieldEffect();

    this.tweens.add({
      targets: this.player,
      scale: { from: 0.9, to: 1.05 },
      duration: 300,
      ease: 'Back.easeOut',
      yoyo: true,
      repeat: -1,
      hold: 500,
    });
  }

  private updateShieldEffect(): void {
    if (!this.shieldEffect || !this.buffManager.hasBuff('shield')) return;

    this.shieldEffect.clear();
    const radius = 55 + Math.sin(this.time.now * 0.005) * 5;
    const alpha = 0.3 + Math.sin(this.time.now * 0.008) * 0.15;

    this.shieldEffect.lineStyle(3, 0x2ecc71, alpha + 0.3);
    this.shieldEffect.fillStyle(0x2ecc71, alpha);
    this.shieldEffect.beginPath();
    this.shieldEffect.arc(this.player.x, this.player.y, radius, 0, Math.PI * 2);
    this.shieldEffect.strokePath();
    this.shieldEffect.fillPath();

    for (let i = 0; i < 3; i++) {
      const angle = (this.time.now * 0.002 + i * 2.094) % (Math.PI * 2);
      const dotX = this.player.x + Math.cos(angle) * radius;
      const dotY = this.player.y + Math.sin(angle) * radius;
      this.shieldEffect.fillStyle(0xffffff, 0.8);
      this.shieldEffect.beginPath();
      this.shieldEffect.arc(dotX, dotY, 4, 0, Math.PI * 2);
      this.shieldEffect.fillPath();
    }
  }

  private removeShieldEffect(): void {
    if (this.shieldEffect) {
      this.tweens.add({
        targets: this.shieldEffect,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          if (this.shieldEffect) {
            this.shieldEffect.destroy();
            this.shieldEffect = null;
          }
        },
      });
    }
    this.player.setScale(0.9);
  }

  private createSlowMotionEffect(): void {
    if (this.slowMotionEffect) {
      this.slowMotionEffect.destroy();
    }

    this.slowMotionEffect = this.add.graphics();
    this.slowMotionEffect.setDepth(5);
    this.slowMotionEffect.fillStyle(0x3498db, 0.12);
    this.slowMotionEffect.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    this.updateAllItemSpeeds();

    const slowText = this.add.text(GAME_CONFIG.width / 2, 250, '⏱ 时间减缓 ⏱', {
      fontSize: '32px',
      fontFamily: 'Microsoft YaHei',
      color: '#3498db',
      stroke: '#ffffff',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: slowText,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.5, to: 1.2 },
      duration: 400,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 200,
      onComplete: () => slowText.destroy(),
    });
  }

  private removeSlowMotionEffect(): void {
    if (this.slowMotionEffect) {
      this.tweens.add({
        targets: this.slowMotionEffect,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          if (this.slowMotionEffect) {
            this.slowMotionEffect.destroy();
            this.slowMotionEffect = null;
          }
        },
      });
    }
  }

  private updateAllItemSpeeds(): void {
    const difficulty = this.getCurrentDifficulty();
    const diff = this.levelConfig.difficulty;
    const baseSpeed = Phaser.Math.Linear(
      diff.fallSpeed.min,
      diff.fallSpeed.max,
      difficulty
    );

    this.items.children.each((child) => {
      const item = child as FallingItem;
      if (item.active && item.body) {
        let speed = baseSpeed * Phaser.Math.FloatBetween(0.85, 1.15);
        if (this.buffManager.hasBuff('slow_motion')) {
          speed *= 0.45;
        }
        item.setVelocityY(speed);
      }
      return null;
    });
  }

  private createDoubleScoreEffect(): void {
    if (this.doubleScoreEffect) {
      this.doubleScoreEffect.destroy();
    }

    this.doubleScoreEffect = this.add.text(GAME_CONFIG.width / 2, 70, 'x2 双倍得分!', {
      fontSize: '24px',
      fontFamily: 'Microsoft YaHei',
      color: '#9b59b6',
      stroke: '#ffffff',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(50);

    this.tweens.add({
      targets: this.doubleScoreEffect,
      scale: { from: 0.8, to: 1.1 },
      duration: 500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  private removeDoubleScoreEffect(): void {
    if (this.doubleScoreEffect) {
      this.tweens.add({
        targets: this.doubleScoreEffect,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        onComplete: () => {
          if (this.doubleScoreEffect) {
            this.doubleScoreEffect.destroy();
            this.doubleScoreEffect = null;
          }
        },
      });
    }
  }

  private clearTimers(): void {
    if (this.gameTimer) this.gameTimer.remove();
    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.comboTimer) this.comboTimer.remove();
    if (this.buffManager) this.buffManager.clearAll();
  }

  private stopAllItems(): void {
    this.items.children.each((child) => {
      const item = child as FallingItem;
      if (item.body) {
        item.body.stop();
      }
      return null;
    });
  }

  private endGame(reason: 'timeout' | 'lives'): void {
    this.isGameActive = false;
    this.clearTimers();
    this.stopAllItems();

    const gameOverData: GameOverData = {
      totalScore: this.gameState.totalScore,
      maxCombo: Math.max(this.totalMaxCombo, this.gameState.maxCombo),
      highestLevel: this.gameState.currentLevel,
      levelsCompleted: this.levelsCompleted,
      reason,
    };

    ScoreManager.saveScore(gameOverData);

    this.time.delayedCall(500, () => {
      this.scene.start('GameOverScene', gameOverData);
    }, [], this);
  }
}
