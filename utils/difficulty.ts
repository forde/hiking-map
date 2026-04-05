export type TerrainType = 'paved' | 'trail' | 'scramble';

export type Difficulty = 'easy' | 'moderate' | 'hard' | 'demanding';

const TERRAIN_MULTIPLIER: Record<TerrainType, number> = {
  paved: 1.0,
  trail: 1.15,
  scramble: 1.4,
};

export function calculateDifficulty(
  distanceKm: number,
  elevationGainM: number,
  terrain: TerrainType = 'trail',
): { timeMin: number; difficulty: Difficulty } {
  const baseTimeH = distanceKm / 4 + elevationGainM / 600;
  const timeMin = Math.round(baseTimeH * TERRAIN_MULTIPLIER[terrain] * 60);

  const score = distanceKm + elevationGainM / 100;
  const difficulty: Difficulty =
    score < 8 ? 'easy' : score < 16 ? 'moderate' : score < 28 ? 'hard' : 'demanding';

  return { timeMin, difficulty };
}
