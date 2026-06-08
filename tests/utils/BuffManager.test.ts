import { BuffManager } from '../../src/utils/BuffManager';
import Phaser from 'phaser';

jest.mock('phaser');

describe('BuffManager.addBuff 续期逻辑测试', () => {
  let mockScene: Phaser.Scene;
  let buffManager: BuffManager;

  const createMockScene = (initialTime: number = 10000): Phaser.Scene => {
    return {
      time: {
        now: initialTime,
        delayedCall: jest.fn()
      },
      add: {
        container: jest.fn().mockReturnValue({
          setPosition: jest.fn(),
          add: jest.fn(),
          destroy: jest.fn(),
          alpha: 1,
          x: 0
        }),
        graphics: jest.fn().mockReturnValue({
          fillStyle: jest.fn().mockReturnThis(),
          lineStyle: jest.fn().mockReturnThis(),
          fillRoundedRect: jest.fn().mockReturnThis(),
          strokeRoundedRect: jest.fn().mockReturnThis(),
          clear: jest.fn().mockReturnThis()
        }),
        text: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          setText: jest.fn(),
          setDepth: jest.fn().mockReturnThis(),
          destroy: jest.fn()
        })
      },
      tweens: {
        add: jest.fn()
      },
      cameras: {
        main: {
          flash: jest.fn()
        }
      }
    } as unknown as Phaser.Scene;
  };

  beforeEach(() => {
    mockScene = createMockScene(10000);
    buffManager = new BuffManager(mockScene);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addBuff 同类 Buff 续期 - endTime 取 max', () => {
    test('首次添加 buff，endTime = now + duration', () => {
      buffManager.addBuff('double_score', 8000);

      const remaining = buffManager.getBuffRemainingTime('double_score');
      expect(remaining).toBeCloseTo(8000, -2);
      expect(buffManager.hasBuff('double_score')).toBe(true);
    });

    test('续期时新 duration 更长 → endTime 取 now + newDuration', () => {
      buffManager.addBuff('double_score', 5000);

      mockScene.time.now = 11000;

      buffManager.addBuff('double_score', 8000);

      const remaining = buffManager.getBuffRemainingTime('double_score');
      expect(remaining).toBeCloseTo(8000, -2);
    });

    test('续期时新 duration 更短 → endTime 保持原值（取 max）', () => {
      buffManager.addBuff('double_score', 8000);

      mockScene.time.now = 11000;

      buffManager.addBuff('double_score', 5000);

      const remaining = buffManager.getBuffRemainingTime('double_score');
      expect(remaining).toBeCloseTo(7000, -2);
    });

    test('续期接近结束时 → 取较大值', () => {
      buffManager.addBuff('double_score', 3000);

      mockScene.time.now = 12500;

      buffManager.addBuff('double_score', 2000);

      const remaining = buffManager.getBuffRemainingTime('double_score');
      expect(remaining).toBeCloseTo(2000, -2);
    });

    test('续期时原 buff 刚好结束 → 取新 duration', () => {
      buffManager.addBuff('double_score', 3000);

      mockScene.time.now = 13000;

      buffManager.addBuff('double_score', 5000);

      const remaining = buffManager.getBuffRemainingTime('double_score');
      expect(remaining).toBeCloseTo(5000, -2);
    });

    test('续期时原 buff 已过期 → 视为新 buff', () => {
      buffManager.addBuff('double_score', 3000);

      mockScene.time.now = 14000;

      expect(buffManager.hasBuff('double_score')).toBe(false);

      buffManager.addBuff('double_score', 5000);

      const remaining = buffManager.getBuffRemainingTime('double_score');
      expect(remaining).toBeCloseTo(5000, -2);
      expect(buffManager.hasBuff('double_score')).toBe(true);
    });

    test('不同类型 buff 互不影响', () => {
      buffManager.addBuff('double_score', 8000);
      buffManager.addBuff('slow_motion', 6000);

      expect(buffManager.hasBuff('double_score')).toBe(true);
      expect(buffManager.hasBuff('slow_motion')).toBe(true);
      expect(buffManager.getActiveBuffTypes()).toHaveLength(2);
    });

    test('多次续期叠加验证', () => {
      buffManager.addBuff('double_score', 5000);

      mockScene.time.now = 12000;
      buffManager.addBuff('double_score', 3000);

      mockScene.time.now = 14000;
      buffManager.addBuff('double_score', 4000);

      const remaining = buffManager.getBuffRemainingTime('double_score');
      expect(remaining).toBeCloseTo(4000, -2);
    });
  });

  describe('hasBuff 正确性验证', () => {
    test('buff 有效期内返回 true', () => {
      buffManager.addBuff('shield', 5000);
      expect(buffManager.hasBuff('shield')).toBe(true);
    });

    test('buff 过期后返回 false', () => {
      buffManager.addBuff('shield', 5000);
      mockScene.time.now = 16000;
      expect(buffManager.hasBuff('shield')).toBe(false);
    });

    test('不存在的 buff 返回 false', () => {
      expect(buffManager.hasBuff('double_score')).toBe(false);
    });
  });

  describe('getBuffRemainingTime 正确性验证', () => {
    test('刚添加时返回完整 duration', () => {
      buffManager.addBuff('slow_motion', 6000);
      expect(buffManager.getBuffRemainingTime('slow_motion')).toBeCloseTo(6000, -2);
    });

    test('时间推进后返回正确剩余时间', () => {
      buffManager.addBuff('slow_motion', 6000);
      mockScene.time.now = 13000;
      expect(buffManager.getBuffRemainingTime('slow_motion')).toBeCloseTo(3000, -2);
    });

    test('过期后返回 0', () => {
      buffManager.addBuff('slow_motion', 6000);
      mockScene.time.now = 17000;
      expect(buffManager.getBuffRemainingTime('slow_motion')).toBe(0);
    });

    test('不存在的 buff 返回 0', () => {
      expect(buffManager.getBuffRemainingTime('slow_motion')).toBe(0);
    });
  });

  describe('clearAll 验证', () => {
    test('clearAll 清除所有 buff', () => {
      buffManager.addBuff('double_score', 8000);
      buffManager.addBuff('slow_motion', 6000);
      buffManager.addBuff('shield', 5000);

      expect(buffManager.getActiveBuffTypes()).toHaveLength(3);

      buffManager.clearAll();

      expect(buffManager.getActiveBuffTypes()).toHaveLength(0);
      expect(buffManager.hasBuff('double_score')).toBe(false);
      expect(buffManager.hasBuff('slow_motion')).toBe(false);
      expect(buffManager.hasBuff('shield')).toBe(false);
    });
  });
});
