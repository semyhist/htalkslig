import { describe, it, expect } from 'vitest';
import { calculateBasePoints, calculateMarginBonuses } from './scoring';

describe('Scoring Logic Tests', () => {
  describe('calculateBasePoints', () => {
    it('should return Math.round(odds) for correct predictions', () => {
      expect(calculateBasePoints('home', 'home', 1.85)).toBe(2);
      expect(calculateBasePoints('draw', 'draw', 3.44)).toBe(3);
      expect(calculateBasePoints('away', 'away', 4.10)).toBe(4);
    });

    it('should return 0 for incorrect predictions', () => {
      expect(calculateBasePoints('home', 'draw', 1.85)).toBe(0);
      expect(calculateBasePoints('away', 'home', 4.10)).toBe(0);
    });
  });

  describe('calculateMarginBonuses', () => {
    it('should assign 1 bonus point to prediction(s) with the minimum absolute margin error', () => {
      const predictions = [
        { id: '1', predicted_diff: 2 },  // Error: |2 - 2| = 0
        { id: '2', predicted_diff: 1 },  // Error: |2 - 1| = 1
        { id: '3', predicted_diff: -1 }, // Error: |2 - (-1)| = 3
      ];
      const actualDiff = 2; // Home won by 2 goals
      const bonuses = calculateMarginBonuses(predictions, actualDiff);
      expect(bonuses['1']).toBe(1);
      expect(bonuses['2']).toBe(0);
      expect(bonuses['3']).toBe(0);
    });

    it('should share bonus points if multiple predictions are equally close', () => {
      const predictions = [
        { id: '1', predicted_diff: 1 },  // Error: |2 - 1| = 1
        { id: '2', predicted_diff: 3 },  // Error: |2 - 3| = 1
        { id: '3', predicted_diff: -2 }, // Error: |2 - (-2)| = 4
      ];
      const actualDiff = 2;
      const bonuses = calculateMarginBonuses(predictions, actualDiff);
      expect(bonuses['1']).toBe(1);
      expect(bonuses['2']).toBe(1);
      expect(bonuses['3']).toBe(0);
    });
  });
});
