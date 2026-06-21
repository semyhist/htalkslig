export function calculateBasePoints(
  predictedOutcome: 'home' | 'draw' | 'away',
  actualOutcome: 'home' | 'draw' | 'away',
  odds: number
): number {
  if (predictedOutcome === actualOutcome) {
    return Math.round(odds);
  }
  return 0;
}

interface BasicPrediction {
  id: string;
  predicted_diff: number;
}

export function calculateMarginBonuses(
  predictions: BasicPrediction[],
  actualDiff: number
): Record<string, number> {
  const result: Record<string, number> = {};
  if (predictions.length === 0) return result;

  // Calculate error for each prediction
  const errors = predictions.map(p => ({
    id: p.id,
    error: Math.abs(actualDiff - p.predicted_diff)
  }));

  // Find minimum error
  const minError = Math.min(...errors.map(e => e.error));

  // Award 1 point to closest, 0 to others
  for (const p of predictions) {
    const pError = Math.abs(actualDiff - p.predicted_diff);
    result[p.id] = pError === minError ? 1 : 0;
  }

  return result;
}
