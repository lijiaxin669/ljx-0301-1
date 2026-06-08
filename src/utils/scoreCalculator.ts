import { GAME_CONFIG } from '../config/gameConfig';

export interface ScoreCalcParams {
  baseScore: number;
  scoreMultiplier: number;
  combo: number;
  hasDoubleScore: boolean;
}

export const calculateBaseScore = (
  packetScore: number,
  scoreMultiplier: number
): number => {
  return Math.floor(packetScore * scoreMultiplier);
};

export const calculateTotalScore = (params: ScoreCalcParams): number => {
  const { baseScore, combo, hasDoubleScore } = params;
  const comboBonus = Math.floor(baseScore * combo * GAME_CONFIG.comboBonusMultiplier);
  let totalScore = baseScore + comboBonus;
  if (hasDoubleScore) {
    totalScore *= 2;
  }
  return totalScore;
};
