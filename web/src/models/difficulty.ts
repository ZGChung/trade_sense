export type Difficulty = 'easy' | 'medium' | 'hard';

export function getDifficulty(actualPerformance: number): Difficulty {
  const abs = Math.abs(actualPerformance);
  if (abs >= 0.08) return 'easy';
  if (abs >= 0.03) return 'medium';
  return 'hard';
}

export function getDifficultyLabel(difficulty: Difficulty): string {
  const labels: Record<Difficulty, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };
  return labels[difficulty];
}

export function getDifficultyColor(difficulty: Difficulty): string {
  const colors: Record<Difficulty, string> = {
    easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[difficulty];
}
