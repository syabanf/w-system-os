import type { Sprint } from "@/domain/entities/Sprint";

export interface BurndownPoint {
  day: number;
  label: string;
  ideal: number;
  actual: number;
}

export class CalculateBurndown {
  execute(sprint: Sprint): BurndownPoint[] {
    const sprintLength = 10; // working days
    const ideal = sprint.committedPoints;
    const points: BurndownPoint[] = [];
    const dailyProgress = (sprint.completedPoints / sprintLength) * 1.05;

    for (let day = 0; day <= sprintLength; day++) {
      const idealRemaining = ideal - (ideal / sprintLength) * day;
      const actualRemaining = Math.max(0, ideal - dailyProgress * day);
      points.push({
        day,
        label: `D${day}`,
        ideal: Math.round(idealRemaining),
        actual: Math.round(actualRemaining),
      });
    }

    return points;
  }
}
