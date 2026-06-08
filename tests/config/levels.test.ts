import { getLevelConfig, LEVELS, getMaxLevel, isLastLevel } from '../../src/config/levels';

describe('getLevelConfig 边界值测试', () => {
  test('getLevelConfig(0) 返回第 1 关配置', () => {
    const config = getLevelConfig(0);
    expect(config).toEqual(LEVELS[0]);
    expect(config.level).toBe(1);
  });

  test('getLevelConfig(-1) 返回第 1 关配置', () => {
    const config = getLevelConfig(-1);
    expect(config).toEqual(LEVELS[0]);
    expect(config.level).toBe(1);
  });

  test('getLevelConfig(999) 返回最后一关配置', () => {
    const config = getLevelConfig(999);
    expect(config).toEqual(LEVELS[LEVELS.length - 1]);
    expect(config.level).toBe(LEVELS.length);
  });

  test('getLevelConfig(1) 到 getLevelConfig(7) 返回对应关卡', () => {
    for (let i = 1; i <= LEVELS.length; i++) {
      expect(getLevelConfig(i).level).toBe(i);
    }
  });

  test('getMaxLevel 返回正确的关卡总数', () => {
    expect(getMaxLevel()).toBe(LEVELS.length);
  });

  test('isLastLevel 正确识别最后一关', () => {
    expect(isLastLevel(LEVELS.length)).toBe(true);
    expect(isLastLevel(LEVELS.length - 1)).toBe(false);
    expect(isLastLevel(1)).toBe(false);
  });
});
