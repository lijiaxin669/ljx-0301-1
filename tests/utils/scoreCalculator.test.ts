import { calculateBaseScore, calculateTotalScore } from '../../src/utils/scoreCalculator';
import { GAME_CONFIG } from '../../src/config/gameConfig';

describe('得分公式测试', () => {
  const comboBonusMultiplier = GAME_CONFIG.comboBonusMultiplier;

  describe('calculateBaseScore - 基础分 × 关卡倍率', () => {
    test('小红包(10分) × 第1关倍率(1.0) = 10', () => {
      expect(calculateBaseScore(10, 1.0)).toBe(10);
    });

    test('中红包(30分) × 第3关倍率(1.2) = Math.floor(36) = 36', () => {
      expect(calculateBaseScore(30, 1.2)).toBe(36);
    });

    test('大红包(100分) × 第7关倍率(2.0) = Math.floor(200) = 200', () => {
      expect(calculateBaseScore(100, 2.0)).toBe(200);
    });

    test('非整数结果向下取整：10 × 1.1 = 11', () => {
      expect(calculateBaseScore(10, 1.1)).toBe(11);
    });

    test('非整数结果向下取整：10 × 1.15 = Math.floor(11.5) = 11', () => {
      expect(calculateBaseScore(10, 1.15)).toBe(11);
    });

    test('非整数结果向下取整：30 × 1.15 = Math.floor(34.5) = 34', () => {
      expect(calculateBaseScore(30, 1.15)).toBe(34);
    });
  });

  describe('calculateTotalScore - 叠加顺序与取整', () => {
    test('无连击、无buff：base=10, combo=1 → 10 + Math.floor(10*1*0.1) = 11', () => {
      expect(calculateTotalScore({
        baseScore: 10,
        scoreMultiplier: 1.0,
        combo: 1,
        hasDoubleScore: false
      })).toBe(11);
    });

    test('连击加成取整：base=10, combo=3 → 10 + Math.floor(10*3*0.1) = 10 + 3 = 13', () => {
      expect(calculateTotalScore({
        baseScore: 10,
        scoreMultiplier: 1.0,
        combo: 3,
        hasDoubleScore: false
      })).toBe(13);
    });

    test('连击加成取整：base=10, combo=4 → 10 + Math.floor(10*4*0.1) = 10 + 4 = 14', () => {
      expect(calculateTotalScore({
        baseScore: 10,
        scoreMultiplier: 1.0,
        combo: 4,
        hasDoubleScore: false
      })).toBe(14);
    });

    test('双倍得分：base=10, combo=1, 有buff → (10 + 1) × 2 = 22', () => {
      expect(calculateTotalScore({
        baseScore: 10,
        scoreMultiplier: 1.0,
        combo: 1,
        hasDoubleScore: true
      })).toBe(22);
    });

    test('完整叠加：base=36(30×1.2), combo=5, 有buff → (36 + Math.floor(36*5*0.1)) × 2 = (36+18)×2 = 108', () => {
      expect(calculateTotalScore({
        baseScore: 36,
        scoreMultiplier: 1.2,
        combo: 5,
        hasDoubleScore: true
      })).toBe(108);
    });

    test('连击加成非整数向下取整：base=11, combo=2 → 11 + Math.floor(11*2*0.1) = 11 + 2 = 13', () => {
      expect(calculateTotalScore({
        baseScore: 11,
        scoreMultiplier: 1.0,
        combo: 2,
        hasDoubleScore: false
      })).toBe(13);
    });

    test('高连击场景：base=36, combo=10, 无buff → 36 + Math.floor(36*10*0.1) = 36 + 36 = 72', () => {
      expect(calculateTotalScore({
        baseScore: 36,
        scoreMultiplier: 1.2,
        combo: 10,
        hasDoubleScore: false
      })).toBe(72);
    });

    test('高连击+双倍buff：base=36, combo=10, 有buff → (36 + 36) × 2 = 144', () => {
      expect(calculateTotalScore({
        baseScore: 36,
        scoreMultiplier: 1.2,
        combo: 10,
        hasDoubleScore: true
      })).toBe(144);
    });

    test('combo=0 边界：base=10, combo=0 → 10 + Math.floor(10*0*0.1) = 10 + 0 = 10', () => {
      expect(calculateTotalScore({
        baseScore: 10,
        scoreMultiplier: 1.0,
        combo: 0,
        hasDoubleScore: false
      })).toBe(10);
    });
  });

  describe('叠加顺序验证', () => {
    test('顺序验证：先关卡倍率取整 → 再加成 → 最后双倍', () => {
      const packetScore = 30;
      const scoreMultiplier = 1.2;
      const combo = 5;
      const hasDoubleScore = true;

      const baseScore = calculateBaseScore(packetScore, scoreMultiplier);
      expect(baseScore).toBe(36);

      const totalScore = calculateTotalScore({
        baseScore,
        scoreMultiplier,
        combo,
        hasDoubleScore
      });

      const comboBonus = Math.floor(baseScore * combo * comboBonusMultiplier);
      const expectedTotal = (baseScore + comboBonus) * (hasDoubleScore ? 2 : 1);
      expect(totalScore).toBe(expectedTotal);
      expect(totalScore).toBe(108);
    });
  });
});
