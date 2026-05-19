export type Percentage = number; // 0..100

export function clampPercentage(value: number): Percentage {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value * 10) / 10;
}
