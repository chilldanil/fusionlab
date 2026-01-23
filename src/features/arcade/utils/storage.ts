/**
 * Fusion Lab Arcade - Storage Utilities
 * LocalStorage management for high scores
 */

import type { GameScore } from '../types';

const STORAGE_PREFIX = 'fusionlab_arcade_';

export const storage = {
  /**
   * Get high score for a specific game
   */
  getHighScore(gameId: string): number {
    const key = `${STORAGE_PREFIX}${gameId}_highscore`;
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) : 0;
  },

  /**
   * Set high score for a specific game
   */
  setHighScore(gameId: string, score: number): void {
    const key = `${STORAGE_PREFIX}${gameId}_highscore`;
    const currentHigh = this.getHighScore(gameId);

    if (score > currentHigh) {
      localStorage.setItem(key, score.toString());
      localStorage.setItem(`${key}_date`, new Date().toISOString());
    }
  },

  /**
   * Get complete game score data
   */
  getGameScore(gameId: string, currentScore: number = 0): GameScore {
    return {
      current: currentScore,
      high: this.getHighScore(gameId),
      lastUpdated: this.getLastUpdated(gameId),
    };
  },

  /**
   * Get last updated date for high score
   */
  getLastUpdated(gameId: string): Date | undefined {
    const key = `${STORAGE_PREFIX}${gameId}_highscore_date`;
    const stored = localStorage.getItem(key);
    return stored ? new Date(stored) : undefined;
  },

  /**
   * Clear all arcade data
   */
  clearAll(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.indexOf(STORAGE_PREFIX) === 0) {
        localStorage.removeItem(key);
      }
    });
  },

  /**
   * Get all high scores
   */
  getAllHighScores(): Record<string, number> {
    const scores: Record<string, number> = {};
    const keys = Object.keys(localStorage);
    const highscoreSuffix = '_highscore';

    keys.forEach(key => {
      if (key.indexOf(STORAGE_PREFIX) === 0 &&
          key.indexOf(highscoreSuffix, key.length - highscoreSuffix.length) !== -1) {
        const gameId = key
          .replace(STORAGE_PREFIX, '')
          .replace(highscoreSuffix, '');
        scores[gameId] = this.getHighScore(gameId);
      }
    });

    return scores;
  },
};
