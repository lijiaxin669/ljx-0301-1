export interface RedPacketConfig {
  type: 'small' | 'medium' | 'large';
  score: number;
  color: number;
  size: number;
  weight: number;
  label: string;
}

export interface GameState {
  score: number;
  totalScore: number;
  lives: number;
  combo: number;
  maxCombo: number;
  timeLeft: number;
  difficulty: number;
  isPaused: boolean;
  currentLevel: number;
  targetScore: number;
  levelScore: number;
  levelMaxCombo: number;
  isLevelComplete: boolean;
}

export interface ScoreRecord {
  score: number;
  date: string;
  maxCombo: number;
  highestLevel: number;
  levelsCompleted: number;
}

export interface LevelResult {
  level: number;
  levelName: string;
  score: number;
  targetScore: number;
  timeLeft: number;
  maxCombo: number;
  passed: boolean;
  isLastLevel: boolean;
}

export interface GameOverData {
  totalScore: number;
  maxCombo: number;
  highestLevel: number;
  levelsCompleted: number;
  reason: 'timeout' | 'lives' | 'complete';
}
